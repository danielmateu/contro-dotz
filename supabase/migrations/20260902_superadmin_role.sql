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

-- Función RPC con SECURITY DEFINER para obtener métricas globales del sistema ignorando RLS si es SuperAdmin
create or replace function public.get_superadmin_metrics()
returns jsonb as $$
declare
  is_admin boolean;
  result jsonb;
begin
  -- Verificar si el usuario que invoca la función es SuperAdmin
  select is_super_admin into is_admin
  from public.profiles
  where id = auth.uid();

  if not coalesce(is_admin, false) then
    raise exception 'Acceso denegado: Se requieren permisos de SuperAdmin';
  end if;

  select jsonb_build_object(
    'totalUsers', (select count(*) from public.profiles where id <> '00000000-0000-0000-0000-000000000000'),
    'totalHouseholds', (select count(*) from public.households),
    'totalExpenses', (select count(*) from public.expenses),
    'totalAmountTracked', coalesce((select sum(amount) from public.expenses), 0),
    'totalChatMessages', (select count(*) from public.messages),
    'totalAiResponses', (select count(*) from public.messages where created_by = '00000000-0000-0000-0000-000000000000'),
    'recentUsers', (
      select coalesce(jsonb_agg(u), '[]'::jsonb)
      from (
        select id, email, display_name, created_at, is_super_admin
        from public.profiles
        where id <> '00000000-0000-0000-0000-000000000000'
        order by created_at desc
        limit 10
      ) u
    ),
    'recentHouseholds', (
      select coalesce(jsonb_agg(h), '[]'::jsonb)
      from (
        select id, name, created_at
        from public.households
        order by created_at desc
        limit 10
      ) h
    )
  ) into result;

  return result;
end;
$$ language plpgsql security definer;
