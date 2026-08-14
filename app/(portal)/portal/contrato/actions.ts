"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getClienteUser } from "@/lib/auth/session";

// clienteId sale siempre de la sesión — la policy "cliente_acepta" (ver
// 20260814050000_cliente_acepta_contrato.sql) ya limita el update al
// contrato que de verdad pertenece a este cliente (vía solicitud_credito),
// así que no hace falta el cliente admin ni un chequeo manual de dueño acá.
export async function aceptarContratoCliente(contratoId: string) {
  const cliente = await getClienteUser();
  if (!cliente) return { error: "No autorizado." };

  const supabase = await createClient();

  const { data: actualizados, error } = await supabase
    .from("contrato")
    .update({ cliente_acepto_en: new Date().toISOString() })
    .eq("id", contratoId)
    .is("cliente_acepto_en", null)
    .select("id");

  if (error) return { error: `No se pudo registrar tu aceptación: ${error.message}` };
  if (!actualizados || actualizados.length === 0) return { error: "Este contrato no existe o ya lo habías aceptado." };

  revalidatePath("/portal");
  revalidatePath("/portal/contrato");
  return { error: null };
}
