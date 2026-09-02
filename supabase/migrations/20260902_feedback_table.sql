-- ==========================================
-- MIGRACIÓN: TABLA DE FEEDBACK CON ESTADOS
-- ==========================================

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  category text not null,
  title text not null,
  description text not null,
  status text default 'pending' not null,
  created_at timestamp with time zone default now() not null
);

-- Añadir columna status si no existe
alter table public.feedback
add column if not exists status text default 'pending' not null;

alter table public.feedback enable row level security;

-- Permitir a usuarios autenticados crear feedback
drop policy if exists "Usuarios pueden insertar feedback" on public.feedback;
create policy "Usuarios pueden insertar feedback"
  on public.feedback for insert
  with check (auth.role() = 'authenticated');

-- Permitir a SuperAdmins leer todo el feedback
drop policy if exists "SuperAdmins pueden ver todo el feedback" on public.feedback;
create policy "SuperAdmins pueden ver todo el feedback"
  on public.feedback for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_super_admin = true
    )
  );

-- Permitir a SuperAdmins actualizar el estado del feedback
drop policy if exists "SuperAdmins pueden actualizar estado de feedback" on public.feedback;
create policy "SuperAdmins pueden actualizar estado de feedback"
  on public.feedback for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_super_admin = true
    )
  );
