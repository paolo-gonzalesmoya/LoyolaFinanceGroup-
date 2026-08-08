"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth/session";

async function requireAdmin() {
  const usuario = await getStaffUser();
  if (!usuario || usuario.rol !== "admin") {
    return null;
  }
  return usuario;
}

export async function crearCategoria(_prevState: { error: string | null } | undefined, formData: FormData) {
  if (!(await requireAdmin())) return { error: "No autorizado." };

  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return { error: "El nombre es obligatorio." };

  const supabase = await createClient();
  const { error } = await supabase.from("categoria_servicio").insert({ nombre });

  if (error) return { error: `No se pudo crear la categoría: ${error.message}` };

  revalidatePath("/configuracion");
  return { error: null };
}

export async function crearCampo(_prevState: { error: string | null } | undefined, formData: FormData) {
  if (!(await requireAdmin())) return { error: "No autorizado." };

  const categoria_id = String(formData.get("categoria_id") ?? "");
  const nombre_campo = String(formData.get("nombre_campo") ?? "").trim();
  const unidad_medida = String(formData.get("unidad_medida") ?? "").trim() || null;
  const tipo_dato = String(formData.get("tipo_dato") ?? "numero");
  const opcionesRaw = String(formData.get("opciones") ?? "").trim();
  const opciones = tipo_dato === "seleccion" && opcionesRaw
    ? opcionesRaw.split(",").map((o) => o.trim()).filter(Boolean)
    : null;

  if (!categoria_id || !nombre_campo) {
    return { error: "Categoría y nombre del campo son obligatorios." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("campo_servicio").insert({
    categoria_id,
    nombre_campo,
    unidad_medida,
    tipo_dato: tipo_dato as "numero" | "texto" | "seleccion",
    opciones,
  });

  if (error) return { error: `No se pudo crear el campo: ${error.message}` };

  revalidatePath("/configuracion");
  return { error: null };
}
