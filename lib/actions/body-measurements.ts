'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// All site fields are in cm (canonical). The UI converts to/from
// inches if the user prefers — see lib/data/body-measurements.ts
// for the conversion helpers.

const measurementsSchema = z.object({
  measuredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weightKg: z.number().min(20).max(400).optional().nullable(),
  bodyFatPct: z.number().min(0).max(100).optional().nullable(),
  neckCm: z.number().min(15).max(80).optional().nullable(),
  chestCm: z.number().min(40).max(200).optional().nullable(),
  upperAbdomenCm: z.number().min(40).max(200).optional().nullable(),
  lowerAbdomenCm: z.number().min(40).max(200).optional().nullable(),
  waistCm: z.number().min(40).max(200).optional().nullable(),
  hipsCm: z.number().min(40).max(200).optional().nullable(),
  bicepLeftCm: z.number().min(10).max(80).optional().nullable(),
  bicepRightCm: z.number().min(10).max(80).optional().nullable(),
  thighLeftCm: z.number().min(20).max(120).optional().nullable(),
  thighRightCm: z.number().min(20).max(120).optional().nullable(),
  calfLeftCm: z.number().min(15).max(80).optional().nullable(),
  calfRightCm: z.number().min(15).max(80).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export type BodyMeasurementInput = z.infer<typeof measurementsSchema>;

export type BodyMeasurementResult = {
  ok: boolean;
  error?: string;
};

function toRow(input: BodyMeasurementInput) {
  return {
    measured_at: input.measuredAt,
    weight_kg: input.weightKg ?? null,
    body_fat_pct: input.bodyFatPct ?? null,
    neck_cm: input.neckCm ?? null,
    chest_cm: input.chestCm ?? null,
    upper_abdomen_cm: input.upperAbdomenCm ?? null,
    lower_abdomen_cm: input.lowerAbdomenCm ?? null,
    waist_cm: input.waistCm ?? null,
    hips_cm: input.hipsCm ?? null,
    bicep_left_cm: input.bicepLeftCm ?? null,
    bicep_right_cm: input.bicepRightCm ?? null,
    thigh_left_cm: input.thighLeftCm ?? null,
    thigh_right_cm: input.thighRightCm ?? null,
    calf_left_cm: input.calfLeftCm ?? null,
    calf_right_cm: input.calfRightCm ?? null,
    note: input.note ?? null,
  };
}

/**
 * Log body measurements for the currently-signed-in user.
 * (client_id, measured_at) is unique — re-submitting for the same
 * date updates the existing row instead of creating a duplicate.
 */
export async function upsertMyMeasurements(
  input: BodyMeasurementInput
): Promise<BodyMeasurementResult> {
  const parsed = measurementsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: 'Not signed in' };

    const { error } = await supabase.from('client_body_measurements').upsert(
      { client_id: user.id, ...toRow(parsed.data) },
      { onConflict: 'client_id,measured_at' }
    );
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[PURE X] upsertMyMeasurements failed:', error);
      return { ok: false, error: error.message };
    }

    revalidatePath('/client/dashboard');
    revalidatePath('/client/profile');
    revalidatePath('/client/progress');
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// ─── Profile-side settings (height, gender, unit preference) ──────

const profileSchema = z.object({
  heightCm: z.number().min(80).max(260).optional().nullable(),
  gender: z
    .enum(['male', 'female', 'other', 'prefer_not_to_say'])
    .optional()
    .nullable(),
  unitPref: z.enum(['in', 'cm']).optional(),
});

export type ProfileBodySettingsInput = z.infer<typeof profileSchema>;

export async function updateProfileBodySettings(
  input: ProfileBodySettingsInput
): Promise<BodyMeasurementResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: 'Not signed in' };

    const update: Record<string, unknown> = {};
    if (parsed.data.heightCm !== undefined) update.height_cm = parsed.data.heightCm;
    if (parsed.data.gender !== undefined) update.gender = parsed.data.gender;
    if (parsed.data.unitPref !== undefined) update.unit_pref = parsed.data.unitPref;

    if (Object.keys(update).length === 0) return { ok: true };

    const { error } = await supabase
      .from('profiles')
      .update(update)
      .eq('id', user.id);
    if (error) return { ok: false, error: error.message };

    revalidatePath('/client/dashboard');
    revalidatePath('/client/profile');
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
