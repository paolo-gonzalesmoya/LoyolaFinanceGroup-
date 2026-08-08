-- Seed de las categorías de servicio reales (SPEC.md §3) — no son datos de
-- ejemplo, son el catálogo real del MVP. Categorías futuras se agregan desde
-- la pantalla de Configuración, sin necesidad de otra migración.

insert into categoria_servicio (nombre) values
  ('Roofing'),
  ('Air Conditioning'),
  ('Home Improvement');

insert into campo_servicio (categoria_id, nombre_campo, unidad_medida, tipo_dato)
select id, 'Escuadras', 'Escuadras', 'numero' from categoria_servicio where nombre = 'Roofing';

insert into campo_servicio (categoria_id, nombre_campo, unidad_medida, tipo_dato)
select id, 'Toneladas', 'Toneladas', 'numero' from categoria_servicio where nombre = 'Air Conditioning';

insert into campo_servicio (categoria_id, nombre_campo, unidad_medida, tipo_dato)
select id, 'Horas', 'Horas', 'numero' from categoria_servicio where nombre = 'Home Improvement';

insert into campo_servicio (categoria_id, nombre_campo, tipo_dato, opciones)
select id, 'Tipo de trabajo', 'seleccion',
  array['Baño', 'Cocina', 'Recamara', 'Pisos', 'Fences', 'Ventana', 'Roofing', 'Pintura']
from categoria_servicio where nombre = 'Home Improvement';
