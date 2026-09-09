-- Función helper para verificar si el usuario es SuperAdmin
create or replace function public.is_super_admin()
returns boolean as $$
  select coalesce(is_super_admin, false) 
  from public.profiles 
  where id = auth.uid();
$$ language sql security definer stable;

create table if not exists public.app_updates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  version text,
  category text default 'feature' not null, -- 'feature' | 'improvement' | 'fix' | 'announcement'
  is_published boolean default true not null,
  published_at timestamp with time zone default now() not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.user_app_update_reads (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_read_at timestamp with time zone default now() not null
);

-- Habilitar RLS
alter table public.app_updates enable row level security;
alter table public.user_app_update_reads enable row level security;

-- Políticas para public.app_updates:
-- 1. Usuarios autenticados pueden ver actualizaciones publicadas (SuperAdmins pueden ver todas)
drop policy if exists "Usuarios autenticados pueden ver novedades publicadas" on public.app_updates;
create policy "Usuarios autenticados pueden ver novedades publicadas"
  on public.app_updates for select
  using (
    (auth.role() = 'authenticated' and is_published = true)
    or public.is_super_admin() = true
  );

-- 2. SuperAdmins pueden insertar, actualizar y eliminar novedades
drop policy if exists "SuperAdmins pueden insertar novedades" on public.app_updates;
create policy "SuperAdmins pueden insertar novedades"
  on public.app_updates for insert
  with check (public.is_super_admin() = true);

drop policy if exists "SuperAdmins pueden actualizar novedades" on public.app_updates;
create policy "SuperAdmins pueden actualizar novedades"
  on public.app_updates for update
  using (public.is_super_admin() = true);

drop policy if exists "SuperAdmins pueden eliminar novedades" on public.app_updates;
create policy "SuperAdmins pueden eliminar novedades"
  on public.app_updates for delete
  using (public.is_super_admin() = true);

-- Políticas para public.user_app_update_reads:
-- 1. Los usuarios pueden ver y gestionar su propia lectura
drop policy if exists "Usuarios pueden ver su propia fecha de lectura de novedades" on public.user_app_update_reads;
create policy "Usuarios pueden ver su propia fecha de lectura de novedades"
  on public.user_app_update_reads for select
  using (auth.uid() = user_id);

drop policy if exists "Usuarios pueden insertar su lectura de novedades" on public.user_app_update_reads;
create policy "Usuarios pueden insertar su lectura de novedades"
  on public.user_app_update_reads for insert
  with check (auth.uid() = user_id);

drop policy if exists "Usuarios pueden actualizar su lectura de novedades" on public.user_app_update_reads;
create policy "Usuarios pueden actualizar su lectura de novedades"
  on public.user_app_update_reads for update
  using (auth.uid() = user_id);
