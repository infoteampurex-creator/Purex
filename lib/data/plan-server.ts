import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { PlanData, PlanWorkout, WorkoutCategoryKey } from './plan';
import { normaliseCategory } from './plan';

/**
 * Plan page — server-side queries.
 *
 * Pulls the user's assigned workouts over a window covering the
 * past 28 days (for history grid + stats) AND the next 6 days
 * (for the upcoming week strip). Single query — joined client-side.
 */
export async function getPlanData(
  clientId: string,
  todayIso: string
): Promise<PlanData> {
  try {
    const supabase = await createClient();

    const past = isoOffsetDay(todayIso, -27);
    const future = isoOffsetDay(todayIso, 6);

    const { data: rows, error } = await supabase
      .from('client_workouts')
      .select(
        'id, workout_date, name, category, duration_minutes, calories, difficulty, focus, completed, completed_at'
      )
      .eq('client_id', clientId)
      .gte('workout_date', past)
      .lte('workout_date', future)
      .order('workout_date', { ascending: true });

    if (error || !rows) {
      // eslint-disable-next-line no-console
      console.error('[plan-server] getPlanData query failed', error);
      return emptyPlanData(todayIso);
    }

    type Row = {
      id: string;
      workout_date: string | null;
      name: string;
      category: string | null;
      duration_minutes: number | null;
      calories: number | null;
      difficulty: string | null;
      focus: string | null;
      completed: boolean | null;
      completed_at: string | null;
    };

    const workouts: PlanWorkout[] = (rows as Row[])
      .filter((r) => r.workout_date) // unscheduled drafts dropped
      .map((r) => ({
        id: r.id,
        date: r.workout_date as string,
        name: r.name,
        category: normaliseCategory(r.category),
        durationMinutes: r.duration_minutes ?? null,
        focus: r.focus ?? null,
        difficulty: r.difficulty ?? null,
        completed: !!r.completed,
        completedAt: r.completed_at,
      }));

    // ─── Stats: window = last 30 days (today + 29 days back) ──────
    const days30 = Array.from({ length: 30 }, (_, i) =>
      isoOffsetDay(todayIso, -i)
    );
    const workouts30 = workouts.filter((w) => days30.includes(w.date));
    const completed30 = workouts30.filter((w) => w.completed);

    const byCategory: Record<WorkoutCategoryKey, number> = {
      strength: 0,
      cardio: 0,
      hybrid: 0,
      mobility: 0,
      rest: 0,
      other: 0,
    };
    completed30.forEach((w) => {
      byCategory[w.category]++;
    });

    // ─── Streak: consecutive trailing days with a completed workout ──
    let streak = 0;
    for (const day of days30) {
      const dayCompleted = workouts30.some((w) => w.date === day && w.completed);
      if (dayCompleted) streak++;
      else break;
    }

    // ─── This week ring: days monday→sunday with assigned workouts ──
    const weekDays = sevenDayWeek(todayIso);
    const weekAssigned = workouts.filter((w) => weekDays.includes(w.date));
    const weekCompleted = weekAssigned.filter((w) => w.completed);

    return {
      todayIso,
      weekDays,
      workoutsByDate: groupWorkoutsByDate(workouts),
      thirtyDayCompleted: completed30.length,
      thirtyDayAssigned: workouts30.length,
      byCategory,
      streakDays: streak,
      thisWeekAssigned: weekAssigned.length,
      thisWeekCompleted: weekCompleted.length,
      hasAnyData: workouts.length > 0,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[plan-server] getPlanData threw', err);
    return emptyPlanData(todayIso);
  }
}

// ─── Helpers ────────────────────────────────────────────────────

function isoOffsetDay(iso: string, offset: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + offset);
  return dt.toISOString().slice(0, 10);
}

/**
 * Return the 7 dates of the current week (Mon → Sun) containing `iso`.
 * Week starts Monday — most consistent for an Indian + global audience
 * where Sunday-start US-style felt off.
 */
function sevenDayWeek(iso: string): string[] {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = (dt.getUTCDay() + 6) % 7; // 0=Mon ... 6=Sun
  const monday = new Date(dt);
  monday.setUTCDate(dt.getUTCDate() - dow);
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setUTCDate(monday.getUTCDate() + i);
    out.push(day.toISOString().slice(0, 10));
  }
  return out;
}

function groupWorkoutsByDate(
  workouts: PlanWorkout[]
): Record<string, PlanWorkout[]> {
  const out: Record<string, PlanWorkout[]> = {};
  for (const w of workouts) {
    if (!out[w.date]) out[w.date] = [];
    out[w.date].push(w);
  }
  return out;
}

function emptyPlanData(todayIso: string): PlanData {
  const weekDays = sevenDayWeek(todayIso);
  return {
    todayIso,
    weekDays,
    workoutsByDate: {},
    thirtyDayCompleted: 0,
    thirtyDayAssigned: 0,
    byCategory: {
      strength: 0,
      cardio: 0,
      hybrid: 0,
      mobility: 0,
      rest: 0,
      other: 0,
    },
    streakDays: 0,
    thisWeekAssigned: 0,
    thisWeekCompleted: 0,
    hasAnyData: false,
  };
}
