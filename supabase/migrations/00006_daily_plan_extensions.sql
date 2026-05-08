-- ════════════════════════════════════════════════════════════════════
-- PURE X — Phase 4: Daily Plan extensions
-- ════════════════════════════════════════════════════════════════════
--
-- Extends the existing schema so trainers can build a complete daily
-- plan (workout + targets + recovery goals) from the admin portal,
-- and clients can log actuals against it on their dashboard.
--
-- DESIGN NOTE: We extend existing tables instead of creating parallel
-- ones. The split between PLANNED and ACTUAL is per-column, not
-- per-table:
--   • client_daily_logs   — both planned (steps_target, etc.) and
--                            actual (steps, etc.) columns coexist on
--                            the (client_id, log_date) row.
--   • client_workouts     — the planned workout for a date.
--   • client_workout_exercises (NEW) — children of client_workouts,
--                            one row per planned exercise.
--   • client_workout_logs / client_exercise_logs (already exist) —
--                            actual completion data.
--
-- Run order: after 00005_exercise_library.sql
-- This migration is ADDITIVE and idempotent.
-- ════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════
-- 1. EXTEND client_daily_logs WITH MISSING PLANNED-TARGET COLUMNS
-- ════════════════════════════════════════════════════════════════════
-- Already has: steps_target, water_target, calories_target, weight_kg,
-- calories_consumed, protein_g, carbs_g, fats_g, water_glasses, steps,
-- sleep_hours, sleep_quality_1_5, mood_1_5, recovery_score, daily_note.

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'client_daily_logs'
      and column_name = 'sleep_target_hours'
  ) then
    alter table public.client_daily_logs add column sleep_target_hours numeric(3,1);
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'client_daily_logs'
      and column_name = 'protein_target_g'
  ) then
    alter table public.client_daily_logs add column protein_target_g int;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'client_daily_logs'
      and column_name = 'cardio_target_minutes'
  ) then
    alter table public.client_daily_logs add column cardio_target_minutes int;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'client_daily_logs'
      and column_name = 'target_weight_kg'
  ) then
    alter table public.client_daily_logs add column target_weight_kg numeric(5,2);
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'client_daily_logs'
      and column_name = 'recovery_goal'
  ) then
    alter table public.client_daily_logs add column recovery_goal text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'client_daily_logs'
      and column_name = 'mobility_goal'
  ) then
    alter table public.client_daily_logs add column mobility_goal text;
  end if;
end $$;


-- ════════════════════════════════════════════════════════════════════
-- 2. EXTEND client_workouts WITH PLAN-LEVEL FIELDS
-- ════════════════════════════════════════════════════════════════════
-- Already has: name, category, focus, description, sets, reps,
-- difficulty, duration_minutes, calories, completed.

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'client_workouts'
      and column_name = 'trainer_notes'
  ) then
    alter table public.client_workouts add column trainer_notes text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'client_workouts'
      and column_name = 'target_muscle_group'
  ) then
    alter table public.client_workouts add column target_muscle_group text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'client_workouts'
      and column_name = 'next_day_instructions'
  ) then
    alter table public.client_workouts add column next_day_instructions text;
  end if;

  -- trainer_id so we can attribute who planned the workout (and use it
  -- in RLS / audit later). Nullable for backfill compatibility.
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'client_workouts'
      and column_name = 'trainer_id'
  ) then
    alter table public.client_workouts
      add column trainer_id uuid references public.profiles(id) on delete set null;
  end if;
end $$;


-- ════════════════════════════════════════════════════════════════════
-- 3. NEW TABLE — client_workout_exercises
-- ════════════════════════════════════════════════════════════════════
-- Planned exercises within a workout. The actual completion data lives
-- in client_exercise_logs (created in 00004).

create table if not exists public.client_workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.client_workouts(id) on delete cascade,

  -- What
  exercise_name text not null,
  target_muscle text,
  exercise_library_id uuid references public.exercise_library(id) on delete set null,

  -- How
  sets int,
  reps text,                  -- '8-12', 'AMRAP', '5'
  target_weight_kg numeric(6,2),
  rest_seconds int,
  tempo text,                 -- '3-1-2-0' (eccentric-bottom-concentric-top)
  rpe_target int check (rpe_target between 1 and 10),

  -- Coaching cue
  trainer_instruction text,

  -- Order within the workout
  exercise_order int not null default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_workout_exercises_workout
  on public.client_workout_exercises(workout_id, exercise_order);

drop trigger if exists tr_workout_exercises_updated on public.client_workout_exercises;
create trigger tr_workout_exercises_updated
  before update on public.client_workout_exercises
  for each row execute procedure public.set_updated_at();


-- ════════════════════════════════════════════════════════════════════
-- 4. RLS — client_workout_exercises
-- ════════════════════════════════════════════════════════════════════
-- No client_id column; resolve via the parent workout.

alter table public.client_workout_exercises enable row level security;

drop policy if exists "Read own or assigned workout exercises"
  on public.client_workout_exercises;
create policy "Read own or assigned workout exercises"
  on public.client_workout_exercises
  for select using (
    exists (
      select 1 from public.client_workouts w
      where w.id = client_workout_exercises.workout_id
        and (
          w.client_id = auth.uid()
          or public.is_trainer_of(w.client_id)
          or public.is_admin_user()
        )
    )
  );

drop policy if exists "Trainers manage workout exercises"
  on public.client_workout_exercises;
create policy "Trainers manage workout exercises"
  on public.client_workout_exercises
  for all using (
    exists (
      select 1 from public.client_workouts w
      where w.id = client_workout_exercises.workout_id
        and (public.is_trainer_of(w.client_id) or public.is_admin_user())
    )
  )
  with check (
    exists (
      select 1 from public.client_workouts w
      where w.id = client_workout_exercises.workout_id
        and (public.is_trainer_of(w.client_id) or public.is_admin_user())
    )
  );


-- ════════════════════════════════════════════════════════════════════
-- 5. EXTEND RLS ON EXISTING TABLES SO TRAINERS CAN WRITE
-- ════════════════════════════════════════════════════════════════════
-- The original 00002 policies only granted access to the client and to
-- admins. Trainers (assigned via trainer_client_assignments) need to
-- write planned data on their clients' behalf.
--
-- Existing policies are left in place; these are added alongside and
-- combine with OR semantics under permissive RLS.

drop policy if exists "Trainers manage assigned client workouts"
  on public.client_workouts;
create policy "Trainers manage assigned client workouts"
  on public.client_workouts
  for all using (public.is_trainer_of(client_id) or public.is_admin_user())
  with check (public.is_trainer_of(client_id) or public.is_admin_user());

drop policy if exists "Trainers manage assigned client daily logs"
  on public.client_daily_logs;
create policy "Trainers manage assigned client daily logs"
  on public.client_daily_logs
  for all using (public.is_trainer_of(client_id) or public.is_admin_user())
  with check (public.is_trainer_of(client_id) or public.is_admin_user());

drop policy if exists "Trainers manage assigned client tasks"
  on public.client_tasks;
create policy "Trainers manage assigned client tasks"
  on public.client_tasks
  for all using (public.is_trainer_of(client_id) or public.is_admin_user())
  with check (public.is_trainer_of(client_id) or public.is_admin_user());


-- ════════════════════════════════════════════════════════════════════
-- DONE
-- ════════════════════════════════════════════════════════════════════
-- Next: Phase 2 (admin "Edit Today's Plan" modal) writes to
-- client_daily_logs (planned columns) + client_workouts. Phase 3
-- (workout builder) writes to client_workouts + client_workout_exercises.
