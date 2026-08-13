-- Reestructuración a "solo financiamiento" (2026-08-13). Paolo + su socio
-- decidieron sacar todo el embudo de ventas: sin leads, sin vendedores/
-- comisión, sin cotización por ítems (se reemplaza por un monto solicitado
-- directo), sin seguimiento de avance de obra. El downpayment inicial se
-- mantiene, ahora calculado sobre el monto solicitado.
--
-- Es la primera migración del proyecto que NO es aditiva — se justifica
-- porque el requerimiento cambió de verdad, no es corregir un diseño que
-- funcionaba mal. Se hizo un respaldo completo (scripts/_backup-pre-
-- restructuring.mjs -> backups/) antes de aplicar esto.

-- ── 1. Policies que quedarían rotas al tocar cotizacion — se sueltan antes
-- de cualquier cambio estructural, se recrean al final con la cadena corta.
drop policy "cliente_lectura" on solicitud_credito;
drop policy "cliente_lectura" on contrato;

-- ── 2. avance_obra y sus buckets van primero: su policy (tabla y storage)
-- también encadena hasta solicitud_credito.cotizacion_id, así que tienen
-- que caer antes de tocar esa columna.
drop policy "staff_insert_lead_fotos" on storage.objects;
drop policy "staff_select_lead_fotos" on storage.objects;
drop policy "admin_delete_lead_fotos" on storage.objects;
drop policy "admin_insert_avance_obra_fotos" on storage.objects;
drop policy "admin_select_avance_obra_fotos" on storage.objects;
drop policy "admin_delete_avance_obra_fotos" on storage.objects;
drop policy "cliente_select_avance_obra_fotos" on storage.objects;

-- Los objetos y buckets en sí (storage.objects/storage.buckets) no se
-- pueden tocar con DELETE directo — Supabase lo bloquea a nivel de tabla
-- ("Use the Storage API instead"). Se vacían/borran aparte con
-- scripts/_cleanup-storage-buckets.mjs antes de aplicar esta migración.

drop table avance_obra;

-- ── 3. solicitud_credito: de "por cotización" a "directo por cliente, con
-- un monto solicitado" — se agregan las columnas nuevas y se hace backfill
-- ANTES de tocar cotizacion/item_cotizacion (todavía existen acá).
alter table solicitud_credito add column cliente_id uuid references cliente(id);
alter table solicitud_credito add column monto_solicitado numeric(12,2);

update solicitud_credito sc
set cliente_id = c.cliente_id,
    monto_solicitado = coalesce(
      (select sum(ic.subtotal) from item_cotizacion ic where ic.cotizacion_id = c.id),
      0
    )
from cotizacion c
where c.id = sc.cotizacion_id;

alter table solicitud_credito alter column cliente_id set not null;
alter table solicitud_credito alter column monto_solicitado set not null;
alter table solicitud_credito add constraint uq_solicitud_cliente unique (cliente_id);
alter table solicitud_credito drop column cotizacion_id;

-- ── 4. Tablas que ya cumplieron su función (orden respeta FKs) ──────
drop table item_cotizacion;
drop table comision_vendedor;

-- ── 5. Columnas que ya no aplican ────────────────────────────────────
alter table contrato drop column vendedor_id;
alter table cliente drop column lead_id;

-- ── 6. El resto de la capa de captación/ventas ──────────────────────
drop table cotizacion;
drop table valor_campo_lead;
drop table lead;
drop table campo_servicio;
drop table categoria_servicio;

drop function is_vendedor();

-- ── 7. Enums que se quedaron sin ninguna tabla que los use ──────────
drop type estado_lead;
drop type tipo_dato_campo;
drop type estado_comision;
drop type etapa_avance_obra;

-- ── 8. RLS del portal del cliente, con la cadena corta ──────────────
create policy "cliente_lectura" on solicitud_credito for select
  using (cliente_id = current_cliente_id());

create policy "cliente_lectura" on contrato for select using (
  exists (
    select 1 from solicitud_credito
    where solicitud_credito.id = contrato.solicitud_id
      and solicitud_credito.cliente_id = current_cliente_id()
  )
);
