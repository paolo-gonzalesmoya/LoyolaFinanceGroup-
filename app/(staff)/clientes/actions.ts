"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth/session";
import { encryptSsn, decryptSsn } from "@/lib/crypto/ssn";

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
    return { error: null, ssn: decryptSsn(cliente.ssn_itn_cifrado) };
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
