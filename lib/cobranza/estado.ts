import type { Database } from "@/types/database.types";
import { DIAS_GRACIA } from "@/lib/mora/calculo";

type EstadoCuota = Database["public"]["Enums"]["estado_cuota"];

// Máquina de estados de cuota (docs/schema.sql, estado_cuota):
// pendiente -> pagada (cobro exitoso)
// pendiente -> vencida (pasó la fecha de vencimiento sin cobro)
// vencida -> en_mora (pasaron los días de gracia sin cobro)
export function calcularNuevoEstadoCuota(exitoso: boolean, diasAtraso: number): EstadoCuota {
  if (exitoso) return "pagada";
  if (diasAtraso > DIAS_GRACIA) return "en_mora";
  if (diasAtraso >= 1) return "vencida";
  return "pendiente";
}
