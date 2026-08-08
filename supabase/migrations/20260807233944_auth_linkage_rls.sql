-- Enlace de usuario/cliente a Supabase Auth, funciones helper de rol, y RLS
-- base en las 16 tablas del esquema inicial.
--
-- Alcance de esta migración (Fase 0 del plan): dejar la base bloqueada por
-- defecto y accesible solo para admin (+ lectura de su propia fila para
-- cualquier usuario autenticado). Las políticas finas de vendedor/cliente se
-- agregan feature por feature en las migraciones de las Fases 1, 2 y 7.

-- ── Enlace a Supabase Auth ──────────────────────────────────────────
alter table usuario add column auth_user_id uuid unique references auth.users(id) on delete set null;
alter table cliente add column auth_user_id uuid unique references auth.users(id) on delete set null;

create index idx_usuario_auth_user_id on usuario(auth_user_id);
create index idx_cliente_auth_user_id on cliente(auth_user_id);

-- ── Funciones helper (security definer: leen usuario/cliente sin quedar
-- atrapadas por el RLS que esas mismas tablas van a tener) ─────────
create function current_usuario_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from usuario where auth_user_id = auth.uid() and activo = true;
$$;

create function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from usuario
    where auth_user_id = auth.uid() and rol = 'admin' and activo = true
  );
$$;

create function is_vendedor()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from usuario
    where auth_user_id = auth.uid() and rol = 'vendedor' and activo = true
  );
$$;

create function current_cliente_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from cliente where auth_user_id = auth.uid();
$$;

comment on function is_admin() is 'true si el usuario autenticado es admin activo. security definer para no quedar atrapada por el RLS de usuario.';
comment on function is_vendedor() is 'true si el usuario autenticado es vendedor activo.';
comment on function current_usuario_id() is 'id de la fila usuario del staff autenticado, o null.';
comment on function current_cliente_id() is 'id de la fila cliente del portal autenticado, o null.';

-- ── RLS: bloqueado por defecto en las 16 tablas ─────────────────────
alter table usuario enable row level security;
alter table categoria_servicio enable row level security;
alter table campo_servicio enable row level security;
alter table lead enable row level security;
alter table valor_campo_lead enable row level security;
alter table cliente enable row level security;
alter table cotizacion enable row level security;
alter table item_cotizacion enable row level security;
alter table consulta_score enable row level security;
alter table solicitud_credito enable row level security;
alter table contrato enable row level security;
alter table comision_vendedor enable row level security;
alter table mandato_cobro enable row level security;
alter table prestamo enable row level security;
alter table cuota enable row level security;
alter table movimiento_pago enable row level security;

-- ── Admin: acceso total, en todas las tablas salvo el ledger ────────
create policy "admin_full_access" on usuario for all using (is_admin()) with check (is_admin());
create policy "self_read" on usuario for select using (auth_user_id = auth.uid());

create policy "admin_full_access" on categoria_servicio for all using (is_admin()) with check (is_admin());
create policy "admin_full_access" on campo_servicio for all using (is_admin()) with check (is_admin());
create policy "admin_full_access" on lead for all using (is_admin()) with check (is_admin());
create policy "admin_full_access" on valor_campo_lead for all using (is_admin()) with check (is_admin());
create policy "admin_full_access" on cliente for all using (is_admin()) with check (is_admin());
create policy "admin_full_access" on cotizacion for all using (is_admin()) with check (is_admin());
create policy "admin_full_access" on item_cotizacion for all using (is_admin()) with check (is_admin());
create policy "admin_full_access" on consulta_score for all using (is_admin()) with check (is_admin());
create policy "admin_full_access" on solicitud_credito for all using (is_admin()) with check (is_admin());
create policy "admin_full_access" on contrato for all using (is_admin()) with check (is_admin());
create policy "admin_full_access" on comision_vendedor for all using (is_admin()) with check (is_admin());
create policy "admin_full_access" on mandato_cobro for all using (is_admin()) with check (is_admin());
create policy "admin_full_access" on prestamo for all using (is_admin()) with check (is_admin());
create policy "admin_full_access" on cuota for all using (is_admin()) with check (is_admin());

-- movimiento_pago: admin solo puede LEER vía RLS. El insert real siempre pasa
-- por el cliente service-role dentro de lib/ledger/movimientos.ts (ver
-- migración de inmutabilidad) — ni admin ni vendedor tienen policy de
-- insert/update/delete aquí, ni siquiera por accidente desde el cliente.
create policy "admin_read" on movimiento_pago for select using (is_admin());
