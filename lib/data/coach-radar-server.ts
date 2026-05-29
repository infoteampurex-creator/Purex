import 'server-only';
import { createClient } from '@/lib/supabase/server';
import {
  FLAG_META,
  type AttentionFlag,
  type RadarClient,
  type RadarPayload,
} from './coach-radar';

/**
 * Coach Radar — server-side aggregation.
 *
 * For each client visible to the current admin/coach, compute a set
 * of attention markers (last log gap, last workout gap, low score,
 * recent report upload, missing mood). Score each marker 0-3 by
 * severity and sum into an "attention score" — higher = needs more
 * coach attention.
 *
 * One query per source table — no per-client N+1.
 *
 * Types (AttentionFlag, RadarClient, RadarPayload) + display metadata
 * (FLAG_META) live in ./coach-radar.ts so the client component can
 * import without pulling in 'server-only'.
 */

// Re-export for backward compat with any caller that still imports
// from this server file.
export {
  FLAG_META,
  type AttentionFlag,
  type RadarClient,
  type RadarPayload,
} from './coach-radar';

/**
 * Get the coach radar payload for the current admin/coach.
 *
 * RLS on the underlying tables means non-admins will get back
 * an empty list — we don't gate here, the caller is responsible
 * for redirecting non-admins away from the page.
 */
export async function getCoachRadar(todayIso: string): Promise<RadarPayload> {
  const supabase = await createClient();

  // ─── Fetch all clients visible to this coach (RLS-gated) ───────
  const { data: profileRows, error: profileErr } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url')
    .eq('role', 'user')
    .order('full_name', { ascending: true });

  if (profileErr || !profileRows || profileRows.length === 0) {
    return {
      todayIso,
      clients: [],
      totals: { total: 0, needsAttention: 0, quiet: 0 },
    };
  }

  const clientIds = profileRows.map((p) => p.id);
  const sevenDaysAgo = offsetDay(todayIso, -7);
  const thirtyDaysAgo = offsetDay(todayIso, -30);

  // ─── Single-query fetches, partitioned in JS by client_id ──────
  const [logsRes, workoutsRes, reportsRes, mealsTodayRes] = await Promise.all([
    supabase
      .from('client_daily_logs')
      .select(
        'client_id, log_date, steps, steps_target, sleep_hours, water_glasses, water_target, calories_consumed, calories_target, mood_state'
      )
      .in('client_id', clientIds)
      .gte('log_date', thirtyDaysAgo)
      .lte('log_date', todayIso),
    supabase
      .from('client_workouts')
      .select('client_id, workout_date, completed')
      .in('client_id', clientIds)
      .eq('completed', true)
      .gte('workout_date', thirtyDaysAgo)
      .lte('workout_date', todayIso),
    supabase
      .from('client_health_reports')
      .select('client_id, coach_review_note, uploaded_at')
      .in('client_id', clientIds),
    supabase
      .from('client_meals')
      .select('client_id, log_date')
      .in('client_id', clientIds)
      .eq('log_date', todayIso),
  ]);

  type LogRow = {
    client_id: string;
    log_date: string;
    steps: number | null;
    steps_target: number | null;
    sleep_hours: number | null;
    water_glasses: number | null;
    water_target: number | null;
    calories_consumed: number | null;
    calories_target: number | null;
    mood_state: string | null;
  };

  type WorkoutRow = {
    client_id: string;
    workout_date: string;
    completed: boolean | null;
  };

  type ReportRow = {
    client_id: string;
    coach_review_note: string | null;
    uploaded_at: string | null;
  };

  type MealRow = { client_id: string; log_date: string };

  const logs = (logsRes.data ?? []) as LogRow[];
  const workouts = (workoutsRes.data ?? []) as WorkoutRow[];
  const reports = (reportsRes.data ?? []) as ReportRow[];
  const mealsToday = (mealsTodayRes.data ?? []) as MealRow[];

  // Group into per-client buckets
  const logsByClient = groupBy(logs, (r) => r.client_id);
  const workoutsByClient = groupBy(workouts, (r) => r.client_id);
  const reportsByClient = groupBy(reports, (r) => r.client_id);
  const mealsTodayByClient = groupBy(mealsToday, (r) => r.client_id);

  // ─── Build per-client radar entries ────────────────────────────
  const clients: RadarClient[] = profileRows.map((p) => {
    const clientLogs = logsByClient.get(p.id) ?? [];
    const clientWorkouts = workoutsByClient.get(p.id) ?? [];
    const clientReports = reportsByClient.get(p.id) ?? [];
    const clientMealsToday = mealsTodayByClient.get(p.id) ?? [];

    // Sort logs newest-first
    clientLogs.sort((a, b) => b.log_date.localeCompare(a.log_date));
    clientWorkouts.sort((a, b) => b.workout_date.localeCompare(a.workout_date));

    const lastLogDate = clientLogs[0]?.log_date ?? null;
    const lastWorkoutDate = clientWorkouts[0]?.workout_date ?? null;
    const daysSinceLastLog = lastLogDate
      ? daysBetween(lastLogDate, todayIso)
      : null;
    const daysSinceLastWorkout = lastWorkoutDate
      ? daysBetween(lastWorkoutDate, todayIso)
      : null;

    // Last-7-days average score
    const recentLogs = clientLogs.filter(
      (l) => l.log_date >= sevenDaysAgo && l.log_date <= todayIso
    );
    const recentScores = recentLogs
      .map((l) => computeMiniScore(l))
      .filter((s): s is number => s !== null);
    const avgScore7d =
      recentScores.length > 0
        ? Math.round(
            recentScores.reduce((sum, n) => sum + n, 0) / recentScores.length
          )
        : null;

    // Streak — consecutive trailing days at ≥70 from today back
    let streak = 0;
    let dayCursor = todayIso;
    while (true) {
      const log = clientLogs.find((l) => l.log_date === dayCursor);
      const s = log ? computeMiniScore(log) : null;
      if (s != null && s >= 70) {
        streak++;
        dayCursor = offsetDay(dayCursor, -1);
      } else {
        break;
      }
    }
    const yesterday = offsetDay(todayIso, -1);
    const yesterdayLog = clientLogs.find((l) => l.log_date === yesterday);
    const yesterdayScore = yesterdayLog ? computeMiniScore(yesterdayLog) : null;
    const todayLog = clientLogs.find((l) => l.log_date === todayIso);
    const todayScore = todayLog ? computeMiniScore(todayLog) : null;
    const streakBrokenToday =
      yesterdayScore != null &&
      yesterdayScore >= 70 &&
      (todayScore == null || todayScore < 70);

    const unreviewedReports = clientReports.filter(
      (r) => !r.coach_review_note?.trim()
    ).length;

    const moodToday = todayLog?.mood_state ?? null;
    const mealsTodayCount = clientMealsToday.length;

    // ─── Compute flags ────────────────────────────────────────
    const flags: AttentionFlag[] = [];
    if (daysSinceLastLog === null || daysSinceLastLog >= 7) {
      flags.push('no_log_7d');
    } else if (daysSinceLastLog >= 3) {
      flags.push('no_log_3d');
    }
    if (daysSinceLastWorkout === null || daysSinceLastWorkout >= 10) {
      flags.push('no_workout_10d');
    } else if (daysSinceLastWorkout >= 5) {
      flags.push('no_workout_5d');
    }
    if (avgScore7d !== null && avgScore7d < 50) {
      flags.push('low_score_7d');
    }
    if (streakBrokenToday) {
      flags.push('streak_broken');
    }
    if (unreviewedReports > 0) {
      flags.push('unreviewed_report');
    }
    if (!moodToday) {
      flags.push('no_mood_today');
    }
    if (mealsTodayCount === 0) {
      flags.push('no_meal_today');
    }

    const attentionScore = flags.reduce((sum, f) => sum + FLAG_META[f].severity, 0);

    return {
      id: p.id,
      fullName: p.full_name ?? p.email,
      email: p.email,
      avatarUrl: p.avatar_url,
      daysSinceLastLog,
      daysSinceLastWorkout,
      avgScore7d,
      currentStreakDays: streak,
      streakBrokenToday,
      unreviewedReports,
      moodToday,
      mealsToday: mealsTodayCount,
      flags,
      attentionScore,
    };
  });

  // Sort by attention score desc, then alphabetical
  clients.sort((a, b) => {
    if (b.attentionScore !== a.attentionScore) {
      return b.attentionScore - a.attentionScore;
    }
    return a.fullName.localeCompare(b.fullName);
  });

  const needsAttention = clients.filter((c) => c.attentionScore >= 3).length;
  const quiet = clients.filter((c) => c.attentionScore < 1).length;

  return {
    todayIso,
    clients,
    totals: { total: clients.length, needsAttention, quiet },
  };
}

// ─── Helpers ────────────────────────────────────────────────────

function offsetDay(iso: string, offset: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + offset);
  return dt.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  const a = Date.UTC(fy, fm - 1, fd);
  const b = Date.UTC(ty, tm - 1, td);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function groupBy<T, K>(items: T[], key: (item: T) => K): Map<K, T[]> {
  const out = new Map<K, T[]>();
  for (const item of items) {
    const k = key(item);
    if (!out.has(k)) out.set(k, []);
    out.get(k)!.push(item);
  }
  return out;
}

/**
 * Light-weight per-day score (0-100) for radar use only — mirrors the
 * weighting in computeHealthScore but without the dep cycle. Returns
 * null when there's no scoreable data on the day.
 */
function computeMiniScore(log: {
  steps: number | null;
  steps_target: number | null;
  sleep_hours: number | null;
  water_glasses: number | null;
  water_target: number | null;
  calories_consumed: number | null;
  calories_target: number | null;
}): number | null {
  const clamp = (n: number) => Math.max(0, Math.min(100, n));
  const stepsPct =
    log.steps != null && log.steps_target && log.steps_target > 0
      ? clamp((log.steps / log.steps_target) * 100)
      : null;
  const sleepPct = log.sleep_hours != null ? clamp((log.sleep_hours / 8) * 100) : null;
  const waterPct =
    log.water_glasses != null && log.water_target && log.water_target > 0
      ? clamp((log.water_glasses / log.water_target) * 100)
      : null;
  const nutritionPct =
    log.calories_consumed != null &&
    log.calories_target &&
    log.calories_target > 0
      ? clamp((log.calories_consumed / log.calories_target) * 100)
      : null;

  const parts = [stepsPct, sleepPct, waterPct, nutritionPct].filter(
    (n): n is number => n !== null
  );
  if (parts.length === 0) return null;
  return Math.round(parts.reduce((sum, n) => sum + n, 0) / parts.length);
}
