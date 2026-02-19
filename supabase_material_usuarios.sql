-- =========================================================
-- Tabla de asignacion de material a clientas individuales
-- Ejecutar en Supabase SQL Editor
-- =========================================================

-- Tabla junction: material <-> usuarios
CREATE TABLE IF NOT EXISTS material_usuarios (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id uuid NOT NULL REFERENCES material(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(material_id, usuario_id)
);

-- Indice para queries rapidas por usuario
CREATE INDEX IF NOT EXISTS idx_material_usuarios_usuario ON material_usuarios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_material_usuarios_material ON material_usuarios(material_id);

-- =========================================================
-- RLS (Row Level Security)
-- =========================================================
ALTER TABLE material_usuarios ENABLE ROW LEVEL SECURITY;

-- Admin puede hacer todo
CREATE POLICY "Admin full access material_usuarios"
  ON material_usuarios FOR ALL
  USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

-- Clienta solo puede leer sus propias asignaciones
CREATE POLICY "Clienta lee sus asignaciones"
  ON material_usuarios FOR SELECT
  USING (usuario_id = auth.uid());
