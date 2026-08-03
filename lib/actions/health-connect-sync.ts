'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

const ML_PER_GLASS = 250;

const syncSchema = z.object({
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  steps: z.number().int().min(0).max(200000).optional().nullable(),
  sleepMinutes: z.number().int().min(0).max(1440).optional().nullable(),
  waterMl: z.number().int().min(0).max(20000).optional().nullable(),
});

export type HealthConnectSyncInput = z.infer<typeof syncSchema>;

export type HealthConnectSyncResult = {
  ok: boolean;
  error?: string;
  /** Echoed normalized values so the client can confirm what landed. */
  saved?: {
    steps: number | null;
    sleepHours: number | null;
    waterGlasses: number | null;
  };
};

/**
 * Persist a Health Connect read for the *current logged-in user*.
 *
 * Unlike `upsertDailyLog` (admin-facing, takes an explicit clientId),
 * this action derives the user from the session — the user can only
 * write to their own row. RLS on `client_daily_logs` enforces this
 * defensively if the input is tampered with.
 *
 * Field mapping from Health Connect → client_daily_logs:
 *   - steps        →  steps
 *   - sleepMinutes →  sleep_hours (round to 0.1h precision)
 *   - waterMl      →  water_glasses (250 ml / glass, rounded)
 */
export async function syncHealthConnectDay(
  input: HealthConnectSyncInput
): Promise<HealthConnectSyncResult> {
  const parsed = syncSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid sync payload',
    };
  }

  const data = parsed.data;

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, error: 'Not signed in' };
    }

    // Derive normalized values + skip nulls so we don't clobber
    // existing admin-entered data with zeros from Health Connect when
    // a record type wasn't granted permission.
    const updates: Record<string, number | null> = {};
    if (data.steps != null) updates.steps = data.steps;
    if (data.sleepMinutes != null) {
      updates.sleep_hours = Math.round((data.sleepMinutes / 60) * 10) / 10;
    }
    if (data.waterMl != null) {
      updates.water_glasses = Math.round(data.waterMl / ML_PER_GLASS);
    }

    if (Object.keys(updates).length === 0) {
      return { ok: true, saved: { steps: null, sleepHours: null, waterGlasses: null } };
    }

    const { error } = await supabase.from('client_daily_logs').upsert(
      {
        client_id: user.id,
        log_date: data.logDate,
        ...updates,
      },
      { onConflict: 'client_id,log_date' }
    );

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[Team Purex] syncHealthConnectDay failed:', error);
      return { ok: false, error: error.message };
    }

    revalidatePath('/client/dashboard');
    revalidatePath('/client/progress');

    return {
      ok: true,
      saved: {
        steps: data.steps ?? null,
        sleepHours:
          data.sleepMinutes != null
            ? Math.round((data.sleepMinutes / 60) * 10) / 10
            : null,
        waterGlasses:
          data.waterMl != null
            ? Math.round(data.waterMl / ML_PER_GLASS)
            : null,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
