-- Permitir a los creadores de los mensajes editar su propio contenido
DROP POLICY IF EXISTS "Los creadores pueden editar sus propios mensajes" ON public.messages;

CREATE POLICY "Los creadores pueden editar sus propios mensajes"
  ON public.messages FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
