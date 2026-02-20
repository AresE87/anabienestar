-- ============================================
-- FIX: RLS PARA TABLA USUARIOS (v2)
-- Ejecutar en el SQL Editor de Supabase
-- IMPORTANTE: ejecutar TODO junto
-- ============================================
-- PROBLEMA ANTERIOR: la policy de admin usaba una
-- subconsulta recursiva a la misma tabla `usuarios`,
-- lo cual creaba evaluacion circular con RLS habilitado.
-- FIX: usar funcion is_admin() con SECURITY DEFINER
-- que bypasea RLS al ejecutarse como owner.
-- ============================================

-- 0. Deshabilitar RLS primero (por si estaba habilitado)
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;

-- 1. Limpiar policies anteriores (si existen)
DROP POLICY IF EXISTS "Admin acceso completo a usuarios" ON usuarios;
DROP POLICY IF EXISTS "Usuario lee su propio perfil" ON usuarios;
DROP POLICY IF EXISTS "Usuario actualiza su propio perfil" ON usuarios;
DROP POLICY IF EXISTS "Insertar perfil propio" ON usuarios;

-- 2. Crear funcion helper con SECURITY DEFINER
--    Esta funcion se ejecuta con permisos del OWNER (postgres),
--    NO del usuario llamante, asi que NO esta sujeta a RLS.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND rol = 'admin'
  );
$$;

-- 3. Crear policies usando is_admin()

-- Admin tiene acceso completo a todos los usuarios
CREATE POLICY "Admin acceso completo a usuarios"
  ON usuarios FOR ALL
  USING (public.is_admin());

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
-- y que usuarios nuevos (OAuth) puedan insertar su perfil
CREATE POLICY "Insertar perfil propio"
  ON usuarios FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4. Ahora si, habilitar RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICACION: despues de ejecutar, probar:
-- 1. Login con admin → debe ver dashboard completo
-- 2. Login con clienta → debe ver su perfil
-- 3. Admin puede ver lista de clientas
-- ============================================
