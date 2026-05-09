-- ════════════════════════════════════════════════════════════════════
-- PURE X — Phase 5a: Planned-data guard
-- ════════════════════════════════════════════════════════════════════
--
-- Closes a hole in the existing RLS: the "Clients manage own logs"
-- policy on client_daily_logs (and the equivalent on client_workouts)
-- is a `for all using (auth.uid() = client_id)` blanket — which lets a
-- determined client overwrite the targets and workout structure their
-- trainer set, by going around the app and using the Supabase JS
-- client directly.
--
-- We don't want column-level GRANTs because trainers are also
-- `authenticated` and would lose access. Instead, BEFORE UPDATE
-- triggers reject changes to planned columns when the caller isn't
-- a trainer/admin.
--
-- Run order: after 00006_daily_plan_extensions.sql
-- Idempotent.
-- ════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════
-- 1. client_daily_logs — guard the planned-target columns
-- ════════════════════════════════════════════════════════════════════
-- Planned columns (trainer-only writeable):
--   steps_target, sleep_target_hours, water_target, calories_target,
--   protein_target_g, cardio_target_minutes, target_weight_kg,
--   recovery_goal, mobility_goal
-- Actual columns (client also writeable):
--   weight_kg, calories_consumed, protein_g, carbs_g, fats_g,
--   water_glasses, steps, sleep_hours, sleep_quality_1_5, mood_1_5,
--   recovery_score, daily_note

create or replace function public.client_daily_logs_planned_guard()
returns trigger as $$
begin
  -- Trainer/admin: anything goes.
  if public.is_admin_user() or public.is_trainer_of(new.client_id) then
    return new;
  end if;

  -- Otherwise (the client themselves): reject changes to planned
  -- columns. `is distinct from` handles NULLs correctly.
  if old.steps_target           is distinct from new.steps_target
     or old.sleep_target_hours    is distinct from new.sleep_target_hours
     or old.water_target          is distinct from new.water_target
     or old.calories_target       is distinct from new.calories_target
     or old.protein_target_g      is distinct from new.protein_target_g
     or old.cardio_target_minutes is distinct from new.cardio_target_minutes
     or old.target_weight_kg      is distinct from new.target_weight_kg
     or old.recovery_goal         is distinct from new.recovery_goal
     or old.mobility_goal         is distinct from new.mobility_goal
  then
    raise exception 'Planned targets can only be modified by an assigned trainer or an admin'
      using errcode = '42501'; -- insufficient_privilege
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists tr_daily_logs_planned_guard on public.client_daily_logs;
create trigger tr_daily_logs_planned_guard
  before update on public.client_daily_logs
  for each row execute procedure public.client_daily_logs_planned_guard();


-- ════════════════════════════════════════════════════════════════════
-- 2. client_workouts — guard the planned columns
-- ════════════════════════════════════════════════════════════════════
-- Planned columns (trainer-only writeable):
--   name, category, target_muscle_group, focus, sets, reps,
--   difficulty, duration_minutes, calories, description, tags,
--   trainer_notes, next_day_instructions, trainer_id, workout_date
-- Actual columns (client also writeable):
--   completed, completed_at

create or replace function public.client_workouts_planned_guard()
returns trigger as $$
begin
  if public.is_admin_user() or public.is_trainer_of(new.client_id) then
    return new;
  end if;

  if old.name                  is distinct from new.name
     or old.category             is distinct from new.category
     or old.target_muscle_group  is distinct from new.target_muscle_group
     or old.focus                is distinct from new.focus
     or old.sets                 is distinct from new.sets
     or old.reps                 is distinct from new.reps
     or old.difficulty           is distinct from new.difficulty
     or old.duration_minutes     is distinct from new.duration_minutes
     or old.calories             is distinct from new.calories
     or old.description          is distinct from new.description
     or old.tags                 is distinct from new.tags
     or old.trainer_notes        is distinct from new.trainer_notes
     or old.next_day_instructions is distinct from new.next_day_instructions
     or old.trainer_id           is distinct from new.trainer_id
     or old.workout_date         is distinct from new.workout_date
  then
    raise exception 'Workout plan can only be modified by an assigned trainer or an admin'
      using errcode = '42501';
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists tr_workouts_planned_guard on public.client_workouts;
create trigger tr_workouts_planned_guard
  before update on public.client_workouts
  for each row execute procedure public.client_workouts_planned_guard();


-- ════════════════════════════════════════════════════════════════════
-- DONE — what this leaves intact
-- ════════════════════════════════════════════════════════════════════
-- · Clients can still INSERT into client_daily_logs (one-time daily
--   log creation) and UPDATE actual columns.
-- · Clients can still UPDATE client_workouts.completed and
--   client_workouts.completed_at to mark workouts done.
-- · client_workout_exercises is already trainer/admin-only via the
--   00006 RLS policies — no client mutations possible there.
-- · client_workout_exercise_logs (Phase 5b) will be added with its
--   own client-write policy for actuals only.
