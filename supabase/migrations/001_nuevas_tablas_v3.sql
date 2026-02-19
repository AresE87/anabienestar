-- ═══════════════════════════════════════════════════
-- Migration v3.0 — Anabienestar Integral
-- Nuevas tablas: recetas, telegram, push, tenant
-- ═══════════════════════════════════════════════════

-- ── RECETAS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS recetas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'Desayuno', -- Desayuno, Almuerzo, Cena, Snack
  emoji TEXT DEFAULT '🍽️',
  tiempo TEXT, -- ej: '20 min'
  calorias TEXT, -- ej: '380 kcal'
  descripcion TEXT,
  url TEXT, -- link a receta completa
  visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── TELEGRAM SUSCRIPTORES ────────────────────
CREATE TABLE IF NOT EXISTS telegram_suscriptores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  chat_id BIGINT NOT NULL,
  nombre_telegram TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id),
  UNIQUE(chat_id)
);

CREATE INDEX IF NOT EXISTS idx_telegram_activo ON telegram_suscriptores(activo) WHERE activo = TRUE;

-- ── PUSH SUBSCRIPTIONS ──────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT,
  auth TEXT,
  subscription_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id)
);

-- ── TENANTS (para futuro multi-tenancy) ─────
CREATE TABLE IF NOT EXISTS tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE, -- ej: 'anabienestar'
  logo_url TEXT,
  color_primary TEXT DEFAULT '#3d5c41',
  color_secondary TEXT DEFAULT '#7a9e7e',
  color_background TEXT DEFAULT '#f8f4ee',
  color_accent TEXT DEFAULT '#b8956a',
  font_title TEXT DEFAULT 'Playfair Display',
  font_body TEXT DEFAULT 'Jost',
  nombre_coach TEXT DEFAULT 'Ana Karina',
  titulo_coach TEXT DEFAULT 'Nutricionista · Coach',
  telegram_bot_token TEXT, -- each tenant can have their own bot
  vapid_public_key TEXT,
  vapid_private_key TEXT,
  plan TEXT DEFAULT 'free', -- free, pro, business
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── TENANT CONFIG (extra settings per tenant) ─
CREATE TABLE IF NOT EXISTS tenant_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  clave TEXT NOT NULL, -- config key
  valor TEXT, -- config value
  UNIQUE(tenant_id, clave)
);

-- ── Insert default tenant for Ana Karina ────
INSERT INTO tenants (nombre, slug, nombre_coach, titulo_coach)
VALUES ('Anabienestar Integral', 'anabienestar', 'Ana Karina', 'Nutricionista · Coach')
ON CONFLICT (slug) DO NOTHING;

-- ── Seed initial recetas ────────────────────
INSERT INTO recetas (nombre, categoria, emoji, tiempo, calorias) VALUES
  ('Tostada de palta con huevo', 'Desayuno', '🥑', '10 min', '280 kcal'),
  ('Bowl de quinoa con verduras', 'Almuerzo', '🥗', '20 min', '420 kcal'),
  ('Huevos revueltos con espinaca', 'Desayuno', '🍳', '8 min', '220 kcal'),
  ('Sopa de lentejas express', 'Cena', '🍲', '25 min', '310 kcal'),
  ('Snack de manzana y almendras', 'Snack', '🍎', '2 min', '150 kcal'),
  ('Salmon al horno', 'Cena', '🐟', '30 min', '380 kcal'),
  ('Smoothie verde', 'Desayuno', '🥤', '5 min', '190 kcal')
ON CONFLICT DO NOTHING;
