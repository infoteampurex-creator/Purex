/**
 * Pure types for workout templates. Stays free of `'server-only'` and
 * `next/headers` imports so client components (the templates page,
 * the apply-template dropdown inside EditDailyPlanModal) can read
 * these types without dragging the server fetcher into the bundle.
 */

export interface WorkoutTemplateExercise {
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
}

/**
 * Discriminator for where a template originates. 'db' is the
 * authoritative store; 'sheet' rows come from the Google Sheets
 * sync and can't be edited via the admin Templates page.
 */
export type WorkoutTemplateSource = 'db' | 'sheet';

export interface WorkoutTemplateSummary {
  id: string;
  name: string;
  category: string | null;
  targetMuscleGroup: string | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
  exerciseCount: number;
  isShared: boolean;
  createdBy: string | null;
  updatedAt: string;
  /** 'db' when sourced from Supabase, 'sheet' when from Google Sheets sync. */
  source: WorkoutTemplateSource;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  category: string | null;
  targetMuscleGroup: string | null;
  description: string | null;
  trainerNotes: string | null;
  nextDayInstructions: string | null;
  estimatedDurationMinutes: number | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
  isShared: boolean;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  exercises: WorkoutTemplateExercise[];
  source?: WorkoutTemplateSource;
}
