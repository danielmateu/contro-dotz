-- Migración para el estado del juego Tamagotchi Financiero (Dotzi)
CREATE TABLE IF NOT EXISTS public.user_game_state (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    coins INTEGER NOT NULL DEFAULT 100,
    equipped_accessory TEXT NOT NULL DEFAULT 'none',
    unlocked_items JSONB NOT NULL DEFAULT '["none"]'::jsonb,
    completed_quests JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.user_game_state ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver su propio estado de juego
CREATE POLICY "Users can view their own game state"
    ON public.user_game_state
    FOR SELECT
    USING (auth.uid() = user_id);

-- Política: Los usuarios pueden insertar/actualizar su propio estado de juego
CREATE POLICY "Users can insert their own game state"
    ON public.user_game_state
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game state"
    ON public.user_game_state
    FOR UPDATE
    USING (auth.uid() = user_id);
