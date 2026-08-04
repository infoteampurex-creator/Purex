import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Coach analytics — batched per-client health signals used to show
 * a "who needs attention today" leaderboard on the admin dashboard.
 *
 * One query per data source (logs, workouts, tasks, profiles) fetches
 * ALL clients' data at once, then we aggregate in JS. Much cheaper
 * than N-queries-per-client. Full roster of 100 clients returns in
 * one server round-trip.
 */

export type RiskTier =
  | 'peak' // Active, on-streak, high engagement
  | 'active' // Active, logging regularly
  | 'cooling' // Missed 1-2 days, but recoverable
  | 'slipping' // Missed 3-5 days, needs a nudge
  | 'at-risk' // Missed 6-13 days, high churn risk
  | 'lost'; // 14+ days silent, likely churned

export interface ClientAnalytics {
  clientId: string;
  fullName: string;
  avatarUrl: string | null;
  status: string; // 'active' | 'onboarding' | 'paused' | etc.
  daysSinceLastActivity: number | null; // null = never logged
  lastActivityIso: string | null;
  currentStreakDays: number;
  todayLogged: boolean;
  weeklyLogRate: number; // 0-1 — fraction of last 7 days with any log
  riskTier: RiskTier;
}

/**
 * Compute a risk tier from raw activity signals. Deliberately biased
 * toward showing 'slipping' at 3 days so the coach's attention is
 * drawn to clients before they cross into churn territory.
 */
function tierFor(
  daysSince: number | null,
  streak: number,
  weeklyRate: number
): RiskTier {
  if (daysSince == null) return 'lost';
  if (daysSince >= 14) return 'lost';
  if (daysSince >= 6) return 'at-risk';
  if (daysSince >= 3) return 'slipping';
  if (daysSince >= 1) return 'cooling';
  // Actively logged today or yesterday
  if (streak >= 14 && weeklyRate >= 0.85) return 'peak';
  return 'active';
}

/**
 * Fetch analytics for every client in the system. Returns sorted by
 * risk tier (most at-risk first) so the leaderboard puts urgent
 * clients at the top.
 */
export async function getCoachAnalytics(): Promise<ClientAnalytics[]> {
  const today = todayIso();
  const sevenDaysAgo = addDays(today, -6);
  const fourteenDaysAgo = addDays(today, -13);

  try {
    const sb = createAdminClient();

    // Fetch all clients + their last 14 days of logs + workouts in
    // three parallel queries.
    const [profilesRes, logsRes, workoutsRes] = await Promise.all([
      sb
        .from('profiles')
        .select('id, full_name, avatar_url, status, role')
        .in('role', ['user', 'client']),
      sb
        .from('client_daily_logs')
        .select('client_id, log_date')
        .gte('log_date', fourteenDaysAgo)
        .lte('log_date', today),
      sb
        .from('client_workouts')
        .select('client_id, workout_date, completed')
        .gte('workout_date', fourteenDaysAgo)
        .lte('workout_date', today),
    ]);

    const profiles = (profilesRes.data ?? []) as Array<{
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      status: string | null;
      role: string | null;
    }>;

    const logsByClient = new Map<string, Set<string>>();
    for (const row of logsRes.data ?? []) {
      const r = row as { client_id: string; log_date: string };
      const set = logsByClient.get(r.client_id) ?? new Set<string>();
      set.add(r.log_date);
      logsByClient.set(r.client_id, set);
    }

    const workoutsByClient = new Map<string, Set<string>>();
    for (const row of workoutsRes.data ?? []) {
      const r = row as {
        client_id: string;
        workout_date: string | null;
        completed: boolean | null;
      };
      if (!r.workout_date || !r.completed) continue;
      const set = workoutsByClient.get(r.client_id) ?? new Set<string>();
      set.add(r.workout_date);
      workoutsByClient.set(r.client_id, set);
    }

    const analytics: ClientAnalytics[] = profiles.map((p) => {
      // Union of "did anything today" — a log OR a completed workout counts
      const activityDates = new Set([
        ...(logsByClient.get(p.id) ?? []),
        ...(workoutsByClient.get(p.id) ?? []),
      ]);

      // Days since last activity (0 = today, 1 = yesterday, null = never)
      let daysSince: number | null = null;
      let lastIso: string | null = null;
      for (let i = 0; i < 14; i++) {
        const iso = addDays(today, -i);
        if (activityDates.has(iso)) {
          daysSince = i;
          lastIso = iso;
          break;
        }
      }

      // Current streak — consecutive days from today back
      let streak = 0;
      for (let i = 0; i < 14; i++) {
        const iso = addDays(today, -i);
        if (activityDates.has(iso)) streak++;
        else break;
      }

      // Weekly log rate — fraction of last 7 days with activity
      let weeklyHits = 0;
      for (let i = 0; i < 7; i++) {
        const iso = addDays(today, -i);
        if (activityDates.has(iso)) weeklyHits++;
      }
      const weeklyRate = weeklyHits / 7;

      const todayLogged = activityDates.has(today);
      const riskTier = tierFor(daysSince, streak, weeklyRate);

      return {
        clientId: p.id,
        fullName: p.full_name ?? '—',
        avatarUrl: p.avatar_url ?? null,
        status: p.status ?? 'active',
        daysSinceLastActivity: daysSince,
        lastActivityIso: lastIso,
        currentStreakDays: streak,
        todayLogged,
        weeklyLogRate: weeklyRate,
        riskTier,
      };
    });

    // Sort: at-risk clients first (most urgent), then by streak descending
    const tierOrder: Record<RiskTier, number> = {
      lost: 0,
      'at-risk': 1,
      slipping: 2,
      cooling: 3,
      active: 4,
      peak: 5,
    };
    analytics.sort((a, b) => {
      const t = tierOrder[a.riskTier] - tierOrder[b.riskTier];
      if (t !== 0) return t;
      return b.currentStreakDays - a.currentStreakDays;
    });

    // Also drop 'lost' clients whose profiles are inactive/paused —
    // those are expected to be silent and clutter the view.
    return analytics.filter(
      (a) => !(a.riskTier === 'lost' && a.status !== 'active')
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error('[coach-analytics] getCoachAnalytics failed', err);
    return [];
  }
}

/** Today's date in ISO YYYY-MM-DD, IST (Team Purex's primary timezone). */
function todayIso(): string {
  const d = new Date();
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
}

function addDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}
