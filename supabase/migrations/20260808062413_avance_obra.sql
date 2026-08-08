-- Fase 5 (SPEC.md §1.5): "LC ejecuta la obra y registra avances/entregas
-- (fotos inicial / en proceso / final)". No existía en el schema original —
-- gap real, se agrega ahora como tabla aditiva.

create type etapa_avance_obra as enum ('inicial', 'en_proceso', 'final');

create table avance_obra (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references contrato(id),
  etapa etapa_avance_obra not null,
  foto_url text,
  descripcion text,
  registrado_por uuid not null references usuario(id),
  fecha_registro timestamptz not null default now()
);

create index idx_avance_obra_contrato on avance_obra(contrato_id);

-- Admin-only por ahora (igual que contrato/prestamo/cuota). Cuando exista
-- el portal del cliente (Fase 7) se suma acá una policy de solo-lectura
-- para que el cliente vea el avance de SU contrato — no antes.
alter table avance_obra enable row level security;
create policy "admin_full_access" on avance_obra for all using (is_admin()) with check (is_admin());

-- Bucket privado para las fotos de avance de obra (mismo patrón que
-- lead-fotos de la Fase 1, pero admin-only — a diferencia de los leads,
-- acá vendedor no tiene ningún rol según SPEC.md).
insert into storage.buckets (id, name, public)
values ('avance-obra-fotos', 'avance-obra-fotos', false)
on conflict (id) do nothing;

create policy "admin_insert_avance_obra_fotos" on storage.objects for insert
  with check (bucket_id = 'avance-obra-fotos' and is_admin());

create policy "admin_select_avance_obra_fotos" on storage.objects for select
  using (bucket_id = 'avance-obra-fotos' and is_admin());

create policy "admin_delete_avance_obra_fotos" on storage.objects for delete
  using (bucket_id = 'avance-obra-fotos' and is_admin());
