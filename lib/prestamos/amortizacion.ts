// Cronograma de cuota fija (sistema francés — pago mensual igual durante
// todo el préstamo). SPEC.md solo define que existe `tasa_mensual` y
// `numero_cuotas`, no la fórmula — esta es la convención estándar para
// préstamos de cuota fija y queda documentada acá como tal.

export type CuotaGenerada = { numero: number; fechaVencimiento: string; monto: number };

export function calcularCuotaFija(montoFinanciado: number, tasaMensualPorciento: number, numeroCuotas: number): number {
  const r = tasaMensualPorciento / 100;
  if (r === 0) return montoFinanciado / numeroCuotas;
  const factor = Math.pow(1 + r, numeroCuotas);
  return (montoFinanciado * r * factor) / (factor - 1);
}

// Ancla la fecha al día del mes de `fechaInicio`, recortando al último día
// del mes destino si no existe (ej. 31 de enero + 1 mes -> 28/29 de
// febrero, no "3 de marzo" como haría un Date.setMonth ingenuo).
function sumarMesesConClamp(fechaInicio: Date, meses: number): Date {
  const dia = fechaInicio.getUTCDate();
  const base = new Date(Date.UTC(fechaInicio.getUTCFullYear(), fechaInicio.getUTCMonth() + meses, 1));
  const ultimoDiaDelMes = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate();
  base.setUTCDate(Math.min(dia, ultimoDiaDelMes));
  return base;
}

export function generarCronograma(
  montoFinanciado: number,
  tasaMensualPorciento: number,
  numeroCuotas: number,
  fechaInicio: Date
): CuotaGenerada[] {
  const cuotaFija = Math.round(calcularCuotaFija(montoFinanciado, tasaMensualPorciento, numeroCuotas) * 100) / 100;

  return Array.from({ length: numeroCuotas }, (_, i) => {
    const numero = i + 1;
    const fecha = sumarMesesConClamp(fechaInicio, numero);
    return { numero, fechaVencimiento: fecha.toISOString().slice(0, 10), monto: cuotaFija };
  });
}
