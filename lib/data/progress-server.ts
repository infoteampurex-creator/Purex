import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { computeHealthScore } from './twin';
import type {
  DailyScorePoint,
  ProgressData,
  StrengthPR,
  WeeklyAverages,
  WeightPoint,
} from './progress';

/**
 * Progress page — server-side aggregation queries.
 *
 * Pulls 30 / 60 / 90 day windows from client_daily_logs + workouts
 * + body measurements, computes derived metrics (Health Score trend,
 * consistency %, weight delta, etc.) and returns serializable shapes
 * the client-side page view renders into Whoop-style charts.
 *
 * One pass over each table — we don't issue per-day queries.
 *
 * Types (ProgressData, DailyScorePoint, WeightPoint, WeeklyAverages)
 * live in ./progress.ts so the client-side ProgressPageView can
 * import them without pulling in this file's `'server-only'` guard.
 */

/** Build an array of YYYY-MM-DD for the N days ending today (oldest first). */
function isoDaysBack(daysBack: number, endDateIso: string): string[] {
  const out: string[] = [];
  const [y, m, d] = endDateIso.split('-').map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  for (let i = daysBack - 1; i >= 0; i--) {
    const dt = new Date(base);
    dt.setUTCDate(dt.getUTCDate() - i);
    out.push(dt.toISOString().slice(0, 10));
  }
  return out;
}

function emptyWeeklyAverages(): WeeklyAverages {
  return {
    steps: 0,
    sleepMinutes: 0,
    waterMl: 0,
    workouts: 0,
    mealsLoggedDays: 0,
  };
}

/**
 * Fetch and assemble the full Progress payload for a client.
 *
 * Returns an empty-stub structure on any error so the page renders
 * a graceful "no data yet" state rather than 500ing.
 */
export async function getProgressData(
  clientId: string,
  endDateIso: string
): Promise<ProgressData> {
  try {
    const supabase = await createClient();

    const days30 = isoDaysBack(30, endDateIso);
    const days90 = isoDaysBack(90, endDateIso);
    const start30 = days30[0];
    const start90 = days90[0];

    // Fire all queries in parallel
    const [logsRes, weightsRes, workoutsRes, mealsRes] = await Promise.all([
      // 90 days of daily logs — covers all our windows
      supabase
        .from('client_daily_logs')
        .select(
          'log_date, steps, steps_target, sleep_hours, water_glasses, water_target, calories_consumed, calories_target, protein_g, weight_kg'
        )
        .eq('client_id', clientId)
        .gte('log_date', start90)
        .lte('log_date', endDateIso)
        .order('log_date', { ascending: true }),
      // Body measurements (separate table — has waist/chest/etc in
      // addition to weight; measured_at is DATE, not timestamptz)
      supabase
        .from('client_body_measurements')
        .select('measured_at, weight_kg')
        .eq('client_id', clientId)
        .gte('measured_at', start90)
        .lte('measured_at', endDateIso)
        .order('measured_at', { ascending: true }),
      // Workout completions
      supabase
        .from('client_workouts')
        .select('workout_date, completed')
        .eq('client_id', clientId)
        .eq('completed', true)
        .gte('workout_date', start90)
        .lte('workout_date', endDateIso),
      // Meals — used to count days logged
      supabase
        .from('client_meals')
        .select('log_date')
        .eq('client_id', clientId)
        .gte('log_date', start30)
        .lte('log_date', endDateIso),
    ]);

    type LogRow = {
      log_date: string;
      steps: number | null;
      steps_target: number | null;
      sleep_hours: number | null;
      water_glasses: number | null;
      water_target: number | null;
      calories_consumed: number | null;
      calories_target: number | null;
      protein_g: number | null;
      weight_kg: number | null;
    };

    type WeightRow = {
      measured_at: string;
      weight_kg: number | null;
    };

    type WorkoutRow = {
      workout_date: string;
      completed: boolean | null;
    };

    type MealRow = { log_date: string };

    const logs = (logsRes.data ?? []) as LogRow[];
    const weights = (weightsRes.data ?? []) as WeightRow[];
    const workouts = (workoutsRes.data ?? []) as WorkoutRow[];
    const meals = (mealsRes.data ?? []) as MealRow[];

    // ─── Build 30-day score trend ──────────────────────────────────
    const logsByDate = new Map<string, LogRow>();
    logs.forEach((l) => logsByDate.set(l.log_date, l));
    const workoutDates = new Set(
      workouts.map((w) => w.workout_date).filter(Boolean) as string[]
    );

    const scoreFor = (date: string): DailyScorePoint => {
      const log = logsByDate.get(date);
      if (!log) return { date, score: null, hit: false };
      const sleepMinutes = log.sleep_hours != null ? log.sleep_hours * 60 : null;
      const waterMl = log.water_glasses != null ? log.water_glasses * 250 : null;
      // Nutrition adherence: % of calorie target hit (capped at 100)
      const nutritionAdherencePct =
        log.calories_consumed != null && log.calories_target && log.calories_target > 0
          ? Math.min(100, (log.calories_consumed / log.calories_target) * 100)
          : 0;
      const hs = computeHealthScore({
        steps: log.steps,
        stepsGoal: log.steps_target ?? 10000,
        sleepMinutes,
        sleepGoalMinutes: 8 * 60,
        waterMl,
        waterGoalMl: 2000,
        workoutCompletedToday: workoutDates.has(date),
        nutritionAdherencePct,
      });
      return { date, score: hs.total, hit: hs.hitGoal };
    };

    const scoreTrend30 = days30.map(scoreFor);

    // ─── Consistency over 30 / 90 days ─────────────────────────────
    const hit30 = scoreTrend30.filter((d) => d.hit).length;
    const allDays90 = days90.map(scoreFor);
    const hit90 = allDays90.filter((d) => d.hit).length;

    // ─── Weight history — combine daily-log weight + measurements ──
    const weightMap = new Map<string, number>();
    logs.forEach((l) => {
      if (l.weight_kg != null) weightMap.set(l.log_date, l.weight_kg);
    });
    weights.forEach((w) => {
      if (w.weight_kg != null) {
        // measured_at is already YYYY-MM-DD (DATE column, not timestamp)
        // Measurements override daily-log self-report when both exist
        weightMap.set(w.measured_at, w.weight_kg);
      }
    });
    const weightHistory: WeightPoint[] = Array.from(weightMap.entries())
      .map(([date, weightKg]) => ({ date, weightKg }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ─── This week / last week averages ────────────────────────────
    const days7 = days30.slice(-7);                  // most recent 7
    const daysPrev7 = days30.slice(-14, -7);         // 7 before that

    const aggregateWindow = (window: string[]): WeeklyAverages => {
      const inWindow = (date: string) => window.includes(date);
      const stepsTotal = logs
        .filter((l) => inWindow(l.log_date))
        .reduce((sum, l) => sum + (l.steps ?? 0), 0);
      const sleepMinTotal = logs
        .filter((l) => inWindow(l.log_date))
        .reduce(
          (sum, l) => sum + (l.sleep_hours != null ? l.sleep_hours * 60 : 0),
          0
        );
      const waterMlTotal = logs
        .filter((l) => inWindow(l.log_date))
        .reduce(
          (sum, l) => sum + (l.water_glasses != null ? l.water_glasses * 250 : 0),
          0
        );
      const workoutsTotal = workouts.filter((w) =>
        inWindow(w.workout_date)
      ).length;
      const mealDays = new Set(
        meals.filter((m) => inWindow(m.log_date)).map((m) => m.log_date)
      ).size;
      const n = Math.max(1, window.length);
      return {
        steps: Math.round(stepsTotal / n),
        sleepMinutes: Math.round(sleepMinTotal / n),
        waterMl: Math.round(waterMlTotal / n),
        workouts: workoutsTotal,
        mealsLoggedDays: mealDays,
      };
    };

    const thisWeek = aggregateWindow(days7);
    const lastWeek = aggregateWindow(daysPrev7);

    const isEmpty =
      logs.length === 0 && weights.length === 0 && workouts.length === 0;

    return {
      scoreTrend30,
      consistency30: { hit: hit30, total: days30.length },
      consistency90: { hit: hit90, total: days90.length },
      weightHistory,
      thisWeek,
      lastWeek,
      isEmpty,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[progress-server] getProgressData failed', err);
    return {
      scoreTrend30: isoDaysBack(30, endDateIso).map((date) => ({
        date,
        score: null,
        hit: false,
      })),
      consistency30: { hit: 0, total: 30 },
      consistency90: { hit: 0, total: 90 },
      weightHistory: [],
      thisWeek: emptyWeeklyAverages(),
      lastWeek: emptyWeeklyAverages(),
      isEmpty: true,
    };
  }
}

// Derived helpers (transformationScore, weightDelta) moved to
// ./progress.ts so client components can import them. Re-export
// here for backward-compat with any caller that still imports
// from the server file.
export {
  transformationScore,
  weightDelta,
} from './progress';

// ─── Strength PRs ─────────────────────────────────────────────────

/**
 * Top-N strength PRs for a client. Joins client_workout_exercise_logs
 * (the actuals) with client_workout_exercises (the planned rows) so
 * we can resolve exercise_name + target_muscle.
 *
 * For each (client, exercise_name), picks the heaviest single set ever
 * — looking at BOTH the flat actual_weight_kg column AND the highest
 * weight inside the set_breakdown jsonb if present. Returns the top
 * `limit` exercises sorted by best weight desc.
 *
 * Returns [] if the user has zero logged actuals (new account) or
 * the query errors.
 */
export async function getStrengthPRs(
  clientId: string,
  limit = 8
): Promise<StrengthPR[]> {
  try {
    const supabase = await createClient();

    // One pass: pull every actual log + the planned exercise it ties to
    const { data, error } = await supabase
      .from('client_workout_exercise_logs')
      .select(
        `actual_weight_kg, actual_reps, set_breakdown, completed_at,
         client_workout_exercises ( exercise_name, target_muscle )`
      )
      .eq('client_id', clientId)
      .order('completed_at', { ascending: false });

    if (error || !data) {
      // eslint-disable-next-line no-console
      console.error('[progress-server] getStrengthPRs failed', error);
      return [];
    }

    type Row = {
      actual_weight_kg: number | null;
      actual_reps: string | null;
      set_breakdown: Array<{
        reps?: string | null;
        weight_kg?: number | null;
        rpe?: number | null;
      }> | null;
      completed_at: string | null;
      client_workout_exercises:
        | {
            exercise_name: string | null;
            target_muscle: string | null;
          }
        | Array<{
            exercise_name: string | null;
            target_muscle: string | null;
          }>
        | null;
    };

    const aggregates = new Map<
      string,
      {
        exerciseName: string;
        targetMuscle: string | null;
        bestWeight: number;
        bestReps: string | null;
        achievedAt: string;
        attempts: number;
      }
    >();

    for (const row of data as Row[]) {
      // Supabase returns the joined row as either an object or array
      // depending on the FK resolution; normalise.
      const planned = Array.isArray(row.client_workout_exercises)
        ? row.client_workout_exercises[0]
        : row.client_workout_exercises;
      const exerciseName = planned?.exercise_name?.trim();
      if (!exerciseName) continue;

      const flat = row.actual_weight_kg ?? 0;
      let bestInBreakdown = 0;
      let bestRepsInBreakdown: string | null = null;
      if (Array.isArray(row.set_breakdown)) {
        for (const s of row.set_breakdown) {
          const w = s?.weight_kg ?? 0;
          if (w > bestInBreakdown) {
            bestInBreakdown = w;
            bestRepsInBreakdown = s?.reps ?? null;
          }
        }
      }
      const bestThisAttempt = Math.max(flat, bestInBreakdown);
      if (bestThisAttempt <= 0) continue;
      const repsThisAttempt =
        bestInBreakdown >= flat
          ? bestRepsInBreakdown ?? row.actual_reps
          : row.actual_reps;

      const key = exerciseName.toLowerCase();
      const existing = aggregates.get(key);
      if (!existing) {
        aggregates.set(key, {
          exerciseName,
          targetMuscle: planned?.target_muscle ?? null,
          bestWeight: bestThisAttempt,
          bestReps: repsThisAttempt,
          achievedAt: row.completed_at ?? '',
          attempts: 1,
        });
      } else {
        existing.attempts++;
        if (bestThisAttempt > existing.bestWeight) {
          existing.bestWeight = bestThisAttempt;
          existing.bestReps = repsThisAttempt;
          existing.achievedAt = row.completed_at ?? existing.achievedAt;
        }
      }
    }

    return Array.from(aggregates.values())
      .sort((a, b) => b.bestWeight - a.bestWeight)
      .slice(0, limit)
      .map((p) => ({
        exerciseName: p.exerciseName,
        targetMuscle: p.targetMuscle,
        bestWeightKg: Math.round(p.bestWeight * 10) / 10,
        bestReps: p.bestReps,
        achievedAt: p.achievedAt,
        attemptsLogged: p.attempts,
      }));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[progress-server] getStrengthPRs threw', err);
    return [];
  }
}
