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
    title: 'Heart of the Squad',
    category: 'consistency',
    message:
      'For lifting the group with positive energy every single day of the 60-day journey.',
  },
  {
    slug: 'swarna',
    name: 'Swarna',
    title: 'Complete Athlete',
    category: 'all_rounder',
    message:
      'For balanced effort across training, diet, steps, and daily discipline — nothing missed.',
  },
  {
    slug: 'akhila',
    name: 'Akhila',
    title: 'Balanced Champion',
    category: 'all_rounder',
    message:
      'For showing that balance is a win — steady dedication across every part of the 60 days.',
  },
  {
    slug: 'sirisha',
    name: 'Sirisha',
    title: 'Core of Steel',
    category: 'plank',
    message:
      'For unbreakable core strength and quiet determination through every plank challenge.',
  },
  {
    slug: 'nilima',
    name: 'Nilima',
    title: 'The Powerhouse',
    category: 'queen',
    message:
      'For extraordinary consistency and all-round performance — the one everyone else drew energy from.',
  },
  {
    slug: 'sunitha',
    name: 'Sunitha',
    title: 'Iron Legs',
    category: 'wall_sit',
    message:
      'For lower-body endurance and mental strength that never faltered in the wall sit challenges.',
  },
  {
    slug: 'pranitha',
    name: 'Pranitha',
    title: 'Total Force',
    category: 'all_rounder',
    message:
      'For strength across every pillar — training, diet, steps, discipline — nothing halfway.',
  },
  {
    slug: 'manga',
    name: 'Manga',
    title: 'Steel Stance',
    category: 'wall_sit',
    message:
      'For the immovable hold — stamina, patience, and commitment that stayed unshaken through every wall sit.',
  },
  {
    slug: 'lakshmi-durga',
    name: 'Lakshmi Durga',
    title: 'The Pillar',
    category: 'wall_sit',
    message:
      'For being an unmoved foundation of strength and consistency across the entire 60-day journey.',
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
