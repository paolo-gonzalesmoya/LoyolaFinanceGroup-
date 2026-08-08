-- Loyola Capital Group — esquema inicial (Postgres / Supabase)
-- Un solo negocio por ahora (sin negocio_id); agregar esa columna a cada tabla
-- cuando se pase a multi-tenant.

create extension if not exists "pgcrypto";

-- ── Usuarios y roles ────────────────────────────────────────────────
create type rol_usuario as enum ('admin', 'vendedor');

create table usuario (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  correo text unique not null,
  rol rol_usuario not null,
  activo boolean not null default true,
  fecha_registro timestamptz not null default now()
);

-- ── Categorías y campos configurables por categoría ────────────────
create table categoria_servicio (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,           -- Roofing, Air Conditioning, Home Improvement
  fecha_registro timestamptz not null default now()
);

create type tipo_dato_campo as enum ('numero', 'texto', 'seleccion');

create table campo_servicio (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references categoria_servicio(id) on delete cascade,
  nombre_campo text not null,             -- Escuadras, Toneladas, Horas, Tipo de trabajo...
  unidad_medida text,                     -- Escuadras, Toneladas, Horas (null si no aplica)
  tipo_dato tipo_dato_campo not null default 'numero',
  opciones text[],                        -- para tipo_dato = 'seleccion' (ej. tipos Home Improvement)
  fecha_registro timestamptz not null default now()
);

-- ── Leads ───────────────────────────────────────────────────────────
create type estado_lead as enum ('activo', 'asignado', 'en_proceso', 'convertido', 'descartado');

create table lead (
  id uuid primary key default gen_random_uuid(),
  registrado_por uuid not null references usuario(id),
  categoria_id uuid not null references categoria_servicio(id),
  nombre text not null,
  direccion text,
  telefono text,
  correo text,
  foto_dni_url text,
  foto_recibo_url text,
  estado estado_lead not null default 'activo',
  vendedor_id uuid references usuario(id),
  fecha_registro timestamptz not null default now()
);

create index idx_lead_estado on lead(estado);
create index idx_lead_vendedor on lead(vendedor_id);

create table valor_campo_lead (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references lead(id) on delete cascade,
  campo_servicio_id uuid not null references campo_servicio(id),
  valor text,
  registrado_por uuid not null references usuario(id),
  fecha_registro timestamptz not null default now(),
  unique (lead_id, campo_servicio_id)
);

-- ── Cliente (una vez el financiamiento se aprueba) ─────────────────
create table cliente (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references lead(id),
  nombre text not null,
  direccion text,
  telefono text,
  correo text,
  ssn_itn_cifrado text,                   -- cifrar en la capa de aplicación; nunca en claro
  registrado_por uuid not null references usuario(id),
  fecha_registro timestamptz not null default now()
);

-- ── Cotización ──────────────────────────────────────────────────────
create table cotizacion (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references cliente(id),
  elaborada_por uuid not null references usuario(id),
  requiere_financiamiento boolean not null default true,
  fecha_registro timestamptz not null default now()
);

create table item_cotizacion (
  id uuid primary key default gen_random_uuid(),
  cotizacion_id uuid not null references cotizacion(id) on delete cascade,
  descripcion text not null,
  cantidad numeric(12,2) not null default 1,
  precio_unitario numeric(12,2) not null,
  subtotal numeric(12,2) generated always as (cantidad * precio_unitario) stored
);

-- ── Consulta de score / Solicitud de crédito ───────────────────────
create table consulta_score (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references cliente(id),
  score integer,
  ingresos_mensuales numeric(12,2),
  capacidad_pago numeric(12,2),
  registrado_por uuid not null references usuario(id),
  fecha_registro timestamptz not null default now()
);

create type decision_credito as enum ('pendiente', 'aprobado', 'rechazado');

create table solicitud_credito (
  id uuid primary key default gen_random_uuid(),
  cotizacion_id uuid not null references cotizacion(id),
  consulta_score_id uuid references consulta_score(id),
  decision decision_credito not null default 'pendiente',
  motivo_rechazo text,
  decidido_por uuid references usuario(id),
  fecha_registro timestamptz not null default now()
);

-- ── Contrato y comisión del vendedor ────────────────────────────────
create table contrato (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references solicitud_credito(id),
  numero_cuotas integer not null check (numero_cuotas in (12,18,24,36,48,60,72,84,96,108,120)),
  tasa_mensual numeric(5,2) not null,
  vendedor_id uuid not null references usuario(id),
  downpayment_monto numeric(12,2) not null,
  downpayment_pagado boolean not null default false,
  downpayment_verificado_por uuid references usuario(id),
  registrado_por uuid not null references usuario(id),
  fecha_registro timestamptz not null default now()
);

create type estado_comision as enum ('devengada', 'pagada', 'revertida');

create table comision_vendedor (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references contrato(id),
  vendedor_id uuid not null references usuario(id),
  porcentaje numeric(5,2) not null,
  monto numeric(12,2) not null,
  estado estado_comision not null default 'devengada',
  fecha_registro timestamptz not null default now()
);

-- ── Mandato de cobro (Stripe) ───────────────────────────────────────
create type estado_mandato as enum ('activo', 'inactivo');

create table mandato_cobro (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references cliente(id),
  stripe_payment_method_id text not null,
  estado estado_mandato not null default 'activo',
  fecha_registro timestamptz not null default now()
);

-- ── Préstamo y cuotas ────────────────────────────────────────────────
create type estado_prestamo as enum ('activo', 'pagado', 'cancelado');

create table prestamo (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references contrato(id),
  mandato_cobro_id uuid references mandato_cobro(id),
  monto_financiado numeric(12,2) not null,
  estado estado_prestamo not null default 'activo',
  fecha_registro timestamptz not null default now()
);

create type estado_cuota as enum ('pendiente', 'pagada', 'vencida', 'en_mora');

create table cuota (
  id uuid primary key default gen_random_uuid(),
  prestamo_id uuid not null references prestamo(id) on delete cascade,
  numero integer not null,
  fecha_vencimiento date not null,
  monto numeric(12,2) not null,
  estado estado_cuota not null default 'pendiente',
  unique (prestamo_id, numero)
);

create index idx_cuota_estado on cuota(estado);
create index idx_cuota_vencimiento on cuota(fecha_vencimiento);

-- ── Ledger de pagos (inmutable) ──────────────────────────────────────
create type tipo_movimiento as enum ('cobro', 'mora', 'reembolso', 'ajuste');
create type resultado_movimiento as enum ('exitoso', 'reintento', 'fallido');

create table movimiento_pago (
  id uuid primary key default gen_random_uuid(),
  cuota_id uuid not null references cuota(id),
  tipo tipo_movimiento not null,
  monto numeric(12,2) not null,
  monto_capital numeric(12,2),
  monto_interes numeric(12,2),
  stripe_event_id text,
  clave_idempotencia text not null unique,
  resultado resultado_movimiento not null,
  fecha_registro timestamptz not null default now()
);
-- Nunca UPDATE ni DELETE sobre esta tabla: solo INSERT. El saldo de una
-- cuota se calcula sumando sus movimientos, no leyendo un campo mutable.

create index idx_movimiento_cuota on movimiento_pago(cuota_id);

-- ── Regla de mora (referencia; el cálculo real corre en la app) ─────
-- 5 días de gracia tras el vencimiento, luego 5% fijo de la cuota +
-- 1% adicional por cada semana vencida, con tope de 10%. Cada cargo
-- se inserta como una fila tipo 'mora' en movimiento_pago.

comment on table movimiento_pago is 'Ledger inmutable de eventos de pago (Stripe webhooks + mora). No editar filas existentes.';
comment on column cliente.ssn_itn_cifrado is 'Cifrar en la app antes de guardar; nunca exponer completo en la UI (mostrar solo últimos 4 dígitos).';
