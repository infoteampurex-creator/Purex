import 'server-only';
import { createClient } from '@/lib/supabase/server';

/**
 * Fetch today's logged weight (if any) plus the most-recent prior
 * weight so the dashboard can show the delta. Cheap dedicated query
 * — keeps the broader twin-inputs SELECT focused on the metrics that
 * drive the Twin visualisation.
 */
export interface DailyWeight {
  /** Today's weight in kg. null when the client hasn't weighed in today. */
  todayKg: number | null;
  /** Most recent prior weight in kg before today. */
  previousKg: number | null;
  previousDate: string | null;
}

export async function getDailyWeight(
  userId: string,
  today: string
): Promise<DailyWeight> {
  try {
    const supabase = await createClient();

    const [todayRes, prevRes] = await Promise.all([
      supabase
        .from('client_daily_logs')
        .select('weight_kg')
        .eq('client_id', userId)
        .eq('log_date', today)
        .maybeSingle(),
      supabase
        .from('client_daily_logs')
        .select('weight_kg, log_date')
        .eq('client_id', userId)
        .lt('log_date', today)
        .not('weight_kg', 'is', null)
        .order('log_date', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const todayRow = todayRes.data as { weight_kg: number | null } | null;
    const prevRow = prevRes.data as
      | { weight_kg: number | null; log_date: string }
      | null;

    return {
      todayKg: todayRow?.weight_kg ?? null,
      previousKg: prevRow?.weight_kg ?? null,
      previousDate: prevRow?.log_date ?? null,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[daily-weight] getDailyWeight failed', err);
    return { todayKg: null, previousKg: null, previousDate: null };
  }
}
