-- Migración para soporte de adjuntos (imágenes y documentos) en mensajes del chat

-- 1. Añadir columna attachments a public.messages si no existe
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- 2. Crear bucket 'chat_attachments' en Supabase Storage si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat_attachments', 'chat_attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas de seguridad RLS para el bucket chat_attachments
DROP POLICY IF EXISTS "Miembros del hogar pueden leer adjuntos de chat" ON storage.objects;
CREATE POLICY "Miembros del hogar pueden leer adjuntos de chat"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat_attachments');

DROP POLICY IF EXISTS "Miembros del hogar pueden subir adjuntos de chat" ON storage.objects;
CREATE POLICY "Miembros del hogar pueden subir adjuntos de chat"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat_attachments'
    AND auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Miembros del hogar pueden borrar sus propios adjuntos de chat" ON storage.objects;
CREATE POLICY "Miembros del hogar pueden borrar sus propios adjuntos de chat"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'chat_attachments'
    AND auth.uid() IS NOT NULL
  );
