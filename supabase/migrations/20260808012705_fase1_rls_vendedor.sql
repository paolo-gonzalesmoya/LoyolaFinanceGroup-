-- Fase 1: políticas de vendedor sobre lead/valor_campo_lead, y lectura de
-- categoria_servicio/campo_servicio para todo el staff (las necesitan ambos
-- roles para armar el formulario de "nuevo lead" y los campos dinámicos).
--
-- Regla de negocio (matriz de permisos del diagrama): un vendedor ve/edita
-- leads en estado 'activo' (para poder reclamarlos) o los que ya son suyos
-- (vendedor_id = él mismo) — vía registro propio o reclamo.

create policy "staff_read" on categoria_servicio for select using (is_admin() or is_vendedor());
create policy "staff_read" on campo_servicio for select using (is_admin() or is_vendedor());

create policy "vendedor_select" on lead for select
  using (is_vendedor() and (estado = 'activo' or vendedor_id = current_usuario_id()));

create policy "vendedor_insert" on lead for insert
  with check (is_vendedor() and registrado_por = current_usuario_id());

create policy "vendedor_update" on lead for update
  using (is_vendedor() and (estado = 'activo' or vendedor_id = current_usuario_id()))
  with check (is_vendedor() and vendedor_id = current_usuario_id());

create policy "vendedor_select" on valor_campo_lead for select
  using (
    is_vendedor()
    and exists (select 1 from lead l where l.id = lead_id and l.vendedor_id = current_usuario_id())
  );

create policy "vendedor_insert" on valor_campo_lead for insert
  with check (
    is_vendedor()
    and registrado_por = current_usuario_id()
    and exists (select 1 from lead l where l.id = lead_id and l.vendedor_id = current_usuario_id())
  );

create policy "vendedor_update" on valor_campo_lead for update
  using (
    is_vendedor()
    and exists (select 1 from lead l where l.id = lead_id and l.vendedor_id = current_usuario_id())
  )
  with check (
    is_vendedor()
    and exists (select 1 from lead l where l.id = lead_id and l.vendedor_id = current_usuario_id())
  );
