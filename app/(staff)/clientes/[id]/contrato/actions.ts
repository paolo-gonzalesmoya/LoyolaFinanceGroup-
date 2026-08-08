"use server";

import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth/session";
import { getStripe } from "@/lib/stripe/client";
import { generarCronograma } from "@/lib/prestamos/amortizacion";
import { TOPE_FINANCIAMIENTO_USD } from "@/lib/credito/reglas";
import { subirFotoAvanceObra } from "@/lib/storage/avance-obra-fotos";

const NUMERO_CUOTAS_VALIDAS = [12, 18, 24, 36, 48, 60, 72, 84, 96, 108, 120];

async function requireAdmin() {
  const usuario = await getStaffUser();
  if (!usuario || usuario.rol !== "admin") return null;
  return usuario;
}

async function totalCotizacion(supabase: Awaited<ReturnType<typeof createClient>>, cotizacionId: string) {
  const { data: items } = await supabase.from("item_cotizacion").select("subtotal").eq("cotizacion_id", cotizacionId);
  return (items ?? []).reduce((suma, item) => suma + Number(item.subtotal), 0);
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

  const { error } = await supabase.from("mandato_cobro").insert({
    cliente_id: clienteId,
    stripe_payment_method_id: stripePaymentMethodId,
    estado: "activo",
  });

  if (error) return { error: `No se pudo guardar el mandato: ${error.message}` };

  revalidatePath(`/clientes/${clienteId}/contrato`);
  return { error: null };
}

export async function crearContrato(
  input: { clienteId: string; cotizacionId: string; solicitudId: string },
  _prevState: { error: string | null } | undefined,
  formData: FormData
) {
  const usuario = await requireAdmin();
  if (!usuario) return { error: "No autorizado." };

  const numeroCuotas = Number(formData.get("numero_cuotas"));
  const tasaMensual = Number(formData.get("tasa_mensual"));
  const vendedorId = String(formData.get("vendedor_id") ?? "");
  const porcentajeComision = Number(formData.get("porcentaje_comision"));

  if (!NUMERO_CUOTAS_VALIDAS.includes(numeroCuotas)) return { error: "Número de cuotas inválido." };
  if (!tasaMensual || tasaMensual <= 0) return { error: "La tasa mensual debe ser mayor a 0." };
  if (!vendedorId) return { error: "Seleccioná un vendedor." };
  if (!porcentajeComision || porcentajeComision <= 0) return { error: "El porcentaje de comisión debe ser mayor a 0." };

  const supabase = await createClient();

  const { data: mandato } = await supabase
    .from("mandato_cobro")
    .select("id")
    .eq("cliente_id", input.clienteId)
    .eq("estado", "activo")
    .maybeSingle();
  if (!mandato) return { error: "Primero hay que autorizar un método de cobro." };

  const total = await totalCotizacion(supabase, input.cotizacionId);
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
      vendedor_id: vendedorId,
      downpayment_monto: downpaymentMonto,
      registrado_por: usuario.id,
    })
    .select("id")
    .single();

  if (error || !contrato) {
    return { error: `No se pudo crear el contrato: ${error?.message ?? "error desconocido"}` };
  }

  // SPEC.md §1.4: la comisión se devenga al firmar el contrato.
  const montoComision = Math.round(montoFinanciado * (porcentajeComision / 100) * 100) / 100;
  const { error: comisionError } = await supabase.from("comision_vendedor").insert({
    contrato_id: contrato.id,
    vendedor_id: vendedorId,
    porcentaje: porcentajeComision,
    monto: montoComision,
    estado: "devengada",
  });

  if (comisionError) {
    return { error: `El contrato se creó pero falló la comisión: ${comisionError.message}` };
  }

  revalidatePath(`/clientes/${input.clienteId}/contrato`);
  return { error: null };
}

export async function verificarDownpayment(input: { clienteId: string; contratoId: string; cotizacionId: string }) {
  const usuario = await requireAdmin();
  if (!usuario) return { error: "No autorizado." };

  const supabase = await createClient();

  const { data: contrato } = await supabase.from("contrato").select("*").eq("id", input.contratoId).single();
  if (!contrato) return { error: "Contrato no encontrado." };
  if (contrato.downpayment_pagado) return { error: "El downpayment ya estaba cobrado." };

  const { data: cliente } = await supabase
    .from("cliente")
    .select("stripe_customer_id")
    .eq("id", input.clienteId)
    .single();
  if (!cliente?.stripe_customer_id) return { error: "El cliente no tiene un Stripe Customer asociado." };

  const { data: mandato } = await supabase
    .from("mandato_cobro")
    .select("id, stripe_payment_method_id")
    .eq("cliente_id", input.clienteId)
    .eq("estado", "activo")
    .maybeSingle();
  if (!mandato) return { error: "No hay un método de cobro activo." };

  const total = await totalCotizacion(supabase, input.cotizacionId);
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
      downpayment_verificado_por: usuario.id,
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

  revalidatePath(`/clientes/${input.clienteId}/contrato`);
  return { error: null };
}

const ETAPAS_VALIDAS = ["inicial", "en_proceso", "final"] as const;

export async function registrarAvanceObra(
  input: { clienteId: string; contratoId: string },
  _prevState: { error: string | null } | undefined,
  formData: FormData
) {
  const usuario = await requireAdmin();
  if (!usuario) return { error: "No autorizado." };

  const etapa = String(formData.get("etapa") ?? "");
  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;
  const foto = formData.get("foto");

  if (!ETAPAS_VALIDAS.includes(etapa as (typeof ETAPAS_VALIDAS)[number])) {
    return { error: "Elegí una etapa válida." };
  }

  const supabase = await createClient();

  const { data: avance, error } = await supabase
    .from("avance_obra")
    .insert({
      contrato_id: input.contratoId,
      etapa: etapa as (typeof ETAPAS_VALIDAS)[number],
      descripcion,
      registrado_por: usuario.id,
    })
    .select("id")
    .single();

  if (error || !avance) {
    return { error: `No se pudo registrar el avance: ${error?.message ?? "error desconocido"}` };
  }

  if (foto instanceof File && foto.size > 0) {
    const path = await subirFotoAvanceObra(supabase, input.contratoId, avance.id, foto);
    if (path) await supabase.from("avance_obra").update({ foto_url: path }).eq("id", avance.id);
  }

  revalidatePath(`/clientes/${input.clienteId}/contrato`);
  return { error: null };
}
