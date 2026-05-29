/**
 * Smart Alerts — pure derivation of in-app alerts from the user's
 * current daily inputs + recent score history.
 *
 * NOT push notifications (separate work — requires FCM/APNs).
 * These are in-app cards that surface on the dashboard so the user
 * sees what to act on right now.
 *
 * Free of `'server-only'` so both server fetch (dashboard) and the
 * client-side preview can import.
 */

import type { DailyInputs } from './twin';
import type { MoodState } from './mood';

export type AlertKey =
  | 'dehydration_risk'
  | 'low_sleep_warning'
  | 'missed_workout_risk'
  | 'consistency_risk'
  | 'overtraining_risk'
  | 'recovery_risk'
  | 'low_nutrition_compliance'
  | 'high_steps_celebration'
  | 'streak_save'
  | 'mood_followup';

export type AlertSeverity = 'info' | 'warn' | 'critical' | 'positive';

export interface SmartAlert {
  key: AlertKey;
  severity: AlertSeverity;
  title: string;
  body: string;
  action?: string;            // suggested CTA copy (display-only for v1)
}

const SEVERITY_RANK: Record<AlertSeverity, number> = {
  critical: 4,
  warn: 3,
  positive: 2,
  info: 1,
};

export const ALERT_PALETTE: Record<
  AlertSeverity,
  { color: string; bg: string; border: string }
> = {
  critical: {
    color: '#ff6b6b',
    bg: 'rgba(255,107,107,0.08)',
    border: 'rgba(255,107,107,0.30)',
  },
  warn: {
    color: '#ff8a4d',
    bg: 'rgba(255,138,77,0.08)',
    border: 'rgba(255,138,77,0.28)',
  },
  positive: {
    color: '#c6ff3d',
    bg: 'rgba(198,255,61,0.08)',
    border: 'rgba(198,255,61,0.28)',
  },
  info: {
    color: '#7dd3ff',
    bg: 'rgba(125,211,255,0.08)',
    border: 'rgba(125,211,255,0.28)',
  },
};

export interface AlertInputs {
  /** Current day's inputs (steps, sleep, water, workout, etc.). */
  inputs: DailyInputs;
  /** Last-7-days health scores (most recent last). */
  recentScores: number[];
  /** Number of workouts over last 7 days (denormalised from inputs). */
  workouts7d: number;
  /** Mood logged today (or null). */
  moodToday: MoodState | null;
  /** Current local hour 0-23 — drives time-sensitive alerts. */
  currentHour: number;
}

/**
 * Compute the list of in-app alerts for this user RIGHT NOW.
 *
 * Sorted by severity (critical → warn → positive → info), then by
 * "freshness" of the trigger. UI typically renders 2-3 at most so
 * cap as needed at the call site.
 */
export function computeSmartAlerts(input: AlertInputs): SmartAlert[] {
  const alerts: SmartAlert[] = [];
  const { inputs, recentScores, workouts7d, moodToday, currentHour } = input;

  // ─── Dehydration ─────────────────────────────────────
  if (inputs.waterGoalMl > 0) {
    const waterPct = (inputs.waterMl / inputs.waterGoalMl) * 100;
    // After 2pm AND below 30% → critical risk
    if (currentHour >= 14 && waterPct < 30) {
      alerts.push({
        key: 'dehydration_risk',
        severity: 'critical',
        title: 'Dehydration risk',
        body: `You're at ${Math.round(waterPct)}% of today's water target. Drink 500ml in the next hour to catch up.`,
        action: 'Log water',
      });
    } else if (currentHour >= 18 && waterPct < 60) {
      alerts.push({
        key: 'dehydration_risk',
        severity: 'warn',
        title: 'Hydration low',
        body: `Behind the curve — ${Math.round(waterPct)}% before dinner. Two glasses now keeps you on track.`,
        action: 'Log water',
      });
    }
  }

  // ─── Low sleep ───────────────────────────────────────
  if (inputs.sleepMinutes > 0 && inputs.sleepMinutes < 6 * 60) {
    const hours = (inputs.sleepMinutes / 60).toFixed(1);
    alerts.push({
      key: 'low_sleep_warning',
      severity: 'warn',
      title: 'Low sleep last night',
      body: `${hours}h logged — recovery + cognition both impacted. Train lighter today; sleep by 10:30 PM tonight.`,
      action: 'View mission',
    });
  } else if (inputs.sleepMinutes === 0 && currentHour >= 10) {
    alerts.push({
      key: 'low_sleep_warning',
      severity: 'info',
      title: 'Sleep not logged',
      body: 'Log last night\'s sleep so today\'s mission can adapt.',
      action: 'Log sleep',
    });
  }

  // ─── Missed workout risk ─────────────────────────────
  if (currentHour >= 17 && !inputs.workoutCompletedToday) {
    alerts.push({
      key: 'missed_workout_risk',
      severity: 'warn',
      title: 'Workout window closing',
      body: 'No workout logged today yet. Even a 20-minute session protects your streak.',
      action: 'Start mission',
    });
  }

  // ─── Consistency risk (score trend declining) ───────
  if (recentScores.length >= 4) {
    const last3 = recentScores.slice(-3);
    const prior4 = recentScores.slice(-7, -3);
    const avgLast = avg(last3);
    const avgPrior = avg(prior4);
    if (avgPrior - avgLast > 12 && avgLast < 60) {
      alerts.push({
        key: 'consistency_risk',
        severity: 'warn',
        title: 'Scores dipping',
        body: `Average dropped from ${Math.round(avgPrior)} to ${Math.round(avgLast)} over the last few days. One full-input day reverses it.`,
        action: 'View progress',
      });
    }
  }

  // ─── Overtraining risk ───────────────────────────────
  if (workouts7d >= 6 && inputs.sleepMinutes < 7 * 60) {
    alerts.push({
      key: 'overtraining_risk',
      severity: 'warn',
      title: 'Overtraining risk',
      body: `6+ workouts this week and sleep is under 7h. Make today active-recovery or rest.`,
      action: 'Switch to mobility',
    });
  }

  // ─── Recovery risk (low mood + low sleep) ────────────
  if (
    moodToday &&
    ['tired', 'sore', 'low_energy', 'stressed'].includes(moodToday) &&
    inputs.sleepMinutes > 0 &&
    inputs.sleepMinutes < 6.5 * 60
  ) {
    alerts.push({
      key: 'recovery_risk',
      severity: 'warn',
      title: 'Recovery low',
      body: `You logged ${labelMood(moodToday)} and slept under 6.5h. Switch today to mobility + a walk.`,
      action: 'View recovery plan',
    });
  }

  // ─── Low nutrition compliance ───────────────────────
  if (inputs.nutritionAdherencePct > 0 && inputs.nutritionAdherencePct < 50) {
    alerts.push({
      key: 'low_nutrition_compliance',
      severity: 'info',
      title: 'Nutrition under target',
      body: `${Math.round(inputs.nutritionAdherencePct)}% of calorie target so far. Browse food ideas to top up.`,
      action: 'Browse food ideas',
    });
  }

  // ─── Streak save ─────────────────────────────────────
  if (currentHour >= 19 && inputs.currentStreak > 0) {
    const todayCount =
      countPositive([
        inputs.steps,
        inputs.sleepMinutes,
        inputs.waterMl,
        inputs.workoutCompletedToday ? 1 : 0,
        inputs.nutritionAdherencePct,
      ]);
    if (todayCount <= 2) {
      alerts.push({
        key: 'streak_save',
        severity: 'critical',
        title: `Save your ${inputs.currentStreak}-day streak`,
        body: 'Log water + a 12-minute walk before bed to push today over the threshold.',
        action: 'Log now',
      });
    }
  }

  // ─── High-steps celebration ─────────────────────────
  if (inputs.stepsGoal > 0 && inputs.steps >= inputs.stepsGoal) {
    alerts.push({
      key: 'high_steps_celebration',
      severity: 'positive',
      title: `Steps goal hit · ${inputs.steps.toLocaleString()}`,
      body: 'Movement done for the day. Now hydrate + recover.',
    });
  }

  // ─── Mood follow-up (logged but no recommendation yet) ─
  if (moodToday && currentHour >= 12) {
    // Light info nudge if mood was concerning earlier in day
    if (['acidity', 'bloated'].includes(moodToday)) {
      alerts.push({
        key: 'mood_followup',
        severity: 'info',
        title: 'Digest check',
        body: 'You flagged stomach issues this morning. Avoid carbonated drinks + take a 10-min walk after meals.',
      });
    }
  }

  // Sort by severity rank desc
  return alerts.sort(
    (a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]
  );
}

// ─── Helpers ─────────────────────────────────────────────

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, n) => sum + n, 0) / arr.length;
}

function countPositive(arr: Array<number | null | undefined>): number {
  return arr.filter((n): n is number => n != null && n > 0).length;
}

function labelMood(state: MoodState): string {
  switch (state) {
    case 'tired':     return 'tired';
    case 'sore':      return 'sore';
    case 'low_energy': return 'low energy';
    case 'stressed':  return 'stressed';
    case 'bloated':   return 'bloated';
    case 'acidity':   return 'acidity';
    case 'fresh':     return 'fresh';
    case 'motivated': return 'motivated';
  }
}
