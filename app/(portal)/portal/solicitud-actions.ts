"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClienteUser } from "@/lib/auth/session";
import { encryptSsn } from "@/lib/crypto/ssn";

// El cliente aún no tiene policy de UPDATE sobre su propia fila (solo
// self_read) ni de INSERT sobre solicitud_credito — de nuevo, service-role
// con autorización explícita acá adentro, clienteId siempre de la sesión,
// nunca de un parámetro.
export async function enviarSolicitudCliente(_prevState: { error: string | null } | undefined, formData: FormData) {
  const cliente = await getClienteUser();
  if (!cliente) return { error: "No autorizado." };

  const admin = createAdminClient();
  const { data: clienteRow } = await admin.from("cliente").select("verificado").eq("id", cliente.id).single();
  if (!clienteRow?.verificado) {
    return { error: "Todavía no confirmamos tu identidad — pronto vas a poder completar tu solicitud." };
  }

  const ssnItn = String(formData.get("ssn_itn") ?? "").trim();
  const montoSolicitado = Number(formData.get("monto_solicitado"));

  if (!ssnItn) return { error: "El SSN/ITN es obligatorio." };
  if (!montoSolicitado || montoSolicitado <= 0) return { error: "El monto solicitado debe ser mayor a 0." };

  const { error: updateError } = await admin
    .from("cliente")
    .update({ ssn_itn_cifrado: encryptSsn(ssnItn) })
    .eq("id", cliente.id);
  if (updateError) return { error: `No se pudo guardar tu información: ${updateError.message}` };

  const { error: insertError } = await admin
    .from("solicitud_credito")
    .insert({ cliente_id: cliente.id, monto_solicitado: montoSolicitado, decision: "pendiente" });
  if (insertError) return { error: `No se pudo enviar tu solicitud: ${insertError.message}` };

  revalidatePath("/portal");
  return { error: null };
}
