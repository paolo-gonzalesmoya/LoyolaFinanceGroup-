import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { enviarEmailMock } from "./email";

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
  await enviarEmailMock(input.correoDestino ?? null, `Loyola Finance Group — ${input.tipo.replace(/_/g, " ")}`, input.mensaje);
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
