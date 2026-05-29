-- ═════════════════════════════════════════════════════════════════════
-- Migration 00021 — Weekly schedule (per-client rolling plan)
-- ─────────────────────────────────────────────────────────────────────
-- Solves: coach (e.g. Siva) was assigning 1 workout × 7 days × N clients
-- every single week. Industry pattern: a per-client weekly "active plan"
-- that auto-repeats. Coach edits the base once; future weeks reflect
-- the change; past weeks stay locked to what was actually trained.
--
-- Schema:
--   client_weekly_plan       : one active plan per client
--   client_weekly_plan_days  : 7 rows (one per day-of-week), each pointing
--                              at a workout_templates row OR null = rest
--
-- Materialization happens in the server action (lib/actions/weekly-plan.ts)
-- when the coach saves: we write client_workouts rows for the next N
-- weeks (default 4). Existing rows for FUTURE dates get rewritten;
-- past + today are preserved (today's session may already be live).
-- ═════════════════════════════════════════════════════════════════════

-- ─── client_weekly_plan ─────────────────────────────────────────────

create table if not exists public.client_weekly_plan (
  client_id uuid primary key references public.profiles(id) on delete cascade,
  name text,                                -- "Strength Block 1", "Cut Phase", etc.
  started_at date not null default current_date,
  -- How many weeks ahead the materialization should keep populating.
  -- Coach hits "Save" → next N weeks get written. Default 4.
  materialize_weeks int not null default 4 check (materialize_weeks between 1 and 12),
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

drop trigger if exists tr_weekly_plan_updated on public.client_weekly_plan;
create trigger tr_weekly_plan_updated
  before update on public.client_weekly_plan
  for each row execute procedure public.set_updated_at();

-- ─── client_weekly_plan_days ────────────────────────────────────────

create table if not exists public.client_weekly_plan_days (
  client_id uuid not null references public.profiles(id) on delete cascade,

  -- 0 = Monday ... 6 = Sunday. Matches the existing PlanData.weekDays
  -- ordering on the client Plan page (week starts Monday — global
  -- convention).
  day_of_week int not null check (day_of_week between 0 and 6),

  -- Null = rest day. FK ON DELETE SET NULL so deleting a template
  -- doesn't break the schedule — the slot just becomes a rest day.
  workout_template_id uuid references public.workout_templates(id) on delete set null,

  -- Per-day coach note (overrides / supplements template's own note)
  override_notes text,

  primary key (client_id, day_of_week)
);

create index if not exists idx_weekly_plan_days_template
  on public.client_weekly_plan_days(workout_template_id);

-- ─── RLS ────────────────────────────────────────────────────────────

alter table public.client_weekly_plan enable row level security;
alter table public.client_weekly_plan_days enable row level security;

-- Clients can READ their own plan (read-only — coach owns writes)
drop policy if exists "Clients read own weekly plan" on public.client_weekly_plan;
create policy "Clients read own weekly plan"
  on public.client_weekly_plan
  for select
  using (auth.uid() = client_id);

drop policy if exists "Clients read own weekly plan days" on public.client_weekly_plan_days;
create policy "Clients read own weekly plan days"
  on public.client_weekly_plan_days
  for select
  using (auth.uid() = client_id);

-- Admins (coaches) MANAGE all plans
drop policy if exists "Admins manage all weekly plans" on public.client_weekly_plan;
create policy "Admins manage all weekly plans"
  on public.client_weekly_plan
  for all
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins manage all weekly plan days" on public.client_weekly_plan_days;
create policy "Admins manage all weekly plan days"
  on public.client_weekly_plan_days
  for all
  using (public.is_admin(auth.uid()));

-- Force PostgREST schema reload so the new tables are queryable
-- immediately on production.
notify pgrst, 'reload schema';
