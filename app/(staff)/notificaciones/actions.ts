"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth/session";

export async function marcarNotificacionLeida(notificacionId: string) {
  const usuario = await getStaffUser();
  if (!usuario || usuario.rol !== "admin") return { error: "No autorizado." };

  const supabase = await createClient();
  const { error } = await supabase.from("notificacion").update({ leida: true }).eq("id", notificacionId);
  if (error) return { error: error.message };

  revalidatePath("/notificaciones");
  return { error: null };
}
