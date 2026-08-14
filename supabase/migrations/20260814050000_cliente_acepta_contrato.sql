-- El cliente ahora es quien tiene que aceptar los términos reales de SU
-- contrato (cuotas, tasa anual, monto financiado, cargo financiero) antes
-- de poder autorizar su método de cobro — hasta ahora esa aceptación era
-- solo un checkbox que marcaba el staff en nombre del cliente
-- (contrato.tila_aceptado_en, que queda intacto como el registro interno de
-- que el staff se lo explicó al armar el contrato).
alter table contrato add column cliente_acepto_en timestamptz;
comment on column contrato.cliente_acepto_en is 'Cuándo el cliente mismo aceptó los términos de su contrato desde su portal — distinto de tila_aceptado_en (que es la confirmación interna de staff).';

-- El cliente ya podía LEER su contrato (cliente_lectura, migración
-- 20260813014655) pero no tenía ninguna policy de UPDATE — la acción
-- aceptarContratoCliente solo toca cliente_acepto_en, nunca los términos.
create policy "cliente_acepta" on contrato for update
  using (
    exists (
      select 1 from solicitud_credito
      where solicitud_credito.id = contrato.solicitud_id
        and solicitud_credito.cliente_id = current_cliente_id()
    )
  )
  with check (
    exists (
      select 1 from solicitud_credito
      where solicitud_credito.id = contrato.solicitud_id
        and solicitud_credito.cliente_id = current_cliente_id()
    )
  );
