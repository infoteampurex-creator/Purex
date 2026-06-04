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

  // ─── Section 4 — Lifestyle ────────────────────────────────────
  {
    key: 'lifestyle',
    title: 'Your Lifestyle',
    intro: 'Help us understand your day-to-day so we can build a plan that fits.',
    fields: [
      {
        key: 'occupation',
        label: 'What do you do for work?',
        type: 'short_text',
        required: true,
        placeholder: 'e.g. Software engineer, school teacher, founder',
      },
      {
        key: 'work_hours_per_day',
        label: 'Average work hours per day',
        type: 'radio',
        required: true,
        options: [
          { value: 'under_8', label: 'Less than 8 hours' },
          { value: '8_to_10', label: '8 – 10 hours' },
          { value: '10_to_12', label: '10 – 12 hours' },
          { value: 'over_12', label: 'More than 12 hours' },
        ],
      },
      {
        key: 'sitting_time',
        label: 'How much of your day is sedentary (sitting at a desk, driving, on screens)?',
        type: 'radio',
        required: true,
        options: [
          { value: 'mostly_active', label: 'Mostly active — I move around a lot' },
          { value: 'mixed', label: 'Mixed — some sitting, some moving' },
          { value: 'mostly_sitting', label: 'Mostly sitting — 6+ hours' },
          { value: 'all_day_sitting', label: 'All day at a desk' },
        ],
      },
      {
        key: 'stress_level',
        label: 'How would you rate your current stress level?',
        type: 'radio',
        required: true,
        options: [
          { value: 'low', label: 'Low — life feels manageable' },
          { value: 'moderate', label: 'Moderate — busy but coping' },
          { value: 'high', label: 'High — feeling stretched thin' },
          { value: 'overwhelming', label: 'Overwhelming — burnout territory' },
        ],
      },
      {
        key: 'sleep_hours',
        label: 'Average sleep per night',
        type: 'radio',
        required: true,
        options: [
          { value: 'under_5', label: 'Under 5 hours' },
          { value: '5_to_6', label: '5 – 6 hours' },
          { value: '6_to_7', label: '6 – 7 hours' },
          { value: '7_to_8', label: '7 – 8 hours' },
          { value: 'over_8', label: 'More than 8 hours' },
        ],
      },
      {
        key: 'biggest_challenge',
        label: 'What\'s been your biggest challenge with fitness so far?',
        type: 'long_text',
        required: true,
        help: 'Be honest — this helps us coach you, not judge you.',
      },
    ],
  },

  // ─── Section 5 — Current fitness ──────────────────────────────
  {
    key: 'current_fitness',
    title: 'Current Fitness',
    fields: [
      {
        key: 'self_rating',
        label: 'How would you rate your current fitness level?',
        type: 'radio',
        required: true,
        options: [
          { value: 'beginner', label: 'Beginner — starting fresh or returning after a long break' },
          { value: 'recreational', label: 'Recreational — I move a few times a week, no structured plan' },
          { value: 'intermediate', label: 'Intermediate — I train regularly, results are okay' },
          { value: 'advanced', label: 'Advanced — I train hard with structure' },
        ],
      },
      {
        key: 'workouts_per_week',
        label: 'How many structured workouts do you currently do per week?',
        type: 'radio',
        required: true,
        options: [
          { value: '0', label: '0 — none' },
          { value: '1_2', label: '1 – 2' },
          { value: '3_4', label: '3 – 4' },
          { value: '5_plus', label: '5 or more' },
        ],
      },
      {
        key: 'workout_types',
        label: 'What types of training are you currently doing? (Select all that apply)',
        type: 'multi_select',
        required: false,
        options: [
          { value: 'weight_training', label: 'Weight training / gym' },
          { value: 'home_bodyweight', label: 'Home / bodyweight' },
          { value: 'running', label: 'Running' },
          { value: 'cycling', label: 'Cycling' },
          { value: 'swimming', label: 'Swimming' },
          { value: 'yoga', label: 'Yoga / Pilates' },
          { value: 'sports', label: 'Sports (cricket, football, etc.)' },
          { value: 'group_classes', label: 'Group classes (CrossFit, HIIT, etc.)' },
          { value: 'walking', label: 'Walking' },
          { value: 'none', label: 'Nothing structured' },
        ],
      },
      {
        key: 'energy_level',
        label: 'How is your day-to-day energy?',
        type: 'radio',
        required: true,
        options: [
          { value: 'strong', label: 'Strong — I feel sharp most of the day' },
          { value: 'okay', label: 'Okay — some afternoon dips' },
          { value: 'low', label: 'Low — I drag through most days' },
          { value: 'depleted', label: 'Depleted — chronic fatigue' },
        ],
      },
      {
        key: 'current_height_cm',
        label: 'Height (cm)',
        type: 'number',
        required: false,
        min: 100,
        max: 230,
        placeholder: '170',
      },
      {
        key: 'current_weight_kg',
        label: 'Current weight (kg)',
        type: 'number',
        required: false,
        min: 30,
        max: 250,
        placeholder: '72',
      },
    ],
  },

  // ─── Section 6 — Medical / health background ─────────────────
  {
    key: 'medical_background',
    title: 'Medical Background',
    intro: 'Stays private. Only the trainer + medical specialist see it. Be thorough — this keeps you safe.',
    fields: [
      {
        key: 'chronic_conditions',
        label: 'Any chronic health conditions we should know about? (Select all that apply)',
        type: 'multi_select',
        required: false,
        options: [
          { value: 'diabetes', label: 'Diabetes (Type 1 or 2)' },
          { value: 'hypertension', label: 'High blood pressure' },
          { value: 'thyroid', label: 'Thyroid (hypo or hyper)' },
          { value: 'pcos', label: 'PCOS / PCOD' },
          { value: 'cholesterol', label: 'High cholesterol' },
          { value: 'asthma', label: 'Asthma / respiratory' },
          { value: 'heart', label: 'Heart condition' },
          { value: 'depression_anxiety', label: 'Depression / anxiety' },
          { value: 'autoimmune', label: 'Autoimmune condition' },
          { value: 'none', label: 'None of the above' },
        ],
      },
      {
        key: 'condition_details',
        label: 'Details on any condition(s) selected above',
        type: 'long_text',
        required: false,
        help: 'Diagnosis date, severity, how it\'s currently managed.',
      },
      {
        key: 'medications',
        label: 'Are you on any regular medications or supplements?',
        type: 'long_text',
        required: false,
        help: 'List names + dosage if comfortable. Otherwise just type "yes — will share on call".',
      },
      {
        key: 'injuries',
        label: 'Any current injuries or chronic pain?',
        type: 'long_text',
        required: false,
        help: 'Back pain, knee issues, shoulder restrictions, etc. Anything we should plan around.',
      },
      {
        key: 'recent_surgery',
        label: 'Any surgery in the last 12 months?',
        type: 'radio',
        required: true,
        options: [
          { value: 'no', label: 'No' },
          { value: 'yes_cleared', label: 'Yes — cleared for exercise by doctor' },
          { value: 'yes_not_cleared', label: 'Yes — not yet cleared' },
        ],
      },
      {
        key: 'pregnancy',
        label: 'Are you currently pregnant or recently postpartum (less than 6 months)?',
        type: 'radio',
        required: false,
        options: [
          { value: 'no', label: 'No / not applicable' },
          { value: 'pregnant', label: 'Pregnant' },
          { value: 'postpartum', label: 'Postpartum (under 6 months)' },
        ],
      },
    ],
  },

  // ─── Section 7 — Nutrition habits ────────────────────────────
  {
    key: 'nutrition',
    title: 'Nutrition Habits',
    fields: [
      {
        key: 'dietary_preference',
        label: 'Your dietary preference',
        type: 'radio',
        required: true,
        options: [
          { value: 'omnivore', label: 'Omnivore — I eat everything' },
          { value: 'eggetarian', label: 'Eggetarian — vegetarian + eggs' },
          { value: 'vegetarian', label: 'Vegetarian' },
          { value: 'vegan', label: 'Vegan' },
          { value: 'jain', label: 'Jain' },
          { value: 'pescatarian', label: 'Pescatarian (fish only)' },
        ],
      },
      {
        key: 'meals_per_day',
        label: 'How many meals do you usually eat per day?',
        type: 'radio',
        required: true,
        options: [
          { value: '1_2', label: '1 – 2 meals' },
          { value: '3', label: '3 meals' },
          { value: '4_5', label: '4 – 5 meals (with snacks)' },
          { value: 'irregular', label: 'Irregular — depends on the day' },
        ],
      },
      {
        key: 'water_intake_litres',
        label: 'Roughly how much water do you drink per day?',
        type: 'radio',
        required: true,
        options: [
          { value: 'under_1', label: 'Less than 1 litre' },
          { value: '1_2', label: '1 – 2 litres' },
          { value: '2_3', label: '2 – 3 litres' },
          { value: 'over_3', label: 'More than 3 litres' },
        ],
      },
      {
        key: 'eating_out_frequency',
        label: 'How often do you eat out or order in?',
        type: 'radio',
        required: true,
        options: [
          { value: 'rare', label: 'Rare — special occasions only' },
          { value: 'weekly', label: '1 – 2 times a week' },
          { value: 'frequent', label: '3 – 5 times a week' },
          { value: 'daily', label: 'Almost every day' },
        ],
      },
      {
        key: 'alcohol_frequency',
        label: 'Alcohol intake',
        type: 'radio',
        required: true,
        options: [
          { value: 'none', label: 'Don\'t drink' },
          { value: 'occasional', label: 'Occasionally (a few times a month)' },
          { value: 'weekly', label: 'Weekly (1 – 2 times a week)' },
          { value: 'frequent', label: 'Frequently (3+ times a week)' },
        ],
      },
      {
        key: 'food_allergies',
        label: 'Any food allergies or strict avoidances?',
        type: 'long_text',
        required: false,
        help: 'Nuts, dairy, gluten, specific cuisines — anything we should plan around.',
      },
      {
        key: 'biggest_nutrition_struggle',
        label: 'What\'s your biggest nutrition struggle right now?',
        type: 'long_text',
        required: false,
        help: 'Late-night cravings, no time to cook, eating too much sugar, etc.',
      },
    ],
  },

  // ─── Section 8 — Training history ────────────────────────────
  {
    key: 'training_history',
    title: 'Training History',
    fields: [
      {
        key: 'past_coaching',
        label: 'Have you worked with a coach or trainer before?',
        type: 'radio',
        required: true,
        options: [
          { value: 'no', label: 'No — this would be my first time' },
          { value: 'gym_trainer', label: 'Yes — gym trainer' },
          { value: 'online_coach', label: 'Yes — online coach' },
          { value: 'physiotherapist', label: 'Yes — physiotherapist / clinical' },
          { value: 'multiple', label: 'Yes — multiple coaches over the years' },
        ],
      },
      {
        key: 'longest_consistent_period',
        label: 'What\'s the longest you\'ve stayed consistent with training?',
        type: 'radio',
        required: true,
        options: [
          { value: 'never', label: 'Never really stuck with anything' },
          { value: 'few_weeks', label: 'A few weeks' },
          { value: '1_3_months', label: '1 – 3 months' },
          { value: '3_6_months', label: '3 – 6 months' },
          { value: '6_12_months', label: '6 – 12 months' },
          { value: 'over_year', label: 'Over a year' },
        ],
      },
      {
        key: 'why_stopped',
        label: 'When you\'ve stopped in the past, what got in the way?',
        type: 'long_text',
        required: true,
        help: 'Time, motivation, injury, life changes, lack of results — name it honestly.',
      },
      {
        key: 'what_worked',
        label: 'What\'s worked best for you in the past?',
        type: 'long_text',
        required: false,
        help: 'A specific coach, a routine, a season of life. Helps us replicate what fits you.',
      },
    ],
  },

  // ─── Section 9 — Commitment level ────────────────────────────
  {
    key: 'commitment',
    title: 'Commitment Level',
    intro: 'Honest answers help us match the right plan to your capacity — not over-promise.',
    fields: [
      {
        key: 'days_available_per_week',
        label: 'Realistically, how many days a week can you commit to structured training?',
        type: 'radio',
        required: true,
        options: [
          { value: '2', label: '2 days' },
          { value: '3', label: '3 days' },
          { value: '4', label: '4 days' },
          { value: '5_plus', label: '5+ days' },
        ],
      },
      {
        key: 'session_length',
        label: 'How long can each session realistically be?',
        type: 'radio',
        required: true,
        options: [
          { value: '30_min', label: '30 minutes' },
          { value: '45_min', label: '45 minutes' },
          { value: '60_min', label: '60 minutes' },
          { value: '90_min', label: '90 minutes or more' },
        ],
      },
      {
        key: 'tracking_willingness',
        label: 'Are you willing to log workouts, meals, and weight daily?',
        type: 'radio',
        required: true,
        options: [
          { value: 'yes', label: 'Yes — I understand consistency is the lever' },
          { value: 'workouts_only', label: 'Workouts yes, meals/weight is harder' },
          { value: 'weekly_only', label: 'Prefer weekly check-ins over daily logging' },
          { value: 'unsure', label: 'Not sure yet — open to trying' },
        ],
      },
      {
        key: 'why_now',
        label: 'Why is now the right time for you?',
        type: 'long_text',
        required: true,
        help: 'A milestone, a health event, a goal date — what\'s pushing the decision.',
      },
      {
        key: 'budget_comfort',
        label: 'PURE X coaching is a premium investment. Are you comfortable discussing pricing on the call?',
        type: 'radio',
        required: true,
        options: [
          { value: 'yes', label: 'Yes — I understand quality coaching has a cost' },
          { value: 'need_details', label: 'I need the details first to decide' },
          { value: 'budget_concern', label: 'I have a strict budget — flexibility matters' },
        ],
      },
    ],
  },

  // ─── Section 10 — Schedule + logistics ───────────────────────
  {
    key: 'schedule',
    title: 'Schedule & Logistics',
    fields: [
      {
        key: 'preferred_workout_time',
        label: 'When can you train most consistently?',
        type: 'radio',
        required: true,
        options: [
          { value: 'early_morning', label: 'Early morning (before 8 AM)' },
          { value: 'morning', label: 'Morning (8 – 11 AM)' },
          { value: 'midday', label: 'Midday (11 AM – 2 PM)' },
          { value: 'afternoon', label: 'Afternoon (2 – 5 PM)' },
          { value: 'evening', label: 'Evening (5 – 9 PM)' },
          { value: 'late_night', label: 'Late night (after 9 PM)' },
        ],
      },
      {
        key: 'training_location',
        label: 'Where will you primarily train?',
        type: 'radio',
        required: true,
        options: [
          { value: 'gym', label: 'Commercial gym' },
          { value: 'home_full', label: 'Home — full equipment setup' },
          { value: 'home_minimal', label: 'Home — minimal equipment (mat, bands, dumbbells)' },
          { value: 'home_bodyweight', label: 'Home — bodyweight only' },
          { value: 'outdoor', label: 'Outdoor (parks, tracks)' },
          { value: 'mixed', label: 'Mix of locations' },
        ],
      },
      {
        key: 'equipment_access',
        label: 'What equipment do you have access to? (Select all that apply)',
        type: 'multi_select',
        required: false,
        options: [
          { value: 'full_gym', label: 'Full commercial gym (barbells, machines, racks)' },
          { value: 'dumbbells', label: 'Dumbbells' },
          { value: 'kettlebells', label: 'Kettlebells' },
          { value: 'resistance_bands', label: 'Resistance bands' },
          { value: 'pull_up_bar', label: 'Pull-up bar' },
          { value: 'cardio_machine', label: 'Cardio machine (treadmill / bike / rower)' },
          { value: 'bench', label: 'Bench' },
          { value: 'yoga_mat', label: 'Yoga mat' },
          { value: 'none', label: 'Nothing — bodyweight only' },
        ],
      },
      {
        key: 'travel_frequency',
        label: 'How often do you travel for work or otherwise?',
        type: 'radio',
        required: true,
        options: [
          { value: 'rare', label: 'Rare — mostly at home base' },
          { value: 'monthly', label: 'Once a month or so' },
          { value: 'weekly', label: 'A few times a month' },
          { value: 'frequent', label: 'Frequently — on the road every week' },
        ],
      },
      {
        key: 'family_commitments',
        label: 'Family / care commitments that affect your schedule?',
        type: 'long_text',
        required: false,
        help: 'Kids, parents, partner. Tell us so we plan around real life.',
      },
      {
        key: 'preferred_coach_communication',
        label: 'How would you prefer to communicate with your coach?',
        type: 'radio',
        required: true,
        options: [
          { value: 'whatsapp', label: 'WhatsApp messages' },
          { value: 'voice_notes', label: 'Voice notes' },
          { value: 'video_calls', label: 'Scheduled video calls' },
          { value: 'mixed', label: 'Mix of all — depends on the topic' },
        ],
      },
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
