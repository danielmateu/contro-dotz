-- ==========================================
-- SCRIPT DE MIGRACIÓN INICIAL: FAMILIA FINANZAS
-- ==========================================

-- Habilitar extensión UUID
create extension if not exists "uuid-ossp";

-- 1. TABLA: profiles (perfiles de usuario)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  display_name text,
  avatar_url text,
  status text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. TABLA: households (hogares)
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. TABLA: household_members (miembros del hogar)
create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  role text check (role in ('owner', 'member')) not null default 'member',
  monthly_income numeric(12,2) default 0.00 check (monthly_income >= 0),
  monthly_contribution numeric(12,2) default 0.00 check (monthly_contribution >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(household_id, user_id)
);

-- 4. TABLA: categories (categorías por hogar)
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households on delete cascade not null,
  name text not null,
  color text default '#64748b' not null,
  icon text default 'Tag' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(household_id, name)
);

-- 5. TABLA: expenses (gastos)
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households on delete cascade not null,
  created_by uuid references public.profiles on delete set null,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'EUR',
  category_id uuid references public.categories on delete restrict not null,
  description text not null,
  expense_date date not null,
  payment_method text check (payment_method in ('Efectivo', 'Tarjeta', 'Transferencia', 'Domiciliación', 'Bizum', 'Otro')) not null,
  notes text,
  receipt_path text,
  is_personal boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. TABLA: budgets (presupuestos mensuales)
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households on delete cascade not null,
  category_id uuid references public.categories on delete cascade not null,
  month varchar(7) not null check (month ~ '^\d{4}-\d{2}$'),
  amount numeric(12,2) not null check (amount >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(household_id, category_id, month)
);

-- 7. TABLA: invitations (invitaciones a hogares)
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households on delete cascade not null,
  email text not null,
  role text check (role in ('owner', 'member')) not null default 'member',
  invited_by uuid references public.profiles on delete cascade not null,
  status text check (status in ('pending', 'accepted', 'rejected')) not null default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create unique index idx_invitations_household_email_pending on public.invitations (household_id, email) where status = 'pending';

-- ==========================================
-- ÍNDICES (Optimización de consultas)
-- ==========================================
create index idx_expenses_household_id on public.expenses(household_id);
create index idx_expenses_expense_date on public.expenses(expense_date);
create index idx_expenses_category_id on public.expenses(category_id);
create index idx_household_members_user_id on public.household_members(user_id);
create index idx_categories_household_id on public.categories(household_id);
create index idx_budgets_household_month on public.budgets(household_id, month);

-- ==========================================
-- TRIGGERS DE ACTUALIZACIÓN DE TIMESTAMPS
-- ==========================================
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tr_profiles_updated_at before update on public.profiles for each row execute procedure public.update_updated_at_column();
create trigger tr_households_updated_at before update on public.households for each row execute procedure public.update_updated_at_column();
create trigger tr_household_members_updated_at before update on public.household_members for each row execute procedure public.update_updated_at_column();
create trigger tr_categories_updated_at before update on public.categories for each row execute procedure public.update_updated_at_column();
create trigger tr_expenses_updated_at before update on public.expenses for each row execute procedure public.update_updated_at_column();
create trigger tr_budgets_updated_at before update on public.budgets for each row execute procedure public.update_updated_at_column();
create trigger tr_invitations_updated_at before update on public.invitations for each row execute procedure public.update_updated_at_column();

-- ==========================================
-- TRIGGER DE CREACIÓN DE PERFIL AUTOMÁTICO
-- ==========================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================
-- FUNCIONES DE NEGOCIO Y BOTSTRAPPING (RPC)
-- ==========================================

-- Función para obtener los hogares del usuario activo de forma optimizada sin recursión en RLS
create or replace function public.get_user_households()
returns setof uuid as $$
  select household_id from public.household_members where user_id = auth.uid();
$$ language sql security definer stable;

-- Función para obtener los hogares de los cuales el usuario activo es propietario (owner)
create or replace function public.get_user_owned_households()
returns setof uuid as $$
  select household_id from public.household_members where user_id = auth.uid() and role = 'owner';
$$ language sql security definer stable;

-- Función segura para crear un hogar y establecer la membresía del creador como owner en una sola transacción
create or replace function public.create_household(household_name text)
returns uuid as $$
declare
  new_household_id uuid;
begin
  -- Crear el hogar
  insert into public.households (name)
  values (household_name)
  returning id into new_household_id;

  -- Añadir al creador como miembro 'owner'
  insert into public.household_members (household_id, user_id, role)
  values (new_household_id, auth.uid(), 'owner');

  return new_household_id;
end;
$$ language plpgsql security definer;

-- Trigger para inicializar categorías por defecto al crearse un hogar
create or replace function public.handle_new_household()
returns trigger as $$
begin
  insert into public.categories (household_id, name, color, icon)
  values
    (new.id, 'Alimentación', '#ef4444', 'Utensils'),
    (new.id, 'Vivienda', '#3b82f6', 'Home'),
    (new.id, 'Transporte', '#f59e0b', 'Car'),
    (new.id, 'Salud', '#10b981', 'HeartPulse'),
    (new.id, 'Educación', '#8b5cf6', 'GraduationCap'),
    (new.id, 'Ocio', '#ec4899', 'Sparkles'),
    (new.id, 'Ropa', '#6366f1', 'Shirt'),
    (new.id, 'Suscripciones', '#14b8a6', 'Tv'),
    (new.id, 'Restaurantes', '#f43f5e', 'Pizza'),
    (new.id, 'Compras', '#06b6d4', 'ShoppingBag'),
    (new.id, 'Otros', '#64748b', 'Tag');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_household_created
  after insert on public.households
  for each row execute procedure public.handle_new_household();

-- Trigger para añadir automáticamente la membresía cuando se acepta una invitación
create or replace function public.handle_accepted_invitation()
returns trigger as $$
declare
  invited_user_id uuid;
begin
  if new.status = 'accepted' and old.status = 'pending' then
    -- Obtener el ID del perfil que coincide con el email de la invitación
    select id into invited_user_id
    from public.profiles
    where email = new.email;

    if invited_user_id is not null then
      insert into public.household_members (household_id, user_id, role)
      values (new.household_id, invited_user_id, new.role)
      on conflict (household_id, user_id) do nothing;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_invitation_accepted
  after update on public.invitations
  for each row execute procedure public.handle_accepted_invitation();

-- ==========================================
-- SEGURIDAD: ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Habilitar RLS en todas las tablas
alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.categories enable row level security;
alter table public.expenses enable row level security;
alter table public.budgets enable row level security;
alter table public.invitations enable row level security;

-- Políticas para profiles
create policy "Los usuarios pueden ver su propio perfil y perfiles relacionados"
  on public.profiles for select
  using (
    id = auth.uid() 
    or id in (
      select user_id from public.household_members where household_id in (select public.get_user_households())
    )
    or id in (
      select invited_by from public.invitations where lower(email) = lower(auth.jwt()->>'email')
    )
  );

create policy "Los usuarios pueden actualizar su propio perfil"
  on public.profiles for update
  using (id = auth.uid());

-- Políticas para households
create policy "Los miembros e invitados pueden leer su hogar"
  on public.households for select
  using (
    id in (select public.get_user_households())
    or id in (
      select household_id from public.invitations where lower(email) = lower(auth.jwt()->>'email')
    )
  );

create policy "Los propietarios pueden editar su hogar"
  on public.households for update
  using (id in (select public.get_user_owned_households()));

create policy "Los propietarios pueden eliminar su hogar"
  on public.households for delete
  using (id in (select public.get_user_owned_households()));

-- Políticas para household_members
create policy "Los miembros pueden leer la lista de miembros de su hogar"
  on public.household_members for select
  using (household_id in (select public.get_user_households()));

create policy "Los propietarios pueden añadir miembros al hogar"
  on public.household_members for insert
  with check (household_id in (select public.get_user_owned_households()));

create policy "Los propietarios pueden cambiar roles de miembros"
  on public.household_members for update
  using (household_id in (select public.get_user_owned_households()));

create policy "Los propietarios pueden eliminar miembros, y los miembros pueden salir del hogar"
  on public.household_members for delete
  using (
    household_id in (select public.get_user_owned_households()) or user_id = auth.uid()
  );

-- Políticas para categories
create policy "Los miembros pueden leer las categorías de su hogar"
  on public.categories for select
  using (household_id in (select public.get_user_households()));

create policy "Los miembros pueden crear categorías en su hogar"
  on public.categories for insert
  with check (household_id in (select public.get_user_households()));

create policy "Los miembros pueden actualizar las categorías de su hogar"
  on public.categories for update
  using (household_id in (select public.get_user_households()));

create policy "Los miembros pueden eliminar las categorías de su hogar"
  on public.categories for delete
  using (household_id in (select public.get_user_households()));

-- Políticas para expenses
create policy "Los miembros pueden leer los gastos de su hogar"
  on public.expenses for select
  using (household_id in (select public.get_user_households()));

create policy "Los miembros pueden crear gastos en su hogar"
  on public.expenses for insert
  with check (
    household_id in (select public.get_user_households())
    and created_by = auth.uid()
  );

create policy "Los miembros pueden actualizar los gastos de su hogar"
  on public.expenses for update
  using (household_id in (select public.get_user_households()))
  with check (household_id in (select public.get_user_households()));

create policy "Los miembros pueden eliminar los gastos de su hogar"
  on public.expenses for delete
  using (household_id in (select public.get_user_households()));

-- Políticas para budgets
create policy "Los miembros pueden leer los presupuestos de su hogar"
  on public.budgets for select
  using (household_id in (select public.get_user_households()));

create policy "Los miembros pueden crear presupuestos en su hogar"
  on public.budgets for insert
  with check (household_id in (select public.get_user_households()));

create policy "Los miembros pueden actualizar los presupuestos de su hogar"
  on public.budgets for update
  using (household_id in (select public.get_user_households()));

create policy "Los miembros pueden eliminar los presupuestos de su hogar"
  on public.budgets for delete
  using (household_id in (select public.get_user_households()));

-- Políticas para invitations
create policy "Los creadores y destinatarios pueden leer las invitaciones"
  on public.invitations for select
  using (
    invited_by = auth.uid() 
    or lower(email) = lower(auth.jwt()->>'email')
  );

create policy "Los propietarios pueden crear invitaciones"
  on public.invitations for insert
  with check (
    household_id in (select public.get_user_owned_households())
    and invited_by = auth.uid()
  );

create policy "Los propietarios pueden cancelar invitaciones, y los destinatarios pueden aceptarlas/rechazarlas"
  on public.invitations for update
  using (
    household_id in (select public.get_user_owned_households())
    or (
      lower(email) = lower(auth.jwt()->>'email')
      and status = 'pending'
    )
  )
  with check (
    household_id in (select public.get_user_owned_households())
    or (
      lower(email) = lower(auth.jwt()->>'email')
      and status in ('accepted', 'rejected')
    )
  );

create policy "Los propietarios pueden eliminar invitaciones"
  on public.invitations for delete
  using (household_id in (select public.get_user_owned_households()));

-- ==========================================
-- 8. TABLA: settlements (liquidación de deudas entre miembros)
-- ==========================================
create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households on delete cascade not null,
  payer_id uuid references public.profiles on delete cascade not null,
  receiver_id uuid references public.profiles on delete cascade not null,
  amount numeric(12,2) not null check (amount > 0),
  settled_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  check (payer_id <> receiver_id)
);

create index idx_settlements_household_id on public.settlements(household_id);

-- Habilitar RLS en settlements
alter table public.settlements enable row level security;

-- Trigger de actualización de timestamp para settlements
create trigger tr_settlements_updated_at before update on public.settlements for each row execute procedure public.update_updated_at_column();

-- Políticas de RLS para settlements
create policy "Los miembros pueden leer las liquidaciones de su hogar"
  on public.settlements for select
  using (household_id in (select public.get_user_households()));

create policy "Los miembros pueden registrar liquidaciones en su hogar"
  on public.settlements for insert
  with check (
    household_id in (select public.get_user_households())
    and (auth.uid() = payer_id or auth.uid() = receiver_id)
  );

create policy "Los miembros pueden eliminar liquidaciones de su hogar"
  on public.settlements for delete
  using (household_id in (select public.get_user_households()));

-- ==========================================
-- ALMACENAMIENTO (Supabase Storage)
-- ==========================================

-- Crear bucket de tickets si no existe
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

-- Asegurar RLS en storage.objects
alter table storage.objects enable row level security;

-- Políticas de RLS para el bucket de tickets
create policy "Miembros del hogar pueden leer tickets"
  on storage.objects for select
  using (
    bucket_id = 'receipts'
    and (
      (storage.foldername(name))[1]::uuid in (
        select household_id from public.household_members where user_id = auth.uid()
      )
    )
  );

create policy "Miembros del hogar pueden subir tickets"
  on storage.objects for insert
  with check (
    bucket_id = 'receipts'
    and (
      (storage.foldername(name))[1]::uuid in (
        select household_id from public.household_members where user_id = auth.uid()
      )
    )
  );

create policy "Miembros del hogar pueden borrar tickets"
  on storage.objects for delete
  using (
    bucket_id = 'receipts'
    and (
      (storage.foldername(name))[1]::uuid in (
        select household_id from public.household_members where user_id = auth.uid()
      )
    )
  );

-- Crear bucket de avatars si no existe y configurarlo como público
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Políticas de RLS para el bucket de avatars
create policy "Cualquiera puede leer avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Los usuarios pueden subir su propia imagen de perfil"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1]::uuid = auth.uid()
  );

create policy "Los usuarios pueden actualizar su propia imagen de perfil"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1]::uuid = auth.uid()
  );

create policy "Los usuarios pueden borrar su propia imagen de perfil"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1]::uuid = auth.uid()
  );

-- 8. TABLA: messages (mensajes del chat familiar)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households on delete cascade not null,
  created_by uuid references public.profiles on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS en mensajes
alter table public.messages enable row level security;

-- Políticas de RLS para mensajes
create policy "Los miembros del hogar pueden leer los mensajes"
  on public.messages for select
  using (household_id in (select public.get_user_households()));

create policy "Los miembros del hogar pueden enviar mensajes"
  on public.messages for insert
  with check (
    household_id in (select public.get_user_households())
    and created_by = auth.uid()
  );

create policy "Los creadores pueden borrar sus propios mensajes"
  on public.messages for delete
  using (created_by = auth.uid());

-- Activar realtime para mensajes
alter publication supabase_realtime add table public.messages;

-- 9. TABLA: shopping_list (lista de la compra compartida)
create table if not exists public.shopping_list (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households on delete cascade not null,
  name text not null,
  quantity text,
  bought boolean default false not null,
  created_by uuid references public.profiles on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS en la lista de la compra
alter table public.shopping_list enable row level security;

-- Políticas de RLS para la lista de la compra
create policy "Los miembros del hogar pueden leer la lista de la compra"
  on public.shopping_list for select
  using (household_id in (select public.get_user_households()));

create policy "Los miembros del hogar pueden gestionar la lista de la compra"
  on public.shopping_list for all
  using (household_id in (select public.get_user_households()))
  with check (household_id in (select public.get_user_households()) and created_by = auth.uid());

-- Activar realtime para la lista de la compra
alter publication supabase_realtime add table public.shopping_list;

-- 10. BOT GEMINI PROFILE & RLS
insert into public.profiles (id, email, display_name, status, avatar_url)
values (
  '00000000-0000-0000-0000-000000000000',
  'gemini@contro-dotz.ai',
  'Gemini AI',
  'Asistente Financiero 🤖',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&h=150&fit=crop'
)
on conflict (id) do nothing;

-- Actualizar política RLS para permitir que todos los usuarios vean el perfil del bot
drop policy if exists "Los usuarios pueden ver su propio perfil y perfiles relacionados" on public.profiles;

create policy "Los usuarios pueden ver su propio perfil y perfiles relacionados"
  on public.profiles for select
  using (
    id = auth.uid() 
    or id in (
      select user_id from public.household_members where household_id in (select public.get_user_households())
    )
    or id in (
      select invited_by from public.invitations where lower(email) = lower(auth.jwt()->>'email')
    )
    or id = '00000000-0000-0000-0000-000000000000'
  );

-- ==========================================
-- 11. TABLA: member_incomes (ingresos mensuales específicos / nóminas)
-- ==========================================
create table public.member_incomes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  month varchar(7) not null check (month ~ '^\d{4}-\d{2}$'),
  amount numeric(12,2) not null check (amount >= 0),
  contribution numeric(12,2) check (contribution >= 0),
  payroll_path text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(household_id, user_id, month)
);

-- Habilitar RLS en member_incomes
alter table public.member_incomes enable row level security;

-- Políticas de RLS para member_incomes
create policy "Los miembros pueden leer los ingresos de su hogar"
  on public.member_incomes for select
  using (household_id in (select public.get_user_households()));

create policy "Los usuarios pueden registrar sus propios ingresos mensuales"
  on public.member_incomes for insert
  with check (
    household_id in (select public.get_user_households()) 
    and user_id = auth.uid()
  );

create policy "Los usuarios pueden actualizar sus propios ingresos mensuales"
  on public.member_incomes for update
  using (
    household_id in (select public.get_user_households()) 
    and user_id = auth.uid()
  );

create policy "Los usuarios pueden eliminar sus propios ingresos mensuales"
  on public.member_incomes for delete
  using (
    household_id in (select public.get_user_households()) 
    and user_id = auth.uid()
  );

-- Trigger de actualización de timestamp para member_incomes
create trigger tr_member_incomes_updated_at before update on public.member_incomes for each row execute procedure public.update_updated_at_column();

-- ==========================================
-- ALMACENAMIENTO DE NÓMINAS (Storage)
-- ==========================================
insert into storage.buckets (id, name, public)
values ('payrolls', 'payrolls', false)
on conflict (id) do nothing;

-- Políticas para el bucket "payrolls"
create policy "Los usuarios pueden leer sus propias nóminas"
  on storage.objects for select
  using (
    bucket_id = 'payrolls'
    and (storage.foldername(name))[2]::uuid = auth.uid()
  );

create policy "Los usuarios pueden subir sus propias nóminas"
  on storage.objects for insert
  with check (
    bucket_id = 'payrolls'
    and (storage.foldername(name))[2]::uuid = auth.uid()
  );

create policy "Los usuarios pueden borrar sus propias nóminas"
  on storage.objects for delete
  using (
    bucket_id = 'payrolls'
    and (storage.foldername(name))[2]::uuid = auth.uid()
  );
