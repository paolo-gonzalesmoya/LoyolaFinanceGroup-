-- Falta en 20260814012000_rol_asesor_gestion_clientes.sql: el asesor
-- necesita poder borrar una solicitud propia sin decisión todavía
-- (eliminarSolicitudCredito ya valida en la Server Action que no tenga
-- contrato asociado; acá solo falta el permiso de RLS para el delete).
create policy "vendedor_delete" on solicitud_credito for delete using (is_vendedor() and cliente_de_vendedor(cliente_id));

-- También faltaba cubrir lib/prestamos/downpayment.ts (cobrarDownpayment),
-- compartido por verificarDownpayment (staff) — ahora abierto a asesor.
-- Actualiza contrato (marca downpayment_pagado) e inserta prestamo/cuota
-- con el cliente de sesión, no con service-role, así que necesita RLS:
create policy "vendedor_update" on contrato for update
  using (is_vendedor() and contrato_de_vendedor(id))
  with check (is_vendedor() and contrato_de_vendedor(id));

create policy "vendedor_insert" on prestamo for insert
  with check (is_vendedor() and contrato_de_vendedor(contrato_id));

create policy "vendedor_insert" on cuota for insert
  with check (is_vendedor() and prestamo_de_vendedor(prestamo_id));
