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

export interface EnquiryAdminData {
  temperature?: LeadTemperature;
  plan_discussed?: PlanDiscussed;
  pricing_discussed?: boolean;
  budget_inr?: string;
  objections?: string;
  next_step?: NextStep;
  discovery_call_date?: string; // ISO date 'YYYY-MM-DD'
  follow_up_at?: string;        // ISO datetime
  source_channel?: string;      // 'instagram' | 'referral' | 'google' | 'other' (free text for flexibility)
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
