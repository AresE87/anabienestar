-- =========================================================
-- Migracion: Agregar columnas faltantes a tabla material
-- Ejecutar en Supabase SQL Editor
-- Seguro de ejecutar multiples veces (idempotente)
-- =========================================================

-- Agregar columna para_todas (controla si el material es para todas las clientas)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'material' AND column_name = 'para_todas'
  ) THEN
    ALTER TABLE material ADD COLUMN para_todas BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Agregar columna visible (controla si el material se muestra)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'material' AND column_name = 'visible'
  ) THEN
    ALTER TABLE material ADD COLUMN visible BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Poner valores default en filas existentes que tengan NULL
UPDATE material SET para_todas = true WHERE para_todas IS NULL;
UPDATE material SET visible = true WHERE visible IS NULL;
