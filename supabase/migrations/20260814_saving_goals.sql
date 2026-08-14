-- ==========================================
-- MIGRACIÓN: HUCHAS VIRTUALES (AHORROS COLECTIVOS)
-- ==========================================

-- 1. TABLA: saving_goals (metas de ahorro)
create table if not exists public.saving_goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households on delete cascade not null,
  name text not null,
  target_amount numeric(12,2) not null check (target_amount >= 0),
  current_amount numeric(12,2) not null default 0.00 check (current_amount >= 0),
  target_date date,
  created_by uuid references public.profiles on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. TABLA: saving_contributions (aportaciones a metas)
create table if not exists public.saving_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid references public.saving_goals on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  amount numeric(12,2) not null check (amount > 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.saving_goals enable row level security;
alter table public.saving_contributions enable row level security;

-- Indexación para optimizar búsquedas
create index if not exists idx_saving_goals_household_id on public.saving_goals(household_id);
create index if not exists idx_saving_contributions_goal_id on public.saving_contributions(goal_id);

-- Políticas RLS para saving_goals
drop policy if exists "Los miembros del hogar pueden leer las metas de ahorro" on public.saving_goals;
create policy "Los miembros del hogar pueden leer las metas de ahorro"
  on public.saving_goals for select
  using (household_id in (select public.get_user_households()));

drop policy if exists "Los miembros del hogar pueden crear metas de ahorro" on public.saving_goals;
create policy "Los miembros del hogar pueden crear metas de ahorro"
  on public.saving_goals for insert
  with check (household_id in (select public.get_user_households()) and created_by = auth.uid());

drop policy if exists "Los miembros del hogar pueden actualizar las metas de ahorro" on public.saving_goals;
create policy "Los miembros del hogar pueden actualizar las metas de ahorro"
  on public.saving_goals for update
  using (household_id in (select public.get_user_households()));

drop policy if exists "Los miembros del hogar pueden eliminar metas de ahorro" on public.saving_goals;
create policy "Los miembros del hogar pueden eliminar metas de ahorro"
  on public.saving_goals for delete
  using (household_id in (select public.get_user_households()));

-- Políticas RLS para saving_contributions
drop policy if exists "Los miembros pueden leer las aportaciones de ahorro" on public.saving_contributions;
create policy "Los miembros pueden leer las aportaciones de ahorro"
  on public.saving_contributions for select
  using (goal_id in (select id from public.saving_goals where household_id in (select public.get_user_households())));

drop policy if exists "Los miembros pueden registrar aportaciones de ahorro" on public.saving_contributions;
create policy "Los miembros pueden registrar aportaciones de ahorro"
  on public.saving_contributions for insert
  with check (
    goal_id in (select id from public.saving_goals where household_id in (select public.get_user_households()))
    and user_id = auth.uid()
  );

drop policy if exists "Los miembros pueden eliminar sus propias aportaciones de ahorro" on public.saving_contributions;
create policy "Los miembros pueden eliminar sus propias aportaciones de ahorro"
  on public.saving_contributions for delete
  using (user_id = auth.uid());

-- Trigger para recalcular current_amount en saving_goals automáticamente al insertar o borrar aportaciones
create or replace function public.update_saving_goal_amount()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.saving_goals
    set current_amount = current_amount + new.amount
    where id = new.goal_id;
  elsif tg_op = 'DELETE' then
    update public.saving_goals
    set current_amount = current_amount - old.amount
    where id = old.goal_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists tr_saving_contributions_changes on public.saving_contributions;
create trigger tr_saving_contributions_changes
  after insert or delete on public.saving_contributions
  for each row execute procedure public.update_saving_goal_amount();

-- Trigger de actualización de timestamp para saving_goals
create trigger tr_saving_goals_updated_at before update on public.saving_goals for each row execute procedure public.update_updated_at_column();
