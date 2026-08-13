-- El cliente necesita ver su propio score (consulta_score) para que el
-- simulador use la tasa real de su nivel en vez de que elija una a mano —
-- hasta ahora esta tabla no tenía ninguna policy para cliente.
create policy "cliente_lectura" on consulta_score for select using (cliente_id = current_cliente_id());
