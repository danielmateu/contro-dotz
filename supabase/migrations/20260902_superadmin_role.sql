-- ==========================================
-- MIGRACIÓN: SUPERADMIN ROLE
-- ==========================================

-- Añadir columna is_super_admin a la tabla public.profiles
alter table public.profiles 
add column if not exists is_super_admin boolean default false not null;

-- Crear función helper para comprobar en RLS si el usuario activo es SuperAdmin
create or replace function public.is_super_admin()
returns boolean as $$
  select coalesce(is_super_admin, false) 
  from public.profiles 
  where id = auth.uid();
$$ language sql security definer stable;
