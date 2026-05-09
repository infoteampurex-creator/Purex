-- ════════════════════════════════════════════════════════════════════
-- PURE X — Phase 5b.1: Per-set actuals
-- ════════════════════════════════════════════════════════════════════
--
-- The 00008 client_workout_exercise_logs schema stores ONE row per
-- planned exercise with single actual_sets / actual_reps /
-- actual_weight_kg fields. That collapses real strength training into
-- a single average — a 4×8-12 working set with ramping weight gets
-- flattened to "4 sets, '8-12' reps, 22.5 kg" with no per-set detail.
--
-- This migration adds a `set_breakdown jsonb` column that stores an
-- array of per-set objects:
--   [
--     { "reps": "10", "weight_kg": 20, "rpe": 7 },
--     { "reps": "8",  "weight_kg": 22.5, "rpe": 8 },
--     { "reps": "8",  "weight_kg": 22.5, "rpe": 9 },
--     { "reps": "6",  "weight_kg": 22.5, "rpe": 10 }
--   ]
--
-- The existing flat columns are kept and used as a denormalised
-- summary (actual_sets = breakdown.length; the others stay for
-- backward compatibility). New code reads set_breakdown when
-- present, falls back to the flat fields otherwise.
--
-- Run order: after 00008_workout_actuals.sql
-- Idempotent.
-- ════════════════════════════════════════════════════════════════════

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'client_workout_exercise_logs'
      and column_name = 'set_breakdown'
  ) then
    alter table public.client_workout_exercise_logs
      add column set_breakdown jsonb;
  end if;
end $$;

-- Optional sanity check on the shape — keep it loose so older flat-only
-- logs (where set_breakdown is null) still validate.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'client_workout_exercise_logs_set_breakdown_is_array'
  ) then
    alter table public.client_workout_exercise_logs
      add constraint client_workout_exercise_logs_set_breakdown_is_array
      check (
        set_breakdown is null
        or jsonb_typeof(set_breakdown) = 'array'
      );
  end if;
end $$;
