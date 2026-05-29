/**
 * Progress — shared types + pure derivations.
 *
 * Free of `'server-only'` so the client-side ProgressPageView can
 * import the helpers (transformationScore, weightDelta) directly.
 * Server-only fetch logic lives in progress-server.ts.
 */

export interface DailyScorePoint {
  /** YYYY-MM-DD */
  date: string;
  /** 0..100 health score for that day, or null if no log */
  score: number | null;
  /** Whether the day hit the streak threshold (≥70%) */
  hit: boolean;
}

export interface WeightPoint {
  date: string;
  weightKg: number;
}

export interface WeeklyAverages {
  steps: number;
  sleepMinutes: number;
  waterMl: number;
  workouts: number;
  mealsLoggedDays: number;
}

export interface ProgressData {
  scoreTrend30: DailyScorePoint[];
  consistency30: { hit: number; total: number };
  consistency90: { hit: number; total: number };
  weightHistory: WeightPoint[];
  thisWeek: WeeklyAverages;
  lastWeek: WeeklyAverages;
  isEmpty: boolean;
}

// ─── Pure derivations ──────────────────────────────────────────

/** Weight delta over the window: most-recent minus first. Null if <2 points. */
export function weightDelta(history: WeightPoint[]): number | null {
  if (history.length < 2) return null;
  return history[history.length - 1].weightKg - history[0].weightKg;
}

/**
 * Transformation Score (0-100) — composite of consistency + workout
 * volume + weight progress. The single "how am I trending?" number.
 *
 * Calibration:
 *   - Consistency over 30 days weighted 50%
 *   - Workout volume over 30 days weighted 25%
 *   - Weight movement weighted 25% (neutral 60 when no weight data)
 */
export function transformationScore(data: ProgressData): number {
  const consistencyPct =
    data.consistency30.total > 0
      ? (data.consistency30.hit / data.consistency30.total) * 100
      : 0;

  const workoutsPct = Math.min(
    100,
    (data.thisWeek.workouts + data.lastWeek.workouts) * (100 / 8)
  );

  let weightPct = 60;
  const wHist = data.weightHistory;
  if (wHist.length >= 2) {
    const delta = wHist[wHist.length - 1].weightKg - wHist[0].weightKg;
    weightPct = Math.max(40, Math.min(95, 60 + Math.abs(delta) * 5));
  }

  return Math.round(
    consistencyPct * 0.5 + workoutsPct * 0.25 + weightPct * 0.25
  );
}

export interface StrengthPR {
  exerciseName: string;
  targetMuscle: string | null;
  bestWeightKg: number;
  bestReps: string | null;
  achievedAt: string;          // ISO date
  attemptsLogged: number;       // how many times the user logged this exercise
}

export function emptyProgressData(daysWindow: string[] = []): ProgressData {
  return {
    scoreTrend30: daysWindow.map((date) => ({ date, score: null, hit: false })),
    consistency30: { hit: 0, total: 30 },
    consistency90: { hit: 0, total: 90 },
    weightHistory: [],
    thisWeek: {
      steps: 0,
      sleepMinutes: 0,
      waterMl: 0,
      workouts: 0,
      mealsLoggedDays: 0,
    },
    lastWeek: {
      steps: 0,
      sleepMinutes: 0,
      waterMl: 0,
      workouts: 0,
      mealsLoggedDays: 0,
    },
    isEmpty: true,
  };
}
