-- ==========================================
-- MIGRACIÓN: FIX METRICAS DE USO DE GEMINI AI
-- ==========================================

-- 1. Actualizar la política RLS en messages para permitir insertar mensajes con la identidad del Bot Gemini
DROP POLICY IF EXISTS "Los miembros del hogar pueden enviar mensajes" ON public.messages;

CREATE POLICY "Los miembros del hogar pueden enviar mensajes"
  ON public.messages FOR INSERT
  WITH CHECK (
    household_id IN (SELECT public.get_user_households())
    AND (created_by = auth.uid() OR created_by = '00000000-0000-0000-0000-000000000000')
  );

-- 2. Actualizar la función get_superadmin_metrics para contar mensajes creados por el bot o con formato de respuesta 🤖
CREATE OR REPLACE FUNCTION public.get_superadmin_metrics()
RETURNS jsonb AS $$
DECLARE
  is_admin boolean;
  result jsonb;
BEGIN
  -- Verificar si el usuario que invoca la función es SuperAdmin
  SELECT is_super_admin INTO is_admin
  FROM public.profiles
  WHERE id = auth.uid();

  IF NOT COALESCE(is_admin, false) THEN
    RAISE EXCEPTION 'Acceso denegado: Se requieren permisos de SuperAdmin';
  END IF;

  SELECT jsonb_build_object(
    'totalUsers', (SELECT count(*) FROM public.profiles WHERE id <> '00000000-0000-0000-0000-000000000000'),
    'totalHouseholds', (SELECT count(*) FROM public.households),
    'totalExpenses', (SELECT count(*) FROM public.expenses),
    'totalAmountTracked', COALESCE((SELECT sum(amount) FROM public.expenses), 0),
    'totalChatMessages', (SELECT count(*) FROM public.messages),
    'totalAiResponses', (SELECT count(*) FROM public.messages WHERE created_by = '00000000-0000-0000-0000-000000000000' OR content LIKE '🤖%'),
    'recentUsers', (
      SELECT COALESCE(jsonb_agg(u), '[]'::jsonb)
      FROM (
        SELECT id, email, display_name, created_at, is_super_admin
        FROM public.profiles
        WHERE id <> '00000000-0000-0000-0000-000000000000'
        ORDER BY created_at DESC
        LIMIT 10
      ) u
    ),
    'recentHouseholds', (
      SELECT COALESCE(jsonb_agg(h), '[]'::jsonb)
      FROM (
        SELECT id, name, created_at
        FROM public.households
        ORDER BY created_at DESC
        LIMIT 10
      ) h
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
