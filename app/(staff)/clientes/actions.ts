"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth/session";
import { encryptSsn, decryptSsn } from "@/lib/crypto/ssn";
import { consultarScore } from "@/lib/experian/client";
import { TOPE_FINANCIAMIENTO_USD } from "@/lib/credito/reglas";

async function requireAdmin() {
  const usuario = await getStaffUser();
  if (!usuario || usuario.rol !== "admin") return null;
  return usuario;
}

export async function convertirACliente(
  leadId: string,
  _prevState: { error: string } | undefined,
  formData: FormData
) {
  const usuario = await requireAdmin();
  if (!usuario) return { error: "No autorizado." };

  const autorizado = formData.get("autorizado") === "on";
  const ssnItn = String(formData.get("ssn_itn") ?? "").trim();

  if (!autorizado) return { error: "Confirmá que el cliente autorizó la captura de sus datos y la consulta de crédito." };
  if (!ssnItn) return { error: "El SSN/ITN es obligatorio." };

  const supabase = await createClient();

  const { data: existente } = await supabase.from("cliente").select("id").eq("lead_id", leadId).maybeSingle();
  if (existente) redirect(`/clientes/${existente.id}`);

  const { data: lead } = await supabase.from("lead").select("*").eq("id", leadId).single();
  if (!lead) return { error: "Lead no encontrado." };

  const { data: cliente, error } = await supabase
    .from("cliente")
    .insert({
      lead_id: leadId,
      nombre: lead.nombre,
      direccion: lead.direccion,
      telefono: lead.telefono,
      correo: lead.correo,
      ssn_itn_cifrado: encryptSsn(ssnItn),
      registrado_por: usuario.id,
    })
    .select("id")
    .single();

  if (error || !cliente) {
    return { error: `No se pudo convertir a cliente: ${error?.message ?? "error desconocido"}` };
  }

  revalidatePath(`/leads/${leadId}`);
  redirect(`/clientes/${cliente.id}`);
}

export async function revelarSsn(clienteId: string) {
  const usuario = await requireAdmin();
  if (!usuario) return { error: "No autorizado.", ssn: null };

  const supabase = await createClient();
  const { data: cliente } = await supabase
    .from("cliente")
    .select("ssn_itn_cifrado")
    .eq("id", clienteId)
    .single();

  if (!cliente?.ssn_itn_cifrado) return { error: "No hay SSN/ITN guardado.", ssn: null };

  try {
    const ssn = decryptSsn(cliente.ssn_itn_cifrado);
    await supabase.from("auditoria").insert({ usuario_id: usuario.id, tipo: "ver_ssn", cliente_id: clienteId });
    return { error: null, ssn };
  } catch {
    return { error: "No se pudo descifrar el valor guardado.", ssn: null };
  }
}

export async function crearCotizacion(
  clienteId: string,
  _prevState: { error: string } | undefined,
  formData: FormData
) {
  const usuario = await requireAdmin();
  if (!usuario) return { error: "No autorizado." };

  const requiereFinanciamiento = formData.get("requiere_financiamiento") === "on";
  const descripciones = formData.getAll("descripcion") as string[];
  const cantidades = formData.getAll("cantidad") as string[];
  const precios = formData.getAll("precio_unitario") as string[];

  const items = descripciones
    .map((descripcion, i) => ({
      descripcion: descripcion.trim(),
      cantidad: Number(cantidades[i] ?? "1") || 1,
      precio_unitario: Number(precios[i] ?? "0") || 0,
    }))
    .filter((item) => item.descripcion !== "" && item.precio_unitario > 0);

  if (items.length === 0) {
    return { error: "Agregá al menos un ítem con descripción y precio unitario mayor a 0." };
  }

  const supabase = await createClient();

  const { data: cotizacion, error } = await supabase
    .from("cotizacion")
    .insert({ cliente_id: clienteId, elaborada_por: usuario.id, requiere_financiamiento: requiereFinanciamiento })
    .select("id")
    .single();

  if (error || !cotizacion) {
    return { error: `No se pudo crear la cotización: ${error?.message ?? "error desconocido"}` };
  }

  const { error: itemsError } = await supabase
    .from("item_cotizacion")
    .insert(items.map((item) => ({ ...item, cotizacion_id: cotizacion.id })));

  if (itemsError) {
    return { error: `La cotización se creó pero fallaron los ítems: ${itemsError.message}` };
  }

  if (requiereFinanciamiento) {
    await supabase.from("solicitud_credito").insert({ cotizacion_id: cotizacion.id, decision: "pendiente" });
  }

  revalidatePath(`/clientes/${clienteId}`);
  redirect(`/clientes/${clienteId}`);
}

export async function solicitarConsultaScore(clienteId: string) {
  const usuario = await requireAdmin();
  if (!usuario) return { error: "No autorizado." };

  const supabase = await createClient();
  const { data: cliente } = await supabase
    .from("cliente")
    .select("nombre, ssn_itn_cifrado")
    .eq("id", clienteId)
    .single();

  if (!cliente?.ssn_itn_cifrado) return { error: "El cliente no tiene SSN/ITN registrado." };

  const resultado = await consultarScore({ nombre: cliente.nombre, ssnItn: decryptSsn(cliente.ssn_itn_cifrado) });

  const { error } = await supabase.from("consulta_score").insert({
    cliente_id: clienteId,
    score: resultado.score,
    ingresos_mensuales: resultado.ingresosMensuales,
    capacidad_pago: resultado.capacidadPago,
    registrado_por: usuario.id,
  });

  if (error) return { error: `No se pudo guardar la consulta: ${error.message}` };

  await supabase.from("auditoria").insert({ usuario_id: usuario.id, tipo: "consulta_score", cliente_id: clienteId });

  revalidatePath(`/clientes/${clienteId}`);
  return { error: null };
}

export async function decidirCredito(
  input: { clienteId: string; leadId: string; solicitudId: string; cotizacionId: string },
  decision: "aprobado" | "rechazado",
  motivoRechazo: string | null
) {
  const usuario = await requireAdmin();
  if (!usuario) return { error: "No autorizado." };

  const supabase = await createClient();

  if (decision === "aprobado") {
    const { data: items } = await supabase
      .from("item_cotizacion")
      .select("subtotal")
      .eq("cotizacion_id", input.cotizacionId);
    const total = (items ?? []).reduce((suma, item) => suma + Number(item.subtotal), 0);

    if (total > TOPE_FINANCIAMIENTO_USD) {
      return {
        error: `El total de la cotización ($${total.toFixed(2)}) supera el tope de $${TOPE_FINANCIAMIENTO_USD.toLocaleString()}.`,
      };
    }
  }

  if (decision === "rechazado" && !motivoRechazo?.trim()) {
    return { error: "El motivo de rechazo es obligatorio." };
  }

  const { data: ultimaConsulta } = await supabase
    .from("consulta_score")
    .select("id")
    .eq("cliente_id", input.clienteId)
    .order("fecha_registro", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: actualizadas, error } = await supabase
    .from("solicitud_credito")
    .update({
      decision,
      decidido_por: usuario.id,
      motivo_rechazo: decision === "rechazado" ? motivoRechazo : null,
      consulta_score_id: ultimaConsulta?.id ?? null,
    })
    .eq("id", input.solicitudId)
    .eq("decision", "pendiente")
    .select("id");

  if (error) return { error: `No se pudo registrar la decisión: ${error.message}` };
  if (!actualizadas || actualizadas.length === 0) return { error: "Esta solicitud ya fue decidida." };

  if (decision === "aprobado") {
    // Máquina de estados del lead (SPEC.md §4): en_proceso -> convertido
    // pasa exactamente acá, cuando se aprueba el crédito — no antes.
    await supabase.from("lead").update({ estado: "convertido" }).eq("id", input.leadId);
  }

  await supabase.from("auditoria").insert({
    usuario_id: usuario.id,
    tipo: decision === "aprobado" ? "aprobacion_credito" : "rechazo_credito",
    cliente_id: input.clienteId,
    solicitud_credito_id: input.solicitudId,
  });

  revalidatePath(`/clientes/${input.clienteId}`);
  return { error: null };
}
