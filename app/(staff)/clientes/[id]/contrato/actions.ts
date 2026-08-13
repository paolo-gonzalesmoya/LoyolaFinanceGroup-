"use server";

import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffUser } from "@/lib/auth/session";
import { getStripe } from "@/lib/stripe/client";
import { TOPE_FINANCIAMIENTO_USD } from "@/lib/credito/reglas";
import { registrarReembolso } from "@/lib/ledger/movimientos";
import { notificarPrestamoCancelado, notificarReembolso } from "@/lib/notificaciones/registrar";
import { cobrarDownpayment } from "@/lib/prestamos/downpayment";

const NUMERO_CUOTAS_VALIDAS = [12, 18, 24, 36, 48, 60, 72, 84, 96, 108, 120];

async function requireAdmin() {
  const usuario = await getStaffUser();
  if (!usuario || usuario.rol !== "admin") return null;
  return usuario;
}

export async function crearSetupIntent(clienteId: string) {
  const usuario = await requireAdmin();
  if (!usuario) return { error: "No autorizado.", clientSecret: null };

  const supabase = await createClient();
  const { data: cliente } = await supabase
    .from("cliente")
    .select("nombre, correo, stripe_customer_id")
    .eq("id", clienteId)
    .single();
  if (!cliente) return { error: "Cliente no encontrado.", clientSecret: null };

  const stripe = getStripe();
  let stripeCustomerId = cliente.stripe_customer_id;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({ name: cliente.nombre, email: cliente.correo ?? undefined });
    stripeCustomerId = customer.id;
    await supabase.from("cliente").update({ stripe_customer_id: stripeCustomerId }).eq("id", clienteId);
  }

  const setupIntent = await stripe.setupIntents.create({
    customer: stripeCustomerId,
    usage: "off_session",
    // allow_redirects: "never" — sin esto, cualquier método basado en
    // redirect que esté habilitado en el Dashboard (bancontact, klarna,
    // etc.) exige un return_url y rompe la confirmación embebida. Deja
    // tarjeta y cuenta bancaria (ACH, si está habilitada) sin salir de la
    // página.
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
  });

  return { error: null, clientSecret: setupIntent.client_secret };
}

export async function confirmarMandatoCobro(clienteId: string, stripePaymentMethodId: string) {
  const usuario = await requireAdmin();
  if (!usuario) return { error: "No autorizado." };

  const supabase = await createClient();

  // Un solo mandato activo por cliente a la vez.
  await supabase.from("mandato_cobro").update({ estado: "inactivo" }).eq("cliente_id", clienteId).eq("estado", "activo");

  // autopay_consentido_en queda como su propio registro, separado de la
  // firma del contrato — el formulario exige el checkbox de consentimiento
  // antes de poder llegar hasta acá (ver mandato-cobro.tsx).
  const { error } = await supabase.from("mandato_cobro").insert({
    cliente_id: clienteId,
    stripe_payment_method_id: stripePaymentMethodId,
    estado: "activo",
    autopay_consentido_en: new Date().toISOString(),
  });

  if (error) return { error: `No se pudo guardar el mandato: ${error.message}` };

  revalidatePath(`/clientes/${clienteId}/contrato`);
  return { error: null };
}

export async function crearContrato(
  input: { clienteId: string; solicitudId: string },
  _prevState: { error: string | null } | undefined,
  formData: FormData
) {
  const usuario = await requireAdmin();
  if (!usuario) return { error: "No autorizado." };

  const numeroCuotas = Number(formData.get("numero_cuotas"));
  const tasaMensual = Number(formData.get("tasa_mensual"));
  const tilaAceptado = formData.get("tila_aceptado") === "on";

  if (!NUMERO_CUOTAS_VALIDAS.includes(numeroCuotas)) return { error: "Número de cuotas inválido." };
  if (!tasaMensual || tasaMensual <= 0) return { error: "La tasa mensual debe ser mayor a 0." };
  if (!tilaAceptado) return { error: "Confirma que el cliente recibió y revisó el disclosure antes de firmar." };

  const supabase = await createClient();

  const { data: mandato } = await supabase
    .from("mandato_cobro")
    .select("id")
    .eq("cliente_id", input.clienteId)
    .eq("estado", "activo")
    .maybeSingle();
  if (!mandato) return { error: "Primero hay que autorizar un método de cobro." };

  const { data: solicitud } = await supabase
    .from("solicitud_credito")
    .select("monto_solicitado")
    .eq("id", input.solicitudId)
    .single();
  const total = Number(solicitud?.monto_solicitado ?? 0);
  const downpaymentMonto = Math.round(total * 0.5 * 100) / 100;
  const montoFinanciado = Math.round((total - downpaymentMonto) * 100) / 100;

  if (montoFinanciado > TOPE_FINANCIAMIENTO_USD) {
    return {
      error: `El monto a financiar ($${montoFinanciado.toFixed(2)}) supera el tope de $${TOPE_FINANCIAMIENTO_USD.toLocaleString()}.`,
    };
  }

  const { data: contrato, error } = await supabase
    .from("contrato")
    .insert({
      solicitud_id: input.solicitudId,
      numero_cuotas: numeroCuotas,
      tasa_mensual: tasaMensual,
      downpayment_monto: downpaymentMonto,
      registrado_por: usuario.id,
      tila_aceptado_en: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !contrato) {
    return { error: `No se pudo crear el contrato: ${error?.message ?? "error desconocido"}` };
  }

  revalidatePath(`/clientes/${input.clienteId}/contrato`);
  return { error: null };
}

export async function verificarDownpayment(input: { clienteId: string; contratoId: string }) {
  const usuario = await requireAdmin();
  if (!usuario) return { error: "No autorizado." };

  const supabase = await createClient();
  const resultado = await cobrarDownpayment(supabase, { ...input, verificadoPor: usuario.id });

  if (!resultado.error) revalidatePath(`/clientes/${input.clienteId}/contrato`);
  return resultado;
}

export async function cancelarPrestamo(input: { clienteId: string; prestamoId: string }) {
  const usuario = await requireAdmin();
  if (!usuario) return { error: "No autorizado." };

  const supabase = await createClient();

  // El where estado='activo' es la guarda: si ya estaba cancelado o pagado,
  // 0 filas afectadas.
  const { data: actualizados, error } = await supabase
    .from("prestamo")
    .update({ estado: "cancelado" })
    .eq("id", input.prestamoId)
    .eq("estado", "activo")
    .select("id");

  if (error) return { error: `No se pudo cancelar el préstamo: ${error.message}` };
  if (!actualizados || actualizados.length === 0) return { error: "El préstamo ya no estaba activo." };

  const { data: cliente } = await supabase.from("cliente").select("correo").eq("id", input.clienteId).single();
  await notificarPrestamoCancelado(supabase, { clienteId: input.clienteId, clienteCorreo: cliente?.correo ?? null }).catch(() => {});

  revalidatePath(`/clientes/${input.clienteId}/contrato`);
  return { error: null };
}

export async function reembolsarMovimiento(input: { clienteId: string; movimientoId: string }) {
  const usuario = await requireAdmin();
  if (!usuario) return { error: "No autorizado." };

  const supabase = await createClient();

  const { data: movimiento } = await supabase
    .from("movimiento_pago")
    .select("id, cuota_id, tipo, monto, resultado, stripe_event_id")
    .eq("id", input.movimientoId)
    .single();

  if (!movimiento) return { error: "Movimiento no encontrado." };
  if (movimiento.tipo !== "cobro" && movimiento.tipo !== "mora") return { error: "Solo se pueden reembolsar cobros o cargos de mora." };
  if (movimiento.resultado !== "exitoso") return { error: "Solo se puede reembolsar un cobro exitoso." };
  if (!movimiento.stripe_event_id) return { error: "Este movimiento no tiene un cargo de Stripe asociado." };

  const { data: reembolsoPrevio } = await supabase
    .from("movimiento_pago")
    .select("id")
    .eq("movimiento_original_id", movimiento.id)
    .maybeSingle();
  if (reembolsoPrevio) return { error: "Este cobro ya fue reembolsado." };

  const { data: cuota } = await supabase.from("cuota").select("numero").eq("id", movimiento.cuota_id).single();

  const claveIdempotencia = `reembolso:${movimiento.id}`;
  const stripe = getStripe();
  let refund: Stripe.Refund;
  try {
    refund = await stripe.refunds.create(
      { payment_intent: movimiento.stripe_event_id },
      { idempotencyKey: claveIdempotencia }
    );
  } catch (e) {
    const mensaje = e instanceof Stripe.errors.StripeError ? e.message : "Error desconocido al reembolsar.";
    return { error: `No se pudo reembolsar en Stripe: ${mensaje}` };
  }

  // El insert real del reembolso pasa siempre por el cliente service-role
  // (lib/ledger/movimientos.ts): admin, aun autenticado, no tiene policy de
  // INSERT sobre movimiento_pago — ver supabase/migrations/..._auth_linkage_rls.sql.
  const adminClient = createAdminClient();
  await registrarReembolso(adminClient, {
    cuotaId: movimiento.cuota_id,
    movimientoOriginalId: movimiento.id,
    monto: Number(movimiento.monto),
    stripeRefundId: refund.id,
    claveIdempotencia,
  });

  const { data: cliente } = await supabase.from("cliente").select("correo").eq("id", input.clienteId).single();
  await notificarReembolso(adminClient, {
    clienteId: input.clienteId,
    cuotaId: movimiento.cuota_id,
    numeroCuota: cuota?.numero ?? 0,
    monto: Number(movimiento.monto),
    clienteCorreo: cliente?.correo ?? null,
  }).catch(() => {});

  revalidatePath(`/clientes/${input.clienteId}/contrato`);
  return { error: null };
}
