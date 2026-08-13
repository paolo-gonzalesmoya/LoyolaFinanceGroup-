import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { enviarEmail } from "./email";

type Cliente = SupabaseClient<Database>;
type TipoNotificacion = Database["public"]["Enums"]["tipo_notificacion"];
type Destinatario = Database["public"]["Enums"]["destinatario_notificacion"];

async function registrarNotificacion(
  supabase: Cliente,
  input: { destinatario: Destinatario; clienteId: string | null; cuotaId: string | null; tipo: TipoNotificacion; mensaje: string; correoDestino?: string | null }
) {
  await supabase.from("notificacion").insert({
    destinatario: input.destinatario,
    cliente_id: input.clienteId,
    cuota_id: input.cuotaId,
    tipo: input.tipo,
    mensaje: input.mensaje,
  });
  await enviarEmail(input.correoDestino ?? null, `Loyola Finance Group — ${input.tipo.replace(/_/g, " ")}`, input.mensaje);
}

// Notifica a cliente + admin el resultado de un intento de cobro (cron o
// webhook, lo que haya resuelto el estado). Un solo evento por intento: si
// la cuota entró en mora, se manda "entrada_mora" en vez de "cobro_fallido"
// (es la más severa de las dos, no hace falta mandar ambas).
export async function notificarResultadoCobro(
  supabase: Cliente,
  input: {
    clienteId: string;
    cuotaId: string;
    numeroCuota: number;
    monto: number;
    tipoMovimiento: "cobro" | "mora";
    exitoso: boolean;
    estadoCuota: Database["public"]["Enums"]["estado_cuota"];
    clienteCorreo: string | null;
  }
) {
  const etiqueta = input.tipoMovimiento === "mora" ? "el cargo de mora" : `la cuota #${input.numeroCuota}`;
  let tipo: TipoNotificacion;
  let mensaje: string;

  if (input.exitoso) {
    tipo = "cobro_exitoso";
    mensaje = `Se cobró con éxito ${etiqueta} por $${input.monto.toFixed(2)}.`;
  } else if (input.estadoCuota === "en_mora") {
    tipo = "entrada_mora";
    mensaje = `No se pudo cobrar ${etiqueta}. La cuota #${input.numeroCuota} entró en mora.`;
  } else {
    tipo = "cobro_fallido";
    mensaje = `No se pudo cobrar ${etiqueta} (cuota #${input.numeroCuota}). Se reintentará.`;
  }

  await registrarNotificacion(supabase, {
    destinatario: "cliente",
    clienteId: input.clienteId,
    cuotaId: input.cuotaId,
    tipo,
    mensaje,
    correoDestino: input.clienteCorreo,
  });
  await registrarNotificacion(supabase, {
    destinatario: "admin",
    clienteId: input.clienteId,
    cuotaId: input.cuotaId,
    tipo,
    mensaje,
  });
}

export async function notificarPrestamoCancelado(supabase: Cliente, input: { clienteId: string; clienteCorreo: string | null }) {
  await registrarNotificacion(supabase, {
    destinatario: "cliente",
    clienteId: input.clienteId,
    cuotaId: null,
    tipo: "prestamo_cancelado",
    mensaje: "Tu préstamo fue cancelado. Ya no se harán más cobros automáticos.",
    correoDestino: input.clienteCorreo,
  });
}

// Aviso de rechazo (FCRA "adverse action notice") — contenido mínimo
// exigido cuando la decisión se basa en información de un buró de
// crédito: motivo, que la fuente fue Experian, cómo contactarlos, y el
// derecho del cliente a una copia gratuita de su reporte. Plantilla —
// los datos de contacto de Experian y el texto exacto deben confirmarse
// antes de producción.
export async function notificarCreditoRechazado(
  supabase: Cliente,
  input: { clienteId: string; motivoRechazo: string; clienteCorreo: string | null }
) {
  const mensaje = [
    `Tu solicitud de financiamiento fue rechazada. Motivo: ${input.motivoRechazo}.`,
    "Esta decisión se basó, en parte o en su totalidad, en información de tu reporte de crédito de Experian.",
    "Tienes derecho a una copia gratuita de tu reporte de Experian si la solicitas dentro de los 60 días siguientes, y a disputar cualquier información inexacta directamente con ellos.",
    "Contacto de Experian: [PENDIENTE — confirmar dirección y teléfono exactos antes de producción].",
  ].join(" ");

  await registrarNotificacion(supabase, {
    destinatario: "cliente",
    clienteId: input.clienteId,
    cuotaId: null,
    tipo: "credito_rechazado",
    mensaje,
    correoDestino: input.clienteCorreo,
  });
}

export async function notificarReembolso(
  supabase: Cliente,
  input: { clienteId: string; cuotaId: string; numeroCuota: number; monto: number; clienteCorreo: string | null }
) {
  await registrarNotificacion(supabase, {
    destinatario: "cliente",
    clienteId: input.clienteId,
    cuotaId: input.cuotaId,
    tipo: "reembolso",
    mensaje: `Se te reembolsó $${input.monto.toFixed(2)} de la cuota #${input.numeroCuota}.`,
    correoDestino: input.clienteCorreo,
  });
}
