-- =========================================================
-- OAuth Setup: Trigger para auto-crear perfil de usuario
-- Ejecutar en Supabase SQL Editor
--
-- Cuando un usuario se registra (email/password, Google, Apple),
-- se crea automaticamente una fila en public.usuarios con rol 'clienta'.
-- Usuarios existentes no se ven afectados (ON CONFLICT DO NOTHING).
-- =========================================================

-- Funcion que crea el perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, nombre, rol, avatar)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    'clienta',
    '🌿'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger que se ejecuta despues de cada INSERT en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
