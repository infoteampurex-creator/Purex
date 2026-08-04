/**
 * Canonical service catalog for the invoice line-item builder.
 * Admin picks from this dropdown to pre-fill title + suggested
 * description + unit price. Custom line items remain an option.
 *
 * INR prices sourced from FALLBACK_PROGRAMS. GBP prices set at
 * roughly equivalent tiers (rounded to clean numbers). Prices
 * are hints — the admin can edit the unit price on the form
 * after selecting.
 */

export interface InvoiceServiceOption {
  key: string;
  title: string;
  description: string;
  // Suggested unit price in the smallest currency unit
  inrPrice: number; // paise
  gbpPrice: number; // pence
  group: 'plan' | 'consultation' | 'diagnostic' | 'custom';
}

export const INVOICE_SERVICES: InvoiceServiceOption[] = [
  // ─── Plans ──────────────────────────────────────────
  {
    key: 'pure-foundation',
    title: 'Pure Foundation',
    description:
      'Entry-level onboarding — profiling, personalised workout + diet plan, water & sleep targets, 1 progress call.',
    inrPrice: 199900,
    gbpPrice: 4900,
    group: 'plan',
  },
  {
    key: 'pure-core',
    title: 'Pure Core · monthly',
    description:
      'Full transformation system — doctor consult, physio assessment, weekly progress calls, streak system, AI chat, community.',
    inrPrice: 499900,
    gbpPrice: 9900,
    group: 'plan',
  },
  {
    key: 'pure-elite',
    title: 'Pure Elite · monthly',
    description:
      'Performance & lifestyle membership — 1-on-1 coaching, HYROX / Ironman prep, weekly outdoor sessions, full club access, weekly expert access.',
    inrPrice: 1999900,
    gbpPrice: 39900,
    group: 'plan',
  },
  {
    key: 'pure-enduro',
    title: 'Pure Enduro · monthly',
    description:
      'Race-day preparation for HYROX / IRONMAN — periodised training cycles, taper protocols, direct access to Siva Jampana, race-day strategy.',
    inrPrice: 749900,
    gbpPrice: 14900,
    group: 'plan',
  },

  // ─── Diagnostics ────────────────────────────────────
  {
    key: 'blood-panel-advanced',
    title: 'Blood Panel · Advanced',
    description:
      '72-marker fasting panel: hormonal, thyroid, vitamin D, ferritin, and full lipid workup. Report attached separately.',
    inrPrice: 1499900,
    gbpPrice: 16500,
    group: 'diagnostic',
  },
  {
    key: 'blood-panel-basic',
    title: 'Blood Panel · Basic',
    description:
      '28-marker essential panel: CBC, glucose, lipids, liver, kidney, thyroid basic.',
    inrPrice: 499900,
    gbpPrice: 6500,
    group: 'diagnostic',
  },

  // ─── Consultations ──────────────────────────────────
  {
    key: 'sleep-recovery',
    title: 'Sleep & recovery consultation',
    description:
      'One-off 45-minute session with sleep specialist — personalised protocol + 30-day follow-up window.',
    inrPrice: 299900,
    gbpPrice: 8500,
    group: 'consultation',
  },
  {
    key: 'physio-session',
    title: 'Physiotherapy session',
    description:
      '1-hour assessment or treatment session with the on-team physiotherapist.',
    inrPrice: 249900,
    gbpPrice: 7500,
    group: 'consultation',
  },
  {
    key: 'doctor-consultation',
    title: 'Doctor consultation',
    description:
      '45-minute consultation with the medical team — reviews health markers, medication, sleep, blood report.',
    inrPrice: 349900,
    gbpPrice: 9500,
    group: 'consultation',
  },
  {
    key: 'mental-health',
    title: 'Mental health session',
    description:
      '1-hour session with the mental health specialist. Stress management, sleep, motivation.',
    inrPrice: 299900,
    gbpPrice: 8500,
    group: 'consultation',
  },
];

export const SERVICE_GROUPS: Array<{
  key: InvoiceServiceOption['group'];
  label: string;
}> = [
  { key: 'plan', label: 'Coaching plans' },
  { key: 'diagnostic', label: 'Diagnostics' },
  { key: 'consultation', label: 'Consultations' },
];
