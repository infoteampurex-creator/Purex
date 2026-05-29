/**
 * Coach Radar — shared types + display metadata.
 *
 * Free of `'server-only'` so the client-side CoachRadarView can
 * import. Server-side aggregation lives in coach-radar-server.ts.
 */

export type AttentionFlag =
  | 'no_log_3d'
  | 'no_log_7d'
  | 'no_workout_5d'
  | 'no_workout_10d'
  | 'low_score_7d'
  | 'streak_broken'
  | 'unreviewed_report'
  | 'no_mood_today'
  | 'no_meal_today';

export const FLAG_META: Record<
  AttentionFlag,
  { label: string; severity: 1 | 2 | 3; color: string }
> = {
  no_log_3d:         { label: 'No log 3+ days',      severity: 2, color: '#ffd24d' },
  no_log_7d:         { label: 'No log 7+ days',      severity: 3, color: '#ff6b6b' },
  no_workout_5d:     { label: 'No workout 5+ days',  severity: 2, color: '#ffd24d' },
  no_workout_10d:    { label: 'No workout 10+ days', severity: 3, color: '#ff6b6b' },
  low_score_7d:      { label: 'Low scores 7d',       severity: 2, color: '#ff8a4d' },
  streak_broken:     { label: 'Streak broke',        severity: 1, color: '#a78bfa' },
  unreviewed_report: { label: 'Report needs review', severity: 3, color: '#7dd3ff' },
  no_mood_today:     { label: 'No mood today',       severity: 1, color: '#a0a69a' },
  no_meal_today:     { label: 'No meals today',      severity: 1, color: '#a0a69a' },
};

export interface RadarClient {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  daysSinceLastLog: number | null;
  daysSinceLastWorkout: number | null;
  avgScore7d: number | null;
  currentStreakDays: number;
  streakBrokenToday: boolean;
  unreviewedReports: number;
  moodToday: string | null;
  mealsToday: number;
  flags: AttentionFlag[];
  attentionScore: number;
}

export interface RadarPayload {
  todayIso: string;
  clients: RadarClient[];
  totals: {
    total: number;
    needsAttention: number;
    quiet: number;
  };
}
