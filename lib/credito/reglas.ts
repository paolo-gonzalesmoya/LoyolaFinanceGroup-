// SPEC.md §1.3: "Decide manualmente: aprueba o rechaza (máximo USD 25,000
// financiado)". Constante única para que Fase 3 (aprobación) y Fase 4
// (creación del préstamo) validen lo mismo — el CHECK en prestamo.monto_financiado
// (migración 0004) es el respaldo duro si esto se saltea.
export const TOPE_FINANCIAMIENTO_USD = 25_000;
