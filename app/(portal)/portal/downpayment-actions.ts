"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClienteUser } from "@/lib/auth/session";
import { cobrarDownpayment } from "@/lib/prestamos/downpayment";

// El cliente paga su propio downpayment — clienteId sale siempre de la
// sesión, nunca de un parámetro, así que no puede pagar (ni intentar
// pagar) el contrato de otro cliente. Usa el cliente admin porque cliente
// no tiene policy de UPDATE sobre contrato/INSERT sobre prestamo/cuota.
export async function pagarDownpaymentCliente(contratoId: string) {
  const cliente = await getClienteUser();
  if (!cliente) return { error: "No autorizado." };

  const admin = createAdminClient();

  // Confirma que este contrato es realmente del cliente que llama, antes
  // de cobrar nada — cobrarDownpayment ya valida el resto, pero esto evita
  // que alguien pase el contratoId de otro cliente. Consultas secuenciales
  // (no embeds de PostgREST) para no depender de nombres de constraint.
  const { data: contrato } = await admin.from("contrato").select("id, solicitud_id").eq("id", contratoId).single();
  if (!contrato) return { error: "Contrato no encontrado." };

  const { data: solicitud } = await admin.from("solicitud_credito").select("cliente_id").eq("id", contrato.solicitud_id).single();
  if (!solicitud || solicitud.cliente_id !== cliente.id) return { error: "Contrato no encontrado." };

  const resultado = await cobrarDownpayment(admin, { clienteId: cliente.id, contratoId, verificadoPor: null });

  if (!resultado.error) revalidatePath("/portal");
  return resultado;
}
