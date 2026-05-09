/**
 * Pure types + constants shared between the server fetcher
 * (lib/data/daily-plan.ts) and client components (modals, cards).
 *
 * This module MUST stay free of `'server-only'` and any imports that
 * touch `next/headers`, cookies, or the Supabase server client — it
 * gets bundled into client components.
 */

/**
 * Lightweight exercise-library option used to populate the dropdown
 * inside the EditDailyPlanModal. Server-side `searchExercises` returns
 * a richer shape; this is the slim subset the client modal actually
 * reads. Lives here so it stays bundleable for client components.
 */
export interface LibraryExerciseOption {
  slug: string;
  name: string;
  category: string; // 'chest' | 'back' | 'legs' | etc — used as targetMuscle prefill
  defaultSets: string | null;
  defaultReps: string | null;
  defaultRestSeconds: number | null;
}

export interface ExerciseActuals {
  actualSets: number | null;
  actualReps: string | null;
  actualWeightKg: number | null;
  rpe: number | null;
  notes: string | null;
  loggedAt: string | null;
}

export interface PlannedExercise {
  id: string;
  exerciseName: string;
  targetMuscle: string | null;
  sets: number | null;
  reps: string | null;
  targetWeightKg: number | null;
  restSeconds: number | null;
  tempo: string | null;
  rpeTarget: number | null;
  trainerInstruction: string | null;
  exerciseOrder: number;
  /** Per-exercise actuals logged by the client. null when never logged. */
  actuals: ExerciseActuals | null;
}

export type WorkoutCompletionStatus = 'completed' | 'partial' | 'skipped' | null;

export interface DailyActuals {
  steps: number | null;
  sleepHours: number | null;
  waterGlasses: number | null;
  weightKg: number | null;
  caloriesConsumed: number | null;
  proteinG: number | null;
  /** Boolean kept for backward compat; prefer workoutCompletionStatus. */
  workoutCompleted: boolean;
  workoutCompletionStatus: WorkoutCompletionStatus;
}

export interface DailyPlan {
  // Workout
  workoutId: string | null;
  workoutName: string | null;
  workoutType: string | null;
  targetMuscleGroup: string | null;
  trainerNotes: string | null;
  nextDayInstructions: string | null;

  // Targets
  stepsTarget: number | null;
  sleepTargetHours: number | null;
  waterTarget: number | null;
  caloriesTarget: number | null;
  proteinTargetG: number | null;
  cardioTargetMinutes: number | null;
  targetWeightKg: number | null;

  // Recovery
  recoveryGoal: string | null;
  mobilityGoal: string | null;

  // Planned exercises (ordered by exercise_order)
  exercises: PlannedExercise[];

  // What the client has logged so far for this date.
  actuals: DailyActuals;
}

export const EMPTY_ACTUALS: DailyActuals = {
  steps: null,
  sleepHours: null,
  waterGlasses: null,
  weightKg: null,
  caloriesConsumed: null,
  proteinG: null,
  workoutCompleted: false,
  workoutCompletionStatus: null,
};

export const EMPTY_DAILY_PLAN: DailyPlan = {
  workoutId: null,
  workoutName: null,
  workoutType: null,
  targetMuscleGroup: null,
  trainerNotes: null,
  nextDayInstructions: null,
  stepsTarget: null,
  sleepTargetHours: null,
  waterTarget: null,
  caloriesTarget: null,
  proteinTargetG: null,
  cardioTargetMinutes: null,
  targetWeightKg: null,
  recoveryGoal: null,
  mobilityGoal: null,
  exercises: [],
  actuals: EMPTY_ACTUALS,
};
