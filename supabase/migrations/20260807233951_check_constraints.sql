-- Respaldos duros a nivel de base para reglas de negocio que hoy solo viven
-- en SPEC.md / en el diagrama, más las relaciones 1:1 que el diagrama del
-- modelo de datos marca explícitamente pero el schema original no fuerza.

-- Tope de financiamiento: SPEC.md §1.3, "máximo USD 25,000 financiado".
-- La app valida esto antes de aprobar; este CHECK es el respaldo si algo
-- se salta esa validación.
alter table prestamo
  add constraint chk_prestamo_monto_max check (monto_financiado <= 25000);

-- Relaciones que el diagrama de modelo de datos marca como 1-1
-- (docs/diagrams/02-diagramas.png y 03-diagramas.png):
alter table cotizacion
  add constraint uq_cotizacion_cliente unique (cliente_id);

alter table solicitud_credito
  add constraint uq_solicitud_cotizacion unique (cotizacion_id);

alter table contrato
  add constraint uq_contrato_solicitud unique (solicitud_id);

alter table comision_vendedor
  add constraint uq_comision_contrato unique (contrato_id);

alter table prestamo
  add constraint uq_prestamo_contrato unique (contrato_id);
