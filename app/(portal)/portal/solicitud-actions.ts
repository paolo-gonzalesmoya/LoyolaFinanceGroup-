"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClienteUser } from "@/lib/auth/session";

// El cliente aún no tiene policy de INSERT sobre solicitud_credito — de
// nuevo, service-role con autorización explícita acá adentro, clienteId
// siempre de la sesión, nunca de un parámetro. El SSN/ITN ya se capturó en
// /registro, así que acá solo hace falta el monto.
export async function enviarSolicitudCliente(_prevState: { error: string | null } | undefined, formData: FormData) {
  const cliente = await getClienteUser();
  if (!cliente) return { error: "No autorizado." };

  const admin = createAdminClient();
  const { data: clienteRow } = await admin.from("cliente").select("verificado").eq("id", cliente.id).single();
  if (!clienteRow?.verificado) {
    return { error: "Todavía no confirmamos tu identidad — pronto vas a poder completar tu solicitud." };
  }

  const montoSolicitado = Number(formData.get("monto_solicitado"));
  if (!montoSolicitado || montoSolicitado <= 0) return { error: "El monto solicitado debe ser mayor a 0." };

  const { error: insertError } = await admin
    .from("solicitud_credito")
    .insert({ cliente_id: cliente.id, monto_solicitado: montoSolicitado, decision: "pendiente" });
  if (insertError) return { error: `No se pudo enviar tu solicitud: ${insertError.message}` };

  revalidatePath("/portal");
  return { error: null };
}
