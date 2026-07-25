import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

// ════════════════════════════════════════════════════════════════════
// Read helpers for the weekly feedback call schedule.
// ════════════════════════════════════════════════════════════════════

export interface FeedbackSlot {
  clientId: string;
  clientName: string;
  whatsapp: string | null;
  email: string | null;
  dayOfWeek: number; // 0 = Mon … 6 = Sun
  timeOfDay: string; // 'HH:MM'
  durationMin: number;
  notes: string | null;
  paused: boolean;
}

/**
 * One slot per client. Returns all NON-paused + paused. Caller can
 * filter. Joins with profiles for client display info.
 */
export async function getAllFeedbackSlots(): Promise<FeedbackSlot[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('client_feedback_schedule')
      .select(
        'client_id, day_of_week, time_of_day, duration_min, notes, paused, ' +
          'profiles:client_id ( full_name, whatsapp, email )'
      )
      .order('day_of_week', { ascending: true })
      .order('time_of_day', { ascending: true });

    if (error || !data) return [];

    return (data as unknown as RawSlotRow[]).map((r) => ({
      clientId: r.client_id,
      clientName: r.profiles?.full_name ?? r.profiles?.email ?? 'Unknown',
      whatsapp: r.profiles?.whatsapp ?? null,
      email: r.profiles?.email ?? null,
      dayOfWeek: r.day_of_week,
      // pg returns time as 'HH:MM:SS' — strip seconds.
      timeOfDay: r.time_of_day.slice(0, 5),
      durationMin: r.duration_min,
      notes: r.notes,
      paused: r.paused,
    }));
  } catch (err) {
    console.error('[feedback-schedule] getAllFeedbackSlots failed', err);
    return [];
  }
}

export async function getFeedbackSlotForClient(
  clientId: string
): Promise<FeedbackSlot | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('client_feedback_schedule')
      .select(
        'client_id, day_of_week, time_of_day, duration_min, notes, paused, ' +
          'profiles:client_id ( full_name, whatsapp, email )'
      )
      .eq('client_id', clientId)
      .maybeSingle();

    if (error || !data) return null;
    const r = data as unknown as RawSlotRow;
    return {
      clientId: r.client_id,
      clientName: r.profiles?.full_name ?? r.profiles?.email ?? 'Unknown',
      whatsapp: r.profiles?.whatsapp ?? null,
      email: r.profiles?.email ?? null,
      dayOfWeek: r.day_of_week,
      timeOfDay: r.time_of_day.slice(0, 5),
      durationMin: r.duration_min,
      notes: r.notes,
      paused: r.paused,
    };
  } catch (err) {
    console.error('[feedback-schedule] getFeedbackSlotForClient failed', err);
    return null;
  }
}

interface RawSlotRow {
  client_id: string;
  day_of_week: number;
  time_of_day: string;
  duration_min: number;
  notes: string | null;
  paused: boolean;
  profiles: {
    full_name: string | null;
    whatsapp: string | null;
    email: string | null;
  } | null;
}

// ────────────────────────────────────────────────────────────────────
// Display helpers (pure — safe for client too if re-exported there).
// ────────────────────────────────────────────────────────────────────

export const DAY_LABELS = [
  { value: 0, short: 'Mon', long: 'Monday' },
  { value: 1, short: 'Tue', long: 'Tuesday' },
  { value: 2, short: 'Wed', long: 'Wednesday' },
  { value: 3, short: 'Thu', long: 'Thursday' },
  { value: 4, short: 'Fri', long: 'Friday' },
  { value: 5, short: 'Sat', long: 'Saturday' },
  { value: 6, short: 'Sun', long: 'Sunday' },
] as const;

/** Hourly grid for the weekly calendar — 06:00 to 22:00 (17 rows). */
export const HOUR_SLOTS: string[] = (() => {
  const out: string[] = [];
  for (let h = 6; h <= 22; h++) out.push(`${String(h).padStart(2, '0')}:00`);
  return out;
})();

export function formatTime12(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const am = h < 12;
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:${String(m).padStart(2, '0')} ${am ? 'AM' : 'PM'}`;
}

/** Bucket helper for the weekly grid — group slots by day + hour. */
export function bucketSlotsByDayHour(
  slots: FeedbackSlot[]
): Map<string, FeedbackSlot[]> {
  const out = new Map<string, FeedbackSlot[]>();
  for (const s of slots) {
    if (s.paused) continue;
    const hour = s.timeOfDay.slice(0, 2) + ':00';
    const key = `${s.dayOfWeek}|${hour}`;
    const list = out.get(key) ?? [];
    list.push(s);
    out.set(key, list);
  }
  return out;
}
