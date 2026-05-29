import 'server-only';
import { createClient } from '@/lib/supabase/server';

/**
 * Read the upcoming materialized client_workouts for a client, with
 * exercise counts. Used by the admin diagnostic panel — gives the
 * coach a live, ground-truth view of what the client sees, so save +
 * materialization can be verified at a glance.
 */
export interface UpcomingWorkoutRow {
  workoutDate: string;
  name: string | null;
  exerciseCount: number;
}

export async function getUpcomingMaterializedWorkouts(
  clientId: string,
  days: number = 14
): Promise<UpcomingWorkoutRow[]> {
  try {
    const supabase = await createClient();
    const today = new Date().toISOString().slice(0, 10);
    const upper = new Date();
    upper.setDate(upper.getDate() + days - 1);
    const upperIso = upper.toISOString().slice(0, 10);

    const { data: workoutRows, error } = await supabase
      .from('client_workouts')
      .select('id, workout_date, name')
      .eq('client_id', clientId)
      .gte('workout_date', today)
      .lte('workout_date', upperIso)
      .order('workout_date', { ascending: true });

    if (error || !workoutRows) return [];

    const workoutIds = workoutRows.map((w) => w.id);
    let countsByWorkout = new Map<string, number>();
    if (workoutIds.length > 0) {
      const { data: exRows } = await supabase
        .from('client_workout_exercises')
        .select('workout_id')
        .in('workout_id', workoutIds);
      for (const r of (exRows ?? []) as Array<{ workout_id: string }>) {
        countsByWorkout.set(
          r.workout_id,
          (countsByWorkout.get(r.workout_id) ?? 0) + 1
        );
      }
    }

    return workoutRows.map((w) => ({
      workoutDate: w.workout_date as string,
      name: w.name as string | null,
      exerciseCount: countsByWorkout.get(w.id as string) ?? 0,
    }));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[materialized-workouts-server] read failed', err);
    return [];
  }
}
