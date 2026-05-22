/**
 * Gamification helpers — XP, Level, Mission, Streak.
 *
 * These layer on top of the existing Twin stats + Healthy Streak. We
 * derive XP from accumulated health scores so no DB changes are
 * needed: the Twin's "level" is a function of the consistency the
 * user has already proven.
 */

import type { DayScoreEntry } from './twin';

// ─── XP & Level math ──────────────────────────────────────────────

/** XP earned per day = the day's total health score (0..100). */
export const XP_PER_DAY_MAX = 100;
/** Each level requires this many XP. Linear scale — easy to read. */
export const XP_PER_LEVEL = 500;

/**
 * Sum daily health scores in the history window to derive lifetime XP.
 * A user with 7 days at avg score 65 has ~455 XP → still Level 1, but
 * close to 2. Logging a perfect day = +100 XP, levelling feels earnable.
 */
export function deriveXp(history: DayScoreEntry[]): number {
  return Math.round(history.reduce((sum, d) => sum + (d.score ?? 0), 0));
}

export interface LevelInfo {
  level: number;          // 1, 2, 3, ...
  currentLevelXp: number; // xp within current level
  nextLevelXp: number;    // xp needed to advance
  progress: number;       // 0..1 within current level
  totalXp: number;        // lifetime
}

export function deriveLevel(xp: number): LevelInfo {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const currentLevelXp = xp % XP_PER_LEVEL;
  const nextLevelXp = XP_PER_LEVEL;
  return {
    level,
    currentLevelXp,
    nextLevelXp,
    progress: currentLevelXp / nextLevelXp,
    totalXp: xp,
  };
}

// ─── Twin status labels (replaces the medical-sounding ones) ──────

import type { TwinVisualState } from './twin';

export const TWIN_STATUS_GAMIFIED: Record<TwinVisualState, string> = {
  depleted:   'RESTING',
  recovering: 'RECOVERING',
  focused:    'BUILDING',
  charged:    'LIVE',
  peak:       'PEAKING',
  hybrid:     'PRIME',
};

/** Special override for the "no data yet" first-day case. */
export const TWIN_STATUS_CALIBRATING = 'CALIBRATING';

// ─── AI Coach mission generator ───────────────────────────────────

import type { DailyInputs } from './twin';

export interface CoachMission {
  headline: string;
  body: string;
  tone: 'rest' | 'build' | 'celebrate' | 'calibrate';
}

/**
 * Generate a short prescriptive mission for today based on the day's
 * inputs and recent streak. Returns the single most important
 * mission — we deliberately pick one focus area rather than listing
 * everything to fix. Coach voice: short imperative sentences.
 */
export function generateMission(
  inputs: DailyInputs,
  streakDays: number
): CoachMission {
  const recoveryPct = pct(inputs.sleepMinutes, inputs.sleepGoalMinutes);
  const hydrationPct = pct(inputs.waterMl, inputs.waterGoalMl);
  const stepsPct = pct(inputs.steps, inputs.stepsGoal);
  const allZero =
    inputs.steps === 0 &&
    inputs.sleepMinutes === 0 &&
    inputs.waterMl === 0;

  if (allZero) {
    return {
      headline: 'Twin is calibrating',
      body: 'Log your first day to unlock your readiness score.',
      tone: 'calibrate',
    };
  }
  if (recoveryPct < 60) {
    return {
      headline: "Tonight's mission: rest",
      body: 'Recovery is low. 7h sleep, 2L water, skip the late workout.',
      tone: 'rest',
    };
  }
  if (streakDays >= 3) {
    return {
      headline: `${streakDays}-day streak burning`,
      body: 'You\'re ahead of the curve. Protect the streak — keep moving.',
      tone: 'celebrate',
    };
  }
  if (hydrationPct < 50) {
    return {
      headline: "Today's mission: hydrate",
      body: 'Water intake low. Aim for 2L by sunset.',
      tone: 'build',
    };
  }
  if (stepsPct < 50) {
    return {
      headline: "Move your Twin",
      body: 'Step count low. A 15-min walk now unlocks the day.',
      tone: 'build',
    };
  }
  return {
    headline: 'Hold the line',
    body: 'Twin is building. Keep logging — momentum compounds.',
    tone: 'build',
  };
}

function pct(value: number, goal: number): number {
  if (!goal) return 0;
  return Math.max(0, Math.min(100, (value / goal) * 100));
}

// ─── Milestone rail (Future Clone dashboard card) ─────────────────

export interface MilestoneRailEntry {
  day: number;
  label: string;
  subLabel: string;
  color: string;
}

/**
 * Gamified milestone names shown on the Future Clone dashboard rail.
 * Separate from FUTURE_STAGES (which the full /client/future-clone
 * page uses) so we can swap the punchy game names in here without
 * touching the more clinical descriptions on the deep-link page.
 */
export const MILESTONE_RAIL: MilestoneRailEntry[] = [
  { day: 1,  label: 'ROOKIE',  subLabel: 'First steps',     color: '#a0a69a' },
  { day: 30, label: 'BUILDER', subLabel: 'Habits hardened', color: '#7dd3ff' },
  { day: 60, label: 'WARRIOR', subLabel: 'Body adapted',    color: '#ffd24d' },
  { day: 90, label: 'PRIME',   subLabel: 'Future you',      color: '#ff8a4d' },
];

// ─── Future Clone — projected delta metrics ───────────────────────

import type { TwinStats } from './twin';

export interface ProjectedDelta {
  label: string;
  todayValue: string;
  futureValue: string;
  delta: string;
  positive: boolean;
}

/**
 * Synthesize "+lift" projections for the Future Clone — derived from
 * stat deltas with safe, non-medical language. These are *not*
 * predictions, they're a visual representation of the consistency
 * compounding over 90 days.
 */
export function deriveProjectedDeltas(
  today: TwinStats,
  future: TwinStats
): ProjectedDelta[] {
  return [
    {
      label: 'Strength',
      todayValue: `${Math.round(today.strength)}`,
      futureValue: `${Math.round(future.strength)}`,
      delta: `+${Math.max(0, Math.round(future.strength - today.strength))}`,
      positive: future.strength > today.strength,
    },
    {
      label: 'Endurance',
      todayValue: `${Math.round(today.endurance)}`,
      futureValue: `${Math.round(future.endurance)}`,
      delta: `+${Math.max(0, Math.round(future.endurance - today.endurance))}`,
      positive: future.endurance > today.endurance,
    },
    {
      label: 'Recovery',
      todayValue: `${Math.round(today.recovery)}`,
      futureValue: `${Math.round(future.recovery)}`,
      delta: `+${Math.max(0, Math.round(future.recovery - today.recovery))}`,
      positive: future.recovery > today.recovery,
    },
  ];
}
