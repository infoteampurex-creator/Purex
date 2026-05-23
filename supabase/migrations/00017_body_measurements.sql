-- ─────────────────────────────────────────────────────────────────
-- 00017 — Body measurements (foundation for parametric avatar)
-- ─────────────────────────────────────────────────────────────────
--
-- Adds the data layer that drives the live-avatar morphing planned
-- for Phase 2. Everything stored in cm internally (single canonical
-- unit, no rounding drift) — UI converts to in/cm per user pref.
--
-- Schema:
--   • profiles gains: height_cm, gender, unit_pref ('in' | 'cm')
--   • new client_body_measurements table — full history series, one
--     row per measurement date, with 12 body sites plus weight + BF%.
--   • RLS: clients manage own; admins manage all.
-- ─────────────────────────────────────────────────────────────────

-- ─── profiles: gender + height + unit preference ────────────────

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
      and column_name = 'height_cm'
  ) then
    alter table public.profiles add column height_cm numeric(5,1);
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
      and column_name = 'gender'
  ) then
    alter table public.profiles add column gender text
      check (gender in ('male', 'female', 'other', 'prefer_not_to_say'));
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
      and column_name = 'unit_pref'
  ) then
    alter table public.profiles add column unit_pref text
      default 'in'
      check (unit_pref in ('in', 'cm'));
  end if;
end $$;

-- ─── client_body_measurements ────────────────────────────────────
-- IMPORTANT: this table was first created by migration 00004
-- (hybrid_athlete_system) with a trainer-focused column set
-- (left_arm_cm, calf_cm, bp_systolic, etc.). We can't `create table
-- if not exists` with a different column list — it would silently
-- skip on environments where 00004 ran first. Instead we ensure the
-- table exists (no-op when it does) then ADD only the columns this
-- migration's app code needs, via `add column if not exists`. Fully
-- additive — preserves all the trainer-managed columns 00004 set up.

create table if not exists public.client_body_measurements (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  measured_at date not null default current_date,
  created_at timestamptz default now()
);

alter table public.client_body_measurements
  add column if not exists weight_kg          numeric(5,2),
  add column if not exists body_fat_pct       numeric(4,1),
  add column if not exists neck_cm            numeric(5,1),
  add column if not exists chest_cm           numeric(5,1),
  add column if not exists upper_abdomen_cm   numeric(5,1),
  add column if not exists lower_abdomen_cm   numeric(5,1),
  add column if not exists waist_cm           numeric(5,1),
  add column if not exists hips_cm            numeric(5,1),
  add column if not exists bicep_left_cm      numeric(5,1),
  add column if not exists bicep_right_cm     numeric(5,1),
  add column if not exists thigh_left_cm      numeric(5,1),
  add column if not exists thigh_right_cm     numeric(5,1),
  add column if not exists calf_left_cm       numeric(5,1),
  add column if not exists calf_right_cm      numeric(5,1),
  add column if not exists note               text,
  add column if not exists updated_at         timestamptz default now();

-- One row per client per measurement date — re-submission overwrites.
-- Wrapped in DO block because `add constraint if not exists` doesn't
-- exist in Postgres; we check first.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'client_body_measurements_client_id_measured_at_key'
  ) then
    alter table public.client_body_measurements
      add constraint client_body_measurements_client_id_measured_at_key
      unique (client_id, measured_at);
  end if;
end $$;

create index if not exists idx_body_meas_client_date
  on public.client_body_measurements(client_id, measured_at desc);

drop trigger if exists tr_body_meas_updated on public.client_body_measurements;
create trigger tr_body_meas_updated
  before update on public.client_body_measurements
  for each row execute procedure public.set_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────────

alter table public.client_body_measurements enable row level security;

drop policy if exists "Clients manage own measurements" on public.client_body_measurements;
create policy "Clients manage own measurements" on public.client_body_measurements
  for all using (auth.uid() = client_id);

drop policy if exists "Admins manage all measurements" on public.client_body_measurements;
create policy "Admins manage all measurements" on public.client_body_measurements
  for all using (public.is_admin(auth.uid()));

-- Force PostgREST to refresh its schema cache immediately so the new
-- columns are visible to the API without waiting for the usual
-- auto-reload. (Without this, the API returns "Could not find the
-- '...' column in the schema cache" until cache TTL expires.)
notify pgrst, 'reload schema';
