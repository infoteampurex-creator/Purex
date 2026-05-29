import 'server-only';
import { createClient } from '@/lib/supabase/server';

/**
 * Lightweight read of the coach-side plan "freshness" — when did the
 * coach last touch the weekly schedule, the diet plan, or materialize
 * a workout for the next 7 days. Used by the client dashboard to
 * surface "Coach updated your plan Xh ago" so the user has a visible
 * signal that something changed (instead of staring at a stale screen
 * and assuming nothing happened).
 *
 * Returns nullable timestamps + a quick count of upcoming materialized
 * workouts. Cheap query — three small selects with single-row results
 * (or short ranges).
 */
export interface CoachPlanFreshness {
  /** ISO timestamp of last edit to client_weekly_plan, or null. */
  scheduleUpdatedAt: string | null;
  /** ISO timestamp of last edit to client_meal_plan, or null. */
  dietUpdatedAt: string | null;
  /** Number of client_workouts rows for [today, today + 6d]. */
  upcomingWorkouts: number;
  /** Date string of the next scheduled workout (YYYY-MM-DD) or null. */
  nextWorkoutDate: string | null;
}

export async function getCoachPlanFreshness(
  clientId: string
): Promise<CoachPlanFreshness> {
  const empty: CoachPlanFreshness = {
    scheduleUpdatedAt: null,
    dietUpdatedAt: null,
    upcomingWorkouts: 0,
    nextWorkoutDate: null,
  };

  try {
    const supabase = await createClient();

    const today = new Date().toISOString().slice(0, 10);
    const in7 = new Date();
    in7.setDate(in7.getDate() + 6);
    const upper = in7.toISOString().slice(0, 10);

    const [schedRes, dietRes, workoutsRes] = await Promise.all([
      supabase
        .from('client_weekly_plan')
        .select('updated_at')
        .eq('client_id', clientId)
        .maybeSingle(),
      supabase
        .from('client_meal_plan')
        .select('updated_at')
        .eq('client_id', clientId)
        .maybeSingle(),
      supabase
        .from('client_workouts')
        .select('workout_date')
        .eq('client_id', clientId)
        .gte('workout_date', today)
        .lte('workout_date', upper)
        .order('workout_date', { ascending: true }),
    ]);

    const workoutRows = (workoutsRes.data ?? []) as Array<{
      workout_date: string;
    }>;

    return {
      scheduleUpdatedAt: schedRes.data?.updated_at ?? null,
      dietUpdatedAt: dietRes.data?.updated_at ?? null,
      upcomingWorkouts: workoutRows.length,
      nextWorkoutDate: workoutRows[0]?.workout_date ?? null,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[plan-updates-server] getCoachPlanFreshness threw', err);
    return empty;
  }
}
