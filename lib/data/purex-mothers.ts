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
    title: 'The Radiant Heart',
    category: 'consistency',
    message:
      'For lighting up every day of the 60-day journey with warmth, positivity, and encouragement for everyone around you.',
  },
  {
    slug: 'swarna',
    name: 'Swarna',
    title: 'The Golden Grace',
    category: 'all_rounder',
    message:
      'For living every part of this journey with grace — training, food, steps, and daily rhythm all in harmony.',
  },
  {
    slug: 'akhila',
    name: 'Akhila',
    title: 'The Wholehearted One',
    category: 'all_rounder',
    message:
      'For giving your whole heart to every part of the 60 days — steady, sincere, and wonderfully consistent.',
  },
  {
    slug: 'sirisha',
    name: 'Sirisha',
    title: 'The Serene Strength',
    category: 'plank',
    message:
      'For the quiet, unwavering strength you brought to every plank — grace and determination in equal measure.',
  },
  {
    slug: 'nilima',
    name: 'Nilima',
    title: 'The Guiding Star',
    category: 'queen',
    message:
      'For being the steady light everyone leaned into — a presence that made the whole journey brighter and easier for others.',
  },
  {
    slug: 'sunitha',
    name: 'Sunitha',
    title: 'The Steadfast Grace',
    category: 'wall_sit',
    message:
      'For the gentle endurance and quiet grace that never let go, wall sit after wall sit, day after day.',
  },
  {
    slug: 'pranitha',
    name: 'Pranitha',
    title: 'The Devoted Soul',
    category: 'all_rounder',
    message:
      'For pouring your whole self into every part of the journey — training, food, steps, and daily care — with love and devotion.',
  },
  {
    slug: 'manga',
    name: 'Manga',
    title: 'The Unshakable Grace',
    category: 'wall_sit',
    message:
      'For the immovable calm and rooted patience that carried every wall sit — steady, dignified, and beautifully strong.',
  },
  {
    slug: 'lakshmi-durga',
    name: 'Lakshmi Durga',
    title: 'The Sacred Pillar',
    category: 'wall_sit',
    message:
      'For being the sacred foundation of strength and consistency — a quiet, blessed presence across the entire 60-day journey.',
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
