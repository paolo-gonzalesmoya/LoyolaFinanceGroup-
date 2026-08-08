-- Notificaciones (cliente + admin sobre resultado de cobros, mora,
-- cancelación, reembolso — el diagrama de Paolo confirma que ambos deben
-- enterarse del resultado de cada cobro) y soporte para reembolsar un cobro
-- puntual (tipo_movimiento ya tenía 'reembolso' en el enum original, pero
-- nada lo usaba todavía).

create type destinatario_notificacion as enum ('admin', 'cliente');
create type tipo_notificacion as enum (
  'cobro_exitoso', 'cobro_fallido', 'entrada_mora', 'prestamo_cancelado', 'reembolso'
);

create table notificacion (
  id uuid primary key default gen_random_uuid(),
  destinatario destinatario_notificacion not null,
  cliente_id uuid references cliente(id),
  cuota_id uuid references cuota(id),
  tipo tipo_notificacion not null,
  mensaje text not null,
  leida boolean not null default false,
  fecha_registro timestamptz not null default now()
);

create index idx_notificacion_cliente on notificacion(cliente_id);
create index idx_notificacion_destinatario_leida on notificacion(destinatario, leida);

-- Admin-only por ahora, igual que el resto de tablas financieras. Cuando
-- exista el portal del cliente (Fase 7) se suma una policy de solo-lectura
-- para que el cliente vea SUS notificaciones (destinatario='cliente' y
-- cliente_id = su propia fila) — no antes.
alter table notificacion enable row level security;
create policy "admin_full_access" on notificacion for all using (is_admin()) with check (is_admin());

-- Para poder trazar un reembolso hasta el cobro que reembolsa. Nullable:
-- solo se llena en filas tipo='reembolso'.
alter table movimiento_pago add column movimiento_original_id uuid references movimiento_pago(id);
