-- Migración para la tabla de Retos Familiares de Ahorro y reclamaciones de recompensas
CREATE TABLE IF NOT EXISTS public.household_challenge_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_key TEXT NOT NULL,
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_challenge_claim UNIQUE (challenge_key, household_id, user_id)
);

ALTER TABLE public.household_challenge_claims ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Los miembros de un hogar pueden ver sus reclamaciones de retos
CREATE POLICY "Household members can view claims"
    ON public.household_challenge_claims
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR user_id IN (
            SELECT user_id 
            FROM public.household_members 
            WHERE household_id IN (SELECT public.get_user_households())
        )
    );

-- Los usuarios pueden registrar su propia reclamación de reto
CREATE POLICY "Users can insert their own claims"
    ON public.household_challenge_claims
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
    );
