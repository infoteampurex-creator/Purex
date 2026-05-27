/**
 * PureX Score — the master daily health number shown on the dashboard.
 *
 * One 0..100 number the user comes back for every day. Blended from
 * five user-facing categories (Movement, Fuel, Recovery, Hydration,
 * Consistency). Same raw inputs as the Healthy Streak score (see
 * computeHealthScore in twin.ts), but re-grouped into the categories
 * the product spec / dashboard surface.
 *
 * Why a separate function from computeHealthScore?
 *   computeHealthScore is the Streak math (5 weighted signals → 0-100,
 *   shipped to the calendar grid). PureX Score is the dashboard hero
 *   metric (5 USER-LABELED categories with explanatory copy). They
 *   share inputs but serve different UI surfaces. Keeping them
 *   separate means tweaking dashboard weighting later (e.g. bumping
 *   Consistency) doesn't affect the streak grid.
 *
 * Free of `'server-only'` so dashboard server components AND any
 * client-side preview components can both import.
 */

import type { DailyInputs } from './twin';

// ─── Category metadata — labels, sources, colors for UI ──────────

export type PureXScoreCategory =
  | 'movement'
  | 'fuel'
  | 'recovery'
  | 'hydration'
  | 'consistency';

export const PUREX_SCORE_CATEGORIES: Record<
  PureXScoreCategory,
  { label: string; source: string; color: string }
> = {
  movement: {
    label: 'Movement',
    source: 'Steps + workouts',
    color: '#c6ff3d', // accent green
  },
  fuel: {
    label: 'Fuel',
    source: 'Nutrition logs + adherence',
    color: '#ff8a4d', // orange
  },
  recovery: {
    label: 'Recovery',
    source: 'Sleep hours',
    color: '#a78bfa', // violet
  },
  hydration: {
    label: 'Hydration',
    source: 'Water intake',
    color: '#7dd3ff', // sky
  },
  consistency: {
    label: 'Consistency',
    source: 'Current streak',
    color: '#ffd24d', // gold
  },
};

// ─── Weights — total 1.0 ─────────────────────────────────────────

/**
 * Weighting calibrated to behavioural impact for a typical Indian
 * fitness coaching client. Movement leads (most controllable + visible
 * daily action). Fuel close behind (dictates the rest). Recovery
 * weighted higher than Hydration because sleep deficiency wrecks
 * everything else. Consistency = streak rewards long-term discipline
 * without dominating any single day.
 */
export const PUREX_SCORE_WEIGHTS: Record<PureXScoreCategory, number> = {
  movement: 0.25,
  fuel: 0.2,
  recovery: 0.2,
  hydration: 0.15,
  consistency: 0.2,
};

// ─── Score breakdown ─────────────────────────────────────────────

export interface PureXScoreBreakdown {
  movement: number;
  fuel: number;
  recovery: number;
  hydration: number;
  consistency: number;
  /** Weighted total, 0..100. The hero number shown on the dashboard. */
  total: number;
  /** True if all five components are exactly 0 — used for empty-state UI. */
  isEmpty: boolean;
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));

/**
 * Compute today's PureX Score from raw daily inputs.
 *
 * Each category resolves to 0..100:
 *   - Movement   = 60% steps progress + 40% today's workout done
 *   - Fuel       = nutrition adherence %
 *   - Recovery   = sleep progress vs goal
 *   - Hydration  = water progress vs goal
 *   - Consistency = streak length scaled (30-day cap = 100)
 *
 * Total = sum of (category × weight). Always 0..100.
 *
 * Empty-input semantics:
 *   - Goals missing or zero → 0% for that category (don't divide by 0)
 *   - "No data" reads the same as "didn't do" — we deliberately punish
 *     silence so logging matters
 *   - When every category is 0, isEmpty=true (lets the dashboard show
 *     a calibrating-style placeholder instead of "0 — looking bad")
 */
export function computePureXScore(
  inputs: DailyInputs,
  currentStreakDays: number
): PureXScoreBreakdown {
  const stepsPct =
    inputs.stepsGoal > 0
      ? clamp((inputs.steps / inputs.stepsGoal) * 100)
      : 0;
  const workoutTodayPct = inputs.workoutCompletedToday ? 100 : 0;

  const movement = clamp(stepsPct * 0.6 + workoutTodayPct * 0.4);

  const fuel = clamp(inputs.nutritionAdherencePct);

  const recovery =
    inputs.sleepGoalMinutes > 0
      ? clamp((inputs.sleepMinutes / inputs.sleepGoalMinutes) * 100)
      : 0;

  const hydration =
    inputs.waterGoalMl > 0
      ? clamp((inputs.waterMl / inputs.waterGoalMl) * 100)
      : 0;

  // Consistency = streak days capped at 30 (1 month of unbroken streak
  // = full score). 30 picked because it matches the "100-day commitment"
  // mental model — 30 is meaningful, 100 too punishing to start.
  const consistency = clamp((Math.min(currentStreakDays, 30) / 30) * 100);

  const total = Math.round(
    movement * PUREX_SCORE_WEIGHTS.movement +
      fuel * PUREX_SCORE_WEIGHTS.fuel +
      recovery * PUREX_SCORE_WEIGHTS.recovery +
      hydration * PUREX_SCORE_WEIGHTS.hydration +
      consistency * PUREX_SCORE_WEIGHTS.consistency
  );

  const isEmpty =
    movement === 0 &&
    fuel === 0 &&
    recovery === 0 &&
    hydration === 0 &&
    consistency === 0;

  return {
    movement: Math.round(movement),
    fuel: Math.round(fuel),
    recovery: Math.round(recovery),
    hydration: Math.round(hydration),
    consistency: Math.round(consistency),
    total,
    isEmpty,
  };
}

// ─── Score band → mood copy ──────────────────────────────────────

/**
 * Verbal label for the total score. Used as the subtitle under the
 * big number on the dashboard. Bands picked so most users settle in
 * "Building" early days and have something positive to climb toward.
 */
export function pureXScoreBand(total: number):
  | { label: string; tagline: string; color: string } {
  if (total >= 85) {
    return {
      label: 'Peak Day',
      tagline: 'Snapshot of who you\'re becoming.',
      color: '#ff8a4d',
    };
  }
  if (total >= 70) {
    return {
      label: 'Charged',
      tagline: 'Momentum is real. Press into it.',
      color: '#ffd24d',
    };
  }
  if (total >= 50) {
    return {
      label: 'On Track',
      tagline: 'Holding the line. One more action lifts this.',
      color: '#c6ff3d',
    };
  }
  if (total >= 30) {
    return {
      label: 'Building',
      tagline: 'Small actions stack. Pick the next one.',
      color: '#7dd3ff',
    };
  }
  return {
    label: 'Reset Day',
    tagline: 'Hydrate, walk, sleep early. Tomorrow is the test.',
    color: '#a78bfa',
  };
}

// ─── The weakest component — used for "save action" CTA ──────────

/**
 * Which category is dragging the score down today? Returns the
 * lowest-scoring non-consistency category (consistency is harder to
 * fix in a day; movement/fuel/recovery/hydration are within reach).
 * Drives the "do this next" CTA on the dashboard.
 */
export function weakestActionableCategory(
  score: PureXScoreBreakdown
): PureXScoreCategory {
  const actionable: Array<{ key: PureXScoreCategory; value: number }> = [
    { key: 'movement', value: score.movement },
    { key: 'fuel', value: score.fuel },
    { key: 'recovery', value: score.recovery },
    { key: 'hydration', value: score.hydration },
  ];
  actionable.sort((a, b) => a.value - b.value);
  return actionable[0].key;
}

/**
 * Suggested action copy for the weakest category. Short, imperative,
 * achievable today. Shown as the "Save your score" CTA on the
 * dashboard PureX Score card.
 */
export const NEXT_ACTION_COPY: Record<PureXScoreCategory, string> = {
  movement: 'Take a 12-minute walk',
  fuel: 'Log your next meal',
  recovery: 'Wind down by 10:30 PM',
  hydration: 'Drink 500ml water',
  consistency: 'Hit today\'s goal to extend the streak',
};
