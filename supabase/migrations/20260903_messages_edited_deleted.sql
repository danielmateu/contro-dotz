-- Agregar columnas para seguimiento de edición y eliminación suave de mensajes
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Permitir a los creadores de los mensajes editar e indicar borrado de su propio contenido
DROP POLICY IF EXISTS "Los creadores pueden editar sus propios mensajes" ON public.messages;

CREATE POLICY "Los creadores pueden editar sus propios mensajes"
  ON public.messages FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
