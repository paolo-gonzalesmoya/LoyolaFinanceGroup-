import type { Database } from "@/types/database.types";
import { DIAS_GRACIA } from "@/lib/mora/calculo";

type EstadoCuota = Database["public"]["Enums"]["estado_cuota"];

// Máquina de estados de cuota (docs/schema.sql, estado_cuota):
// pendiente -> pagada (cobro exitoso)
// pendiente -> vencida (pasó la fecha de vencimiento sin cobro)
// vencida -> en_mora (pasaron los días de gracia sin cobro)
//
// La transición a en_mora está apagada a propósito (pedido explícito de
// Paolo, 2026-08-13): todavía no hay una fórmula de mora confirmada bajo
// Texas Finance Code Chapter 345, así que una cuota atrasada se queda en
// "vencida" sin importar cuánto pase. lib/mora/calculo.ts sigue intacto,
// listo para reactivar cuando haya fórmula — solo hay que volver a
// devolver "en_mora" acá.
export function calcularNuevoEstadoCuota(exitoso: boolean, diasAtraso: number): EstadoCuota {
  if (exitoso) return "pagada";
  if (diasAtraso >= 1) return "vencida";
  return "pendiente";
}
