-- Paolo pasó un modelo de formulario de prequalificación (de un competidor/
-- socio) con más datos estructurados que los que hoy pide /clientes/nuevo.
-- cliente.nombre se mantiene tal cual (nombre completo, ya usado en todo el
-- código para mostrar al cliente) — estas columnas nuevas son aditivas,
-- todas nullable porque las filas existentes no las tienen.
alter table cliente
  add column nombre_pila text,
  add column nombre_medio text,
  add column apellido text,
  add column ciudad text,
  add column estado text,
  add column codigo_postal text,
  add column licencia_numero text,
  add column licencia_estado text,
  add column fecha_nacimiento date,
  add column instalacion_misma_direccion boolean not null default true,
  add column direccion_instalacion text,
  add column ciudad_instalacion text,
  add column estado_instalacion text,
  add column codigo_postal_instalacion text;

comment on column cliente.direccion is 'Dirección de correspondencia (Mailing Address).';
comment on column cliente.instalacion_misma_direccion is 'true si la dirección de instalación es la misma que la de correspondencia — si es false, se usan las columnas *_instalacion.';
