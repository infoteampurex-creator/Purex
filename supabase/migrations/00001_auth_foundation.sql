-- ═══════════════════════════════════════════════════════════════════════
-- PURE X — Auth Foundation (Phase 2 essential migration)
-- ═══════════════════════════════════════════════════════════════════════
--
-- Run this FIRST in the Supabase SQL editor. This is the minimum setup
-- needed for login/signup to work. The full schema (experts, programs,
-- bookings, etc.) lives in /docs/02-database-schema.md — run that after.
--
-- What this does:
--   1. Creates the `profiles` table linked to auth.users
--   2. Creates a trigger that auto-creates a profile when a user signs up
--   3. Sets up Row-Level Security so users can only read/update their own profile
--   4. Creates the `is_admin()` helper used throughout the schema
-- ═══════════════════════════════════════════════════════════════════════

-- ─── 1. Profiles table ───
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin', 'super_admin')),
  avatar_url text,
  phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_role on public.profiles(role);

-- ─── 2. Auto-update updated_at ───
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tr_profiles_updated on public.profiles;
create trigger tr_profiles_updated
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ─── 3. Auto-create profile on signup ───
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── 4. Admin check helper ───
create or replace function public.is_admin(uid uuid)
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role in ('admin', 'super_admin')
  );
$$ language sql security definer stable;

-- ─── 5. Row-Level Security ───
alter table public.profiles enable row level security;

-- Users can read their own profile
drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile (except role)
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));

-- Admins can read all profiles
drop policy if exists "Admins read all profiles" on public.profiles;
create policy "Admins read all profiles"
  on public.profiles for select
  using (public.is_admin(auth.uid()));

-- Admins can update any profile (including role changes)
drop policy if exists "Admins update any profile" on public.profiles;
create policy "Admins update any profile"
  on public.profiles for update
  using (public.is_admin(auth.uid()));

-- ═══════════════════════════════════════════════════════════════════════
-- To promote a user to admin, run this manually after they sign up:
--   update public.profiles set role = 'admin' where email = 'admin@purex.fit';
-- ═══════════════════════════════════════════════════════════════════════
