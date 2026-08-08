-- Rastro de auditoría (Fase 3): quién vio un SSN, quién disparó una
-- consulta de score, quién aprobó/rechazó una solicitud de crédito. Gap
-- real del schema original — se agrega ahora porque es exactamente cuando
-- empiezan a circular datos sensibles y decisiones de crédito.

create type tipo_evento_auditoria as enum ('ver_ssn', 'consulta_score', 'aprobacion_credito', 'rechazo_credito');

create table auditoria (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuario(id),
  tipo tipo_evento_auditoria not null,
  cliente_id uuid references cliente(id),
  solicitud_credito_id uuid references solicitud_credito(id),
  fecha_registro timestamptz not null default now()
);

create index idx_auditoria_cliente on auditoria(cliente_id);

alter table auditoria enable row level security;

create policy "admin_read" on auditoria for select using (is_admin());
create policy "admin_insert" on auditoria for insert with check (is_admin());
-- Sin policy de update/delete: igual que movimiento_pago, nadie puede
-- editar el rastro de auditoría por la API — solo INSERT y SELECT.

comment on table auditoria is 'Rastro de auditoría (quién vio SSN, consultó score, aprobó/rechazó crédito). Solo INSERT/SELECT, nunca se edita ni se borra.';
