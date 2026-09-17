-- Migración para soporte de reacciones emoji en mensajes del chat

-- 1. Asegurar la columna reactions en public.messages por si acaso
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb;

-- 2. Actualizar política RLS para UPDATE en public.messages
-- Anteriormente solo 'created_by = auth.uid()' podía actualizar, impidiendo que otros miembros añadan reacciones.
DROP POLICY IF EXISTS "Los creadores pueden editar sus propios mensajes" ON public.messages;
DROP POLICY IF EXISTS "Los miembros del hogar pueden actualizar mensajes" ON public.messages;

CREATE POLICY "Los miembros del hogar pueden actualizar mensajes"
  ON public.messages FOR UPDATE
  USING (household_id IN (SELECT public.get_user_households()))
  WITH CHECK (household_id IN (SELECT public.get_user_households()));
