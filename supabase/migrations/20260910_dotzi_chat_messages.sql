-- Migration to create dotzi_chat_messages table for 1-on-1 Dotzi Tamagotchi AI chat history

CREATE TABLE IF NOT EXISTS public.dotzi_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    household_id UUID REFERENCES public.households(id) ON DELETE SET NULL,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'dotzi')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user chat history queries ordered by timestamp
CREATE INDEX IF NOT EXISTS idx_dotzi_chat_messages_user_created
    ON public.dotzi_chat_messages(user_id, created_at ASC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.dotzi_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own dotzi chat messages"
    ON public.dotzi_chat_messages
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dotzi chat messages"
    ON public.dotzi_chat_messages
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dotzi chat messages"
    ON public.dotzi_chat_messages
    FOR DELETE
    USING (auth.uid() = user_id);
