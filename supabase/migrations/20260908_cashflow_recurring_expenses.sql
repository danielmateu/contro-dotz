-- Migración para la tabla de Gastos Recurrentes / Facturas Fijas del Hogar (Cashflow Forecast)

CREATE TABLE IF NOT EXISTS public.recurring_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    day_of_month INTEGER NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 31),
    payment_method TEXT NOT NULL DEFAULT 'Domiciliación',
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

-- Index para búsquedas rápidas por hogar
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_household_id ON public.recurring_expenses(household_id);

-- Trigger para actualizar el timestamp updated_at automáticamente
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'tr_recurring_expenses_updated_at'
    ) THEN
        CREATE TRIGGER tr_recurring_expenses_updated_at
            BEFORE UPDATE ON public.recurring_expenses
            FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
    END IF;
END $$;

-- Políticas de Seguridad RLS
DROP POLICY IF EXISTS "Household members can read recurring expenses" ON public.recurring_expenses;
CREATE POLICY "Household members can read recurring expenses"
    ON public.recurring_expenses FOR SELECT
    USING (household_id IN (SELECT public.get_user_households()));

DROP POLICY IF EXISTS "Household members can insert recurring expenses" ON public.recurring_expenses;
CREATE POLICY "Household members can insert recurring expenses"
    ON public.recurring_expenses FOR INSERT
    WITH CHECK (
        household_id IN (SELECT public.get_user_households())
        AND (created_by IS NULL OR created_by = auth.uid())
    );

DROP POLICY IF EXISTS "Household members can update recurring expenses" ON public.recurring_expenses;
CREATE POLICY "Household members can update recurring expenses"
    ON public.recurring_expenses FOR UPDATE
    USING (household_id IN (SELECT public.get_user_households()));

DROP POLICY IF EXISTS "Household members can delete recurring expenses" ON public.recurring_expenses;
CREATE POLICY "Household members can delete recurring expenses"
    ON public.recurring_expenses FOR DELETE
    USING (household_id IN (SELECT public.get_user_households()));
