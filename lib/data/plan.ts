/**
 * Plan page — shared types + pure helpers.
 *
 * Free of `'server-only'` so the client-side page view can import.
 * Server fetch logic lives in plan-server.ts.
 */

export type WorkoutCategoryKey =
  | 'strength'
  | 'cardio'
  | 'hybrid'
  | 'mobility'
  | 'rest'
  | 'other';

export interface PlanWorkout {
  id: string;
  date: string;          // YYYY-MM-DD
  name: string;
  category: WorkoutCategoryKey;
  durationMinutes: number | null;
  focus: string | null;
  difficulty: string | null;
  completed: boolean;
  completedAt: string | null; // ISO timestamp
}

export interface PlanData {
  todayIso: string;
  /** 7 dates of the current week (Mon → Sun). */
  weekDays: string[];
  /** Workouts grouped by YYYY-MM-DD. */
  workoutsByDate: Record<string, PlanWorkout[]>;
  /** Stats for the trailing 30 days. */
  thirtyDayCompleted: number;
  thirtyDayAssigned: number;
  byCategory: Record<WorkoutCategoryKey, number>;
  /** Consecutive trailing days with at least one completed workout. */
  streakDays: number;
  /** Counts for the current Mon-Sun week. */
  thisWeekAssigned: number;
  thisWeekCompleted: number;
  /** False when the user has zero workouts in the 28-day window. */
  hasAnyData: boolean;
}

/**
 * Map a free-form DB category string to one of our typed keys.
 * Trainer-side admin allows almost any string — this collapses
 * synonyms so the UI grouping stays clean.
 */
export function normaliseCategory(raw: string | null | undefined): WorkoutCategoryKey {
  if (!raw) return 'other';
  const v = raw.trim().toLowerCase();
  if (/strength|lift|push|pull|legs|hypertrophy|powerlift/.test(v)) return 'strength';
  if (/cardio|run|hiit|spin|cycling|condition|hyrox|amrap/.test(v)) return 'cardio';
  if (/hybrid|combine|circuit|metcon/.test(v)) return 'hybrid';
  if (/mobility|yoga|stretch|recovery|flex/.test(v)) return 'mobility';
  if (/rest|off|deload/.test(v)) return 'rest';
  return 'other';
}

export const CATEGORY_META: Record<
  WorkoutCategoryKey,
  { label: string; color: string; emoji: string }
> = {
  strength: { label: 'Strength', color: '#ff8a4d', emoji: '🏋️' },
  cardio:   { label: 'Cardio',   color: '#7dd3ff', emoji: '🏃' },
  hybrid:   { label: 'Hybrid',   color: '#c6ff3d', emoji: '🔥' },
  mobility: { label: 'Mobility', color: '#a78bfa', emoji: '🧘' },
  rest:     { label: 'Rest',     color: '#5a6055', emoji: '💤' },
  other:    { label: 'Other',    color: '#ffd24d', emoji: '⚡' },
};

/**
 * Training Load — a single 0-100 number for the current week.
 * Composite of:
 *   - Completion rate of assigned workouts (60%)
 *   - Total minutes vs 240/week target (40%)
 *
 * Falls back gracefully when nothing assigned yet (returns 0 with
 * empty band). The hero card on the page uses this number + band.
 */
export function trainingLoad(data: PlanData): {
  score: number;
  band: { label: string; tagline: string; color: string };
} {
  const { workoutsByDate, weekDays, thisWeekAssigned, thisWeekCompleted } = data;

  const minutesTotal = weekDays
    .flatMap((d) => workoutsByDate[d] ?? [])
    .filter((w) => w.completed)
    .reduce((sum, w) => sum + (w.durationMinutes ?? 0), 0);

  const completionPct =
    thisWeekAssigned > 0 ? (thisWeekCompleted / thisWeekAssigned) * 100 : 0;
  const minutesPct = Math.min(100, (minutesTotal / 240) * 100);

  const score = Math.round(completionPct * 0.6 + minutesPct * 0.4);

  let band: { label: string; tagline: string; color: string };
  if (thisWeekAssigned === 0) {
    band = {
      label: 'No plan yet',
      tagline:
        "Your coach hasn't assigned workouts this week. Add a self-challenge from Home if you want to keep moving.",
      color: '#a78bfa',
    };
  } else if (score >= 90) {
    band = {
      label: 'Full send',
      tagline: 'Every assigned workout is done. Recovery becomes the next move.',
      color: '#ff8a4d',
    };
  } else if (score >= 70) {
    band = {
      label: 'On plan',
      tagline: 'Holding the line. One more session caps the week.',
      color: '#c6ff3d',
    };
  } else if (score >= 40) {
    band = {
      label: 'Catching up',
      tagline: 'Mid-week pivot — pick the next assigned workout and start it.',
      color: '#ffd24d',
    };
  } else {
    band = {
      label: 'Behind',
      tagline:
        'Week is slipping. Re-open today or tomorrow and start the smallest one.',
      color: '#7dd3ff',
    };
  }

  return { score, band };
}
