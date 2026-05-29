/**
 * Weekly plan — shared types + display metadata.
 *
 * Pure types, importable on server and client. Server-only logic
 * (read + materialization) lives in weekly-plan-server.ts. Mutation
 * actions live in lib/actions/weekly-plan.ts.
 */

export interface WeeklyPlanDay {
  /** 0 = Monday ... 6 = Sunday */
  dayOfWeek: number;
  workoutTemplateId: string | null; // null = rest
  overrideNotes: string | null;
}

export interface WeeklyPlan {
  clientId: string;
  name: string | null;
  startedAt: string;          // YYYY-MM-DD
  materializeWeeks: number;
  updatedAt: string;          // ISO
  updatedBy: string | null;
  days: WeeklyPlanDay[];      // length 7, ordered 0..6
}

export const DAY_LABELS_LONG = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export const DAY_LABELS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/** Build a 7-slot empty plan (all rest days) for a client. Used when
 *  the coach opens the editor for the first time. */
export function emptyWeeklyPlan(clientId: string): WeeklyPlan {
  return {
    clientId,
    name: null,
    startedAt: new Date().toISOString().slice(0, 10),
    materializeWeeks: 4,
    updatedAt: new Date().toISOString(),
    updatedBy: null,
    days: Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      workoutTemplateId: null,
      overrideNotes: null,
    })),
  };
}

/** Returns true if at least one day has a template assigned. */
export function isPlanEmpty(plan: WeeklyPlan): boolean {
  return plan.days.every((d) => d.workoutTemplateId === null);
}
