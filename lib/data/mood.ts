/**
 * Mood check-in — types + display metadata for the morning
 * "How is your body today?" prompt on the dashboard.
 *
 * Pure types and constants. Free of `'server-only'` so both client
 * components (the chip picker UI) and server components (fetching
 * today's state for the dashboard) can import.
 */

export type MoodState =
  | 'fresh'
  | 'tired'
  | 'sore'
  | 'stressed'
  | 'bloated'
  | 'acidity'
  | 'low_energy'
  | 'motivated';

export const MOOD_STATES: MoodState[] = [
  'fresh',
  'tired',
  'sore',
  'stressed',
  'bloated',
  'acidity',
  'low_energy',
  'motivated',
];

export const MOOD_META: Record<
  MoodState,
  { label: string; emoji: string; color: string; intent: 'good' | 'neutral' | 'caution' }
> = {
  fresh:     { label: 'Fresh',      emoji: '🌿', color: '#c6ff3d', intent: 'good' },
  motivated: { label: 'Motivated',  emoji: '⚡',  color: '#ffd24d', intent: 'good' },
  tired:     { label: 'Tired',      emoji: '😴', color: '#7dd3ff', intent: 'caution' },
  sore:      { label: 'Sore',       emoji: '💢', color: '#ff8a4d', intent: 'caution' },
  stressed:  { label: 'Stressed',   emoji: '🌀', color: '#a78bfa', intent: 'caution' },
  bloated:   { label: 'Bloated',    emoji: '🫃', color: '#ffb84d', intent: 'caution' },
  acidity:   { label: 'Acidity',    emoji: '🔥', color: '#ff6b9d', intent: 'caution' },
  low_energy:{ label: 'Low energy', emoji: '🪫', color: '#8ea876', intent: 'caution' },
};

/**
 * Adaptive recommendation copy keyed by mood. Shown beside the
 * selected state on the dashboard so the user gets immediate value
 * from logging (not just data collection).
 *
 * Kept lifestyle-only — no medical or training-load advice (legal
 * scope per docs/product-vision.md §4). All copy is "try this small
 * action today" not "your workout is being adjusted."
 */
export const MOOD_RECOMMENDATION: Record<MoodState, string> = {
  fresh:     'Press into the workout. Today is the day to add load.',
  motivated: 'Channel it. Hit your full Today\'s Mission and log everything.',
  tired:     'Train light. Aim for sleep by 10:30 PM tonight.',
  sore:      'Mobility + walk over heavy lifting today. Recovery wins.',
  stressed:  '20-min walk outside. Then breathwork before workout.',
  bloated:   'Hydrate + short walk after meals. Skip carbonated drinks.',
  acidity:   'Smaller, slower meals today. Skip caffeine + late dinners.',
  low_energy:'Hydrate first. Walk 12 min before deciding on the workout.',
};

/** Quick "good day"/"watch the day" classifier for adaptive UI banding. */
export function moodIntent(state: MoodState | null): 'good' | 'neutral' | 'caution' {
  if (!state) return 'neutral';
  return MOOD_META[state].intent;
}
