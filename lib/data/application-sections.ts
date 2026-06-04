/**
 * PURE X — Detailed Transformation Application form (Form B) config.
 *
 * Single source of truth for every section + question. The form
 * renderer at /application reads this array and builds the UI
 * dynamically. Adding a new section / question is purely a config
 * change here — no migration, no UI edits, no admin tweaks.
 *
 * Submission payload structure:
 *   {
 *     personal_info: { full_name, age, gender, phone, email },
 *     goals: { transformation_goals: [...] },
 *     lifestyle: { ... },
 *     ...
 *   }
 *
 * Each section key (snake_case) becomes a top-level field in the
 * `payload` JSONB column.
 */

export type FieldType =
  | 'short_text'
  | 'long_text'
  | 'email'
  | 'tel'
  | 'number'
  | 'radio'
  | 'select'
  | 'multi_select'
  | 'checkbox';

export interface FieldOption {
  value: string;
  label: string;
}

export interface Field {
  /** snake_case key — becomes the JSONB property */
  key: string;
  /** Visible label */
  label: string;
  type: FieldType;
  required?: boolean;
  /** Helper text below the field */
  help?: string;
  /** Placeholder for text inputs */
  placeholder?: string;
  /** Options for radio / select / multi_select */
  options?: FieldOption[];
  /** Min / max for number inputs */
  min?: number;
  max?: number;
  /** Auto-prefilled from ?email= query param (used to seed Section 1) */
  prefillFromQuery?: string;
}

export interface Section {
  /** snake_case key — becomes the section's top-level JSONB key */
  key: string;
  /** Visible section title (shown in the progress bar + header) */
  title: string;
  /** Optional intro paragraph at the top of the section */
  intro?: string;
  fields: Field[];
}

// ════════════════════════════════════════════════════════════════════
// SECTION CONFIG
// ════════════════════════════════════════════════════════════════════
//
// 11 sections per the Google form. Sections 1, 2, and the first
// question of Section 3 are captured below from the screenshots
// shared. Remaining sections (3.2+ through Section 11) need their
// fields added — drop new field objects into the relevant section's
// `fields: []` array as you share them. No other code changes.
//
// ════════════════════════════════════════════════════════════════════

export const APPLICATION_SECTIONS: Section[] = [
  // ─── Section 1 — Welcome / intent ─────────────────────────────
  {
    key: 'welcome',
    title: 'Welcome',
    intro:
      "We focus on building sustainable transformations through structured nutrition, intelligent training, accountability, and performance-based coaching. Please fill this form carefully — it helps us build a plan specifically for you.",
    fields: [
      {
        key: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        placeholder: 'your.email@example.com',
        prefillFromQuery: 'email',
      },
    ],
  },

  // ─── Section 2 — Personal information ─────────────────────────
  {
    key: 'personal_info',
    title: 'Personal Information',
    fields: [
      {
        key: 'full_name',
        label: 'Full Name',
        type: 'short_text',
        required: true,
      },
      {
        key: 'age',
        label: 'Age',
        type: 'number',
        required: true,
        min: 16,
        max: 100,
      },
      {
        key: 'gender',
        label: 'Gender',
        type: 'radio',
        required: true,
        options: [
          { value: 'female', label: 'Female' },
          { value: 'male', label: 'Male' },
          { value: 'prefer_not_to_say', label: 'Prefer not to say' },
        ],
      },
      {
        key: 'phone',
        label: 'Phone Number',
        type: 'tel',
        required: true,
        help: 'Ten digits, no +91 needed.',
        placeholder: '9876543210',
      },
      // Email collected in Section 1 — repeated here in the Google
      // form, omitted here to avoid double entry.
    ],
  },

  // ─── Section 3 — Goals ───────────────────────────────────────
  {
    key: 'goals',
    title: 'Your Goals',
    fields: [
      {
        key: 'transformation_goals',
        label: 'What transformation are you looking to achieve through TEAM PURE X?',
        type: 'multi_select',
        required: true,
        help: 'Select all that apply.',
        options: [
          { value: 'fat_loss', label: 'Fat Loss' },
          { value: 'muscle_gain', label: 'Muscle Gain' },
          { value: 'strength_building', label: 'Strength Building' },
          { value: 'athletic_performance', label: 'Athletic Performance' },
          { value: 'hybrid_fitness', label: 'Hybrid Fitness' },
          { value: 'marathon_running', label: 'Marathon / Running' },
          { value: 'general_fitness', label: 'General Fitness' },
          { value: 'postpartum_fitness', label: 'Postpartum Fitness' },
          { value: 'mobility_flexibility', label: 'Mobility & Flexibility' },
          { value: 'lifestyle_transformation', label: 'Lifestyle Transformation' },
        ],
      },
      // TODO: Add remaining 3.x questions from Google form as they
      // are shared. Drop new Field objects into this `fields` array.
    ],
  },

  // ─── Section 4 — Lifestyle (placeholder — fields to be added) ─
  {
    key: 'lifestyle',
    title: 'Your Lifestyle',
    intro: 'Help us understand your day-to-day so we can build a plan that fits.',
    fields: [
      // TODO: populate from Google form sections 4.x as shared.
    ],
  },

  // ─── Section 5 — Current fitness ──────────────────────────────
  {
    key: 'current_fitness',
    title: 'Current Fitness',
    fields: [
      // TODO: populate as shared.
    ],
  },

  // ─── Section 6 — Medical / health background ─────────────────
  {
    key: 'medical_background',
    title: 'Medical Background',
    intro: 'Stays private. Only the trainer + medical specialist see it.',
    fields: [
      // TODO: populate as shared.
    ],
  },

  // ─── Section 7 — Nutrition habits ────────────────────────────
  {
    key: 'nutrition',
    title: 'Nutrition Habits',
    fields: [
      // TODO: populate as shared.
    ],
  },

  // ─── Section 8 — Training history ────────────────────────────
  {
    key: 'training_history',
    title: 'Training History',
    fields: [
      // TODO: populate as shared.
    ],
  },

  // ─── Section 9 — Commitment level ────────────────────────────
  {
    key: 'commitment',
    title: 'Commitment Level',
    fields: [
      // TODO: populate as shared.
    ],
  },

  // ─── Section 10 — Schedule + logistics ───────────────────────
  {
    key: 'schedule',
    title: 'Schedule & Logistics',
    fields: [
      // TODO: populate as shared.
    ],
  },

  // ─── Section 11 — Final notes ────────────────────────────────
  {
    key: 'final_notes',
    title: 'Anything Else',
    intro: 'Last chance to share anything we should know.',
    fields: [
      {
        key: 'anything_else',
        label: 'Is there anything else you would like us to know?',
        type: 'long_text',
        required: false,
        help: 'Optional. Whatever you write here goes straight to your coach.',
      },
    ],
  },
];

/**
 * Field validation rules used by both the public form (client-side
 * Zod schema) and the server action (server-side Zod schema). Drop
 * a new field here when adding it — both sides pick it up.
 */
export function isFieldFilled(field: Field, value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'boolean') return true;
  return false;
}

export const APPLICATION_TOTAL_SECTIONS = APPLICATION_SECTIONS.length;
