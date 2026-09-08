-- Migración para añadir campos de RPG, salud dinámica (peso/higiene) y convivencia de mascotas en el hogar a user_game_state

ALTER TABLE public.user_game_state
ADD COLUMN IF NOT EXISTS pet_name TEXT NOT NULL DEFAULT 'Dotzi',
ADD COLUMN IF NOT EXISTS gender TEXT NOT NULL DEFAULT 'neutral',
ADD COLUMN IF NOT EXISTS personality TEXT NOT NULL DEFAULT 'saver',
ADD COLUMN IF NOT EXISTS weight INTEGER NOT NULL DEFAULT 50,
ADD COLUMN IF NOT EXISTS cleanliness INTEGER NOT NULL DEFAULT 100,
ADD COLUMN IF NOT EXISTS friendship_points INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_bathed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_fed_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Nueva política RLS: Los usuarios de un mismo hogar pueden ver el estado de las mascotas de sus compañeros de hogar
CREATE POLICY "Users can view household members game state"
    ON public.user_game_state
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR user_id IN (
            SELECT user_id 
            FROM public.household_members 
            WHERE household_id IN (SELECT public.get_user_households())
        )
    );

-- Tabla para guardar interacciones recientes entre mascotas (caricias, chuches, saludos)
CREATE TABLE IF NOT EXISTS public.dotzi_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL, -- 'pet', 'treat', 'greet', 'wash'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.dotzi_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Household members can view interactions"
    ON public.dotzi_interactions
    FOR SELECT
    USING (
        sender_id = auth.uid() 
        OR receiver_id = auth.uid()
        OR receiver_id IN (
            SELECT user_id 
            FROM public.household_members 
            WHERE household_id IN (SELECT public.get_user_households())
        )
    );

CREATE POLICY "Users can insert interactions"
    ON public.dotzi_interactions
    FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- Políticas RLS: Los miembros de un mismo hogar pueden actualizar e insertar el estado de juego de sus compañeros
CREATE POLICY "Household members can update game state"
    ON public.user_game_state
    FOR UPDATE
    USING (
        auth.uid() = user_id
        OR user_id IN (
            SELECT user_id 
            FROM public.household_members 
            WHERE household_id IN (SELECT public.get_user_households())
        )
    );

CREATE POLICY "Household members can insert game state"
    ON public.user_game_state
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        OR user_id IN (
            SELECT user_id 
            FROM public.household_members 
            WHERE household_id IN (SELECT public.get_user_households())
        )
    );

