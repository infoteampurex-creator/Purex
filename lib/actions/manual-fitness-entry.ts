'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

const schema = z.object({
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  field: z.enum([
    'steps',
    'sleep_hours',
    'water_glasses',
    // New: daily weigh-in. weight_kg is numeric(5,2) in the DB so two
    // decimal places of precision are preserved (e.g. 71.45).
    'weight_kg',
  ]),
  value: z.number().min(0).max(200000),
  /**
   * 'set'  → overwrite the column with `value` (use for steps,
   *          sleep_hours, weight_kg — these represent absolute
   *          measurements for the day).
   * 'add'  → increment the existing column by `value` (use for
   *          water_glasses — users tend to log a glass at a time).
   */
  mode: z.enum(['set', 'add']),
});

export type ManualEntryInput = z.infer<typeof schema>;

export type ManualEntryResult = {
  ok: boolean;
  error?: string;
  /** The new value of the column after the write. */
  newValue?: number;
};

/**
 * Manual fitness log entry by the currently-signed-in user. Unlike
 * the admin-facing `upsertDailyLog`, the client_id is derived from
 * the session — users can only write to their own row.
 *
 * Used by the QuickLogSheet on the dashboard fitness tiles so users
 * without auto-source apps (no Galaxy Watch, no Samsung Health
 * sleep tracker, no hydration app) can still log day-to-day.
 */
export async function manualFitnessEntry(
  input: ManualEntryInput
): Promise<ManualEntryResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid entry',
    };
  }
  const { logDate, field, value, mode } = parsed.data;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: 'Not signed in' };

    let newValue = value;
    if (mode === 'add') {
      // Read the existing value to compute the new total
      const { data: existing } = await supabase
        .from('client_daily_logs')
        .select(field)
        .eq('client_id', user.id)
        .eq('log_date', logDate)
        .maybeSingle();
      // Supabase's typed select narrows to a single-key shape; we know
      // `field` matches, but the union type forces us to widen.
      const row = existing as Record<string, number | null> | null;
      const current = row?.[field] ?? 0;
      newValue = current + value;
    }

    const { error } = await supabase.from('client_daily_logs').upsert(
      {
        client_id: user.id,
        log_date: logDate,
        [field]: newValue,
      },
      { onConflict: 'client_id,log_date' }
    );

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[Team Purex] manualFitnessEntry failed:', error);
      return { ok: false, error: error.message };
    }

    revalidatePath('/client/dashboard');
    revalidatePath('/client/progress');

    return { ok: true, newValue };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

