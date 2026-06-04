/**
 * Pure types + shared constants for the public enquiry funnel.
 *
 * Free of `'server-only'` so both server and client components can
 * import.
 */

export const PRIMARY_GOAL_OPTIONS = [
  { value: 'fat_loss',                 label: 'Fat Loss' },
  { value: 'muscle_gain',              label: 'Muscle Gain' },
  { value: 'strength_building',        label: 'Strength Building' },
  { value: 'athletic_performance',     label: 'Athletic Performance' },
  { value: 'hybrid_fitness',           label: 'Hybrid Fitness' },
  { value: 'marathon_running',         label: 'Marathon / Running' },
  { value: 'general_fitness',          label: 'General Fitness' },
  { value: 'postpartum_fitness',       label: 'Postpartum Fitness' },
  { value: 'mobility_flexibility',     label: 'Mobility & Flexibility' },
  { value: 'lifestyle_transformation', label: 'Lifestyle Transformation' },
] as const;

export type PrimaryGoal = (typeof PRIMARY_GOAL_OPTIONS)[number]['value'];

export const START_TIMING_OPTIONS = [
  { value: 'immediately',     label: 'Immediately', help: 'I\'m ready to start this week.' },
  { value: 'within_2_weeks',  label: 'Within 2 weeks', help: 'I want to start soon.' },
  { value: 'within_month',    label: 'Within a month', help: 'I\'m planning ahead.' },
  { value: 'within_3_months', label: 'Within 3 months', help: 'Still researching options.' },
  { value: 'just_exploring',  label: 'Just exploring', help: 'No urgency yet.' },
] as const;

export type StartTiming = (typeof START_TIMING_OPTIONS)[number]['value'];

export type EnquiryStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'converted'
  | 'rejected';

export const ENQUIRY_STATUS_LABEL: Record<EnquiryStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  converted: 'Converted',
  rejected: 'Not a fit',
};

export const ENQUIRY_STATUS_COLOR: Record<EnquiryStatus, string> = {
  new: '#c6ff3d',
  contacted: '#7dd3ff',
  qualified: '#ffd24d',
  converted: '#a78bfa',
  rejected: '#5a6055',
};

// ────────────────────────────────────────────────────────────────────
// Admin-captured discovery fields (stored as JSONB in enquiries.admin_data).
//
// Kept as a flexible object so we can iterate without migrations.
// Every field is optional — admin team fills in what they have.
// ────────────────────────────────────────────────────────────────────

export const LEAD_TEMPERATURE_OPTIONS = [
  { value: 'cold', label: 'Cold',  color: '#7dd3ff' },
  { value: 'warm', label: 'Warm',  color: '#ffd24d' },
  { value: 'hot',  label: 'Hot',   color: '#ff7a3d' },
] as const;

export type LeadTemperature = (typeof LEAD_TEMPERATURE_OPTIONS)[number]['value'];

export const PLAN_DISCUSSED_OPTIONS = [
  { value: 'one_to_one',       label: 'One-on-One Coaching' },
  { value: 'group',            label: 'Group Coaching' },
  { value: 'transformation',   label: 'Transformation Program' },
  { value: 'nutrition_only',   label: 'Nutrition Only' },
  { value: 'consultation',     label: 'Consultation Only' },
  { value: 'undecided',        label: 'Not Decided Yet' },
] as const;

export type PlanDiscussed = (typeof PLAN_DISCUSSED_OPTIONS)[number]['value'];

export const NEXT_STEP_OPTIONS = [
  { value: 'send_application', label: 'Send detailed application' },
  { value: 'follow_up',        label: 'Follow up later' },
  { value: 'send_pricing',     label: 'Send pricing' },
  { value: 'book_call',        label: 'Book a second call' },
  { value: 'awaiting_decision', label: 'Awaiting client decision' },
  { value: 'closed_won',       label: 'Closed — converted' },
  { value: 'closed_lost',      label: 'Closed — lost' },
] as const;

export type NextStep = (typeof NEXT_STEP_OPTIONS)[number]['value'];

// ────────────────────────────────────────────────────────────────────
// Form-B-style discovery options — admin captures these on the call.
// Values match `lib/data/application-sections.ts` exactly so they're
// portable if the visitor later self-fills Form B at /application.
// ────────────────────────────────────────────────────────────────────

export const GENDER_OPTIONS = [
  { value: 'female',             label: 'Female' },
  { value: 'male',               label: 'Male' },
  { value: 'prefer_not_to_say',  label: 'Prefer not to say' },
] as const;

export type Gender = (typeof GENDER_OPTIONS)[number]['value'];

export const FOOD_PREFERENCE_OPTIONS = [
  { value: 'vegetarian',     label: 'Vegetarian' },
  { value: 'eggetarian',     label: 'Eggetarian' },
  { value: 'non_vegetarian', label: 'Non Vegetarian' },
  { value: 'vegan',          label: 'Vegan' },
] as const;

export type FoodPreference = (typeof FOOD_PREFERENCE_OPTIONS)[number]['value'];

export const WORKOUT_EXPERIENCE_OPTIONS = [
  { value: 'beginner',     label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced',     label: 'Advanced' },
] as const;

export type WorkoutExperience = (typeof WORKOUT_EXPERIENCE_OPTIONS)[number]['value'];

export const TRAINING_DAYS_OPTIONS = [
  { value: '3', label: '3 days' },
  { value: '4', label: '4 days' },
  { value: '5', label: '5 days' },
  { value: '6', label: '6 days' },
] as const;

export type TrainingDays = (typeof TRAINING_DAYS_OPTIONS)[number]['value'];

export const COMMITMENT_DURATION_OPTIONS = [
  { value: '3_months',   label: '3 months' },
  { value: '6_months',   label: '6 months' },
  { value: '12_months',  label: '12 months' },
  { value: 'long_term',  label: 'Long-term lifestyle' },
] as const;

export type CommitmentDuration =
  (typeof COMMITMENT_DURATION_OPTIONS)[number]['value'];

export const MEDICAL_CONDITION_OPTIONS = [
  { value: 'thyroid',         label: 'Thyroid' },
  { value: 'pcos_pcod',       label: 'PCOS / PCOD' },
  { value: 'blood_pressure',  label: 'Blood Pressure' },
  { value: 'diabetes',        label: 'Diabetes / Blood Sugar' },
  { value: 'knee_pain',       label: 'Knee Pain' },
  { value: 'back_pain',       label: 'Back Pain' },
  { value: 'asthma',          label: 'Asthma' },
  { value: 'none',            label: 'None' },
] as const;

export type MedicalCondition = (typeof MEDICAL_CONDITION_OPTIONS)[number]['value'];

export interface EnquiryAdminData {
  // ── Sales / discovery ──────────────────────────────────────────
  temperature?: LeadTemperature;
  plan_discussed?: PlanDiscussed;
  pricing_discussed?: boolean;
  budget_inr?: string;
  objections?: string;
  next_step?: NextStep;
  discovery_call_date?: string; // ISO date 'YYYY-MM-DD'
  follow_up_at?: string;        // ISO datetime
  source_channel?: string;

  // ── About the client (Google Form sections 1, 4) ───────────────
  age?: number;
  gender?: Gender;
  occupation?: string;
  city_country?: string;
  height_cm?: number;
  weight_kg?: number;

  // ── Medical (Google Form section 5) ────────────────────────────
  medical_conditions?: MedicalCondition[];
  injuries_notes?: string;
  energy_level?: number; // 1-10

  // ── Habits + Training (Google Form sections 7, 8) ─────────────
  food_preference?: FoodPreference;
  currently_working_out?: boolean;
  workout_experience?: WorkoutExperience;
  gym_access?: boolean;
  training_days_per_week?: TrainingDays;

  // ── Commitment (Google Form section 3) ─────────────────────────
  commitment_duration?: CommitmentDuration;
}

export interface AdminEnquiry {
  id: string;
  fullName: string;
  whatsapp: string;
  email: string;
  primaryGoal: PrimaryGoal;
  startTiming: StartTiming;
  message: string | null;
  preferredLanguage: 'en' | 'hi';
  status: EnquiryStatus;
  assignedSpecialistId: string | null;
  assignedSpecialistName: string | null;
  adminNotes: string | null;
  source: string | null;
  createdAt: string;
  contactedAt: string | null;
  convertedAt: string | null;
  adminData: EnquiryAdminData;
}
