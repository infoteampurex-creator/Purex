/**
 * Pure types + shared constants for PUREX Mother Strong.
 *
 * Free of `'server-only'` so both server and client components can
 * import it. Server-only fetchers live in lib/data/mother-strong.ts.
 */

export const GOAL_OPTIONS = [
  { value: 'weight_loss',          label: 'Weight loss' },
  { value: 'hormonal_balance',     label: 'Hormonal balance' },
  { value: 'daily_activity',       label: 'Daily activity' },
  { value: 'stress_mental_health', label: 'Stress / mental health' },
  { value: 'general_fitness',      label: 'General fitness' },
  { value: 'doctors_advice',       label: "Doctor's advice" },
] as const;

export type GoalValue = (typeof GOAL_OPTIONS)[number]['value'];

export type ParticipantStatus = 'active' | 'dropped' | 'completed';

export type PreferredLanguage = 'en' | 'hi';

/** Full participant — admin-only view. Never exposed to public components. */
export interface AdminParticipant {
  id: string;
  displayId: string;            // 'PX001'
  fullName: string;
  whatsapp: string;             // 10 digits
  age: number;
  city: string;
  state: string;
  photoUrl: string | null;
  showPhotoPublicly: boolean;
  heightCm: number | null;
  weightKg: number | null;
  goal: GoalValue;
  healthCondition: string | null;
  emergencyContactName: string;
  emergencyContactNumber: string;
  preferredLanguage: PreferredLanguage;
  startDate: string;            // YYYY-MM-DD
  endDate: string;              // YYYY-MM-DD
  status: ParticipantStatus;
  createdAt: string;
}

/** Single-row settings. */
export interface MotherStrongConfig {
  challengeStartDate: string | null;
  dailyGoal: number;
  whatsappGroupLink: string | null;
  cohortLabel: string | null;
}

/** Public-safe leaderboard row (from mother_strong_leaderboard view). */
export interface LeaderboardRow {
  id: string;
  displayId: string;
  publicName: string;            // "Sravya K."
  city: string;
  publicPhotoUrl: string | null; // null when participant hid photo
  startDate: string;
  endDate: string;
  status: ParticipantStatus;
  daysElapsed: number;
  daysHitGoal: number;
  totalSteps: number;
  currentStreak: number;
  consistencyPct: number;
}

/** A single day cell in the 60-day grid. */
export interface DayCell {
  dayNumber: number;             // 1..60
  date: string;                  // YYYY-MM-DD
  stepCount: number | null;      // null = not yet entered
  hitGoal: boolean;
  isFuture: boolean;             // date > today (in IST)
}

/** Personal progress payload for /mother-strong/my-progress. */
export interface PersonalProgress {
  displayId: string;
  fullName: string;
  publicPhotoUrl: string | null;
  city: string;
  status: ParticipantStatus;
  rank: number | null;            // null if not yet ranked (no entries)
  totalParticipants: number;
  daysElapsed: number;
  daysHitGoal: number;
  totalSteps: number;
  currentStreak: number;
  consistencyPct: number;
  startDate: string;
  endDate: string;
  /** 60 cells indexed 0..59, exposing exact per-day breakdown. */
  calendar: DayCell[];
}

/** Admin photo-feed post. */
export interface JourneyPost {
  id: string;
  participantId: string | null;
  participantName: string | null;   // joined for the public feed
  participantPhotoUrl: string | null;
  caption: string | null;
  imageUrl: string;
  dayNumber: number | null;
  postedAt: string;
}

/** Daily targets / config seed for forms. */
export const DEFAULT_DAILY_GOAL = 10000;
export const CHALLENGE_DURATION_DAYS = 60;
