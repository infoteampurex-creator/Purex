/**
 * Team Purex Mothers — 60 Days of Strength (Mother's Day 2026 cohort).
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
    title: 'Champion of Encouragement',
    category: 'consistency',
    message:
      'For lifting the group with your encouragement — the mother whose warmth kept everyone showing up, day after day.',
  },
  {
    slug: 'swarna',
    name: 'Swarna',
    title: 'All-Around Champion',
    category: 'all_rounder',
    message:
      'For being the mother who showed up for every pillar — training, diet, steps, and daily discipline. Nothing missed.',
  },
  {
    slug: 'akhila',
    name: 'Akhila',
    title: 'Champion of Balance',
    category: 'all_rounder',
    message:
      'For proving that balance itself is a championship — steady across training, food, steps, and mindset for the full 60 days.',
  },
  {
    slug: 'sirisha',
    name: 'Sirisha',
    title: 'Plank Queen',
    category: 'plank',
    message:
      'For plank after plank, hold after hold — quiet, determined, and unshakable through every core challenge.',
  },
  {
    slug: 'neelima',
    name: 'Neelima',
    title: 'Consistency Queen',
    category: 'queen',
    message:
      'For being the mother everyone else looked to — consistency, dedication, and all-round performance at a level of its own.',
  },
  {
    slug: 'sunitha',
    name: 'Sunitha',
    title: 'Wall Sit Warrior',
    category: 'wall_sit',
    message:
      'For wall sit after wall sit, day after day — endurance and mental strength that never let go.',
  },
  {
    slug: 'pranitha',
    name: 'Pranitha',
    title: 'Queen of Consistency',
    category: 'all_rounder',
    message:
      'For 60 days of showing up completely — steady, consistent, devoted, and never halfway across every part of the journey.',
  },
  {
    slug: 'manga',
    name: 'Manga',
    title: 'Queen of Patience',
    category: 'wall_sit',
    message:
      'For the immovable calm and rooted patience that carried every wall sit to the end — steady, dignified, and unbroken.',
  },
  {
    slug: 'lakshmi-durga',
    name: 'Lakshmi Durga',
    title: 'Queen of Foundation',
    category: 'wall_sit',
    message:
      'For being the foundation of the group — the quiet, unmoved strength that everyone else built on across the 60-day journey.',
  },
];

export const PUREX_MOTHERS_META = {
  startDate: '2026-05-10',
  endDate: '2026-07-10',
  totalDays: 60,
  trainerName: 'Siva Reddy',
  dailyStepGoal: 10000,
  collectiveSteps: 10000 * 60 * PUREX_MOTHERS.length,
  brand: 'Team Purex',
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
