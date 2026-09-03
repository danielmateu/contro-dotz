-- Corregir política RLS de lectura en push_subscriptions para permitir a los miembros del mismo hogar enviarse notificaciones entre sí
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propias suscripciones push" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Los usuarios pueden ver suscripciones push de miembros de su hogar" ON public.push_subscriptions;

CREATE POLICY "Los usuarios pueden ver suscripciones push de miembros de su hogar"
    ON public.push_subscriptions FOR SELECT
    USING (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 
            FROM public.household_members hm1
            JOIN public.household_members hm2 ON hm1.household_id = hm2.household_id
            WHERE hm1.user_id = auth.uid() 
              AND hm2.user_id = push_subscriptions.user_id
        )
    );
