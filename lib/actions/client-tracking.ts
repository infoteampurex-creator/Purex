'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// ─── Types ─────────────────────────────────────────────────────────

export type ActionState = {
  ok: boolean;
  error?: string;
  message?: string;
};

// ─── Daily logs ────────────────────────────────────────────────────

const dailyLogSchema = z.object({
  clientId: z.string().uuid(),
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  weightKg: z.number().positive().max(400).optional().nullable(),
  caloriesConsumed: z.number().int().min(0).max(20000).optional().nullable(),
  caloriesTarget: z.number().int().min(0).max(20000).optional().nullable(),
  proteinG: z.number().int().min(0).max(1000).optional().nullable(),
  carbsG: z.number().int().min(0).max(2000).optional().nullable(),
  fatsG: z.number().int().min(0).max(1000).optional().nullable(),
  waterGlasses: z.number().int().min(0).max(50).optional().nullable(),
  steps: z.number().int().min(0).max(200000).optional().nullable(),
  sleepHours: z.number().min(0).max(24).optional().nullable(),
  sleepQuality: z.number().int().min(1).max(5).optional().nullable(),
  mood: z.number().int().min(1).max(5).optional().nullable(),
  recoveryScore: z.number().int().min(0).max(100).optional().nullable(),
  dailyNote: z.string().max(2000).optional().nullable(),
});

export type DailyLogInput = z.infer<typeof dailyLogSchema>;

/**
 * Upsert a client's daily log for a specific date.
 * Unique constraint on (client_id, log_date) means re-submitting for the
 * same date updates the existing row instead of creating a duplicate.
 */
export async function upsertDailyLog(input: DailyLogInput): Promise<ActionState> {
  const parsed = dailyLogSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid data',
    };
  }

  const data = parsed.data;

  try {
    const supabase = await createClient();

    const { error } = await supabase.from('client_daily_logs').upsert(
      {
        client_id: data.clientId,
        log_date: data.logDate,
        weight_kg: data.weightKg ?? null,
        calories_consumed: data.caloriesConsumed ?? null,
        calories_target: data.caloriesTarget ?? null,
        protein_g: data.proteinG ?? null,
        carbs_g: data.carbsG ?? null,
        fats_g: data.fatsG ?? null,
        water_glasses: data.waterGlasses ?? null,
        steps: data.steps ?? null,
        sleep_hours: data.sleepHours ?? null,
        sleep_quality_1_5: data.sleepQuality ?? null,
        mood_1_5: data.mood ?? null,
        recovery_score: data.recoveryScore ?? null,
        daily_note: data.dailyNote ?? null,
      },
      { onConflict: 'client_id,log_date' }
    );

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[PURE X] upsertDailyLog failed:', error);
      return { ok: false, error: error.message };
    }

    // Refresh admin + client dashboards so new data shows immediately
    revalidatePath('/admin/clients', 'page');
    revalidatePath(`/admin/clients/${data.clientId}`);
    revalidatePath('/client/dashboard');
    revalidatePath('/client/progress');

    return { ok: true, message: 'Daily log saved.' };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// ─── Tasks ─────────────────────────────────────────────────────────

const addTaskSchema = z.object({
  clientId: z.string().uuid(),
  title: z.string().min(1).max(200),
  category: z
    .enum(['workout', 'nutrition', 'recovery', 'lifestyle'])
    .default('lifestyle'),
  taskDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  scheduledTime: z.string().max(50).optional(),
});

export async function addTask(
  input: z.infer<typeof addTaskSchema>
): Promise<ActionState & { taskId?: string }> {
  const parsed = addTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid task' };
  }

  const data = parsed.data;
  const logDate = data.taskDate ?? new Date().toISOString().slice(0, 10);

  try {
    const supabase = await createClient();

    const { data: inserted, error } = await supabase
      .from('client_tasks')
      .insert({
        client_id: data.clientId,
        task_date: logDate,
        title: data.title,
        category: data.category,
        scheduled_time: data.scheduledTime ?? null,
        completed: false,
      })
      .select('id')
      .single();

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[PURE X] addTask failed:', error);
      return { ok: false, error: error.message };
    }

    revalidatePath(`/admin/clients/${data.clientId}`);
    revalidatePath('/client/dashboard');

    return { ok: true, taskId: inserted.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

export async function toggleTask(
  taskId: string,
  completed: boolean
): Promise<ActionState> {
  if (!taskId) return { ok: false, error: 'Missing task id' };

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('client_tasks')
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq('id', taskId);

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[PURE X] toggleTask failed:', error);
      return { ok: false, error: error.message };
    }

    revalidatePath('/admin/clients', 'layout');
    revalidatePath('/client/dashboard');

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

export async function deleteTask(taskId: string): Promise<ActionState> {
  if (!taskId) return { ok: false, error: 'Missing task id' };

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('client_tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[PURE X] deleteTask failed:', error);
      return { ok: false, error: error.message };
    }

    revalidatePath('/admin/clients', 'layout');
    revalidatePath('/client/dashboard');

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// ─── Workouts ─────────────────────────────────────────────────────

export async function toggleWorkout(
  workoutId: string,
  completed: boolean
): Promise<ActionState> {
  if (!workoutId) return { ok: false, error: 'Missing workout id' };

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('client_workouts')
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq('id', workoutId);

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[PURE X] toggleWorkout failed:', error);
      return { ok: false, error: error.message };
    }

    revalidatePath('/admin/clients', 'layout');
    revalidatePath('/client/dashboard');
    revalidatePath('/client/plan');

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
