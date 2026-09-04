-- Añadir columnas de skin_color, hairstyle y tap_count a user_game_state
ALTER TABLE public.user_game_state
ADD COLUMN IF NOT EXISTS skin_color TEXT NOT NULL DEFAULT 'skin_indigo',
ADD COLUMN IF NOT EXISTS hairstyle TEXT NOT NULL DEFAULT 'hair_none',
ADD COLUMN IF NOT EXISTS tap_count INTEGER NOT NULL DEFAULT 0;
