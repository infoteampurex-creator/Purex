/**
 * Lightweight string dictionary for PUREX Mother Strong.
 *
 * Two locales are supported: English (en) and Hindi (hi). Hindi
 * currently falls back to the English copy — translator can replace
 * each `hi:` block in place when ready. Keys are designed so that
 * fallback to English never produces a runtime crash.
 *
 * Usage:
 *   import { ms } from '@/lib/i18n/mother-strong';
 *   const t = ms(lang);
 *   t.register.fullName;
 */

import { type GoalValue, type PreferredLanguage } from '@/lib/data/mother-strong-types';

interface BrandStrings {
  name: string;
}

interface RegisterStrings {
  title: string;
  subtitle: string;

  // Identity
  fullName: string;
  fullNameHelp: string;
  whatsapp: string;
  whatsappHelp: string;
  age: string;
  ageHelp: string;
  seniorWarning: string;
  city: string;
  state: string;

  // Photo
  photo: string;
  photoHelp: string;
  showPhoto: string;
  showPhotoHelp: string;

  // Vitals + goal
  height: string;
  weight: string;
  goal: string;
  goalHelp: string;
  healthCondition: string;
  healthConditionHelp: string;

  // Emergency
  emergencyName: string;
  emergencyNumber: string;
  emergencyNumberHelp: string;

  // Consent + submit
  consent: string;
  submit: string;
  submitting: string;

  // Success screen
  successTitle: string;
  successId: string;
  successSave: string;
  successJoin: string;
  successProgressLink: string;
  successEnd: string;

  // Duplicate
  duplicateTitle: string;
  duplicateBody: string;
  duplicateProgress: string;
  duplicateLeaderboard: string;
}

interface Strings {
  brand: BrandStrings;
  register: RegisterStrings;
  goal: Record<GoalValue, string>;
}

// ─── English ──────────────────────────────────────────────────────

const en: Strings = {
  brand: {
    name: 'PUREX Mother Strong',
  },
  register: {
    title: 'For our mothers — 60 days of walking, witnessed.',
    subtitle:
      'A free 10,000-steps-a-day challenge for mothers. Sixty days, one cohort, real accountability. Register in two minutes — your team logs the steps for you.',

    fullName: 'Your full name',
    fullNameHelp: 'As you would like it printed on your gratitude card.',
    whatsapp: 'WhatsApp number',
    whatsappHelp:
      'Ten digits, no +91 needed. We use this to add you to the group and to look up your progress later.',
    age: 'Age',
    ageHelp: 'Must be 18 or older.',
    seniorWarning:
      'You are 60 or older. Please share this with your family doctor before joining — a 10,000-step daily target is a real load, and we want you safe.',
    city: 'City',
    state: 'State',

    photo: 'Profile photo (optional but encouraged)',
    photoHelp:
      'A clear headshot or anything you are comfortable with. We crop it to a circle on the leaderboard — your face shows up next to your name as you climb the ranks. Skip if you prefer.',
    showPhoto: 'Show my photo on the public leaderboard.',
    showPhotoHelp:
      'Uncheck if you would rather stay name-only. Your photo is still saved for the admin team.',

    height: 'Height (cm) — optional',
    weight: 'Weight (kg) — optional',
    goal: 'What are you hoping to get out of this?',
    goalHelp: 'One answer is fine — pick the closest match.',
    healthCondition: 'Any health condition we should know about? (optional)',
    healthConditionHelp:
      'Stays private. Only the trainer sees it. Examples: high BP, diabetes, recent surgery, joint pain.',

    emergencyName: 'Emergency contact — name',
    emergencyNumber: 'Emergency contact — phone number',
    emergencyNumberHelp:
      'Ten digits. Someone we can call only if there is a real emergency.',

    consent:
      'I confirm I am 18 or older, the information above is accurate, and I am joining this challenge of my own free will. I understand walking 10,000 steps a day is physical activity and I take responsibility for my own well-being. I am okay with my name and stats appearing on the public leaderboard.',
    submit: 'Register me',
    submitting: 'Saving your registration…',

    successTitle: 'You are in.',
    successId: 'Your PUREX ID',
    successSave:
      'Save this ID somewhere safe — you will use it to track your progress over the next 60 days.',
    successJoin: 'Join the WhatsApp group',
    successProgressLink: 'Track my progress',
    successEnd: 'Your 60-day window ends',

    duplicateTitle: 'You are already registered.',
    duplicateBody:
      'This WhatsApp number is already on the cohort. Jump straight to your progress page or check the leaderboard.',
    duplicateProgress: 'See my progress',
    duplicateLeaderboard: 'Open leaderboard',
  },
  goal: {
    weight_loss: 'Weight loss',
    hormonal_balance: 'Hormonal balance',
    daily_activity: 'Daily activity',
    stress_mental_health: 'Stress / mental health',
    general_fitness: 'General fitness',
    doctors_advice: "Doctor's advice",
  },
};

// ─── Hindi ─────────────────────────────────────────────────────────
// Placeholder — falls back to English copy until translation is ready.
// Translator can replace each value in place; the key shape matches
// `en` exactly.

const hi: Strings = en;

// ─── Lookup ────────────────────────────────────────────────────────

const DICTIONARY: Record<PreferredLanguage, Strings> = { en, hi };

export function ms(lang: PreferredLanguage): Strings {
  return DICTIONARY[lang] ?? en;
}
