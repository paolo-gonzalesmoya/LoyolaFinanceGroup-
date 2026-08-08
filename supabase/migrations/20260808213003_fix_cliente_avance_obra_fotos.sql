-- Fix de la auditoría de RLS (Fase 8): el bucket avance-obra-fotos solo
-- tenía policy de SELECT para is_admin() — el portal del cliente (Fase 7)
-- ya podía leer la fila avance_obra, pero createSignedUrl() sobre la FOTO
-- fallaba silenciosamente ("Object not found", el mensaje que usa Storage
-- para no revelar si el objeto existe) porque nadie le dio permiso de
-- lectura al cliente sobre el archivo en sí.
--
-- El path del objeto es "{contrato_id}/{avance_obra_id}.{ext}" — se extrae
-- el contrato_id del primer segmento de la carpeta y se valida la misma
-- cadena que ya usa la policy de la tabla avance_obra.
create policy "cliente_select_avance_obra_fotos" on storage.objects for select
  using (
    bucket_id = 'avance-obra-fotos'
    and exists (
      select 1 from contrato
      join solicitud_credito on solicitud_credito.id = contrato.solicitud_id
      join cotizacion on cotizacion.id = solicitud_credito.cotizacion_id
      where contrato.id = ((storage.foldername(name))[1])::uuid
        and cotizacion.cliente_id = current_cliente_id()
    )
  );
