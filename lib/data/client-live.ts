import 'server-only';
import { createClient } from '@/lib/supabase/server';
import {
  getMockClientTasks,
  getMockClientRecentLogs,
  getMockClientWorkouts,
  type AdminClientTask,
  type AdminClientDailyLog,
  type AdminClientWorkout,
} from '@/lib/data/admin-mock';

/**
 * Strategy for admin client detail + client dashboard:
 *
 * - Try Supabase
 * - If there are real rows for this client → return them
 * - If the client has NO real rows → fall back to mock data (so
 *   dashboards look populated during development and demos)
 * - If the query errors → fall back to mock with a warning
 *
 * This mirrors the bookings pattern from lib/data/admin-bookings.ts
 */

export type LiveSource = 'supabase' | 'mock' | 'error-fallback';

export interface LiveResult<T> {
  rows: T[];
  source: LiveSource;
  error?: string;
}

// ─── Tasks ─────────────────────────────────────────────────────────

export async function getClientTasksLive(
  clientId: string,
  taskDate?: string
): Promise<LiveResult<AdminClientTask>> {
  const date = taskDate ?? new Date().toISOString().slice(0, 10);

  try {
    const supabase = await createClient();

    const { data: rows, error } = await supabase
      .from('client_tasks')
      .select('id, title, category, scheduled_time, completed, completed_at, task_date')
      .eq('client_id', clientId)
      .eq('task_date', date)
      .order('scheduled_time', { ascending: true, nullsFirst: false });

    if (error) {
      return {
        rows: getMockClientTasks(clientId),
        source: 'error-fallback',
        error: error.message,
      };
    }

    if (!rows || rows.length === 0) {
      return { rows: getMockClientTasks(clientId), source: 'mock' };
    }

    return {
      rows: rows.map(
        (r): AdminClientTask => ({
          id: r.id,
          title: r.title,
          category:
            (r.category as AdminClientTask['category']) ?? 'lifestyle',
          scheduledTime: r.scheduled_time ?? undefined,
          completed: Boolean(r.completed),
          completedAt: r.completed_at ?? undefined,
          taskDate: r.task_date,
        })
      ),
      source: 'supabase',
    };
  } catch (err) {
    return {
      rows: getMockClientTasks(clientId),
      source: 'error-fallback',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// ─── Daily logs ────────────────────────────────────────────────────

export async function getClientLogsLive(
  clientId: string,
  limit = 7
): Promise<LiveResult<AdminClientDailyLog>> {
  try {
    const supabase = await createClient();

    const { data: rows, error } = await supabase
      .from('client_daily_logs')
      .select(
        `id, log_date, weight_kg, calories_consumed, calories_target,
         protein_g, carbs_g, fats_g, water_glasses, water_target,
         steps, steps_target, sleep_hours, sleep_quality_1_5,
         mood_1_5, recovery_score, daily_note`
      )
      .eq('client_id', clientId)
      .order('log_date', { ascending: false })
      .limit(limit);

    if (error) {
      return {
        rows: getMockClientRecentLogs(clientId),
        source: 'error-fallback',
        error: error.message,
      };
    }

    if (!rows || rows.length === 0) {
      return { rows: getMockClientRecentLogs(clientId), source: 'mock' };
    }

    return {
      rows: rows.map(
        (r): AdminClientDailyLog => ({
          id: r.id,
          logDate: r.log_date,
          weightKg: r.weight_kg ?? undefined,
          caloriesConsumed: r.calories_consumed ?? undefined,
          caloriesTarget: r.calories_target ?? undefined,
          proteinG: r.protein_g ?? undefined,
          carbsG: r.carbs_g ?? undefined,
          fatsG: r.fats_g ?? undefined,
          waterGlasses: r.water_glasses ?? undefined,
          waterTarget: r.water_target ?? 8,
          steps: r.steps ?? undefined,
          stepsTarget: r.steps_target ?? 10000,
          sleepHours: r.sleep_hours ?? undefined,
          sleepQuality: r.sleep_quality_1_5 ?? undefined,
          mood: r.mood_1_5 ?? undefined,
          recoveryScore: r.recovery_score ?? undefined,
          dailyNote: r.daily_note ?? undefined,
        })
      ),
      source: 'supabase',
    };
  } catch (err) {
    return {
      rows: getMockClientRecentLogs(clientId),
      source: 'error-fallback',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// ─── Workouts ─────────────────────────────────────────────────────

export async function getClientWorkoutsLive(
  clientId: string
): Promise<LiveResult<AdminClientWorkout>> {
  try {
    const supabase = await createClient();

    const { data: rows, error } = await supabase
      .from('client_workouts')
      .select(
        `id, name, category, workout_date, duration_minutes, calories,
         difficulty, focus, completed`
      )
      .eq('client_id', clientId)
      .order('workout_date', { ascending: false, nullsFirst: false })
      .limit(20);

    if (error) {
      return {
        rows: getMockClientWorkouts(clientId),
        source: 'error-fallback',
        error: error.message,
      };
    }

    if (!rows || rows.length === 0) {
      return { rows: getMockClientWorkouts(clientId), source: 'mock' };
    }

    return {
      rows: rows.map(
        (r): AdminClientWorkout => ({
          id: r.id,
          name: r.name,
          category: r.category ?? 'General',
          workoutDate: r.workout_date ?? undefined,
          durationMinutes: r.duration_minutes ?? undefined,
          calories: r.calories ?? undefined,
          difficulty:
            (r.difficulty as AdminClientWorkout['difficulty']) ?? undefined,
          focus: r.focus ?? undefined,
          completed: Boolean(r.completed),
        })
      ),
      source: 'supabase',
    };
  } catch (err) {
    return {
      rows: getMockClientWorkouts(clientId),
      source: 'error-fallback',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// ─── Current user helper (for client-facing pages) ────────────────

/**
 * Get the currently authenticated user's client_id (i.e. their own profile id).
 * Returns null if not logged in. Use this on the client dashboard so clients
 * see their OWN data without needing to pass an id.
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}
