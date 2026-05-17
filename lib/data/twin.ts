/**
 * PureX Twin & Future Clone — pure types + derivation logic.
 *
 * Free of `'server-only'` so both server and client components can
 * import. Twin and Future Clone are *visualizations* over data the
 * platform already collects (daily logs, workouts, streaks); these
 * helpers translate raw inputs into the 5 stat vectors that drive
 * the animated SVG.
 */

// ─── Twin stats — the five vectors ─────────────────────────────────

export type TwinStatKey =
  | 'energy'
  | 'strength'
  | 'endurance'
  | 'recovery'
  | 'discipline';

export interface TwinStats {
  energy: number; // 0..100
  strength: number;
  endurance: number;
  recovery: number;
  discipline: number;
}

export const TWIN_STAT_META: Record<
  TwinStatKey,
  { label: string; source: string; color: string }
> = {
  energy: {
    label: 'Energy',
    source: 'Water + activity throughout the day',
    color: '#c6ff3d', // accent green
  },
  strength: {
    label: 'Strength',
    source: 'Workout completion + load progression',
    color: '#ff8a4d', // warm orange
  },
  endurance: {
    label: 'Endurance',
    source: 'Daily steps and cardio minutes',
    color: '#7dd3ff', // sky
  },
  recovery: {
    label: 'Recovery',
    source: 'Sleep duration + sleep quality',
    color: '#a78bfa', // violet (calm)
  },
  discipline: {
    label: 'Discipline',
    source: 'Healthy Streak — consecutive days at ≥70 %',
    color: '#ffd24d', // gold
  },
};

// ─── Inputs → Twin stats ───────────────────────────────────────────

export interface DailyInputs {
  steps: number;
  stepsGoal: number;
  sleepMinutes: number;
  sleepGoalMinutes: number;
  waterMl: number;
  waterGoalMl: number;
  workoutCompletedToday: boolean;
  workoutsLast7: number;       // count of completed workouts last 7 days
  nutritionAdherencePct: number; // 0..100
  currentStreak: number;       // days
  bestStreak: number;          // days
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));

/**
 * Derive the 5 Twin stats from a day's inputs. Each stat is a blend
 * of one primary signal + a softer secondary signal so a single bad
 * day doesn't tank the avatar.
 */
export function deriveTwinStats(input: DailyInputs): TwinStats {
  const stepsPct = clamp((input.steps / Math.max(1, input.stepsGoal)) * 100);
  const sleepPct = clamp(
    (input.sleepMinutes / Math.max(1, input.sleepGoalMinutes)) * 100
  );
  const waterPct = clamp((input.waterMl / Math.max(1, input.waterGoalMl)) * 100);
  const workoutLast7Pct = clamp((input.workoutsLast7 / 7) * 100);
  const nutritionPct = clamp(input.nutritionAdherencePct);
  const streakPct = clamp(Math.min(input.currentStreak, 30) * (100 / 30));

  return {
    // Endurance — mostly steps, lightly boosted by workout consistency
    endurance: clamp(stepsPct * 0.75 + workoutLast7Pct * 0.25),
    // Strength — workout consistency dominates
    strength: clamp(workoutLast7Pct * 0.7 + (input.workoutCompletedToday ? 30 : 0)),
    // Recovery — sleep is king, water hydrates the muscles
    recovery: clamp(sleepPct * 0.8 + waterPct * 0.2),
    // Energy — water + nutrition + a kicker from today's workout
    energy: clamp(
      waterPct * 0.35 +
        nutritionPct * 0.4 +
        (input.workoutCompletedToday ? 25 : 0)
    ),
    // Discipline — streak length is the only real input
    discipline: streakPct,
  };
}

/** Average stat — used as the Twin's overall "vitality" score. */
export function twinOverallScore(stats: TwinStats): number {
  const sum =
    stats.energy +
    stats.strength +
    stats.endurance +
    stats.recovery +
    stats.discipline;
  return Math.round(sum / 5);
}

// ─── Visual states ────────────────────────────────────────────────

/**
 * The 5 visual states the Twin's silhouette can be in. Each maps
 * to a different aura colour, breathing speed, and accent glow.
 * Computed from stats + flags so the avatar changes throughout
 * the day as the user logs.
 */
export type TwinVisualState =
  | 'depleted' // overall < 30
  | 'recovering' // recovery low, others mid
  | 'focused' // strong streak, mid energy
  | 'charged' // high overall (>= 70) — golden aura
  | 'peak'; // 85+ AND workout done today

export function deriveVisualState(
  stats: TwinStats,
  workoutDoneToday: boolean
): TwinVisualState {
  const overall = twinOverallScore(stats);
  if (overall >= 85 && workoutDoneToday) return 'peak';
  if (overall >= 70) return 'charged';
  if (stats.discipline >= 60) return 'focused';
  if (stats.recovery < 40) return 'recovering';
  if (overall < 30) return 'depleted';
  return 'focused';
}

// ─── Status messages — short, motivational, state-driven ──────────

const STATE_MESSAGES: Record<TwinVisualState, string[]> = {
  depleted: [
    'Your Twin needs care. One small action today resets the curve.',
    'Low energy. Hydrate, then move for ten minutes — that\'s the whole ask.',
    'Today isn\'t the test. Tomorrow\'s consistency is.',
  ],
  recovering: [
    'Sleep first tonight. The Twin recharges in the dark.',
    'Recovery is low. Train light, rest hard.',
    'Your Twin is rebuilding. Don\'t fight it — feed it.',
  ],
  focused: [
    'Discipline is showing. Stack one more day.',
    'You\'re holding the line. The Twin sees it.',
    'Steady wins. Keep walking.',
  ],
  charged: [
    'Your Twin is charged today. Train with intent.',
    'Energy is high. Press into the workout.',
    'You\'re in flow. Don\'t hold back.',
  ],
  peak: [
    'Your Twin is at peak form. This is the version of you others see.',
    'Elite day. Hold this rhythm and watch the future shift.',
    'Peak vitality. Today is a snapshot of where you\'re heading.',
  ],
};

/** Pick a deterministic message for the day so it stays stable on refresh. */
export function dailyTwinMessage(
  state: TwinVisualState,
  dateSeed: string
): string {
  const pool = STATE_MESSAGES[state];
  // dateSeed is YYYY-MM-DD — hash it to a stable index in the pool.
  let h = 0;
  for (let i = 0; i < dateSeed.length; i++) h = (h * 31 + dateSeed.charCodeAt(i)) >>> 0;
  return pool[h % pool.length];
}

// ─── Future Clone — projection stages ─────────────────────────────

export type FutureStageKey = 'today' | '30d' | '90d' | '6mo' | '1yr';

export interface FutureStage {
  key: FutureStageKey;
  label: string;
  daysOut: number;
  /** 0..1 multiplier applied to today's stats to project the future. */
  projectionMultiplier: number;
  athleteLevel: string;
  bodyType: string;
  aura: string;          // hex
  description: string;
}

export const FUTURE_STAGES: FutureStage[] = [
  {
    key: 'today',
    label: 'Today',
    daysOut: 0,
    projectionMultiplier: 1,
    athleteLevel: 'Baseline',
    bodyType: 'Current state',
    aura: '#7dd3ff',
    description: 'Where you are right now. This is your starting line.',
  },
  {
    key: '30d',
    label: '30 Days',
    daysOut: 30,
    projectionMultiplier: 1.15,
    athleteLevel: 'Activated',
    bodyType: 'Lean, awakening',
    aura: '#c6ff3d',
    description: 'One month of consistency. Your Twin\'s aura brightens, endurance climbs.',
  },
  {
    key: '90d',
    label: '90 Days',
    daysOut: 90,
    projectionMultiplier: 1.35,
    athleteLevel: 'Conditioned',
    bodyType: 'Athletic, defined',
    aura: '#ffd24d',
    description: 'Three months in. Strength compounds. Posture lifts. Recovery sharpens.',
  },
  {
    key: '6mo',
    label: '6 Months',
    daysOut: 180,
    projectionMultiplier: 1.6,
    athleteLevel: 'Advanced',
    bodyType: 'Powerful, integrated',
    aura: '#ff8a4d',
    description: 'Six months. The body is rebuilt. Strength, endurance, recovery move together.',
  },
  {
    key: '1yr',
    label: '1 Year',
    daysOut: 365,
    projectionMultiplier: 2,
    athleteLevel: 'Elite Hybrid',
    bodyType: 'Hybrid athlete',
    aura: '#ffffff',
    description: 'A year of holding the line. You don\'t look like before — and you don\'t train like before.',
  },
];

/**
 * Project today's Twin stats forward to a future stage. Caps at 100
 * because the bars don't exceed full. The projection is a deliberate
 * over-simplification — we don't claim guaranteed transformation,
 * just "this is where consistency points."
 */
export function projectStats(
  today: TwinStats,
  stage: FutureStage
): TwinStats {
  const m = stage.projectionMultiplier;
  return {
    energy: clamp(today.energy * m),
    strength: clamp(today.strength * m),
    endurance: clamp(today.endurance * m),
    recovery: clamp(today.recovery * m),
    discipline: clamp(today.discipline * m),
  };
}

// ─── Safe-language disclaimer (shown on Future Clone page) ────────

export const FUTURE_CLONE_DISCLAIMER =
  'Projected based on your consistency and habits. Not a medical or guaranteed transformation forecast.';
