-- Un cliente auto-registrado no tiene ningún miembro de staff que lo haya
-- cargado — registrado_por deja de ser obligatorio. Para los admin-created
-- sigue llenándose igual que siempre.
alter table cliente alter column registrado_por drop not null;
