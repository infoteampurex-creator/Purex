/**
 * Team Purex — Detailed Transformation Application form (Form B) config.
 *
 * Single source of truth for every section + question. The form
 * renderer at /application reads this array and builds the UI
 * dynamically. Adding a new question is purely a config change —
 * no migration, no UI edits, no admin tweaks.
 *
 * Submission payload structure:
 *   {
 *     welcome: { email },
 *     personal_info: { full_name, age, gender, phone, ... },
 *     goals: { transformation_goals: [...], ... },
 *     ...
 *   }
 *
 * Each section key (snake_case) becomes a top-level field in the
 * `payload` JSONB column.
 *
 * ─── Source: Google Form "TEAM Team Purex — Transformation Application
 *     Form" — 10 sections, 47 questions. Photo uploads (9.1) are
 *     captured as a paste-able shared-folder link until we wire
 *     Supabase Storage uploads in a follow-up.
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
  | 'checkbox'
  | 'scale';

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
  /** Min / max for number inputs (and scale endpoints) */
  min?: number;
  max?: number;
  /** Suffix for number inputs (cm, kg, etc.) */
  suffix?: string;
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
// SECTION CONFIG — mirrors the Google Form exactly.
// ════════════════════════════════════════════════════════════════════

export const APPLICATION_SECTIONS: Section[] = [
  // ─── Welcome / email capture ─────────────────────────────────────
  {
    key: 'welcome',
    title: 'Welcome',
    intro:
      "This is not just another fitness program. We focus on building sustainable transformations through structured nutrition, intelligent training, accountability, and performance-based coaching. Please fill this form carefully so we can build a plan that fits your lifestyle.",
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

  // ─── 1. Personal Information ─────────────────────────────────────
  {
    key: 'personal_info',
    title: '1. Personal Information',
    fields: [
      {
        key: 'full_name',
        label: '1.1. Full Name',
        type: 'short_text',
        required: true,
      },
      {
        key: 'age',
        label: '1.2. Age',
        type: 'number',
        required: true,
        min: 14,
        max: 100,
      },
      {
        key: 'gender',
        label: '1.3. Gender',
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
        label: '1.4. Phone Number',
        type: 'tel',
        required: true,
        placeholder: '9876543210',
        help: 'Include country code if outside India.',
      },
      {
        key: 'occupation',
        label: '1.6. Occupation',
        type: 'short_text',
        required: true,
        placeholder: 'e.g. Software engineer, school teacher, founder',
      },
      {
        key: 'city_country',
        label: '1.7. City & Country',
        type: 'short_text',
        required: true,
        placeholder: 'Bengaluru, India',
      },
    ],
  },

  // ─── 2. Goals & Motivation ───────────────────────────────────────
  {
    key: 'goals',
    title: '2. Goals & Motivation',
    fields: [
      {
        key: 'transformation_goals',
        label:
          '2.1. What transformation are you looking to achieve through TEAM Team Purex?',
        type: 'multi_select',
        required: true,
        help: 'Tick all that apply.',
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
      {
        key: 'whats_been_stopping_you',
        label: '2.2. What has been stopping you from achieving your fitness goals until now?',
        type: 'long_text',
        required: true,
      },
      {
        key: 'why_team_pure_x',
        label: '2.3. Why do you specifically want to work with TEAM Team Purex?',
        type: 'long_text',
        required: true,
      },
      {
        key: 'what_achieving_means',
        label: '2.4. What would achieving your goal mean to you personally?',
        type: 'long_text',
        required: true,
      },
    ],
  },

  // ─── 3. Commitment & Coaching ────────────────────────────────────
  {
    key: 'commitment',
    title: '3. Commitment & Coaching',
    fields: [
      {
        key: 'commitment_duration',
        label: '3.1. How long are you willing to commit towards improving your health & fitness?',
        type: 'radio',
        required: true,
        options: [
          { value: '3_months', label: '3 Months' },
          { value: '6_months', label: '6 Months' },
          { value: '12_months', label: '12 Months' },
          { value: 'long_term', label: 'Long Term Lifestyle Change' },
        ],
      },
      {
        key: 'ready_to_follow_process',
        label:
          '3.2. Our coaching includes accountability, structured systems, and regular check-ins. Are you ready to stay consistent and follow the process?',
        type: 'radio',
        required: true,
        options: [
          { value: 'yes_fully', label: 'Yes, fully committed' },
          { value: 'try_best', label: 'I will try my best' },
          { value: 'not_sure', label: 'Not sure yet' },
        ],
      },
      {
        key: 'financial_commitment',
        label:
          '3.4. Coaching requires both time and financial commitment. Which best describes your situation?',
        type: 'radio',
        required: true,
        options: [
          { value: 'ready_to_invest', label: 'I’m ready to invest in my transformation' },
          { value: 'budget_concerns', label: 'I have budget concerns but still interested' },
          { value: 'not_ready', label: 'Not ready financially right now' },
        ],
      },
    ],
  },

  // ─── 4. Body Details ─────────────────────────────────────────────
  {
    key: 'body_details',
    title: '4. Body Details',
    intro: 'Please provide values in centimetres / kilograms.',
    fields: [
      {
        key: 'height_cm',
        label: '4.1. Height',
        type: 'number',
        required: true,
        suffix: 'cm',
        min: 100,
        max: 230,
        placeholder: '170',
      },
      {
        key: 'weight_empty_stomach_kg',
        label: '4.2. Weight (empty stomach)',
        type: 'number',
        required: true,
        suffix: 'kg',
        min: 30,
        max: 250,
        placeholder: '72',
      },
      {
        key: 'neck_cm',
        label: '4.3. Neck',
        type: 'number',
        required: true,
        suffix: 'cm',
        min: 20,
        max: 70,
      },
      {
        key: 'chest_cm',
        label: '4.4. Chest',
        type: 'number',
        required: true,
        suffix: 'cm',
        min: 50,
        max: 180,
      },
      {
        key: 'left_bicep_cm',
        label: '4.5. Left Bicep',
        type: 'number',
        required: true,
        suffix: 'cm',
        min: 15,
        max: 70,
      },
      {
        key: 'right_bicep_cm',
        label: '4.5. Right Bicep',
        type: 'number',
        required: true,
        suffix: 'cm',
        min: 15,
        max: 70,
      },
      {
        key: 'belly_cm',
        label: '4.6. Belly',
        type: 'number',
        required: true,
        suffix: 'cm',
        min: 40,
        max: 200,
      },
      {
        key: 'waist_cm',
        label: '4.7. Waist',
        type: 'number',
        required: true,
        suffix: 'cm',
        min: 40,
        max: 200,
      },
      {
        key: 'hip_glute_cm',
        label: '4.8. Hip / Glute',
        type: 'number',
        required: true,
        suffix: 'cm',
        min: 50,
        max: 200,
      },
      {
        key: 'left_thigh_cm',
        label: '4.9. Left Thigh',
        type: 'number',
        required: true,
        suffix: 'cm',
        min: 25,
        max: 120,
      },
      {
        key: 'right_thigh_cm',
        label: '4.10. Right Thigh',
        type: 'number',
        required: true,
        suffix: 'cm',
        min: 25,
        max: 120,
      },
    ],
  },

  // ─── 5. Medical & Health Information ─────────────────────────────
  {
    key: 'medical',
    title: '5. Medical & Health Information',
    intro: 'Stays private. Only your coach and the medical specialist see it.',
    fields: [
      {
        key: 'current_conditions',
        label: '5.1. Are you currently suffering from any of these?',
        type: 'multi_select',
        required: true,
        help: 'Tick all that apply.',
        options: [
          { value: 'thyroid', label: 'Thyroid' },
          { value: 'pcos_pcod', label: 'PCOS / PCOD' },
          { value: 'blood_pressure', label: 'Blood Pressure' },
          { value: 'diabetes', label: 'Diabetes / Blood Sugar' },
          { value: 'knee_pain', label: 'Knee Pain' },
          { value: 'back_pain', label: 'Back Pain' },
          { value: 'asthma', label: 'Asthma' },
          { value: 'none', label: 'None' },
        ],
      },
      {
        key: 'injuries_surgeries',
        label: '5.2. Any injuries, surgeries, or medical conditions we should know about?',
        type: 'long_text',
        required: false,
      },
      {
        key: 'medications',
        label: '5.3. Are you currently taking any medications?',
        type: 'long_text',
        required: false,
        help: 'List names + dosage if comfortable. Otherwise type "will share on call".',
      },
      {
        key: 'energy_level',
        label: 'How would you rate your daily energy levels?',
        type: 'scale',
        required: false,
        min: 1,
        max: 10,
        help: '1 = constantly drained · 10 = sharp and high-energy all day.',
      },
    ],
  },

  // ─── 6. Lifestyle Assessment ─────────────────────────────────────
  {
    key: 'lifestyle',
    title: '6. Lifestyle Assessment',
    fields: [
      {
        key: 'work_study_lifestyle',
        label: '6.1. What does your work/study lifestyle look like?',
        type: 'radio',
        required: true,
        options: [
          { value: 'desk_job', label: 'Desk Job' },
          { value: 'work_from_home', label: 'Work From Home' },
          { value: 'physically_active_job', label: 'Physically Active Job' },
          { value: 'student', label: 'Student' },
          { value: 'shift_work', label: 'Shift Work' },
        ],
      },
      {
        key: 'daily_activity',
        label: '6.2. How active are you daily?',
        type: 'radio',
        required: true,
        options: [
          { value: 'sedentary', label: 'Sedentary' },
          { value: 'lightly_active', label: 'Lightly Active' },
          { value: 'moderately_active', label: 'Moderately Active' },
          { value: 'highly_active', label: 'Highly Active' },
        ],
      },
      {
        key: 'average_sleep',
        label: '6.3. Average Sleep Duration',
        type: 'radio',
        required: true,
        options: [
          { value: 'under_5', label: 'Less than 5 hrs' },
          { value: '5_6', label: '5–6 hrs' },
          { value: '6_7', label: '6–7 hrs' },
          { value: '7_8', label: '7–8 hrs' },
          { value: '8_plus', label: '8+ hrs' },
        ],
      },
    ],
  },

  // ─── 7. Nutrition Assessment ─────────────────────────────────────
  {
    key: 'nutrition',
    title: '7. Nutrition Assessment',
    fields: [
      {
        key: 'food_preference',
        label: '7.1. Food Preference',
        type: 'radio',
        required: true,
        options: [
          { value: 'vegetarian', label: 'Vegetarian' },
          { value: 'eggetarian', label: 'Eggetarian' },
          { value: 'non_vegetarian', label: 'Non Vegetarian' },
          { value: 'vegan', label: 'Vegan' },
        ],
      },
      {
        key: 'eating_habits',
        label: '7.2. Walk us through your current eating habits in detail',
        type: 'long_text',
        required: false,
        help: 'Please explain in detail — typical breakfast, lunch, dinner, snacks, timing, what changes on busy days.',
      },
      {
        key: 'meals_per_day',
        label: '7.3. How many meals do you usually eat daily?',
        type: 'radio',
        required: true,
        options: [
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
          { value: '5_plus', label: '5+' },
        ],
      },
      {
        key: 'water_intake',
        label: '7.4. Water Intake Per Day',
        type: 'radio',
        required: true,
        options: [
          { value: 'under_1l', label: 'Less than 1L' },
          { value: '1_2l', label: '1–2L' },
          { value: '2_3l', label: '2–3L' },
          { value: '3l_plus', label: '3L+' },
        ],
      },
      {
        key: 'food_allergies_dislikes',
        label: '7.5. Any food allergies or foods you dislike?',
        type: 'long_text',
        required: true,
        help: 'Nuts, dairy, gluten, specific cuisines — anything we should plan around.',
      },
      {
        key: 'alcohol_consumption',
        label: '7.6. Alcohol Consumption',
        type: 'radio',
        required: true,
        options: [
          { value: 'never', label: 'Never' },
          { value: 'occasionally', label: 'Occasionally' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'frequently', label: 'Frequently' },
        ],
      },
    ],
  },

  // ─── 8. Training Assessment ──────────────────────────────────────
  {
    key: 'training',
    title: '8. Training Assessment',
    fields: [
      {
        key: 'workout_experience',
        label: '8.1. Current Workout Experience',
        type: 'radio',
        required: true,
        options: [
          { value: 'beginner', label: 'Beginner' },
          { value: 'intermediate', label: 'Intermediate' },
          { value: 'advanced', label: 'Advanced' },
        ],
      },
      {
        key: 'currently_working_out',
        label: '8.2. Are you currently working out?',
        type: 'radio',
        required: true,
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        key: 'preferred_workout_style',
        label: '8.3. Preferred Workout Style',
        type: 'multi_select',
        required: true,
        help: 'Tick all that apply.',
        options: [
          { value: 'gym_workouts', label: 'Gym Workouts' },
          { value: 'home_workouts', label: 'Home Workouts' },
          { value: 'running', label: 'Running' },
          { value: 'strength_training', label: 'Strength Training' },
          { value: 'functional_training', label: 'Functional Training' },
          { value: 'hybrid_training', label: 'Hybrid Training' },
          { value: 'yoga', label: 'Yoga' },
          { value: 'mobility', label: 'Mobility' },
        ],
      },
      {
        key: 'gym_access',
        label: '8.4. Do you have gym access?',
        type: 'radio',
        required: true,
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        key: 'equipment_at_home',
        label: '8.5. Equipment available at home',
        type: 'long_text',
        required: false,
        help: 'List what you have — dumbbells, mat, bands, bench, pull-up bar, etc.',
      },
      {
        key: 'training_days_per_week',
        label: '8.6. How many days per week can you realistically train?',
        type: 'radio',
        required: true,
        options: [
          { value: '3', label: '3 Days' },
          { value: '4', label: '4 Days' },
          { value: '5', label: '5 Days' },
          { value: '6', label: '6 Days' },
        ],
      },
    ],
  },

  // ─── 9. Progress Tracking ────────────────────────────────────────
  // Original Google form uses file uploads for 4 angles. Until we
  // wire Supabase Storage, we ask for a shared-folder link. The
  // admin can then ask for them on WhatsApp during the call.
  {
    key: 'progress_tracking',
    title: '9. Progress Tracking',
    intro:
      'We need current photos to set a baseline. Upload them to a Google Drive / iCloud / OneDrive folder and paste the share link below — make sure the folder is viewable by anyone with the link.',
    fields: [
      {
        key: 'photos_link',
        label: '9.1. Photo folder link (Front · Back · Left · Right profiles)',
        type: 'long_text',
        required: true,
        placeholder: 'https://drive.google.com/...',
        help:
          'Include 4 photos: Front Full Body, Back Full Body, Left Profile, Right Profile. Tight-fitting clothes work best for accurate measurements.',
      },
    ],
  },

  // ─── 10. Final Step ──────────────────────────────────────────────
  {
    key: 'final_step',
    title: '10. Final Step',
    fields: [
      {
        key: 'anything_else',
        label: '10.1. Anything else you want TEAM Team Purex to know?',
        type: 'long_text',
        required: false,
      },
      {
        key: 'agreement',
        label:
          '10.2. Before joining TEAM Team Purex, understand that transformation requires consistency, patience, discipline, and accountability. There are no shortcuts. We provide the system, structure, and support — your responsibility is to execute consistently.',
        type: 'checkbox',
        required: true,
        help: 'Tick to agree.',
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
  if (typeof value === 'boolean') return value === true || !field.required;
  return false;
}

export const APPLICATION_TOTAL_SECTIONS = APPLICATION_SECTIONS.length;
