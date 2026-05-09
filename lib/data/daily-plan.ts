import 'server-only';
import { createClient } from '@/lib/supabase/server';
import {
  type DailyActuals,
  type DailyPlan,
  type ExerciseActuals,
  type PlannedExercise,
  type WorkoutCompletionStatus,
  EMPTY_DAILY_PLAN,
} from '@/lib/data/daily-plan-types';

/**
 * Read the planned side of a client's day for prefill in the
 * "Edit Today's Plan" modal. Returns null fields when no plan exists yet
 * — the modal renders empty inputs in that case.
 *
 * Types and EMPTY_* constants live in `daily-plan-types.ts` so that
 * client components can import them without dragging this file (and
 * its `'server-only'` + `next/headers` chain) into the client bundle.
 */

interface DailyLogRow {
  steps_target: number | null;
  sleep_target_hours: number | null;
  water_target: number | null;
  calories_target: number | null;
  protein_target_g: number | null;
  cardio_target_minutes: number | null;
  target_weight_kg: number | null;
  recovery_goal: string | null;
  mobility_goal: string | null;
  // Actuals (logged by client)
  steps: number | null;
  sleep_hours: number | null;
  water_glasses: number | null;
  weight_kg: number | null;
  calories_consumed: number | null;
  protein_g: number | null;
}

interface WorkoutRow {
  id: string;
  name: string | null;
  category: string | null;
  target_muscle_group: string | null;
  trainer_notes: string | null;
  next_day_instructions: string | null;
  completed: boolean | null;
  completion_status: string | null;
}

interface ExerciseRow {
  id: string;
  exercise_name: string;
  target_muscle: string | null;
  sets: number | null;
  reps: string | null;
  target_weight_kg: number | null;
  rest_seconds: number | null;
  tempo: string | null;
  rpe_target: number | null;
  trainer_instruction: string | null;
  exercise_order: number;
}

interface ExerciseActualsRow {
  planned_exercise_id: string;
  actual_sets: number | null;
  actual_reps: string | null;
  actual_weight_kg: number | null;
  rpe: number | null;
  notes: string | null;
  completed_at: string | null;
}

export async function getDailyPlan(
  clientId: string,
  planDate: string
): Promise<DailyPlan> {
  try {
    const supabase = await createClient();

    const [{ data: log }, { data: workout }] = await Promise.all([
      supabase
        .from('client_daily_logs')
        .select(
          'steps_target, sleep_target_hours, water_target, calories_target, protein_target_g, cardio_target_minutes, target_weight_kg, recovery_goal, mobility_goal, steps, sleep_hours, water_glasses, weight_kg, calories_consumed, protein_g'
        )
        .eq('client_id', clientId)
        .eq('log_date', planDate)
        .maybeSingle(),
      supabase
        .from('client_workouts')
        .select(
          'id, name, category, target_muscle_group, trainer_notes, next_day_instructions, completed, completion_status'
        )
        .eq('client_id', clientId)
        .eq('workout_date', planDate)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

    const l = (log as DailyLogRow | null) ?? null;
    const w = (workout as WorkoutRow | null) ?? null;

    let exercises: PlannedExercise[] = [];
    if (w?.id) {
      const { data: exerciseRows } = await supabase
        .from('client_workout_exercises')
        .select(
          'id, exercise_name, target_muscle, sets, reps, target_weight_kg, rest_seconds, tempo, rpe_target, trainer_instruction, exercise_order'
        )
        .eq('workout_id', w.id)
        .order('exercise_order', { ascending: true });

      const plannedRows = (exerciseRows ?? []) as ExerciseRow[];

      // Fetch any logged actuals for these planned exercises in one query.
      const plannedIds = plannedRows.map((r) => r.id);
      const actualsByPlannedId = new Map<string, ExerciseActuals>();
      if (plannedIds.length > 0) {
        const { data: actualRows } = await supabase
          .from('client_workout_exercise_logs')
          .select(
            'planned_exercise_id, actual_sets, actual_reps, actual_weight_kg, rpe, notes, completed_at'
          )
          .in('planned_exercise_id', plannedIds);

        (actualRows ?? []).forEach((row) => {
          const a = row as ExerciseActualsRow;
          actualsByPlannedId.set(a.planned_exercise_id, {
            actualSets: a.actual_sets,
            actualReps: a.actual_reps,
            actualWeightKg: a.actual_weight_kg,
            rpe: a.rpe,
            notes: a.notes,
            loggedAt: a.completed_at,
          });
        });
      }

      exercises = plannedRows.map((r) => ({
        id: r.id,
        exerciseName: r.exercise_name,
        targetMuscle: r.target_muscle,
        sets: r.sets,
        reps: r.reps,
        targetWeightKg: r.target_weight_kg,
        restSeconds: r.rest_seconds,
        tempo: r.tempo,
        rpeTarget: r.rpe_target,
        trainerInstruction: r.trainer_instruction,
        exerciseOrder: r.exercise_order,
        actuals: actualsByPlannedId.get(r.id) ?? null,
      }));
    }

    const completionStatus = (w?.completion_status ??
      null) as WorkoutCompletionStatus;

    const actuals: DailyActuals = {
      steps: l?.steps ?? null,
      sleepHours: l?.sleep_hours ?? null,
      waterGlasses: l?.water_glasses ?? null,
      weightKg: l?.weight_kg ?? null,
      caloriesConsumed: l?.calories_consumed ?? null,
      proteinG: l?.protein_g ?? null,
      workoutCompleted: Boolean(w?.completed),
      workoutCompletionStatus: completionStatus,
    };

    return {
      workoutId: w?.id ?? null,
      workoutName: w?.name ?? null,
      workoutType: w?.category ?? null,
      targetMuscleGroup: w?.target_muscle_group ?? null,
      trainerNotes: w?.trainer_notes ?? null,
      nextDayInstructions: w?.next_day_instructions ?? null,
      stepsTarget: l?.steps_target ?? null,
      sleepTargetHours: l?.sleep_target_hours ?? null,
      waterTarget: l?.water_target ?? null,
      caloriesTarget: l?.calories_target ?? null,
      proteinTargetG: l?.protein_target_g ?? null,
      cardioTargetMinutes: l?.cardio_target_minutes ?? null,
      targetWeightKg: l?.target_weight_kg ?? null,
      recoveryGoal: l?.recovery_goal ?? null,
      mobilityGoal: l?.mobility_goal ?? null,
      exercises,
      actuals,
    };
  } catch {
    return EMPTY_DAILY_PLAN;
  }
}
