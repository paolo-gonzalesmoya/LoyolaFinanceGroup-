-- Reintroduce el rol "vendedor" (etiqueta en la UI: "Asesor") con un
-- propósito distinto al que tenía antes de la reestructuración
-- solo-financiamiento: ya no vende/genera leads, ahora registra clientes y
-- gestiona (simula, arma contrato, cobra) los que él mismo registró.
-- Admin sigue viendo y pudiendo gestionar todo.
--
-- is_vendedor() se había borrado en 20260813014655_reestructuracion_solo_
-- financiamiento.sql junto con el viejo modelo de leads — se recrea acá
-- con la misma definición de siempre, el significado de "vendedor" cambió
-- pero el chequeo de rol es igual.
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
comment on function is_vendedor() is 'true si el usuario autenticado es asesor (rol vendedor) activo.';

-- ── Helpers de propiedad: "¿esta fila pertenece a un cliente que registró
-- el asesor actual?" — encadenados según la FK real hasta cliente.
-- registrado_por (ver types/database.types.ts, no docs/schema.sql que
-- quedó desactualizado tras la reestructuración).
create function cliente_de_vendedor(p_cliente_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from cliente
    where id = p_cliente_id and registrado_por = current_usuario_id()
  );
$$;

create function contrato_de_vendedor(p_contrato_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from contrato c
    join solicitud_credito s on s.id = c.solicitud_id
    where c.id = p_contrato_id and cliente_de_vendedor(s.cliente_id)
  );
$$;

create function prestamo_de_vendedor(p_prestamo_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from prestamo p
    where p.id = p_prestamo_id and contrato_de_vendedor(p.contrato_id)
  );
$$;

comment on function cliente_de_vendedor(uuid) is 'true si el cliente fue registrado por el asesor autenticado.';
comment on function contrato_de_vendedor(uuid) is 'true si el contrato pertenece a un cliente del asesor autenticado.';
comment on function prestamo_de_vendedor(uuid) is 'true si el préstamo pertenece a un cliente del asesor autenticado.';

-- ── cliente: el asesor ve/crea/edita solo los que él registró. Sin
-- delete — igual que admin, nadie borra clientes vía RLS. ────────────
create policy "vendedor_select" on cliente for select using (is_vendedor() and registrado_por = current_usuario_id());
create policy "vendedor_insert" on cliente for insert with check (is_vendedor() and registrado_por = current_usuario_id());
create policy "vendedor_update" on cliente for update
  using (is_vendedor() and registrado_por = current_usuario_id())
  with check (is_vendedor() and registrado_por = current_usuario_id());

-- ── solicitud_credito: el asesor arma y ve la solicitud de sus clientes,
-- pero no cambia decision (eso lo aprueba/rechaza admin) — sin policy de
-- update para vendedor a propósito. ──────────────────────────────────
create policy "vendedor_select" on solicitud_credito for select using (is_vendedor() and cliente_de_vendedor(cliente_id));
create policy "vendedor_insert" on solicitud_credito for insert with check (is_vendedor() and cliente_de_vendedor(cliente_id));

-- ── consulta_score: el asesor consulta el score de sus propios clientes. ──
create policy "vendedor_select" on consulta_score for select using (is_vendedor() and cliente_de_vendedor(cliente_id));
create policy "vendedor_insert" on consulta_score for insert with check (is_vendedor() and cliente_de_vendedor(cliente_id));

-- ── contrato: el asesor arma y ve el contrato de sus clientes. ───────
create policy "vendedor_select" on contrato for select using (is_vendedor() and contrato_de_vendedor(id));
create policy "vendedor_insert" on contrato for insert
  with check (
    is_vendedor()
    and exists (select 1 from solicitud_credito s where s.id = solicitud_id and cliente_de_vendedor(s.cliente_id))
  );

-- ── mandato_cobro: el asesor puede ayudar a autorizar/cambiar el método
-- de cobro de sus clientes (respaldo del flujo del propio cliente). ──
create policy "vendedor_select" on mandato_cobro for select using (is_vendedor() and cliente_de_vendedor(cliente_id));
create policy "vendedor_insert" on mandato_cobro for insert with check (is_vendedor() and cliente_de_vendedor(cliente_id));
create policy "vendedor_update" on mandato_cobro for update
  using (is_vendedor() and cliente_de_vendedor(cliente_id))
  with check (is_vendedor() and cliente_de_vendedor(cliente_id));

-- ── prestamo: lectura, y update solo para cancelar (cancelarPrestamo). ──
create policy "vendedor_select" on prestamo for select using (is_vendedor() and contrato_de_vendedor(contrato_id));
create policy "vendedor_update" on prestamo for update
  using (is_vendedor() and contrato_de_vendedor(contrato_id))
  with check (is_vendedor() and contrato_de_vendedor(contrato_id));

-- ── cuota: solo lectura vía RLS — el cronograma lo genera siempre
-- lib/prestamos/downpayment.ts con service-role, igual que para admin. ──
create policy "vendedor_select" on cuota for select using (is_vendedor() and prestamo_de_vendedor(prestamo_id));

-- ── movimiento_pago: mismo criterio que admin_read — solo lectura, el
-- insert real siempre pasa por service-role (lib/ledger/movimientos.ts). ──
create policy "vendedor_read" on movimiento_pago for select using (
  is_vendedor()
  and exists (select 1 from cuota c where c.id = cuota_id and prestamo_de_vendedor(c.prestamo_id))
);

-- ── notificacion: el asesor ve las de sus propios clientes. ──────────
create policy "vendedor_select" on notificacion for select using (
  is_vendedor() and cliente_id is not null and cliente_de_vendedor(cliente_id)
);
