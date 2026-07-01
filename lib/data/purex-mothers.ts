/**
 * PURE X Mothers — 60 Days of Strength (Mother's Day 2026 cohort).
 *
 * Static roster of the 9 mothers who completed the 60-day challenge.
 * Individual URLs live at /purex-mothers/[slug] so each mother can
 * share her own appreciation page directly.
 */

export interface PureXMother {
  slug: string;
  name: string;
  title: string;
  /** Short bucket used by the appreciation wall for the award-icon +
   *  category chip. Not shown on the card itself (name + title do that). */
  category: 'consistency' | 'all_rounder' | 'plank' | 'wall_sit' | 'queen';
  /** 1-2 sentence appreciation from Team PureX. Rendered on the card. */
  message: string;
}

export const PUREX_MOTHERS: PureXMother[] = [
  {
    slug: 'vani',
    name: 'Vani',
    title: 'Consistency Entertainment Star',
    category: 'consistency',
    message:
      'For bringing discipline, positive energy, and entertainment throughout the PURE X Mothers journey.',
  },
  {
    slug: 'swarna',
    name: 'Swarna',
    title: 'All Rounder',
    category: 'all_rounder',
    message:
      'For showing balanced effort in training, diet, steps, and daily discipline.',
  },
  {
    slug: 'akhila',
    name: 'Akhila',
    title: 'All Rounder',
    category: 'all_rounder',
    message:
      'For maintaining strong dedication across every part of the 60-day journey.',
  },
  {
    slug: 'sirisha',
    name: 'Sirisha',
    title: 'Plank Champion',
    category: 'plank',
    message:
      'For showing strong core strength, patience, and determination through plank challenges.',
  },
  {
    slug: 'nilima',
    name: 'Nilima',
    title: 'Consistency All Rounder Queen',
    category: 'queen',
    message:
      'For outstanding consistency, energy, and all-round performance throughout the journey.',
  },
  {
    slug: 'sunitha',
    name: 'Sunitha',
    title: 'Wall Sit Champion',
    category: 'wall_sit',
    message:
      'For showing powerful lower-body endurance and mental strength in wall sit challenges.',
  },
  {
    slug: 'pranitha',
    name: 'Pranitha',
    title: 'All Rounder',
    category: 'all_rounder',
    message:
      'For strong participation, discipline, and dedication across the complete program.',
  },
  {
    slug: 'manga',
    name: 'Manga',
    title: 'Wall Sit Champion',
    category: 'wall_sit',
    message:
      'For excellent stamina, patience, and commitment in the wall sit challenge.',
  },
  {
    slug: 'lakshmi-durga',
    name: 'Lakshmi Durga',
    title: 'Wall Sit Consistency Star',
    category: 'wall_sit',
    message:
      'For showing strong consistency and endurance throughout the 60-day journey.',
  },
];

export const PUREX_MOTHERS_META = {
  startDate: '2026-05-10',
  endDate: '2026-07-10',
  totalDays: 60,
  trainerName: 'Siva Reddy',
  dailyStepGoal: 10000,
  collectiveSteps: 10000 * 60 * PUREX_MOTHERS.length,
  brand: 'Team PURE X',
} as const;

export function findMotherBySlug(slug: string): PureXMother | null {
  return PUREX_MOTHERS.find((m) => m.slug === slug) ?? null;
}

// Category → award-icon color + label for the appreciation wall.
export const CATEGORY_META: Record<
  PureXMother['category'],
  { label: string; color: string; short: string }
> = {
  consistency: {
    label: 'Consistency Star',
    color: '#ffd700',
    short: 'CONSISTENCY',
  },
  all_rounder: {
    label: 'All Rounder',
    color: '#ff4d94',
    short: 'ALL ROUNDER',
  },
  plank: { label: 'Plank Champion', color: '#e63980', short: 'PLANK' },
  wall_sit: {
    label: 'Wall Sit Champion',
    color: '#c94a8e',
    short: 'WALL SIT',
  },
  queen: {
    label: 'Consistency Queen',
    color: '#ffb84d',
    short: 'CONSISTENCY QUEEN',
  },
};
