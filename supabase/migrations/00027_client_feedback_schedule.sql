-- ═════════════════════════════════════════════════════════════════════
-- Migration 00027 — Client feedback call (weekly recurring slot)
-- ─────────────────────────────────────────────────────────────────────
-- Every active client gets one weekly feedback call with their coach
-- (e.g. "Sundays at 4 PM"). Admin captures the slot the client gave
-- them; that slot then recurs every week until changed or paused.
--
-- Schema decisions
--   • One row per client (primary key on client_id) — there's only
--     ever one active recurring slot per client at a time. Edit-in-
--     place rather than maintain history.
--   • day_of_week 0..6 with 0 = Monday. Matches the convention used
--     by 00021_weekly_schedule (week starts Monday everywhere in
--     the app — global ISO + how the existing Plan page renders).
--   • time_of_day stored as `time` (no zone). Coach + clients are
--     all in IST; storing local time is simpler than juggling UTC
--     for a recurring slot. If we ever go multi-tz, add a tz column.
--   • paused boolean so a holiday / month break can be marked
--     without losing the slot.
-- ═════════════════════════════════════════════════════════════════════

create table if not exists public.client_feedback_schedule (
  client_id      uuid primary key references public.profiles(id) on delete cascade,
  day_of_week    int  not null check (day_of_week between 0 and 6),
  time_of_day    time not null,
  duration_min   int  not null default 30 check (duration_min between 10 and 120),
  notes          text,
  paused         boolean not null default false,
  set_by         uuid references public.profiles(id),
  set_at         timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

drop trigger if exists tr_feedback_schedule_updated on public.client_feedback_schedule;
create trigger tr_feedback_schedule_updated
  before update on public.client_feedback_schedule
  for each row execute procedure public.set_updated_at();

create index if not exists idx_feedback_schedule_day_time
  on public.client_feedback_schedule(day_of_week, time_of_day)
  where paused = false;

-- ─── RLS ────────────────────────────────────────────────────────────

alter table public.client_feedback_schedule enable row level security;

-- Clients can READ their own scheduled call (so the client app can
-- surface a "Your next feedback call: Sunday 4 PM" badge).
drop policy if exists "Clients read own feedback slot" on public.client_feedback_schedule;
create policy "Clients read own feedback slot"
  on public.client_feedback_schedule
  for select
  using (auth.uid() = client_id);

-- Admins (coaches) manage everything.
drop policy if exists "Admins manage all feedback slots" on public.client_feedback_schedule;
create policy "Admins manage all feedback slots"
  on public.client_feedback_schedule
  for all
  using (public.is_admin(auth.uid()));

-- Reload PostgREST so the new table is queryable immediately.
notify pgrst, 'reload schema';
