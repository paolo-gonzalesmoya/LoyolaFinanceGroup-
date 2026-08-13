import "server-only";
import Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getStripe } from "@/lib/stripe/client";
import { generarCronograma } from "@/lib/prestamos/amortizacion";
import { TOPE_FINANCIAMIENTO_USD } from "@/lib/credito/reglas";

// Lógica compartida por el botón de admin (verificarDownpayment) y el
// checkout del propio cliente en el portal (pagarDownpaymentCliente) — el
// downpayment es un cobro único, normal en cualquier cuenta de Stripe, así
// que ambos caminos quedan activos (a diferencia del cobro recurrente).
// `verificadoPor` es el id de usuario admin si lo confirma admin, o null si
// lo paga el cliente mismo (contrato.downpayment_verificado_por acepta null).
export async function cobrarDownpayment(
  supabase: SupabaseClient<Database>,
  input: { clienteId: string; contratoId: string; verificadoPor: string | null }
): Promise<{ error: string | null }> {
  const { data: contrato } = await supabase.from("contrato").select("*").eq("id", input.contratoId).single();
  if (!contrato) return { error: "Contrato no encontrado." };
  if (contrato.downpayment_pagado) return { error: "El downpayment ya estaba cobrado." };

  const { data: solicitud } = await supabase
    .from("solicitud_credito")
    .select("monto_solicitado")
    .eq("id", contrato.solicitud_id)
    .single();
  const total = Number(solicitud?.monto_solicitado ?? 0);

  const { data: cliente } = await supabase
    .from("cliente")
    .select("stripe_customer_id")
    .eq("id", input.clienteId)
    .single();
  if (!cliente?.stripe_customer_id) return { error: "No tienes un método de cobro autorizado todavía." };

  const { data: mandato } = await supabase
    .from("mandato_cobro")
    .select("id, stripe_payment_method_id")
    .eq("cliente_id", input.clienteId)
    .eq("estado", "activo")
    .maybeSingle();
  if (!mandato) return { error: "No hay un método de cobro activo." };

  const montoFinanciado = Math.round((total - Number(contrato.downpayment_monto)) * 100) / 100;

  if (montoFinanciado > TOPE_FINANCIAMIENTO_USD) {
    return {
      error: `El monto a financiar ($${montoFinanciado.toFixed(2)}) supera el tope de $${TOPE_FINANCIAMIENTO_USD.toLocaleString()}.`,
    };
  }

  // Cobra el downpayment por Stripe con el medio ya autorizado. Idempotency
  // key fija por contrato: un doble clic (o un retry de red) no duplica el
  // cargo, Stripe devuelve el mismo resultado del primer intento.
  const stripe = getStripe();
  let paymentIntent: Stripe.PaymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create(
      {
        amount: Math.round(Number(contrato.downpayment_monto) * 100),
        currency: "usd",
        customer: cliente.stripe_customer_id,
        payment_method: mandato.stripe_payment_method_id,
        off_session: true,
        confirm: true,
      },
      { idempotencyKey: `downpayment:${input.contratoId}` }
    );
  } catch (e) {
    const mensaje = e instanceof Stripe.errors.StripeError ? e.message : "Error desconocido al cobrar.";
    return { error: `No se pudo cobrar el downpayment: ${mensaje}` };
  }

  if (paymentIntent.status !== "succeeded") {
    return { error: `El cobro no se completó (estado: ${paymentIntent.status}).` };
  }

  const { data: actualizado, error: updateError } = await supabase
    .from("contrato")
    .update({
      downpayment_pagado: true,
      downpayment_verificado_por: input.verificadoPor,
      downpayment_stripe_payment_intent_id: paymentIntent.id,
    })
    .eq("id", input.contratoId)
    .eq("downpayment_pagado", false)
    .select("id");

  if (updateError) return { error: `El cobro se hizo (${paymentIntent.id}) pero no se pudo guardar: ${updateError.message}` };
  if (!actualizado || actualizado.length === 0) return { error: "El downpayment ya estaba verificado." };

  const { data: prestamo, error: prestamoError } = await supabase
    .from("prestamo")
    .insert({
      contrato_id: input.contratoId,
      mandato_cobro_id: mandato.id,
      monto_financiado: montoFinanciado,
      estado: "activo",
    })
    .select("id")
    .single();

  if (prestamoError || !prestamo) {
    return { error: `No se pudo crear el préstamo: ${prestamoError?.message ?? "error desconocido"}` };
  }

  const cronograma = generarCronograma(montoFinanciado, Number(contrato.tasa_mensual), contrato.numero_cuotas, new Date());

  const { error: cuotasError } = await supabase.from("cuota").insert(
    cronograma.map((c) => ({
      prestamo_id: prestamo.id,
      numero: c.numero,
      fecha_vencimiento: c.fechaVencimiento,
      monto: c.monto,
    }))
  );

  if (cuotasError) {
    return { error: `El préstamo se creó pero falló el cronograma: ${cuotasError.message}` };
  }

  return { error: null };
}
