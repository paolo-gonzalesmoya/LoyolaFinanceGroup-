import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { aplicarResultadoCobro } from "@/lib/ledger/movimientos";
import { calcularNuevoEstadoCuota } from "@/lib/cobranza/estado";
import { diasDeAtraso } from "@/lib/mora/calculo";
import { notificarResultadoCobro } from "@/lib/notificaciones/registrar";

export const dynamic = "force-dynamic";

// Confirmación asíncrona de Stripe para los cargos que dispara el cron.
// Para tarjeta, el cron ya sabe el resultado en el mismo request (confirm:
// true resuelve síncrono) y este webhook solo reconfirma lo mismo — pero es
// la ÚNICA fuente de verdad para medios que resuelven después (ACH, que
// tarda días en liquidar) y protege contra que el propio cron pierda su
// respuesta aunque Stripe sí haya procesado el cargo.
export async function POST(request: Request) {
  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return NextResponse.json({ error: "Falta la firma o STRIPE_WEBHOOK_SECRET." }, { status: 400 });
  }

  // Body crudo, sin parsear: constructEvent necesita los bytes exactos que
  // Stripe firmó — pasarlo por JSON.parse antes rompería la verificación.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    return NextResponse.json({ error: "Firma inválida." }, { status: 400 });
  }

  if (event.type !== "payment_intent.succeeded" && event.type !== "payment_intent.payment_failed") {
    return NextResponse.json({ received: true });
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const cuotaId = paymentIntent.metadata?.cuota_id;
  const tipo = paymentIntent.metadata?.tipo as "cobro" | "mora" | undefined;
  const claveIdempotencia = paymentIntent.metadata?.clave_idempotencia;

  // PaymentIntents sin esta metadata no vienen del cron de cobranza (por
  // ejemplo, el downpayment del contrato) — no son de este handler.
  if (!cuotaId || !tipo || !claveIdempotencia) {
    return NextResponse.json({ received: true });
  }

  const supabase = createAdminClient();
  const exitoso = event.type === "payment_intent.succeeded";

  const { yaRegistrado } = await aplicarResultadoCobro(supabase, {
    cuotaId,
    tipo,
    monto: paymentIntent.amount / 100,
    exitoso,
    stripeEventId: paymentIntent.id,
    claveIdempotencia,
  });

  // Si el cron ya había registrado este mismo intento en el mismo request
  // síncrono, el estado de la cuota y la notificación también quedaron
  // resueltos entonces. Este bloque solo importa cuando el webhook es quien
  // resuelve primero (medios de pago asíncronos, o si el cron perdió su
  // propia respuesta).
  if (!yaRegistrado && tipo === "cobro") {
    const { data: cuota } = await supabase
      .from("cuota")
      .select("numero, estado, fecha_vencimiento, prestamo_id")
      .eq("id", cuotaId)
      .single();

    if (cuota) {
      let estadoNuevo = cuota.estado;
      if (!exitoso) {
        const atraso = diasDeAtraso(cuota.fecha_vencimiento, new Date());
        estadoNuevo = calcularNuevoEstadoCuota(false, atraso);
        if (estadoNuevo !== cuota.estado) {
          await supabase.from("cuota").update({ estado: estadoNuevo }).eq("id", cuotaId);
        }
      }

      const { data: prestamo } = await supabase.from("prestamo").select("mandato_cobro_id").eq("id", cuota.prestamo_id).single();
      const { data: mandato } = prestamo?.mandato_cobro_id
        ? await supabase.from("mandato_cobro").select("cliente_id").eq("id", prestamo.mandato_cobro_id).single()
        : { data: null };

      if (mandato?.cliente_id) {
        const { data: cliente } = await supabase.from("cliente").select("correo").eq("id", mandato.cliente_id).single();
        await notificarResultadoCobro(supabase, {
          clienteId: mandato.cliente_id,
          cuotaId,
          numeroCuota: cuota.numero,
          monto: paymentIntent.amount / 100,
          tipoMovimiento: "cobro",
          exitoso,
          estadoCuota: estadoNuevo,
          clienteCorreo: cliente?.correo ?? null,
        }).catch(() => {});
      }
    }
  }

  return NextResponse.json({ received: true });
}
