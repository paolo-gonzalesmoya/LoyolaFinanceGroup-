-- Corrección de modelo de tasa: el sistema trataba contrato.tasa_mensual y
-- niveles_score.tasa_interes como si fueran una tasa MENSUAL directa (así se
-- usaban en lib/prestamos/amortizacion.ts sin ninguna conversión), pero la
-- regla de negocio de Paolo ("máximo 9.99%", relevante para el tope de
-- usura) siempre fue pensada como tasa ANUAL — confirmado explícitamente
-- 2026-08-14 con una captura de un competidor que muestra "Interest Rate"
-- como una sola tasa aplicada igual en todos los plazos (comportamiento de
-- tasa anual, no mensual). Los valores ya cargados en niveles_score
-- (5.99–9.99) no se tocan — siempre fueron un ladder de tasa anual
-- razonable, el bug estaba en cómo el código los usaba, no en los datos.
--
-- Renombra la columna para que el nombre ya no mienta sobre su contenido.
-- Las 9 filas de contrato existentes son datos de prueba (downpayments de
-- $42–$120, no préstamos reales — verificado antes de este cambio), así que
-- reinterpretar su tasa_mensual=1.5 como tasa_anual=1.5 no afecta a ningún
-- cliente real.
alter table contrato rename column tasa_mensual to tasa_anual;

comment on column contrato.tasa_anual is 'Tasa de interés ANUAL (%) — se divide entre 12 recién al calcular el cronograma mensual, nunca se usa directamente como tasa mensual.';
comment on column niveles_score.tasa_interes is 'Tasa de interés ANUAL (%) sugerida para este nivel de score — mismo criterio que contrato.tasa_anual.';
