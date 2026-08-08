"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

// Crear el usuario de Auth requiere la service_role key (no hay forma de
// hacerlo con el cliente de sesión normal) — es uno de los pocos usos
// deliberados de lib/supabase/admin.ts fuera del cron/webhook, y por eso
// arranca con su propio chequeo explícito de autorización (requireAdmin).
export async function crearUsuarioStaff(
  _prevState: { error: string | null; password: string | null } | undefined,
  formData: FormData
) {
  if (!(await requireAdmin())) return { error: "No autorizado.", password: null };

  const nombre = String(formData.get("nombre") ?? "").trim();
  const correo = String(formData.get("correo") ?? "").trim().toLowerCase();
  const rol = String(formData.get("rol") ?? "");

  if (!nombre || !correo || !["admin", "vendedor"].includes(rol)) {
    return { error: "Completá nombre, correo y rol.", password: null };
  }

  const admin = createAdminClient();
  const password = randomBytes(12).toString("base64url");

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: correo,
    password,
    email_confirm: true,
  });

  if (authError || !authUser?.user) {
    return { error: `No se pudo crear el usuario: ${authError?.message ?? "error desconocido"}`, password: null };
  }

  const supabase = await createClient();
  const { error: dbError } = await supabase.from("usuario").insert({
    nombre,
    correo,
    rol: rol as "admin" | "vendedor",
    auth_user_id: authUser.user.id,
  });

  if (dbError) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    return { error: `No se pudo crear el usuario: ${dbError.message}`, password: null };
  }

  revalidatePath("/configuracion");
  return { error: null, password };
}

export async function cambiarActivoUsuario(usuarioId: string, activo: boolean) {
  if (!(await requireAdmin())) return;

  const supabase = await createClient();
  await supabase.from("usuario").update({ activo }).eq("id", usuarioId);
  revalidatePath("/configuracion");
}
