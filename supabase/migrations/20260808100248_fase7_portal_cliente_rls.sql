-- Fase 7: portal del cliente. RLS es la superficie más crítica acá —
-- expuesta a internet, no solo a staff interno — así que cada policy nueva
-- se ata explícitamente a current_cliente_id() (ya existía desde la
-- migración de Fase 0, security definer, devuelve null si quien pregunta no
-- es un cliente autenticado).

-- ── Lectura del cliente sobre su propia fila ────────────────────────
-- Ojo: esta policy no oculta columnas — ssn_itn_cifrado queda legible en la
-- fila propia, pero es ciphertext inútil sin SSN_ENCRYPTION_KEY (que nunca
-- sale del servidor). El código del portal igual nunca selecciona esa
-- columna, por las dudas.
create policy "cliente_self_read" on cliente for select using (id = current_cliente_id());

create policy "cliente_lectura" on cotizacion for select using (cliente_id = current_cliente_id());

create policy "cliente_lectura" on solicitud_credito for select using (
  exists (
    select 1 from cotizacion
    where cotizacion.id = solicitud_credito.cotizacion_id and cotizacion.cliente_id = current_cliente_id()
  )
);

create policy "cliente_lectura" on contrato for select using (
  exists (
    select 1 from solicitud_credito
    join cotizacion on cotizacion.id = solicitud_credito.cotizacion_id
    where solicitud_credito.id = contrato.solicitud_id and cotizacion.cliente_id = current_cliente_id()
  )
);

create policy "cliente_lectura" on avance_obra for select using (
  exists (
    select 1 from contrato
    join solicitud_credito on solicitud_credito.id = contrato.solicitud_id
    join cotizacion on cotizacion.id = solicitud_credito.cotizacion_id
    where contrato.id = avance_obra.contrato_id and cotizacion.cliente_id = current_cliente_id()
  )
);

-- mandato_cobro: el cliente puede ver y crear/actualizar los suyos (mismo
-- flujo de SetupIntent que usa admin, pero autoservicio — para cambiar de
-- tarjeta sin llamar a soporte). Nunca puede tocar el de otro cliente
-- porque cliente_id sale de current_cliente_id(), no de un parámetro.
create policy "cliente_lectura" on mandato_cobro for select using (cliente_id = current_cliente_id());
create policy "cliente_gestion" on mandato_cobro for insert with check (cliente_id = current_cliente_id());
create policy "cliente_gestion_update" on mandato_cobro for update
  using (cliente_id = current_cliente_id()) with check (cliente_id = current_cliente_id());

-- prestamo/cuota: la cadena más corta hasta el cliente es vía mandato_cobro
-- (prestamo.mandato_cobro_id), no vía contrato/solicitud/cotizacion — más
-- simple y siempre poblada (crearContrato exige un mandato activo antes de
-- crear el préstamo).
create policy "cliente_lectura" on prestamo for select using (
  exists (
    select 1 from mandato_cobro
    where mandato_cobro.id = prestamo.mandato_cobro_id and mandato_cobro.cliente_id = current_cliente_id()
  )
);

create policy "cliente_lectura" on cuota for select using (
  exists (
    select 1 from prestamo
    join mandato_cobro on mandato_cobro.id = prestamo.mandato_cobro_id
    where prestamo.id = cuota.prestamo_id and mandato_cobro.cliente_id = current_cliente_id()
  )
);

-- movimiento_pago ya tiene "admin_read"; esta se suma (postgres hace OR
-- entre policies del mismo comando) — el cliente ve el ledger de SUS
-- cuotas, nunca puede insertar/actualizar (sigue sin policy de escritura).
create policy "cliente_lectura" on movimiento_pago for select using (
  exists (
    select 1 from cuota
    join prestamo on prestamo.id = cuota.prestamo_id
    join mandato_cobro on mandato_cobro.id = prestamo.mandato_cobro_id
    where cuota.id = movimiento_pago.cuota_id and mandato_cobro.cliente_id = current_cliente_id()
  )
);

-- notificacion ya tiene "admin_full_access"; el cliente solo ve y marca
-- como leídas las suyas.
create policy "cliente_lectura" on notificacion for select
  using (destinatario = 'cliente' and cliente_id = current_cliente_id());
create policy "cliente_marcar_leida" on notificacion for update
  using (destinatario = 'cliente' and cliente_id = current_cliente_id())
  with check (destinatario = 'cliente' and cliente_id = current_cliente_id());

-- ── Saldo de una cuota, derivado del ledger (Decisión de seguridad #8 del
-- plan): nunca se lee cuota.estado como fuente de verdad de montos, se suma
-- movimiento_pago. security_invoker para que respete el RLS de quien
-- consulta (cliente ve solo lo suyo, admin ve todo) en vez de correr con
-- los privilegios de quien creó la vista.
create view saldo_cuota
with (security_invoker = true)
as
select
  cuota.id as cuota_id,
  cuota.monto as monto_cuota,
  coalesce(sum(movimiento_pago.monto) filter (where movimiento_pago.resultado = 'exitoso'), 0) as total_cobrado,
  cuota.monto - coalesce(sum(movimiento_pago.monto) filter (where movimiento_pago.resultado = 'exitoso'), 0) as saldo_pendiente
from cuota
left join movimiento_pago on movimiento_pago.cuota_id = cuota.id
group by cuota.id, cuota.monto;
