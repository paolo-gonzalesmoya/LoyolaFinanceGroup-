-- Faltaba: marcarNotificacionLeida ahora abierto a asesor, pero
-- 20260814012000_rol_asesor_gestion_clientes.sql solo agregó
-- vendedor_select en notificacion, no update.
create policy "vendedor_update" on notificacion for update
  using (is_vendedor() and cliente_id is not null and cliente_de_vendedor(cliente_id))
  with check (is_vendedor() and cliente_id is not null and cliente_de_vendedor(cliente_id));
