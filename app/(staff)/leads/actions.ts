"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth/session";
import { subirFotoLead } from "@/lib/storage/lead-fotos";

export async function crearLead(_prevState: { error: string } | undefined, formData: FormData) {
  const usuario = await getStaffUser();
  if (!usuario) redirect("/login");

  const nombre = String(formData.get("nombre") ?? "").trim();
  const categoria_id = String(formData.get("categoria_id") ?? "");
  const direccion = String(formData.get("direccion") ?? "").trim() || null;
  const telefono = String(formData.get("telefono") ?? "").trim() || null;
  const correo = String(formData.get("correo") ?? "").trim() || null;

  if (!nombre || !categoria_id) {
    return { error: "Nombre y categoría son obligatorios." };
  }

  const supabase = await createClient();
  const esVendedor = usuario.rol === "vendedor";

  const { data: lead, error } = await supabase
    .from("lead")
    .insert({
      registrado_por: usuario.id,
      categoria_id,
      nombre,
      direccion,
      telefono,
      correo,
      estado: esVendedor ? "asignado" : "activo",
      vendedor_id: esVendedor ? usuario.id : null,
    })
    .select("id")
    .single();

  if (error || !lead) {
    return { error: `No se pudo crear el lead: ${error?.message ?? "error desconocido"}` };
  }

  const fotoDni = formData.get("foto_dni");
  const fotoRecibo = formData.get("foto_recibo");
  const updates: { foto_dni_url?: string; foto_recibo_url?: string } = {};

  if (fotoDni instanceof File && fotoDni.size > 0) {
    const path = await subirFotoLead(supabase, lead.id, "dni", fotoDni);
    if (path) updates.foto_dni_url = path;
  }
  if (fotoRecibo instanceof File && fotoRecibo.size > 0) {
    const path = await subirFotoLead(supabase, lead.id, "recibo", fotoRecibo);
    if (path) updates.foto_recibo_url = path;
  }
  if (Object.keys(updates).length > 0) {
    await supabase.from("lead").update(updates).eq("id", lead.id);
  }

  revalidatePath("/leads");
  redirect(`/leads/${lead.id}`);
}

export async function reclamarLead(leadId: string) {
  const usuario = await getStaffUser();
  if (!usuario || usuario.rol !== "vendedor") redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("lead")
    .update({ estado: "asignado", vendedor_id: usuario.id })
    .eq("id", leadId)
    .eq("estado", "activo")
    .select("id");

  if (!data || data.length === 0) {
    return { error: "Ese lead ya no está disponible — probablemente otro vendedor lo tomó primero." };
  }

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  return { error: null };
}

export async function completarDatosLead(leadId: string, _prevState: { error: string } | undefined, formData: FormData) {
  const usuario = await getStaffUser();
  if (!usuario) redirect("/login");

  const supabase = await createClient();

  const { data: lead } = await supabase.from("lead").select("categoria_id").eq("id", leadId).single();
  if (!lead) return { error: "Lead no encontrado." };

  const { data: campos } = await supabase
    .from("campo_servicio")
    .select("id")
    .eq("categoria_id", lead.categoria_id);

  const filas = (campos ?? [])
    .map((campo) => ({
      lead_id: leadId,
      campo_servicio_id: campo.id,
      valor: String(formData.get(`campo_${campo.id}`) ?? "").trim(),
      registrado_por: usuario.id,
    }))
    .filter((fila) => fila.valor !== "");

  if (filas.length > 0) {
    const { error: upsertError } = await supabase
      .from("valor_campo_lead")
      .upsert(filas, { onConflict: "lead_id,campo_servicio_id" });
    if (upsertError) {
      return { error: `No se pudieron guardar los campos: ${upsertError.message}` };
    }
  }

  const direccion = String(formData.get("direccion") ?? "").trim() || null;
  const telefono = String(formData.get("telefono") ?? "").trim() || null;
  const correo = String(formData.get("correo") ?? "").trim() || null;

  const { error } = await supabase
    .from("lead")
    .update({ direccion, telefono, correo, estado: "en_proceso" })
    .eq("id", leadId);

  if (error) {
    return { error: `No se pudo avanzar el lead: ${error.message}` };
  }

  revalidatePath(`/leads/${leadId}`);
  redirect(`/leads/${leadId}`);
}
