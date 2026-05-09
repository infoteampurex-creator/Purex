-- ════════════════════════════════════════════════════════════════════
-- PURE X — Phase 5b: Workout actuals (tri-state status + per-exercise log)
-- ════════════════════════════════════════════════════════════════════
--
-- Lets clients close the loop on the workout, not just daily metrics:
--   1. Tri-state completion status on the workout itself (was just a
--      boolean): completed / partial / skipped.
--   2. Per-exercise actual sets/reps/weight log keyed by the planned
--      exercise. Lives in its own table so trainer edits to the plan
--      (which use delete-then-insert on client_workout_exercises) DON'T
--      wipe out logged actuals — the FK cascades only when the planned
--      row is genuinely removed; that's intentional.
--
-- Why a separate table instead of columns on client_workout_exercises?
-- Because upsertDailyPlan replaces planned rows wholesale on every
-- save. Columns on the same row would be wiped on every plan edit.
--
-- Run order: after 00007_planned_data_guard.sql
-- Idempotent.
-- ════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════
-- 1. client_workouts.completion_status — replaces the boolean toggle
-- ════════════════════════════════════════════════════════════════════
-- The existing `completed` boolean is left in place for backwards
-- compatibility (the LogMetricsModal pattern still reads it). New
-- code reads completion_status; older code keeps reading completed.

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'client_workouts'
      and column_name = 'completion_status'
  ) then
    alter table public.client_workouts
      add column completion_status text
      check (completion_status in ('completed', 'partial', 'skipped'));
  end if;
end $$;


-- ════════════════════════════════════════════════════════════════════
-- 2. NEW TABLE — client_workout_exercise_logs
-- ════════════════════════════════════════════════════════════════════
-- One row per (planned_exercise, attempt). Keep it simple: one log
-- per planned exercise via the unique constraint. If a client wants
-- to update their numbers, they overwrite the existing row.

create table if not exists public.client_workout_exercise_logs (
  id uuid primary key default gen_random_uuid(),
  planned_exercise_id uuid not null
    references public.client_workout_exercises(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,

  -- What actually happened
  actual_sets int,
  actual_reps text,                    -- '10', '8-10', 'AMRAP — 12'
  actual_weight_kg numeric(6,2),
  rpe int check (rpe between 1 and 10),
  notes text,                          -- "felt heavy on set 4"

  completed_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- One log per planned exercise. Updates overwrite.
  unique(planned_exercise_id)
);

create index if not exists idx_exercise_actuals_client
  on public.client_workout_exercise_logs(client_id, completed_at desc);
create index if not exists idx_exercise_actuals_planned
  on public.client_workout_exercise_logs(planned_exercise_id);

drop trigger if exists tr_exercise_actuals_updated on public.client_workout_exercise_logs;
create trigger tr_exercise_actuals_updated
  before update on public.client_workout_exercise_logs
  for each row execute procedure public.set_updated_at();


-- ════════════════════════════════════════════════════════════════════
-- 3. RLS — client_workout_exercise_logs
-- ════════════════════════════════════════════════════════════════════
-- Clients write their OWN actuals; trainers/admins write any of
-- their assigned clients'.

alter table public.client_workout_exercise_logs enable row level security;

drop policy if exists "Read own or assigned exercise actuals"
  on public.client_workout_exercise_logs;
create policy "Read own or assigned exercise actuals"
  on public.client_workout_exercise_logs
  for select using (
    client_id = auth.uid()
    or public.is_trainer_of(client_id)
    or public.is_admin_user()
  );

drop policy if exists "Clients log own exercise actuals"
  on public.client_workout_exercise_logs;
create policy "Clients log own exercise actuals"
  on public.client_workout_exercise_logs
  for all using (client_id = auth.uid())
  with check (client_id = auth.uid());

drop policy if exists "Trainers manage assigned exercise actuals"
  on public.client_workout_exercise_logs;
create policy "Trainers manage assigned exercise actuals"
  on public.client_workout_exercise_logs
  for all using (public.is_trainer_of(client_id) or public.is_admin_user())
  with check (public.is_trainer_of(client_id) or public.is_admin_user());


-- ════════════════════════════════════════════════════════════════════
-- DONE
-- ════════════════════════════════════════════════════════════════════
