'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// ─── Types ──────────────────────────────────────────────────────────

const MEAL_TYPE = z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'other']);
const SOURCE = z.enum(['manual', 'ai_photo', 'health_connect']);

const addMealSchema = z.object({
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: MEAL_TYPE,
  name: z.string().max(120).optional().nullable(),
  calories: z.number().int().min(0).max(10000),
  proteinG: z.number().int().min(0).max(500).default(0),
  carbsG: z.number().int().min(0).max(1000).default(0),
  fatsG: z.number().int().min(0).max(500).default(0),
  fiberG: z.number().int().min(0).max(200).default(0),
  source: SOURCE.default('manual'),
  note: z.string().max(500).optional().nullable(),
  /** Phase 2 — present when the meal came from the AI photo flow. */
  photoUrl: z.string().url().optional().nullable(),
  aiRaw: z.unknown().optional().nullable(),
  aiConfidence: z.number().min(0).max(1).optional().nullable(),
});

export type AddMealInput = z.infer<typeof addMealSchema>;

export type AddMealResult = {
  ok: boolean;
  error?: string;
  mealId?: string;
};

/**
 * Log a meal for the currently-signed-in user. The
 * rollup_client_meals_to_daily trigger auto-updates
 * client_daily_logs.calories_consumed / protein_g / etc., so the
 * Twin / fitness tiles / streak score pick up the new totals on
 * next render.
 */
export async function addMeal(input: AddMealInput): Promise<AddMealResult> {
  const parsed = addMealSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid meal' };
  }
  const data = parsed.data;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: 'Not signed in' };

    const { data: inserted, error } = await supabase
      .from('client_meals')
      .insert({
        client_id: user.id,
        log_date: data.logDate,
        meal_type: data.mealType,
        name: data.name ?? null,
        calories: data.calories,
        protein_g: data.proteinG,
        carbs_g: data.carbsG,
        fats_g: data.fatsG,
        fiber_g: data.fiberG,
        source: data.source,
        note: data.note ?? null,
        photo_url: data.photoUrl ?? null,
        ai_raw: data.aiRaw ?? null,
        ai_confidence: data.aiConfidence ?? null,
      })
      .select('id')
      .single();

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[Team Purex] addMeal failed:', error);
      return { ok: false, error: error.message };
    }

    revalidatePath('/client/dashboard');
    revalidatePath('/client/progress');

    return { ok: true, mealId: inserted.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

export async function deleteMeal(mealId: string): Promise<{ ok: boolean; error?: string }> {
  if (!mealId) return { ok: false, error: 'Missing meal id' };
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('client_meals')
      .delete()
      .eq('id', mealId);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/client/dashboard');
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
