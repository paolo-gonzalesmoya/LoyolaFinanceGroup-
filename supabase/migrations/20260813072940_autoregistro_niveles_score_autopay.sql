-- Auto-registro del cliente + niveles de score/tasa + separación legal del
-- autopay (Texas Finance Code Chapter 345 — financiamiento del propio
-- contratista). Migración aditiva: no se toca ninguna tabla existente más
-- allá de agregar columnas nuevas.

-- ── Niveles de score → tasa (Paolo ya trajo este schema) ────────────
create table niveles_score (
  id uuid primary key default gen_random_uuid(),
  nombre_nivel text not null,
  score_min integer not null,
  score_max integer not null,
  tasa_interes numeric(5,2) not null,
  -- Reparto interno Loyola/socio — metadata pura, no participa en ningún
  -- cálculo que vea o pague el cliente (confirmado con Paolo).
  dealer_fee_pct numeric(5,2),
  dealer_fee_socio_pct numeric(5,2),
  activo boolean not null default true,
  fecha_registro timestamptz not null default now()
);

alter table niveles_score enable row level security;
create policy "admin_full_access" on niveles_score for all using (is_admin()) with check (is_admin());
-- Lectura pública de los niveles activos: hace falta para el simulador
-- antes de que el visitante tenga cuenta o esté confirmado.
create policy "lectura_publica_activos" on niveles_score for select using (activo = true);

-- ── Cliente: auto-registro + confirmación manual de admin ───────────
alter table cliente add column verificado boolean not null default false;
alter table cliente add column verificado_por uuid references usuario(id);
alter table cliente add column verificado_en timestamptz;
alter table cliente add column tc_aceptado_en timestamptz;
alter table cliente add column tc_version text;

-- Los clientes que ya existían (todos registrados por admin hasta ahora)
-- quedan verificados — admin ya los validó al cargarlos a mano.
update cliente set verificado = true;

-- ── Contrato: disclosure de TILA aceptado ────────────────────────────
alter table contrato add column tila_aceptado_en timestamptz;

-- ── Mandato de cobro: consentimiento explícito de autopay, separado del
-- resto del contrato (requisito legal, no decisión de UX) ────────────
alter table mandato_cobro add column autopay_consentido_en timestamptz;

-- ── Notificación de rechazo de crédito (FCRA) ────────────────────────
alter type tipo_notificacion add value 'credito_rechazado';
