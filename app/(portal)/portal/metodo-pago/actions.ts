"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClienteUser } from "@/lib/auth/session";
import { getStripe } from "@/lib/stripe/client";

// A diferencia de las acciones de staff (que reciben clienteId porque admin
// puede actuar sobre cualquier cliente), estas SIEMPRE derivan el cliente de
// la sesión — nunca de un parámetro. Así un cliente autenticado no puede,
// ni por error de UI ni a propósito, tocar el mandato de otro.
export async function crearSetupIntentCliente() {
  const cliente = await getClienteUser();
  if (!cliente) return { error: "No autorizado.", clientSecret: null };

  // El update de stripe_customer_id pasa por el cliente admin: cliente no
  // tiene policy de UPDATE sobre su propia fila (solo self_read), y esta
  // acción ya limita el alcance al derivar todo de la sesión, no de un
  // parámetro — no hace falta abrir esa policy solo para este campo.
  const admin = createAdminClient();
  const { data: clienteRow } = await admin.from("cliente").select("nombre, correo, stripe_customer_id").eq("id", cliente.id).single();
  if (!clienteRow) return { error: "Cliente no encontrado.", clientSecret: null };

  const stripe = getStripe();
  let stripeCustomerId = clienteRow.stripe_customer_id;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({ name: clienteRow.nombre, email: clienteRow.correo ?? undefined });
    stripeCustomerId = customer.id;
    await admin.from("cliente").update({ stripe_customer_id: stripeCustomerId }).eq("id", cliente.id);
  }

  const setupIntent = await stripe.setupIntents.create({
    customer: stripeCustomerId,
    usage: "off_session",
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
  });

  return { error: null, clientSecret: setupIntent.client_secret };
}

export async function confirmarMandatoCobroCliente(stripePaymentMethodId: string) {
  const cliente = await getClienteUser();
  if (!cliente) return { error: "No autorizado." };

  const supabase = await createClient();

  // Mismo chequeo que hace la página, repetido acá porque esta Server
  // Action es la frontera real — la redirección de la página es solo UX.
  const { data: solicitud } = await supabase.from("solicitud_credito").select("id").eq("cliente_id", cliente.id).maybeSingle();
  if (solicitud) {
    const { data: contrato } = await supabase
      .from("contrato")
      .select("cliente_acepto_en")
      .eq("solicitud_id", solicitud.id)
      .maybeSingle();
    if (contrato && !contrato.cliente_acepto_en) {
      return { error: "Primero tienes que aceptar los términos de tu contrato." };
    }
  }

  // Un solo mandato activo por cliente — mismo patrón que el flujo de
  // staff. Las policies "cliente_gestion*" de mandato_cobro exigen que
  // cliente_id sea el propio, así que esto no necesita el cliente admin.
  await supabase.from("mandato_cobro").update({ estado: "inactivo" }).eq("cliente_id", cliente.id).eq("estado", "activo");

  // autopay_consentido_en queda como su propio registro, separado de
  // cualquier otra aceptación — el formulario exige el checkbox de
  // consentimiento antes de poder llegar hasta acá (ver formulario.tsx).
  const { error } = await supabase.from("mandato_cobro").insert({
    cliente_id: cliente.id,
    stripe_payment_method_id: stripePaymentMethodId,
    estado: "activo",
    autopay_consentido_en: new Date().toISOString(),
  });

  if (error) return { error: `No se pudo guardar el método de cobro: ${error.message}` };

  revalidatePath("/portal");
  revalidatePath("/portal/metodo-pago");
  return { error: null };
}
