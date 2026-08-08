// Regla de mora (docs/schema.sql, comentario sobre movimiento_pago): 5 días
// de gracia tras el vencimiento: 0% mora. Del día 6 en adelante, 5% fijo del
// monto de la cuota + 1% adicional por cada semana completa vencida, con
// tope de 10%. El cálculo corre acá (en la app), nunca en la base.

export const DIAS_GRACIA = 5;

const MORA_BASE = 0.05;
const MORA_POR_SEMANA = 0.01;
const MORA_TOPE = 0.1;

// Cuenta días de calendario completos entre la fecha de vencimiento (date,
// sin hora) y "ahora". Usa Math.floor así que el resultado no depende de a
// qué hora del día corre el cron.
export function diasDeAtraso(fechaVencimiento: string, ahora: Date): number {
  const vencimiento = new Date(`${fechaVencimiento}T00:00:00Z`);
  const diffMs = ahora.getTime() - vencimiento.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// Porcentaje de mora TOTAL acumulado a la fecha (no incremental respecto al
// día anterior — ver lib/cobranza/mora.ts para el manejo del incremento).
export function calcularPorcentajeMora(diasAtraso: number): number {
  if (diasAtraso <= DIAS_GRACIA) return 0;
  const semanasEnMora = Math.floor((diasAtraso - DIAS_GRACIA) / 7);
  return Math.min(MORA_BASE + semanasEnMora * MORA_POR_SEMANA, MORA_TOPE);
}

export function calcularMontoMora(montoCuota: number, porcentajeMora: number): number {
  return Math.round(montoCuota * porcentajeMora * 100) / 100;
}
