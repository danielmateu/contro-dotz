-- Migración: Aportaciones al Fondo del Hogar y Gastos Personales

-- 1. Añadir columna monthly_contribution a household_members (Aportación base mensual)
alter table public.household_members 
add column if not exists monthly_contribution numeric(12,2) default 0.00 check (monthly_contribution >= 0);

-- 2. Añadir columna contribution a member_incomes (Aportación específica para un mes concreto)
alter table public.member_incomes 
add column if not exists contribution numeric(12,2) check (contribution >= 0);

-- 3. Añadir columna is_personal a expenses (Indica si es gasto personal del usuario o compartido del hogar)
alter table public.expenses 
add column if not exists is_personal boolean default false not null;
