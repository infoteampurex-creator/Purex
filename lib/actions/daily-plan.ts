'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// ─── Types ─────────────────────────────────────────────────────────

export type DailyPlanActionState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  workoutId?: string;
};

// Optional() but stripped of empty strings before validation, so the
// admin can leave fields blank without zod complaining.
const optionalInt = z
  .union([z.number().int(), z.literal('').transform(() => null), z.null()])
  .optional();
const optionalNumber = z
  .union([z.number(), z.literal('').transform(() => null), z.null()])
  .optional();
const optionalText = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (typeof v === 'string' ? v.trim() || null : v ?? null));

const exerciseInputSchema = z.object({
  exerciseName: z.string().min(1).max(200),
  targetMuscle: optionalText,
  sets: optionalInt,
  reps: optionalText,
  targetWeightKg: optionalNumber,
  restSeconds: optionalInt,
  tempo: optionalText,
  rpeTarget: z
    .union([
      z.number().int().min(1).max(10),
      z.literal('').transform(() => null),
      z.null(),
    ])
    .optional(),
  trainerInstruction: optionalText,
});

export type PlannedExerciseInput = z.input<typeof exerciseInputSchema>;

const upsertDailyPlanSchema = z.object({
  clientId: z.string().uuid(),
  planDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),

  workout: z
    .object({
      name: optionalText,
      type: optionalText, // 'Strength' | 'HYROX' | 'Conditioning' | …
      targetMuscleGroup: optionalText,
      trainerNotes: optionalText,
      nextDayInstructions: optionalText,
    })
    .optional(),

  targets: z
    .object({
      stepsTarget: optionalInt,
      sleepTargetHours: optionalNumber,
      waterTarget: optionalInt,
      caloriesTarget: optionalInt,
      proteinTargetG: optionalInt,
      cardioTargetMinutes: optionalInt,
      targetWeightKg: optionalNumber,
    })
    .optional(),

  recovery: z
    .object({
      recoveryGoal: optionalText,
      mobilityGoal: optionalText,
    })
    .optional(),

  /**
   * Full replacement of planned exercises for the day. If provided
   * (even as []), all existing client_workout_exercises rows for this
   * workout are deleted and replaced with the supplied list. If omitted,
   * existing exercises are left untouched.
   */
  exercises: z.array(exerciseInputSchema).optional(),
});

export type UpsertDailyPlanInput = z.input<typeof upsertDailyPlanSchema>;

// ─── Action ────────────────────────────────────────────────────────

/**
 * Upsert the planned side of a client's day:
 *   1. client_daily_logs row by (client_id, log_date) — sets target_*,
 *      recovery_goal, mobility_goal columns. Actual columns (steps,
 *      sleep_hours, etc.) are NEVER touched here so the client's logged
 *      data is preserved.
 *   2. client_workouts row for the same (client_id, workout_date).
 *      Looks up existing row first; updates if found, inserts if not.
 *
 * RLS guarantees only the trainer assigned to this client (via
 * trainer_client_assignments) and admins can write. The SSR client
 * inherits the caller's auth.uid().
 */
export async function upsertDailyPlan(
  input: UpsertDailyPlanInput
): Promise<DailyPlanActionState> {
  const parsed = upsertDailyPlanSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const key = issue.path.join('.');
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    });
    return {
      ok: false,
      error: 'Please fix the highlighted fields.',
      fieldErrors,
    };
  }

  const data = parsed.data;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, error: 'Not authenticated.' };
    }

    // ─── 1. Upsert daily-log planned columns ────────────────────────
    const targets = data.targets;
    const recovery = data.recovery;

    // Build object including only the planned columns. Actual columns
    // (steps, sleep_hours, etc.) are not in this object so an UPDATE
    // on conflict leaves them untouched.
    const dailyLogRow = {
      client_id: data.clientId,
      log_date: data.planDate,
      steps_target: targets?.stepsTarget ?? null,
      sleep_target_hours: targets?.sleepTargetHours ?? null,
      water_target: targets?.waterTarget ?? null,
      calories_target: targets?.caloriesTarget ?? null,
      protein_target_g: targets?.proteinTargetG ?? null,
      cardio_target_minutes: targets?.cardioTargetMinutes ?? null,
      target_weight_kg: targets?.targetWeightKg ?? null,
      recovery_goal: recovery?.recoveryGoal ?? null,
      mobility_goal: recovery?.mobilityGoal ?? null,
    };

    const { error: logError } = await supabase
      .from('client_daily_logs')
      .upsert(dailyLogRow, { onConflict: 'client_id,log_date' });

    if (logError) {
      console.error('[PURE X] upsertDailyPlan: daily_logs failed', logError);
      return { ok: false, error: logError.message };
    }

    // ─── 2. Upsert the workout row ──────────────────────────────────
    let workoutId: string | undefined;
    const workout = data.workout;
    const exercises = data.exercises;
    const hasAnyWorkoutField = Boolean(
      workout?.name ||
        workout?.type ||
        workout?.targetMuscleGroup ||
        workout?.trainerNotes ||
        workout?.nextDayInstructions
    );
    // If exercises are provided (even empty array — meaning "replace"),
    // we still need a parent workout row to attach them to.
    const needsWorkoutRow =
      hasAnyWorkoutField || (exercises !== undefined && exercises.length > 0);

    if (needsWorkoutRow) {
      const { data: existingRows, error: lookupError } = await supabase
        .from('client_workouts')
        .select('id')
        .eq('client_id', data.clientId)
        .eq('workout_date', data.planDate)
        .order('created_at', { ascending: true })
        .limit(1);

      if (lookupError) {
        console.error('[PURE X] upsertDailyPlan: workout lookup failed', lookupError);
        return { ok: false, error: lookupError.message };
      }

      const existingId = existingRows?.[0]?.id as string | undefined;

      const workoutPayload = {
        client_id: data.clientId,
        trainer_id: user.id,
        workout_date: data.planDate,
        name: workout?.name ?? 'Daily plan',
        category: workout?.type ?? null,
        target_muscle_group: workout?.targetMuscleGroup ?? null,
        trainer_notes: workout?.trainerNotes ?? null,
        next_day_instructions: workout?.nextDayInstructions ?? null,
      };

      if (existingId) {
        const { error: updateError } = await supabase
          .from('client_workouts')
          .update(workoutPayload)
          .eq('id', existingId);
        if (updateError) {
          console.error(
            '[PURE X] upsertDailyPlan: workout update failed',
            updateError
          );
          return { ok: false, error: updateError.message };
        }
        workoutId = existingId;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('client_workouts')
          .insert(workoutPayload)
          .select('id')
          .single();
        if (insertError) {
          console.error(
            '[PURE X] upsertDailyPlan: workout insert failed',
            insertError
          );
          return { ok: false, error: insertError.message };
        }
        workoutId = inserted?.id;
      }
    }

    // ─── 3. Replace planned exercises (if provided) ─────────────────
    // exercises === undefined → leave existing rows alone.
    // exercises === []        → wipe planned exercises for the day.
    // exercises === [...rows] → replace planned exercises with these.
    if (exercises !== undefined && workoutId) {
      const { error: deleteErr } = await supabase
        .from('client_workout_exercises')
        .delete()
        .eq('workout_id', workoutId);

      if (deleteErr) {
        console.error(
          '[PURE X] upsertDailyPlan: exercise delete failed',
          deleteErr
        );
        return { ok: false, error: deleteErr.message };
      }

      if (exercises.length > 0) {
        const exerciseRows = exercises.map((ex, idx) => ({
          workout_id: workoutId,
          exercise_name: ex.exerciseName,
          target_muscle: ex.targetMuscle ?? null,
          sets: ex.sets ?? null,
          reps: ex.reps ?? null,
          target_weight_kg: ex.targetWeightKg ?? null,
          rest_seconds: ex.restSeconds ?? null,
          tempo: ex.tempo ?? null,
          rpe_target: ex.rpeTarget ?? null,
          trainer_instruction: ex.trainerInstruction ?? null,
          exercise_order: idx,
        }));

        const { error: insertErr } = await supabase
          .from('client_workout_exercises')
          .insert(exerciseRows);

        if (insertErr) {
          console.error(
            '[PURE X] upsertDailyPlan: exercise insert failed',
            insertErr
          );
          return { ok: false, error: insertErr.message };
        }
      }
    }

    // ─── 4. Refresh ─────────────────────────────────────────────────
    revalidatePath(`/admin/clients/${data.clientId}`);
    revalidatePath('/admin/clients');
    revalidatePath('/admin/dashboard');
    revalidatePath('/client/dashboard');

    return { ok: true, workoutId };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// ─── Workout completion (client-side action) ──────────────────────

const setWorkoutCompletedSchema = z.object({
  workoutId: z.string().uuid(),
  completed: z.boolean(),
});

/**
 * Toggle a workout's completion flag. Used by the client's "Today's
 * Plan" card on the dashboard so they can mark today's workout as done.
 *
 * RLS: clients can update their own workout rows ("Clients manage own
 * workouts" policy from migration 00002). The 00006 trainer policy
 * stacks on top so trainers can also flip this from the admin side.
 */
export async function setWorkoutCompleted(
  input: z.infer<typeof setWorkoutCompletedSchema>
): Promise<DailyPlanActionState> {
  const parsed = setWorkoutCompletedSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  try {
    const supabase = await createClient();

    const { data: row, error } = await supabase
      .from('client_workouts')
      .update({
        completed: parsed.data.completed,
        completed_at: parsed.data.completed ? new Date().toISOString() : null,
      })
      .eq('id', parsed.data.workoutId)
      .select('client_id')
      .single();

    if (error) {
      console.error('[PURE X] setWorkoutCompleted failed', error);
      return { ok: false, error: error.message };
    }

    revalidatePath('/client/dashboard');
    if (row?.client_id) {
      revalidatePath(`/admin/clients/${row.client_id}`);
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// ─── Delete ────────────────────────────────────────────────────────

const deleteDailyPlanSchema = z.object({
  clientId: z.string().uuid(),
  planDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * Clear the planned side of a client's day:
 *   - Nulls all target_* and goal columns on the daily-log row.
 *   - Deletes the client_workouts row for the date (cascades to
 *     client_workout_exercises).
 * Does NOT touch any actual data the client has logged.
 */
export async function deleteDailyPlan(
  input: z.infer<typeof deleteDailyPlanSchema>
): Promise<DailyPlanActionState> {
  const parsed = deleteDailyPlanSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  try {
    const supabase = await createClient();

    const { error: clearError } = await supabase
      .from('client_daily_logs')
      .update({
        steps_target: null,
        sleep_target_hours: null,
        water_target: null,
        calories_target: null,
        protein_target_g: null,
        cardio_target_minutes: null,
        target_weight_kg: null,
        recovery_goal: null,
        mobility_goal: null,
      })
      .eq('client_id', parsed.data.clientId)
      .eq('log_date', parsed.data.planDate);

    if (clearError) {
      console.error('[PURE X] deleteDailyPlan: clear targets failed', clearError);
      return { ok: false, error: clearError.message };
    }

    const { error: workoutError } = await supabase
      .from('client_workouts')
      .delete()
      .eq('client_id', parsed.data.clientId)
      .eq('workout_date', parsed.data.planDate);

    if (workoutError) {
      console.error(
        '[PURE X] deleteDailyPlan: workout delete failed',
        workoutError
      );
      return { ok: false, error: workoutError.message };
    }

    revalidatePath(`/admin/clients/${parsed.data.clientId}`);
    revalidatePath('/admin/clients');
    revalidatePath('/client/dashboard');

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
