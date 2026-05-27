'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { MOOD_STATES, type MoodState } from '@/lib/data/mood';

const moodSchema = z.object({
  mood: z.enum(MOOD_STATES as [MoodState, ...MoodState[]]),
  /** YYYY-MM-DD — defaults to today on the server if not supplied. */
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export type SetMoodResult = { ok: true } | { ok: false; error: string };

/**
 * Save the current user's mood for a given date (default today).
 *
 * Upserts client_daily_logs on (client_id, log_date) — re-submitting
 * the same day just updates mood_state. Returns 'ok: true' on
 * success; on error returns a short human-readable message the
 * dashboard surfaces to the user.
 *
 * Security: relies on the auth context for client_id — never trusts
 * a client-supplied user id. RLS policy "Clients manage own logs"
 * also enforces this server-side.
 */
export async function setMood(input: {
  mood: MoodState;
  date?: string;
}): Promise<SetMoodResult> {
  const parsed = moodSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid mood' };
  }
  const { mood, date } = parsed.data;

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { ok: false, error: 'You are not signed in.' };
    }

    const logDate = date ?? new Date().toISOString().slice(0, 10);

    const { error } = await supabase
      .from('client_daily_logs')
      .upsert(
        {
          client_id: user.id,
          log_date: logDate,
          mood_state: mood,
        },
        { onConflict: 'client_id,log_date' }
      );

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath('/client/dashboard');
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not save mood',
    };
  }
}
