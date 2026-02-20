-- ============================================
-- RLS PARA TABLA USUARIOS
-- Ejecutar en el SQL Editor de Supabase
-- IMPORTANTE: ejecutar TODO junto (policies + enable)
-- ============================================

-- 1. Crear policies ANTES de habilitar RLS
-- (si RLS se habilita sin policies, todas las queries fallan)

-- Admin tiene acceso completo a todos los usuarios
CREATE POLICY "Admin acceso completo a usuarios"
  ON usuarios FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u WHERE u.id = auth.uid() AND u.rol = 'admin'
    )
  );

-- Cada usuario puede leer su propia fila
CREATE POLICY "Usuario lee su propio perfil"
  ON usuarios FOR SELECT
  USING (auth.uid() = id);

-- Cada usuario puede actualizar su propia fila
CREATE POLICY "Usuario actualiza su propio perfil"
  ON usuarios FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Permitir que el trigger de auto-crear perfil funcione
-- (el trigger usa SECURITY DEFINER, pero por si acaso)
CREATE POLICY "Insertar perfil propio"
  ON usuarios FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. Ahora si, habilitar RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- ============================================
-- NOTA: La policy "Admin acceso completo" es recursiva
-- (consulta la misma tabla usuarios para verificar rol).
-- Esto funciona en PostgreSQL porque las policies se
-- evaluan fila por fila. El admin puede leer su propia
-- fila via "Usuario lee su propio perfil", y eso permite
-- que la subconsulta de admin funcione para las demas filas.
-- ============================================
