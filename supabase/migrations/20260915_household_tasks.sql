-- Migración para la tabla de Tareas del Hogar y Personales (Task Manager)
CREATE TABLE IF NOT EXISTS public.household_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    is_private BOOLEAN NOT NULL DEFAULT false,
    due_date TIMESTAMPTZ,
    xp_reward INT NOT NULL DEFAULT 15,
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para optimizar búsquedas por hogar, asignado y estado
CREATE INDEX IF NOT EXISTS idx_household_tasks_household ON public.household_tasks(household_id);
CREATE INDEX IF NOT EXISTS idx_household_tasks_user ON public.household_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_household_tasks_assigned ON public.household_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_household_tasks_status ON public.household_tasks(status);

-- Habilitar RLS
ALTER TABLE public.household_tasks ENABLE ROW LEVEL SECURITY;

-- Políticas RLS:
-- 1. Ver Tareas: Tareas privadas creadas por el usuario, O tareas compartidas del hogar del usuario
CREATE POLICY "Users can view relevant tasks"
    ON public.household_tasks
    FOR SELECT
    USING (
        (is_private = true AND user_id = auth.uid())
        OR (
            is_private = false 
            AND household_id IS NOT NULL 
            AND household_id IN (SELECT public.get_user_households())
        )
    );

-- 2. Crear Tareas: El creador debe ser auth.uid()
CREATE POLICY "Users can insert their own tasks"
    ON public.household_tasks
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
    );

-- 3. Actualizar Tareas: Creador o miembro del hogar si es compartida
CREATE POLICY "Users can update relevant tasks"
    ON public.household_tasks
    FOR UPDATE
    USING (
        user_id = auth.uid()
        OR (
            is_private = false 
            AND household_id IS NOT NULL 
            AND household_id IN (SELECT public.get_user_households())
        )
    );

-- 4. Eliminar Tareas: Creador o miembro del hogar si es compartida
CREATE POLICY "Users can delete relevant tasks"
    ON public.household_tasks
    FOR DELETE
    USING (
        user_id = auth.uid()
        OR (
            is_private = false 
            AND household_id IS NOT NULL 
            AND household_id IN (SELECT public.get_user_households())
        )
    );
