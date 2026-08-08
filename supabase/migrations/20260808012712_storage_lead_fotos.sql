-- Bucket privado para foto de DNI y de recibo de cada lead (SPEC.md §1.1).
-- Convención de path: {lead_id}/dni.<ext> y {lead_id}/recibo.<ext> — el
-- primer segmento del path es el lead_id, así storage.foldername(name) sirve
-- para acotar el acceso más adelante si hace falta (por ahora, cualquier
-- miembro del staff con sesión puede subir/leer; borrar queda solo para
-- admin, para no perder evidencia por error de un vendedor).

insert into storage.buckets (id, name, public)
values ('lead-fotos', 'lead-fotos', false)
on conflict (id) do nothing;

create policy "staff_insert_lead_fotos" on storage.objects for insert
  with check (bucket_id = 'lead-fotos' and (is_admin() or is_vendedor()));

create policy "staff_select_lead_fotos" on storage.objects for select
  using (bucket_id = 'lead-fotos' and (is_admin() or is_vendedor()));

create policy "admin_delete_lead_fotos" on storage.objects for delete
  using (bucket_id = 'lead-fotos' and is_admin());
