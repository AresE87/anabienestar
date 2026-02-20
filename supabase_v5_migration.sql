-- =============================================
-- Anabienestar v5.0 Migration
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. Agregar tipo 'audio' a mensajes (para mensajes de voz)
-- Nota: Si no hay constraint, estas lineas simplemente no hacen nada
ALTER TABLE mensajes DROP CONSTRAINT IF EXISTS mensajes_tipo_check;
-- Si la tabla usa un CHECK generico, tambien intentamos:
DO $$
BEGIN
  -- Intentar agregar constraint. Si ya existe un check compatible, no pasa nada.
  ALTER TABLE mensajes ADD CONSTRAINT mensajes_tipo_check
    CHECK (tipo IN ('texto', 'imagen', 'video', 'audio'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN others THEN NULL;
END $$;

-- 2. Tablas para programa grupal (scaffolding para futuro)

CREATE TABLE IF NOT EXISTS grupos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  fecha_inicio DATE,
  fecha_fin DATE,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grupo_miembros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  grupo_id UUID REFERENCES grupos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(grupo_id, usuario_id)
);

CREATE TABLE IF NOT EXISTS grupo_metas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  grupo_id UUID REFERENCES grupos(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  tipo TEXT DEFAULT 'checklist',
  objetivo_valor NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grupo_progreso (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meta_id UUID REFERENCES grupo_metas(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  valor NUMERIC,
  completado BOOLEAN DEFAULT FALSE,
  fecha DATE DEFAULT CURRENT_DATE,
  UNIQUE(meta_id, usuario_id, fecha)
);

-- RLS para grupos
ALTER TABLE grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupo_miembros ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupo_metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupo_progreso ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin manages groups" ON grupos FOR ALL
  USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin'));

CREATE POLICY "Admin manages group members" ON grupo_miembros FOR ALL
  USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin'));

CREATE POLICY "Admin manages group goals" ON grupo_metas FOR ALL
  USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin'));

CREATE POLICY "Admin manages group progress" ON grupo_progreso FOR ALL
  USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin'));

-- Clienta read access
CREATE POLICY "Clientas see their groups" ON grupos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM grupo_miembros WHERE grupo_id = grupos.id AND usuario_id = auth.uid()
  ));

CREATE POLICY "Clientas see group members" ON grupo_miembros FOR SELECT
  USING (
    usuario_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM grupo_miembros gm
      WHERE gm.grupo_id = grupo_miembros.grupo_id AND gm.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Clientas see group goals" ON grupo_metas FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM grupo_miembros gm
    WHERE gm.grupo_id = grupo_metas.grupo_id AND gm.usuario_id = auth.uid()
  ));

CREATE POLICY "Clientas manage own progress" ON grupo_progreso FOR ALL
  USING (usuario_id = auth.uid());
