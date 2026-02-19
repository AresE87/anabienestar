-- ============================================
-- TABLAS PARA SISTEMA DE CHAT
-- Ejecutar en el SQL Editor de Supabase
-- ============================================

-- Tabla de conversaciones (una por clienta)
CREATE TABLE IF NOT EXISTS conversaciones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  clienta_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ultimo_mensaje text,
  ultimo_mensaje_at timestamptz DEFAULT now(),
  no_leidos_admin int DEFAULT 0,
  no_leidos_clienta int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(clienta_id)
);

-- Tabla de mensajes
CREATE TABLE IF NOT EXISTS mensajes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversacion_id uuid REFERENCES conversaciones(id) ON DELETE CASCADE NOT NULL,
  remitente_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tipo text DEFAULT 'texto' CHECK (tipo IN ('texto', 'imagen', 'video')),
  contenido text,
  media_url text,
  media_type text,
  leido boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_mensajes_conversacion ON mensajes(conversacion_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversaciones_clienta ON conversaciones(clienta_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_remitente ON mensajes(remitente_id);

-- RLS (Row Level Security)
ALTER TABLE conversaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes ENABLE ROW LEVEL SECURITY;

-- Politicas para conversaciones
CREATE POLICY "Clientas ven su propia conversacion"
  ON conversaciones FOR SELECT
  USING (auth.uid() = clienta_id);

CREATE POLICY "Clientas pueden crear su conversacion"
  ON conversaciones FOR INSERT
  WITH CHECK (auth.uid() = clienta_id);

CREATE POLICY "Clientas pueden actualizar su conversacion"
  ON conversaciones FOR UPDATE
  USING (auth.uid() = clienta_id);

-- Admin ve todas las conversaciones
CREATE POLICY "Admin ve todas las conversaciones"
  ON conversaciones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Politicas para mensajes
CREATE POLICY "Usuarios ven mensajes de sus conversaciones"
  ON mensajes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversaciones c
      WHERE c.id = mensajes.conversacion_id
      AND (c.clienta_id = auth.uid() OR EXISTS (
        SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin'
      ))
    )
  );

CREATE POLICY "Usuarios pueden enviar mensajes en sus conversaciones"
  ON mensajes FOR INSERT
  WITH CHECK (
    auth.uid() = remitente_id
    AND EXISTS (
      SELECT 1 FROM conversaciones c
      WHERE c.id = mensajes.conversacion_id
      AND (c.clienta_id = auth.uid() OR EXISTS (
        SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin'
      ))
    )
  );

CREATE POLICY "Admin puede actualizar mensajes (marcar leidos)"
  ON mensajes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin'
    )
  );

CREATE POLICY "Clientas pueden actualizar sus mensajes recibidos (marcar leidos)"
  ON mensajes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversaciones c
      WHERE c.id = mensajes.conversacion_id
      AND c.clienta_id = auth.uid()
    )
  );

-- Storage bucket para media del chat (fotos y videos)
-- Ejecutar este INSERT solo si el bucket no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- Politica de storage: usuarios autenticados pueden subir
CREATE POLICY "Usuarios autenticados pueden subir media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-media' AND auth.role() = 'authenticated');

-- Politica de storage: todos pueden ver (bucket publico)
CREATE POLICY "Media del chat es publica"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-media');
