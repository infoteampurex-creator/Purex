// Per-expert services + pre-consultation form templates.
// These replace the `services` and `form_templates` tables until Supabase is wired.

export type ServiceFormat = 'online' | 'in_person' | 'hybrid';

export interface Service {
  id: string;
  expertSlug: string;
  name: string;
  description: string;
  format: ServiceFormat;
  durationMinutes: number;
  priceDisplay: string;
  isConsultation: boolean;
  formTemplateId: string;
}

export interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox-group' | 'radio-group' | 'number' | 'date';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  helpText?: string;
}

export interface FormTemplate {
  id: string;
  name: string;
  intro: string;
  fields: FormField[];
}

// ─── FORM TEMPLATES ───

export const FORM_TEMPLATES: Record<string, FormTemplate> = {
  'discovery-call': {
    id: 'discovery-call',
    name: 'Discovery Call Intake',
    intro:
      'A few quick questions before your call so we can make the most of the 30 minutes.',
    fields: [
      {
        id: 'primary_goal',
        type: 'select',
        label: 'What is your primary goal?',
        required: true,
        options: [
          'Fat loss',
          'Muscle gain',
          'HYROX race preparation',
          'IRONMAN / Triathlon preparation',
          'General fitness',
          'Injury recovery',
          'Couples training',
          'Not sure yet',
        ],
      },
      {
        id: 'current_activity',
        type: 'select',
        label: 'Describe your current activity level',
        required: true,
        options: [
          'Sedentary — minimal exercise',
          'Light — occasional workouts',
          'Moderate — 2-3 workouts per week',
          'Active — 4+ workouts per week',
          'Athletic — daily training with specific goals',
        ],
      },
      {
        id: 'timeline',
        type: 'select',
        label: 'What is your ideal start timeline?',
        required: true,
        options: ['This week', 'This month', 'Next 2-3 months', 'Just exploring'],
      },
      {
        id: 'health_concerns',
        type: 'textarea',
        label: 'Any medical conditions, injuries, or concerns we should know about?',
        placeholder: 'E.g. lower back issue, previous surgery, thyroid, diabetes...',
        required: false,
        helpText: 'This stays confidential and goes only to Dr. Chandralekha.',
      },
      {
        id: 'preferred_format',
        type: 'radio-group',
        label: 'Preferred training format',
        required: true,
        options: ['Online only', 'In-person only', 'Hybrid', 'No preference'],
      },
    ],
  },

  'physio-intake': {
    id: 'physio-intake',
    name: 'Physiotherapy Intake',
    intro:
      'Help Krishna understand your movement history before the assessment.',
    fields: [
      {
        id: 'current_pain',
        type: 'textarea',
        label: 'Where do you currently feel pain or restriction?',
        placeholder: 'E.g. lower back when sitting, right shoulder on overhead press...',
        required: true,
      },
      {
        id: 'pain_level',
        type: 'select',
        label: 'Pain level (on worst days)',
        required: true,
        options: ['0 — None', '1-3 — Mild', '4-6 — Moderate', '7-9 — Severe', '10 — Unbearable'],
      },
      {
        id: 'injury_history',
        type: 'textarea',
        label: 'Previous injuries or surgeries',
        placeholder: 'Include approximate date and treatment received',
        required: false,
      },
      {
        id: 'activities_affected',
        type: 'checkbox-group',
        label: 'Which activities are affected?',
        required: true,
        options: [
          'Walking',
          'Running',
          'Lifting weights',
          'Climbing stairs',
          'Sitting for long periods',
          'Sleeping',
          'Daily tasks',
        ],
      },
      {
        id: 'prior_physio',
        type: 'radio-group',
        label: 'Have you worked with a physiotherapist before?',
        required: true,
        options: ['Yes, recently', 'Yes, long ago', 'No'],
      },
    ],
  },

  'medical-intake': {
    id: 'medical-intake',
    name: 'Medical Screening Intake',
    intro:
      'Confidential medical information for Dr. Chandralekha ahead of your consultation.',
    fields: [
      {
        id: 'age',
        type: 'number',
        label: 'Age',
        required: true,
      },
      {
        id: 'conditions',
        type: 'checkbox-group',
        label: 'Do you have any of the following?',
        required: false,
        options: [
          'High blood pressure',
          'Diabetes / pre-diabetes',
          'Thyroid issues',
          'Heart condition',
          'Asthma',
          'PCOS / hormonal issues',
          'Anxiety / depression',
          'None of the above',
        ],
      },
      {
        id: 'medications',
        type: 'textarea',
        label: 'Current medications (if any)',
        placeholder: 'Include dosage if known',
        required: false,
      },
      {
        id: 'family_history',
        type: 'textarea',
        label: 'Relevant family medical history',
        placeholder: 'E.g. cardiac disease in family, diabetes in parents...',
        required: false,
      },
      {
        id: 'last_checkup',
        type: 'select',
        label: 'When was your last medical check-up?',
        required: true,
        options: [
          'Within 3 months',
          '3-12 months ago',
          '1-2 years ago',
          'More than 2 years ago',
          'Never had one',
        ],
      },
    ],
  },
};

// ─── SERVICES (per expert) ───

export const FALLBACK_SERVICES: Service[] = [
  // Everyone's primary bookable = free discovery call
  {
    id: 'svc-discovery-reddy',
    expertSlug: 'siva-reddy',
    name: '30-min Discovery Call',
    description:
      'A free introductory call to understand your goals, training background, and recommend the right PURE X programme.',
    format: 'online',
    durationMinutes: 30,
    priceDisplay: 'Free',
    isConsultation: true,
    formTemplateId: 'discovery-call',
  },
  {
    id: 'svc-training-assessment',
    expertSlug: 'siva-reddy',
    name: '60-min Training Assessment',
    description:
      'Comprehensive strength, endurance, and movement baseline with Siva. Includes personalised programme recommendation.',
    format: 'in_person',
    durationMinutes: 60,
    priceDisplay: '₹2,500',
    isConsultation: true,
    formTemplateId: 'discovery-call',
  },
  {
    id: 'svc-medical-screening',
    expertSlug: 'chandralekha',
    name: 'Medical Health Screening',
    description:
      'Full pre-programme medical assessment. Cardiovascular, metabolic, and clearance for training.',
    format: 'in_person',
    durationMinutes: 45,
    priceDisplay: 'Included in all plans',
    isConsultation: true,
    formTemplateId: 'medical-intake',
  },
  {
    id: 'svc-medical-consult',
    expertSlug: 'chandralekha',
    name: '30-min Medical Consultation',
    description:
      'One-on-one consultation with Dr. Chandralekha for ongoing medical guidance, supplement safety, or condition-specific concerns.',
    format: 'online',
    durationMinutes: 30,
    priceDisplay: '₹1,500',
    isConsultation: false,
    formTemplateId: 'medical-intake',
  },
  {
    id: 'svc-physio-assessment',
    expertSlug: 'krishna',
    name: 'Physiotherapy Movement Screen',
    description:
      'Full musculoskeletal assessment. Identifies injury risk and movement imbalances. Included in all training plans.',
    format: 'in_person',
    durationMinutes: 60,
    priceDisplay: 'Included in all plans',
    isConsultation: true,
    formTemplateId: 'physio-intake',
  },
  {
    id: 'svc-physio-session',
    expertSlug: 'krishna',
    name: '60-min Physiotherapy Session',
    description:
      'Targeted physiotherapy for rehabilitation, pain relief, or movement quality. Book standalone or as part of your programme.',
    format: 'hybrid',
    durationMinutes: 60,
    priceDisplay: '₹2,000',
    isConsultation: false,
    formTemplateId: 'physio-intake',
  },
  {
    id: 'svc-athletic-consult',
    expertSlug: 'paula-konasionok',
    name: 'Athletic Performance Consultation',
    description:
      'HYROX or IRONMAN-focused consultation with Paula. Programme design for endurance and athletic transformation.',
    format: 'online',
    durationMinutes: 45,
    priceDisplay: '£60',
    isConsultation: true,
    formTemplateId: 'discovery-call',
  },
  {
    id: 'svc-ops-discovery',
    expertSlug: 'siva-jampana',
    name: '30-min Ops & Programme Fit Call',
    description:
      'A free chat with Siva Jampana about programme structure, logistics, and how PURE X fits your life. Ideal if you want to know how it all works before committing.',
    format: 'online',
    durationMinutes: 30,
    priceDisplay: 'Free',
    isConsultation: true,
    formTemplateId: 'discovery-call',
  },
];

export function getServicesForExpert(expertSlug: string): Service[] {
  return FALLBACK_SERVICES.filter((s) => s.expertSlug === expertSlug);
}

export function getServiceById(id: string): Service | null {
  return FALLBACK_SERVICES.find((s) => s.id === id) ?? null;
}

export function getFormTemplate(id: string): FormTemplate | null {
  return FORM_TEMPLATES[id] ?? null;
}
