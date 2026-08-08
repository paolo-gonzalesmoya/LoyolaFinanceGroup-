-- Inmutabilidad real de movimiento_pago (regla de oro del ledger, SPEC.md §7).
-- Hasta acá el "solo INSERT" era un comentario en el schema; esta migración
-- lo hace cumplir en 2 capas independientes de la base (la 3ra capa es de
-- disciplina de código: un único módulo, lib/ledger/movimientos.ts, puede
-- llamar insert sobre esta tabla).

-- Capa 1: trigger — bloquea UPDATE/DELETE sin importar qué rol de Postgres
-- ejecute la sentencia (incluido service_role).
create function prevent_movimiento_pago_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'movimiento_pago es inmutable: solo se permite INSERT (fila id=%, intento de %)', old.id, tg_op;
end;
$$;

create trigger trg_movimiento_pago_inmutable
  before update or delete on movimiento_pago
  for each row
  execute function prevent_movimiento_pago_mutation();

-- Capa 2: privilegios — respaldo independiente del trigger. Ningún rol de
-- API (anon, authenticated, service_role) tiene permiso de UPDATE/DELETE
-- sobre esta tabla; nada legítimo en la app necesita hacerlo nunca.
revoke update, delete on movimiento_pago from authenticated, anon, service_role;

comment on function prevent_movimiento_pago_mutation() is 'Hace cumplir la regla de oro del ledger (SPEC.md §7): movimiento_pago solo admite INSERT.';
