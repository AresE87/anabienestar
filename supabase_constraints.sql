-- Constraints únicos para Supabase
-- Ejecutar estos comandos en el SQL Editor de Supabase

-- Constraint único para checklist_items
ALTER TABLE checklist_items 
ADD CONSTRAINT checklist_unique UNIQUE (usuario_id, fecha, item);

-- Constraint único para estados_animo
ALTER TABLE estados_animo 
ADD CONSTRAINT estado_unique UNIQUE (usuario_id, fecha);
