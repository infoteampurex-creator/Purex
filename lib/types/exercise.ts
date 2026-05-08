/**
 * Type definitions mirroring the Phase 3A.5 exercise library schema.
 *
 * These types are used across server actions, data readers, and components
 * when working with the master exercise catalog.
 */

// ════════════════════════════════════════════════════════════════════
// Enumerated types — must match Postgres CHECK constraints exactly
// ════════════════════════════════════════════════════════════════════

export type ExerciseCategory =
  | 'chest'
  | 'back'
  | 'legs'
  | 'shoulders'
  | 'arms'
  | 'core'
  | 'cardio'
  | 'hybrid'
  | 'mobility'
  | 'recovery'
  | 'full_body';

export type ExerciseType =
  | 'strength'
  | 'hypertrophy'
  | 'functional'
  | 'hybrid'
  | 'endurance'
  | 'cardio'
  | 'mobility'
  | 'recovery';

export type MovementPattern =
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'push_horizontal'
  | 'push_vertical'
  | 'pull_horizontal'
  | 'pull_vertical'
  | 'carry'
  | 'rotation'
  | 'gait'
  | 'isolation'
  | 'static'
  | 'mobility'
  | 'recovery';

export type ExerciseDifficulty =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'elite';

export type MuscleGroup =
  // Chest
  | 'pec_major' | 'pec_minor' | 'serratus'
  // Back
  | 'lats' | 'traps_upper' | 'traps_mid' | 'traps_lower'
  | 'rhomboids' | 'erectors' | 'rear_delts' | 'rotator_cuff'
  // Shoulders
  | 'front_delts' | 'side_delts'
  // Arms
  | 'biceps' | 'triceps' | 'brachialis' | 'forearms'
  // Core
  | 'rectus_abdominis' | 'obliques' | 'transverse_abdominis' | 'spinal_erectors'
  // Legs
  | 'quads' | 'hamstrings' | 'glutes' | 'glute_med' | 'adductors'
  | 'abductors' | 'calves' | 'hip_flexors' | 'tibialis'
  // Other
  | 'cardiovascular' | 'grip' | 'full_body';

export type MuscleRole = 'primary' | 'secondary' | 'stabilizer';

export type AlternativeReason =
  | 'easier'
  | 'harder'
  | 'no_equipment'
  | 'less_equipment'
  | 'home_friendly'
  | 'injury_safe'
  | 'similar_pattern';

// ════════════════════════════════════════════════════════════════════
// Display labels (use these in UI, not the raw enum strings)
// ════════════════════════════════════════════════════════════════════

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  chest: 'Chest',
  back: 'Back',
  legs: 'Legs',
  shoulders: 'Shoulders',
  arms: 'Arms',
  core: 'Core',
  cardio: 'Cardio',
  hybrid: 'Hybrid',
  mobility: 'Mobility',
  recovery: 'Recovery',
  full_body: 'Full Body',
};

export const TYPE_LABELS: Record<ExerciseType, string> = {
  strength: 'Strength',
  hypertrophy: 'Hypertrophy',
  functional: 'Functional',
  hybrid: 'Hybrid',
  endurance: 'Endurance',
  cardio: 'Cardio',
  mobility: 'Mobility',
  recovery: 'Recovery',
};

export const DIFFICULTY_LABELS: Record<ExerciseDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  elite: 'Elite',
};

export const DIFFICULTY_COLORS: Record<ExerciseDifficulty, string> = {
  beginner: '#7dd3ff',  // sky blue
  intermediate: '#c6ff3d', // lime accent
  advanced: '#ffb84d',  // amber
  elite: '#ff6b9d',     // pink for elite
};

// ════════════════════════════════════════════════════════════════════
// Core exercise type
// ════════════════════════════════════════════════════════════════════

export interface ExerciseLibraryEntry {
  id: string;
  slug: string;
  name: string;
  alternateNames: string[];

  category: ExerciseCategory;
  exerciseType: ExerciseType;
  movementPattern: MovementPattern | null;

  primaryEquipment: string | null;
  secondaryEquipment: string[];
  equipmentAlternatives: string[];

  difficulty: ExerciseDifficulty;
  technicalDemand: number; // 1-5
  cardioDemand: number;    // 1-5

  caloriesPerMinuteEstimate: number | null;
  defaultSets: string;
  defaultReps: string;
  defaultRestSeconds: number;

  thumbnailUrl: string | null;
  animationUrl: string | null;
  videoUrl: string | null;
  diagramUrl: string | null;

  description: string | null;
  instructions: string[];
  setupCues: string[];
  executionCues: string[];
  commonMistakes: string[];
  trainerTips: string[];

  mobilityRequirements: string[];
  contraindications: string[];

  isHyroxEvent: boolean;
  isHybridSignature: boolean;
  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}

// ════════════════════════════════════════════════════════════════════
// Muscle mapping
// ════════════════════════════════════════════════════════════════════

export interface ExerciseMuscle {
  id: string;
  exerciseId: string;
  muscle: MuscleGroup;
  role: MuscleRole;
  intensity: number; // 1-5
}

// ════════════════════════════════════════════════════════════════════
// Alternative exercises
// ════════════════════════════════════════════════════════════════════

export interface ExerciseAlternative {
  id: string;
  exerciseId: string;
  alternativeExerciseId: string;
  reason: AlternativeReason | null;
  notes: string | null;
}

// ════════════════════════════════════════════════════════════════════
// Aggregated exercise (with muscles + alternatives joined in)
// Used by the search action when returning rich results
// ════════════════════════════════════════════════════════════════════

export interface ExerciseWithDetails extends ExerciseLibraryEntry {
  muscles: ExerciseMuscle[];
  alternatives: ExerciseAlternative[];
}

// ════════════════════════════════════════════════════════════════════
// Search params
// ════════════════════════════════════════════════════════════════════

export interface ExerciseSearchParams {
  /** Free-text search — matches name, alternate names, description */
  q?: string;
  category?: ExerciseCategory;
  exerciseType?: ExerciseType;
  difficulty?: ExerciseDifficulty;
  equipment?: string;
  isHyroxEvent?: boolean;
  isHybridSignature?: boolean;
  limit?: number;
}
