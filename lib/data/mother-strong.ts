import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  type AdminParticipant,
  type DayCell,
  type JourneyPost,
  type LeaderboardRow,
  type MotherStrongConfig,
  type PersonalProgress,
  CHALLENGE_DURATION_DAYS,
  DEFAULT_DAILY_GOAL,
} from '@/lib/data/mother-strong-types';

// ─── Row shapes from Supabase ──────────────────────────────────────

interface ParticipantRow {
  id: string;
  display_id: string;
  full_name: string;
  whatsapp: string;
  age: number;
  city: string;
  state: string;
  photo_url: string | null;
  show_photo_publicly: boolean;
  height_cm: number | null;
  weight_kg: number | null;
  goal: AdminParticipant['goal'];
  health_condition: string | null;
  emergency_contact_name: string;
  emergency_contact_number: string;
  preferred_language: AdminParticipant['preferredLanguage'];
  start_date: string;
  end_date: string;
  status: AdminParticipant['status'];
  created_at: string;
}

interface LeaderboardRowDb {
  id: string;
  display_id: string;
  public_name: string;
  city: string;
  public_photo_url: string | null;
  start_date: string;
  end_date: string;
  status: AdminParticipant['status'];
  days_elapsed: number;
  days_hit_goal: number;
  total_steps: number;
  current_streak: number;
  consistency_pct: number;
}

interface DailyEntryRow {
  day_number: number;
  step_count: number;
}

// ─── Mappers ───────────────────────────────────────────────────────

function rowToParticipant(r: ParticipantRow): AdminParticipant {
  return {
    id: r.id,
    displayId: r.display_id,
    fullName: r.full_name,
    whatsapp: r.whatsapp,
    age: r.age,
    city: r.city,
    state: r.state,
    photoUrl: r.photo_url,
    showPhotoPublicly: r.show_photo_publicly,
    heightCm: r.height_cm,
    weightKg: r.weight_kg,
    goal: r.goal,
    healthCondition: r.health_condition,
    emergencyContactName: r.emergency_contact_name,
    emergencyContactNumber: r.emergency_contact_number,
    preferredLanguage: r.preferred_language,
    startDate: r.start_date,
    endDate: r.end_date,
    status: r.status,
    createdAt: r.created_at,
  };
}

function rowToLeaderboard(r: LeaderboardRowDb): LeaderboardRow {
  return {
    id: r.id,
    displayId: r.display_id,
    publicName: r.public_name,
    city: r.city,
    publicPhotoUrl: r.public_photo_url,
    startDate: r.start_date,
    endDate: r.end_date,
    status: r.status,
    daysElapsed: r.days_elapsed,
    daysHitGoal: r.days_hit_goal,
    totalSteps: r.total_steps,
    currentStreak: r.current_streak,
    consistencyPct: r.consistency_pct,
  };
}

// ─── Config ────────────────────────────────────────────────────────

const EMPTY_CONFIG: MotherStrongConfig = {
  challengeStartDate: null,
  dailyGoal: DEFAULT_DAILY_GOAL,
  whatsappGroupLink: null,
  cohortLabel: null,
};

export async function getMotherStrongConfig(): Promise<MotherStrongConfig> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('mother_strong_config')
      .select('challenge_start_date, daily_goal, whatsapp_group_link, cohort_label')
      .eq('id', 1)
      .maybeSingle();

    if (error || !data) return EMPTY_CONFIG;
    return {
      challengeStartDate: data.challenge_start_date,
      dailyGoal: data.daily_goal,
      whatsappGroupLink: data.whatsapp_group_link,
      cohortLabel: data.cohort_label,
    };
  } catch {
    return EMPTY_CONFIG;
  }
}

// ─── Leaderboard ───────────────────────────────────────────────────

/**
 * Read the public-safe leaderboard view, ranked by:
 *   consistency_pct desc, current_streak desc, total_steps desc
 *
 * Active rows only (the view already excludes dropped). The caller
 * (server action or page) is expected to wrap this in unstable_cache
 * with a tag like 'mother-strong-leaderboard' so writes can revalidate.
 */
export async function getMotherStrongLeaderboard(): Promise<LeaderboardRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('mother_strong_leaderboard')
      .select(
        'id, display_id, public_name, city, public_photo_url, start_date, end_date, status, days_elapsed, days_hit_goal, total_steps, current_streak, consistency_pct'
      )
      .order('consistency_pct', { ascending: false })
      .order('current_streak', { ascending: false })
      .order('total_steps', { ascending: false });

    if (error || !data) return [];
    return (data as LeaderboardRowDb[]).map(rowToLeaderboard);
  } catch {
    return [];
  }
}

/** Count of leaderboard-visible participants. Useful for the "X mothers walking strong" headline. */
export async function getMotherStrongActiveCount(): Promise<number> {
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from('mother_strong_leaderboard')
      .select('id', { count: 'exact', head: true });
    return count ?? 0;
  } catch {
    return 0;
  }
}

// ─── Admin: participant list + detail ──────────────────────────────

/**
 * List all participants for the admin panel. Uses service-role client
 * so we bypass the leaderboard-only public read policy and see full
 * personal data.
 */
export async function getAdminParticipants(): Promise<AdminParticipant[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('mother_strong_participants')
      .select(
        'id, display_id, full_name, whatsapp, age, city, state, photo_url, show_photo_publicly, height_cm, weight_kg, goal, health_condition, emergency_contact_name, emergency_contact_number, preferred_language, start_date, end_date, status, created_at'
      )
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return (data as ParticipantRow[]).map(rowToParticipant);
  } catch {
    return [];
  }
}

export async function getAdminParticipantById(
  id: string
): Promise<AdminParticipant | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('mother_strong_participants')
      .select(
        'id, display_id, full_name, whatsapp, age, city, state, photo_url, show_photo_publicly, height_cm, weight_kg, goal, health_condition, emergency_contact_name, emergency_contact_number, preferred_language, start_date, end_date, status, created_at'
      )
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return rowToParticipant(data as ParticipantRow);
  } catch {
    return null;
  }
}

// ─── Personal progress (public, by whatsapp OR display_id) ─────────

/**
 * Look up one participant's progress for the /my-progress page.
 * Accepts either a 10-digit WhatsApp number or a display_id (PX001).
 *
 * Returns the public-safe shape, never the participant's phone or
 * emergency contact. Photo is only returned if show_photo_publicly
 * is true.
 */
export async function getPersonalProgress(
  query: string
): Promise<PersonalProgress | null> {
  if (!query || !query.trim()) return null;
  const q = query.trim();

  // Decide whether the input is a display_id or a phone number.
  const isDisplayId = /^PX\d{3,6}$/i.test(q);
  const isWhatsapp = /^\d{10}$/.test(q.replace(/\D/g, ''));
  if (!isDisplayId && !isWhatsapp) return null;

  try {
    const admin = createAdminClient();

    // 1. Find the participant row (need internal id + start/end dates).
    let query1 = admin
      .from('mother_strong_participants')
      .select(
        'id, display_id, full_name, photo_url, show_photo_publicly, city, status, start_date, end_date'
      )
      .limit(1);

    if (isDisplayId) {
      query1 = query1.eq('display_id', q.toUpperCase());
    } else {
      query1 = query1.eq('whatsapp', q.replace(/\D/g, ''));
    }

    const { data: pRow } = await query1.maybeSingle();
    if (!pRow) return null;

    interface P {
      id: string;
      display_id: string;
      full_name: string;
      photo_url: string | null;
      show_photo_publicly: boolean;
      city: string;
      status: AdminParticipant['status'];
      start_date: string;
      end_date: string;
    }
    const p = pRow as P;

    // 2. Pull this participant's aggregated stats from the leaderboard view.
    const { data: lbRow } = await admin
      .from('mother_strong_leaderboard')
      .select(
        'days_elapsed, days_hit_goal, total_steps, current_streak, consistency_pct'
      )
      .eq('id', p.id)
      .maybeSingle();

    // 3. Pull rank — fetch the full leaderboard ordered, find this row.
    //    For 500 participants this is fine; under a materialized rank
    //    column we could skip the second round-trip.
    const { data: allRows } = await admin
      .from('mother_strong_leaderboard')
      .select('id')
      .order('consistency_pct', { ascending: false })
      .order('current_streak', { ascending: false })
      .order('total_steps', { ascending: false });

    const rank =
      allRows && allRows.length > 0
        ? (allRows as { id: string }[]).findIndex((r) => r.id === p.id) + 1
        : 0;

    // 4. Build the 60-day calendar.
    const { data: entryRows } = await admin
      .from('mother_strong_daily_entries')
      .select('day_number, step_count')
      .eq('participant_id', p.id);

    const goal = (await getMotherStrongConfig()).dailyGoal;
    const entryByDay = new Map<number, number>();
    (entryRows as DailyEntryRow[] | null)?.forEach((e) => {
      entryByDay.set(e.day_number, e.step_count);
    });

    const today = new Date();
    const start = new Date(p.start_date + 'T00:00:00');
    const calendar: DayCell[] = Array.from(
      { length: CHALLENGE_DURATION_DAYS },
      (_, i) => {
        const dayNumber = i + 1;
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        const step = entryByDay.get(dayNumber) ?? null;
        return {
          dayNumber,
          date: date.toISOString().slice(0, 10),
          stepCount: step,
          hitGoal: step !== null && step >= goal,
          isFuture: date > today,
        };
      }
    );

    return {
      displayId: p.display_id,
      fullName: p.full_name,
      publicPhotoUrl: p.show_photo_publicly ? p.photo_url : null,
      city: p.city,
      status: p.status,
      rank: rank > 0 ? rank : null,
      totalParticipants: allRows?.length ?? 0,
      daysElapsed: lbRow?.days_elapsed ?? 0,
      daysHitGoal: lbRow?.days_hit_goal ?? 0,
      totalSteps: lbRow?.total_steps ?? 0,
      currentStreak: lbRow?.current_streak ?? 0,
      consistencyPct: lbRow?.consistency_pct ?? 0,
      startDate: p.start_date,
      endDate: p.end_date,
      calendar,
    };
  } catch {
    return null;
  }
}

// ─── Journey posts ─────────────────────────────────────────────────

interface JourneyRowDb {
  id: string;
  participant_id: string | null;
  caption: string | null;
  image_url: string;
  day_number: number | null;
  posted_at: string;
  mother_strong_participants: {
    full_name: string;
    photo_url: string | null;
    show_photo_publicly: boolean;
  } | null;
}

export async function getJourneyPosts(limit = 30): Promise<JourneyPost[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('mother_strong_journey_posts')
      .select(
        `id, participant_id, caption, image_url, day_number, posted_at,
         mother_strong_participants ( full_name, photo_url, show_photo_publicly )`
      )
      .order('posted_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return (data as unknown as JourneyRowDb[]).map((r) => {
      const linked = Array.isArray(r.mother_strong_participants)
        ? r.mother_strong_participants[0]
        : r.mother_strong_participants;
      // First name + last initial, same shape as the leaderboard view.
      const publicName = linked?.full_name
        ? formatPublicName(linked.full_name)
        : null;
      return {
        id: r.id,
        participantId: r.participant_id,
        participantName: publicName,
        participantPhotoUrl:
          linked?.show_photo_publicly && linked?.photo_url
            ? linked.photo_url
            : null,
        caption: r.caption,
        imageUrl: r.image_url,
        dayNumber: r.day_number,
        postedAt: r.posted_at,
      };
    });
  } catch {
    return [];
  }
}

function formatPublicName(fullName: string): string {
  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

// ─── Day-of-challenge helper ───────────────────────────────────────

/**
 * Compute which day of the challenge today is, in Asia/Kolkata time
 * — used for the "Day X of 60" headline on the leaderboard and the
 * admin grid. Returns 0 before the challenge starts, capped at 60.
 */
export async function getCurrentChallengeDay(): Promise<number> {
  const cfg = await getMotherStrongConfig();
  if (!cfg.challengeStartDate) return 0;

  // Compare dates in Asia/Kolkata: format today's date as YYYY-MM-DD
  // using that time zone, then subtract.
  const today = new Date().toLocaleDateString('en-CA', {
    timeZone: 'Asia/Kolkata',
  });
  const start = cfg.challengeStartDate;
  const diff =
    Math.floor((Date.parse(today) - Date.parse(start)) / 86400000) + 1;
  if (diff < 1) return 0;
  if (diff > CHALLENGE_DURATION_DAYS) return CHALLENGE_DURATION_DAYS;
  return diff;
}

// ─── Admin: daily-entry grid data ──────────────────────────────────

/**
 * Build the wide table for /admin/mother-strong daily-entry tab —
 * rows = participants, columns = Day 1..60. Pulls all entries and
 * indexes them by participant_id + day_number.
 */
export interface AdminGridRow {
  participant: AdminParticipant;
  /** Sparse map day_number → step_count. Empty cells stay undefined. */
  entries: Record<number, number>;
}

export async function getAdminDailyEntryGrid(): Promise<AdminGridRow[]> {
  try {
    const admin = createAdminClient();
    const [{ data: participants }, { data: entries }] = await Promise.all([
      admin
        .from('mother_strong_participants')
        .select(
          'id, display_id, full_name, whatsapp, age, city, state, photo_url, show_photo_publicly, height_cm, weight_kg, goal, health_condition, emergency_contact_name, emergency_contact_number, preferred_language, start_date, end_date, status, created_at'
        )
        .order('display_id', { ascending: true }),
      admin
        .from('mother_strong_daily_entries')
        .select('participant_id, day_number, step_count'),
    ]);

    if (!participants) return [];

    const byParticipant = new Map<string, Record<number, number>>();
    (
      entries as
        | { participant_id: string; day_number: number; step_count: number }[]
        | null
    )?.forEach((e) => {
      let m = byParticipant.get(e.participant_id);
      if (!m) {
        m = {};
        byParticipant.set(e.participant_id, m);
      }
      m[e.day_number] = e.step_count;
    });

    return (participants as ParticipantRow[]).map((p) => ({
      participant: rowToParticipant(p),
      entries: byParticipant.get(p.id) ?? {},
    }));
  } catch {
    return [];
  }
}
