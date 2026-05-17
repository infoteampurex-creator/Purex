import 'server-only';
import { createClient } from '@/lib/supabase/server';
import {
  computeHealthScore,
  type DailyInputs,
  type DayScoreEntry,
} from '@/lib/data/twin';

/**
 * Phase 4 — server-only data layer for the Twin.
 *
 * Pulls live data from Supabase and shapes it into the structures
 * the Twin / Future Clone / HealthyStreakCard expect. NO new tables
 * needed at this phase — we derive everything from:
 *
 *   - client_daily_logs (steps, sleep, water, calories, protein)
 *   - client_workouts   (completed + workout_date)
 *
 * When a client has no log for a given day, fields are returned as
 * null and the score formula treats that component as 0. The Twin
 * gracefully renders the "depleted" or "recovering" state in that
 * case rather than crashing.
 */

// ─── Type shapes from Supabase ────────────────────────────────────

interface DailyLogRow {
  log_date: string;
  steps: number | null;
  steps_target: number | null;
  sleep_hours: number | null;
  sleep_target_hours: number | null;
  water_glasses: number | null;
  water_target: number | null;
  calories_consumed: number | null;
  calories_target: number | null;
  protein_g: number | null;
  protein_target_g: number | null;
}

interface WorkoutRow {
  workout_date: string | null;
  completed: boolean | null;
}

// ─── Shape helpers ────────────────────────────────────────────────

const DEFAULT_STEPS_GOAL = 10000;
const DEFAULT_SLEEP_HOURS = 8;
const DEFAULT_WATER_GLASSES = 8;
const ML_PER_GLASS = 250; // standard 250 ml glass

function logToInputs(
  log: DailyLogRow | null,
  workoutToday: boolean,
  workoutsLast7: number,
  currentStreak: number,
  bestStreak: number
): DailyInputs {
  return {
    steps: log?.steps ?? 0,
    stepsGoal: log?.steps_target ?? DEFAULT_STEPS_GOAL,
    sleepMinutes:
      log?.sleep_hours != null ? Math.round(log.sleep_hours * 60) : 0,
    sleepGoalMinutes:
      (log?.sleep_target_hours ?? DEFAULT_SLEEP_HOURS) * 60,
    waterMl: log?.water_glasses != null ? log.water_glasses * ML_PER_GLASS : 0,
    waterGoalMl:
      (log?.water_target ?? DEFAULT_WATER_GLASSES) * ML_PER_GLASS,
    workoutCompletedToday: workoutToday,
    workoutsLast7,
    nutritionAdherencePct: deriveNutritionPct(log),
    currentStreak,
    bestStreak,
  };
}

/**
 * Score nutrition compliance from the day's logged macros. Two
 * components averaged:
 *   - Calories: within ±15% of target → 100, ±30% → 50, beyond → 0
 *   - Protein:  hit target → 100, scales linearly down to 0 at 0 g
 *
 * Either component missing → 0. If both are missing we return 0
 * (the streak rewards LOGGING — silence is treated as a miss).
 */
function deriveNutritionPct(log: DailyLogRow | null): number {
  if (!log) return 0;
  const hasCalories = log.calories_consumed != null && log.calories_target;
  const hasProtein = log.protein_g != null && log.protein_target_g;
  if (!hasCalories && !hasProtein) return 0;

  let caloriesPct = 0;
  if (hasCalories) {
    const ratio =
      Math.abs(log.calories_consumed! - log.calories_target!) /
      log.calories_target!;
    if (ratio <= 0.15) caloriesPct = 100;
    else if (ratio <= 0.3) caloriesPct = 50;
    else caloriesPct = 0;
  }

  let proteinPct = 0;
  if (hasProtein) {
    proteinPct = Math.max(
      0,
      Math.min(100, (log.protein_g! / log.protein_target_g!) * 100)
    );
  }

  if (hasCalories && hasProtein) return Math.round((caloriesPct + proteinPct) / 2);
  return Math.round(hasCalories ? caloriesPct : proteinPct);
}

// ─── Date helpers (Asia/Kolkata for cohort alignment) ─────────────

function todayIsoIST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ─── Main fetchers ────────────────────────────────────────────────

const LOG_COLS =
  'log_date, steps, steps_target, sleep_hours, sleep_target_hours, ' +
  'water_glasses, water_target, calories_consumed, calories_target, ' +
  'protein_g, protein_target_g';

/**
 * Returns the DailyInputs structure for the Twin and Future Clone,
 * for the given client and date. Falls back to a deterministic
 * empty-state when the client has no logged data — so the Twin
 * always renders, just in 'depleted' or 'recovering' state.
 */
export async function getTwinDailyInputs(
  clientId: string,
  date?: string
): Promise<{ inputs: DailyInputs; source: 'supabase' | 'empty' }> {
  const targetDate = date ?? todayIsoIST();
  const sevenDaysAgo = addDaysIso(targetDate, -6);
  const ninetyDaysAgo = addDaysIso(targetDate, -89);

  try {
    const supabase = await createClient();

    // Today's log + last 7 days of logs (for streak + workouts) +
    // 90 days for best streak — all in parallel.
    const [todayRes, last7LogsRes, last90LogsRes, workoutsRes] =
      await Promise.all([
        supabase
          .from('client_daily_logs')
          .select(LOG_COLS)
          .eq('client_id', clientId)
          .eq('log_date', targetDate)
          .maybeSingle(),
        supabase
          .from('client_daily_logs')
          .select(LOG_COLS)
          .eq('client_id', clientId)
          .gte('log_date', sevenDaysAgo)
          .lte('log_date', targetDate)
          .order('log_date', { ascending: false }),
        supabase
          .from('client_daily_logs')
          .select(LOG_COLS)
          .eq('client_id', clientId)
          .gte('log_date', ninetyDaysAgo)
          .lte('log_date', targetDate)
          .order('log_date', { ascending: false }),
        supabase
          .from('client_workouts')
          .select('workout_date, completed')
          .eq('client_id', clientId)
          .eq('completed', true)
          .gte('workout_date', sevenDaysAgo)
          .lte('workout_date', targetDate),
      ]);

    const todayLog =
      (todayRes.data ?? null) as unknown as DailyLogRow | null;
    const last7Logs =
      (last7LogsRes.data ?? []) as unknown as DailyLogRow[];
    const last90Logs =
      (last90LogsRes.data ?? []) as unknown as DailyLogRow[];
    const workouts = (workoutsRes.data ?? []) as unknown as WorkoutRow[];

    const workoutDates = new Set(
      workouts.map((w) => w.workout_date).filter(Boolean) as string[]
    );

    const workoutToday = workoutDates.has(targetDate);
    const workoutsLast7 = workoutDates.size;

    // Streak computation walks back from today. Build a quick lookup
    // of last 90 days for the streak scoring.
    const logByDate = new Map(last90Logs.map((l) => [l.log_date, l]));
    const fullHistory: DayScoreEntry[] = [];
    for (let i = 0; i < 90; i++) {
      const iso = addDaysIso(targetDate, -i);
      const log = logByDate.get(iso) ?? null;
      const score = computeHealthScore({
        steps: log?.steps,
        stepsGoal: log?.steps_target ?? DEFAULT_STEPS_GOAL,
        sleepMinutes:
          log?.sleep_hours != null ? Math.round(log.sleep_hours * 60) : null,
        sleepGoalMinutes:
          (log?.sleep_target_hours ?? DEFAULT_SLEEP_HOURS) * 60,
        waterMl:
          log?.water_glasses != null ? log.water_glasses * ML_PER_GLASS : null,
        waterGoalMl:
          (log?.water_target ?? DEFAULT_WATER_GLASSES) * ML_PER_GLASS,
        workoutCompletedToday: workoutDates.has(iso),
        nutritionAdherencePct: log ? deriveNutritionPct(log) : null,
      });
      fullHistory.push({
        date: iso,
        score: score.total,
        hitGoal: score.hitGoal,
        hasData: log != null,
      });
    }

    // current streak walks forward from today; best streak across
    // the 90-day window.
    let currentStreak = 0;
    for (const entry of fullHistory) {
      if (!entry.hasData || !entry.hitGoal) break;
      currentStreak++;
    }
    let bestStreak = 0;
    let runningBest = 0;
    for (const entry of fullHistory) {
      if (entry.hasData && entry.hitGoal) {
        runningBest++;
        if (runningBest > bestStreak) bestStreak = runningBest;
      } else {
        runningBest = 0;
      }
    }

    const inputs = logToInputs(
      todayLog,
      workoutToday,
      workoutsLast7,
      currentStreak,
      bestStreak
    );

    const hasAnyData = todayLog != null || last7Logs.length > 0;
    return { inputs, source: hasAnyData ? 'supabase' : 'empty' };
  } catch (err) {
    console.error('[twin-server] getTwinDailyInputs failed', err);
    // On error, return an empty-state inputs so the Twin still renders.
    return {
      inputs: emptyInputs(),
      source: 'empty',
    };
  }
}

/**
 * Returns the last N days of scored entries — used by the streak
 * calendar card. Each entry has the date, total score, hitGoal flag,
 * and a hasData flag so cells without a log render greyed-out.
 */
export async function getStreakHistory(
  clientId: string,
  days = 7
): Promise<DayScoreEntry[]> {
  const targetDate = todayIsoIST();
  const firstDate = addDaysIso(targetDate, -(days - 1));

  try {
    const supabase = await createClient();
    const [logsRes, workoutsRes] = await Promise.all([
      supabase
        .from('client_daily_logs')
        .select(LOG_COLS)
        .eq('client_id', clientId)
        .gte('log_date', firstDate)
        .lte('log_date', targetDate)
        .order('log_date', { ascending: false }),
      supabase
        .from('client_workouts')
        .select('workout_date, completed')
        .eq('client_id', clientId)
        .eq('completed', true)
        .gte('workout_date', firstDate)
        .lte('workout_date', targetDate),
    ]);

    const logs = (logsRes.data ?? []) as unknown as DailyLogRow[];
    const workouts = (workoutsRes.data ?? []) as unknown as WorkoutRow[];
    const workoutDates = new Set(
      workouts.map((w) => w.workout_date).filter(Boolean) as string[]
    );
    const logByDate = new Map(logs.map((l) => [l.log_date, l]));

    const history: DayScoreEntry[] = [];
    for (let i = 0; i < days; i++) {
      const iso = addDaysIso(targetDate, -i);
      const log = logByDate.get(iso) ?? null;
      const score = computeHealthScore({
        steps: log?.steps,
        stepsGoal: log?.steps_target ?? DEFAULT_STEPS_GOAL,
        sleepMinutes:
          log?.sleep_hours != null ? Math.round(log.sleep_hours * 60) : null,
        sleepGoalMinutes:
          (log?.sleep_target_hours ?? DEFAULT_SLEEP_HOURS) * 60,
        waterMl:
          log?.water_glasses != null ? log.water_glasses * ML_PER_GLASS : null,
        waterGoalMl:
          (log?.water_target ?? DEFAULT_WATER_GLASSES) * ML_PER_GLASS,
        workoutCompletedToday: workoutDates.has(iso),
        nutritionAdherencePct: log ? deriveNutritionPct(log) : null,
      });
      history.push({
        date: iso,
        score: score.total,
        hitGoal: score.hitGoal,
        hasData: log != null,
      });
    }
    return history;
  } catch (err) {
    console.error('[twin-server] getStreakHistory failed', err);
    return [];
  }
}

function emptyInputs(): DailyInputs {
  return {
    steps: 0,
    stepsGoal: DEFAULT_STEPS_GOAL,
    sleepMinutes: 0,
    sleepGoalMinutes: DEFAULT_SLEEP_HOURS * 60,
    waterMl: 0,
    waterGoalMl: DEFAULT_WATER_GLASSES * ML_PER_GLASS,
    workoutCompletedToday: false,
    workoutsLast7: 0,
    nutritionAdherencePct: 0,
    currentStreak: 0,
    bestStreak: 0,
  };
}
