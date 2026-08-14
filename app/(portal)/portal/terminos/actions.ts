"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClienteUser } from "@/lib/auth/session";
import { TC_VERSION } from "@/lib/legal/terminos";

export async function aceptarTerminos(_prevState: { error: string } | undefined, formData: FormData) {
  const cliente = await getClienteUser();
  if (!cliente) return { error: "No autorizado." };

  if (formData.get("tc_aceptado") !== "on") {
    return { error: "Tienes que marcar la casilla para continuar." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("cliente")
    .update({ tc_aceptado_en: new Date().toISOString(), tc_version: TC_VERSION })
    .eq("id", cliente.id);

  if (error) return { error: `No se pudo registrar tu aceptación: ${error.message}` };

  redirect("/portal");
}
