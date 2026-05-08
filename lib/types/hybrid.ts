/**
 * Type definitions mirroring the Phase 3A Supabase schema.
 *
 * These types are used across server actions, data readers, and components
 * to ensure compile-time safety when working with hybrid athlete data.
 *
 * Update this file whenever 00004_hybrid_athlete_system.sql changes.
 */

// ════════════════════════════════════════════════════════════════════
// Trainer ↔ Client assignment
// ════════════════════════════════════════════════════════════════════

export interface TrainerClientAssignment {
  id: string;
  trainerId: string;
  clientId: string;
  assignedAt: string;
  unassignedAt: string | null;
  isPrimary: boolean;
  notes: string | null;
}

// ════════════════════════════════════════════════════════════════════
// Workout logs
// ════════════════════════════════════════════════════════════════════

export type WorkoutType =
  | 'Strength'
  | 'HYROX'
  | 'Conditioning'
  | 'Mobility'
  | 'Sport'
  | 'Cardio'
  | 'Functional';

export type CompletionStatus = 'completed' | 'partial' | 'skipped';

export interface WorkoutLog {
  id: string;
  clientId: string;
  trainerId: string | null;
  logDate: string; // YYYY-MM-DD

  workoutId: string | null; // optional link to assigned workout
  workoutType: WorkoutType | null;
  muscleGroup: string | null;
  durationMinutes: number | null;
  caloriesBurned: number | null;
  perceivedExertion: number | null; // 1-10
  restSecondsAvg: number | null;

  completionStatus: CompletionStatus;
  trainerComment: string | null;

  createdAt: string;
  updatedAt: string;
}

// ════════════════════════════════════════════════════════════════════
// Exercise logs (one row per exercise inside a workout)
// ════════════════════════════════════════════════════════════════════

export type WeightUnit = 'kg' | 'lb' | 'bw';

export interface ExerciseSetBreakdown {
  set: number;
  reps: number;
  weight?: number;
  rpe?: number;
}

export interface ExerciseLog {
  id: string;
  workoutLogId: string;
  clientId: string;

  exerciseName: string;
  sequenceNumber: number;

  sets: number | null;
  reps: string | null; // text — can be '5x5', 'AMRAP', '8-10'
  weightKg: number | null;
  weightUnit: WeightUnit;

  setBreakdown: ExerciseSetBreakdown[] | null;

  restSeconds: number | null;
  tempo: string | null;
  rpe: number | null;
  notes: string | null;

  createdAt: string;
}

// ════════════════════════════════════════════════════════════════════
// Cardio logs
// ════════════════════════════════════════════════════════════════════

export type CardioActivity =
  | 'running'
  | 'cycling'
  | 'swimming'
  | 'rowing'
  | 'walking'
  | 'hyrox_circuit'
  | 'erg'
  | 'incline_walk'
  | 'other';

export interface CardioLog {
  id: string;
  clientId: string;
  trainerId: string | null;
  logDate: string;

  activity: CardioActivity;
  distanceKm: number | null;
  durationMinutes: number | null;
  pacePerKm: string | null; // '5:30' format
  speedKmh: number | null;

  resistanceLevel: number | null;
  powerAvgWatts: number | null;

  laps: number | null;
  poolLengthM: number | null;
  stroke: string | null;

  vo2Max: number | null;
  heartRateAvg: number | null;
  heartRateMax: number | null;
  zoneDistribution: Record<string, number> | null; // {z1: 12, z2: 20, ...}
  enduranceScore: number | null; // 0-100

  caloriesBurned: number | null;
  trainerComment: string | null;

  createdAt: string;
}

// ════════════════════════════════════════════════════════════════════
// Nutrition logs
// ════════════════════════════════════════════════════════════════════

export interface NutritionLog {
  id: string;
  clientId: string;
  trainerId: string | null;
  logDate: string;

  calories: number | null;
  caloriesTarget: number | null;
  proteinG: number | null;
  proteinTargetG: number | null;
  carbsG: number | null;
  carbsTargetG: number | null;
  fatsG: number | null;
  fatsTargetG: number | null;
  fibreG: number | null;

  waterLitres: number | null;
  waterTargetLitres: number;

  mealCompliancePct: number | null;
  mealsLogged: number | null;
  mealsPlanned: number | null;

  ateProcessedFood: boolean | null;
  alcoholUnits: number;

  trainerComment: string | null;
  clientNote: string | null;

  createdAt: string;
  updatedAt: string;
}

// ════════════════════════════════════════════════════════════════════
// Recovery logs
// ════════════════════════════════════════════════════════════════════

export type MobilityStatus = 'excellent' | 'good' | 'okay' | 'limited' | 'restricted';

export interface RecoveryLog {
  id: string;
  clientId: string;
  trainerId: string | null;
  logDate: string;

  sleepHours: number | null;
  sleepQuality: number | null; // 1-5
  bedtime: string | null;
  wakeTime: string | null;
  wokeUpCount: number;

  recoveryScore: number | null; // 0-100
  mobilityStatus: MobilityStatus | null;
  sorenessLevel: number | null; // 1-5
  stressLevel: number | null; // 1-5
  energyLevel: number | null; // 1-5

  soreAreas: string[];

  didMobility: boolean | null;
  didStretching: boolean | null;
  didMeditation: boolean | null;
  didSauna: boolean | null;
  didIceBath: boolean | null;

  trainerComment: string | null;
  clientNote: string | null;

  createdAt: string;
  updatedAt: string;
}

// ════════════════════════════════════════════════════════════════════
// Body measurements
// ════════════════════════════════════════════════════════════════════

export interface BodyMeasurement {
  id: string;
  clientId: string;
  trainerId: string | null;
  measuredAt: string;

  weightKg: number | null;
  bodyFatPct: number | null;
  muscleMassKg: number | null;
  bmi: number | null;

  chestCm: number | null;
  waistCm: number | null;
  hipsCm: number | null;
  leftArmCm: number | null;
  rightArmCm: number | null;
  leftThighCm: number | null;
  rightThighCm: number | null;
  calfCm: number | null;
  neckCm: number | null;

  restingHeartRate: number | null;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;

  frontPhotoUrl: string | null;
  sidePhotoUrl: string | null;
  backPhotoUrl: string | null;

  trainerComment: string | null;

  createdAt: string;
}

// ════════════════════════════════════════════════════════════════════
// Trainer notes
// ════════════════════════════════════════════════════════════════════

export type NotePriority = 'low' | 'normal' | 'high' | 'urgent';

export interface TrainerNote {
  id: string;
  clientId: string;
  trainerId: string;
  noteDate: string;

  motivationNote: string | null;
  weakAreas: string | null;
  improvementSuggestions: string | null;
  injuryNotes: string | null;
  nextDayInstructions: string | null;

  visibleToClient: boolean;
  priority: NotePriority;

  createdAt: string;
  updatedAt: string;
}

// ════════════════════════════════════════════════════════════════════
// Hybrid Athlete Score
// ════════════════════════════════════════════════════════════════════

export type AthleteLevel =
  | 'rookie'
  | 'performer'
  | 'advanced'
  | 'elite'
  | 'hybrid_beast';

export const ATHLETE_LEVEL_LABELS: Record<AthleteLevel, string> = {
  rookie: 'Rookie',
  performer: 'Performer',
  advanced: 'Advanced',
  elite: 'Elite',
  hybrid_beast: 'Hybrid Beast',
};

export const ATHLETE_LEVEL_THRESHOLDS: Record<AthleteLevel, number> = {
  rookie: 0,
  performer: 40,
  advanced: 60,
  elite: 78,
  hybrid_beast: 90,
};

export function levelForScore(score: number): AthleteLevel {
  if (score >= ATHLETE_LEVEL_THRESHOLDS.hybrid_beast) return 'hybrid_beast';
  if (score >= ATHLETE_LEVEL_THRESHOLDS.elite) return 'elite';
  if (score >= ATHLETE_LEVEL_THRESHOLDS.advanced) return 'advanced';
  if (score >= ATHLETE_LEVEL_THRESHOLDS.performer) return 'performer';
  return 'rookie';
}

export interface HybridScore {
  id: string;
  clientId: string;
  scoreDate: string;

  strengthScore: number | null;
  enduranceScore: number | null;
  recoveryScore: number | null;
  consistencyScore: number | null;
  mobilityScore: number | null;
  nutritionScore: number | null;

  hybridAthleteScore: number;
  athleteLevel: AthleteLevel;

  currentStreakDays: number;
  longestStreakDays: number;

  createdAt: string;
}

// ════════════════════════════════════════════════════════════════════
// Achievements
// ════════════════════════════════════════════════════════════════════

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Achievement {
  id: string;
  clientId: string;
  achievementKey: string;
  achievementName: string;
  achievementDescription: string | null;
  achievementIcon: string | null;
  achievementTier: AchievementTier;
  earnedAt: string;
  awardedBy: string | null;
}

// ════════════════════════════════════════════════════════════════════
// Challenges
// ════════════════════════════════════════════════════════════════════

export type ChallengeType =
  | 'fat_loss'
  | 'hybrid'
  | 'streak'
  | 'volume'
  | 'race_prep';

export type EnrollmentStatus = 'active' | 'completed' | 'abandoned' | 'paused';

export interface Challenge {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  durationDays: number;
  challengeType: ChallengeType | null;
  targetMetric: string | null;
  targetValue: number | null;
  icon: string | null;
  heroImageUrl: string | null;
  accentColor: string;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
}

export interface ChallengeEnrollment {
  id: string;
  clientId: string;
  challengeId: string;
  enrolledAt: string;
  currentDay: number;
  currentValue: number;
  status: EnrollmentStatus;
  completedAt: string | null;
}
