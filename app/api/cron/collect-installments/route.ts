import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/client";
import { aplicarResultadoCobro, registrarMovimiento } from "@/lib/ledger/movimientos";
import { calcularNuevoEstadoCuota } from "@/lib/cobranza/estado";
import { diasDeAtraso, calcularPorcentajeMora, calcularMontoMora } from "@/lib/mora/calculo";
import type { Database } from "@/types/database.types";

export const dynamic = "force-dynamic";

type AdminClient = ReturnType<typeof createAdminClient>;
type Cuota = { id: string; monto: number; fecha_vencimiento: string; estado: Database["public"]["Enums"]["estado_cuota"]; prestamo_id: string };
type TipoMovimiento = Database["public"]["Enums"]["tipo_movimiento"];

// Cron diario (vercel.json): para cada cuota pendiente/vencida/en_mora cuyo
// vencimiento ya llegó, intenta cobrarla por Stripe con el mandato guardado.
// Vercel manda este Bearer token automáticamente cuando CRON_SECRET está
// configurado — ver https://vercel.com/docs/cron-jobs/manage-cron-jobs.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const supabase = createAdminClient();
  const stripe = getStripe();
  const hoy = new Date();
  const hoyStr = hoy.toISOString().slice(0, 10);

  const { data: cuotas, error } = await supabase
    .from("cuota")
    .select("id, monto, fecha_vencimiento, estado, prestamo_id")
    .in("estado", ["pendiente", "vencida", "en_mora"])
    .lte("fecha_vencimiento", hoyStr);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const resultados = [];
  for (const cuota of cuotas ?? []) {
    resultados.push({ cuotaId: cuota.id, ...(await procesarCuota(supabase, stripe, cuota, hoy, hoyStr)) });
  }

  return NextResponse.json({ fecha: hoyStr, procesadas: resultados.length, resultados });
}

async function procesarCuota(supabase: AdminClient, stripe: Stripe, cuota: Cuota, hoy: Date, hoyStr: string) {
  const { data: prestamo } = await supabase
    .from("prestamo")
    .select("mandato_cobro_id")
    .eq("id", cuota.prestamo_id)
    .single();
  if (!prestamo?.mandato_cobro_id) return { omitido: "préstamo sin mandato de cobro activo" };

  const { data: mandato } = await supabase
    .from("mandato_cobro")
    .select("cliente_id, stripe_payment_method_id")
    .eq("id", prestamo.mandato_cobro_id)
    .single();
  if (!mandato) return { omitido: "mandato de cobro no encontrado" };

  const { data: cliente } = await supabase
    .from("cliente")
    .select("stripe_customer_id")
    .eq("id", mandato.cliente_id)
    .single();
  if (!cliente?.stripe_customer_id) return { omitido: "cliente sin Stripe customer" };

  const atraso = diasDeAtraso(cuota.fecha_vencimiento, hoy);
  const claveCobro = `cuota:${cuota.id}:vencimiento:${cuota.fecha_vencimiento}:intento:${hoyStr}`;

  if (await yaFueRegistrado(supabase, claveCobro)) {
    return { atraso, omitido: "esta cuota ya se procesó hoy" };
  }

  const cobro = await intentarCobro(supabase, stripe, {
    cuotaId: cuota.id,
    clienteStripeId: cliente.stripe_customer_id,
    paymentMethodId: mandato.stripe_payment_method_id,
    monto: Number(cuota.monto),
    tipo: "cobro",
    claveIdempotencia: claveCobro,
  });

  const estadoNuevo = calcularNuevoEstadoCuota(cobro.exitoso, atraso);
  if (estadoNuevo !== cuota.estado) {
    await supabase.from("cuota").update({ estado: estadoNuevo }).eq("id", cuota.id);
  }

  let mora = null;
  if (!cobro.exitoso && estadoNuevo === "en_mora") {
    mora = await procesarMora(supabase, stripe, cuota, mandato, cliente.stripe_customer_id, atraso, hoyStr);
  }

  return { atraso, estadoAnterior: cuota.estado, estadoNuevo, cobro, mora };
}

async function procesarMora(
  supabase: AdminClient,
  stripe: Stripe,
  cuota: Cuota,
  mandato: { stripe_payment_method_id: string },
  clienteStripeId: string,
  atraso: number,
  hoyStr: string
) {
  const porcentaje = calcularPorcentajeMora(atraso);
  const montoMoraTotal = calcularMontoMora(Number(cuota.monto), porcentaje);

  // La mora se cobra en incrementos: cada semana que sube el porcentaje se
  // intenta cobrar solo la diferencia contra lo ya cobrado con éxito, nunca
  // el total de nuevo (evita cobrar dos veces la misma mora acumulada).
  const { data: morasExitosas } = await supabase
    .from("movimiento_pago")
    .select("monto")
    .eq("cuota_id", cuota.id)
    .eq("tipo", "mora")
    .eq("resultado", "exitoso");
  const montoMoraYaCobrado = (morasExitosas ?? []).reduce((suma, m) => suma + Number(m.monto), 0);
  const incremento = Math.round((montoMoraTotal - montoMoraYaCobrado) * 100) / 100;

  if (incremento <= 0) return { omitido: "mora ya cobrada al día", porcentaje };

  const claveMora = `cuota:${cuota.id}:mora:intento:${hoyStr}`;
  if (await yaFueRegistrado(supabase, claveMora)) return { omitido: "mora ya intentada hoy", porcentaje };

  const resultado = await intentarCobro(supabase, stripe, {
    cuotaId: cuota.id,
    clienteStripeId,
    paymentMethodId: mandato.stripe_payment_method_id,
    monto: incremento,
    tipo: "mora",
    claveIdempotencia: claveMora,
  });

  return { ...resultado, porcentaje, incremento };
}

async function yaFueRegistrado(supabase: AdminClient, claveIdempotencia: string) {
  const { data } = await supabase
    .from("movimiento_pago")
    .select("id")
    .eq("clave_idempotencia", claveIdempotencia)
    .maybeSingle();
  return !!data;
}

async function intentarCobro(
  supabase: AdminClient,
  stripe: Stripe,
  input: {
    cuotaId: string;
    clienteStripeId: string;
    paymentMethodId: string;
    monto: number;
    tipo: TipoMovimiento;
    claveIdempotencia: string;
  }
) {
  try {
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: Math.round(input.monto * 100),
        currency: "usd",
        customer: input.clienteStripeId,
        payment_method: input.paymentMethodId,
        off_session: true,
        confirm: true,
        metadata: { cuota_id: input.cuotaId, tipo: input.tipo, clave_idempotencia: input.claveIdempotencia },
      },
      { idempotencyKey: input.claveIdempotencia }
    );

    const exitoso = paymentIntent.status === "succeeded";
    await aplicarResultadoCobro(supabase, {
      cuotaId: input.cuotaId,
      tipo: input.tipo,
      monto: input.monto,
      exitoso,
      stripeEventId: paymentIntent.id,
      claveIdempotencia: input.claveIdempotencia,
    });

    return { exitoso, paymentIntentId: paymentIntent.id, estadoStripe: paymentIntent.status };
  } catch (e) {
    const mensaje = e instanceof Stripe.errors.StripeError ? e.message : "Error desconocido al cobrar.";
    // No usamos aplicarResultadoCobro acá: si el propio create() tira
    // excepción (ej. PaymentMethod inexistente) no hay PaymentIntent que
    // referenciar, pero igual queda el intento en el ledger.
    await registrarMovimiento(supabase, {
      cuotaId: input.cuotaId,
      tipo: input.tipo,
      monto: input.monto,
      claveIdempotencia: input.claveIdempotencia,
      resultado: "reintento",
    }).catch(() => {});
    return { exitoso: false, error: mensaje };
  }
}
