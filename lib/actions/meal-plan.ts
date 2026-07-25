'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// ─── Validation ─────────────────────────────────────────────────

const macrosSchema = z.object({
  calories: z.number().int().min(0).max(10000).nullable(),
  carbsMin: z.number().int().min(0).max(1000).nullable(),
  carbsMax: z.number().int().min(0).max(1000).nullable(),
  proteinMin: z.number().int().min(0).max(500).nullable(),
  proteinMax: z.number().int().min(0).max(500).nullable(),
  fatsMin: z.number().int().min(0).max(500).nullable(),
  fatsMax: z.number().int().min(0).max(500).nullable(),
});

const lifestyleSchema = z.object({
  waterLiters: z.number().min(0).max(20).nullable(),
  stepsTarget: z.number().int().min(0).max(60000).nullable(),
  sleepHours: z.number().min(0).max(16).nullable(),
});

const itemSchema = z.object({
  foodName: z.string().min(1).max(200),
  quantity: z.string().max(80).nullable(),
  /** kcal per portion. 0 – 4000 covers everything from a sip of water
   *  to a calorie-dense oil-only meal; admin is expected to keep this
   *  honest. Null means "coach hasn't set it" — client just doesn't
   *  see a kcal label and the swap suggestions are disabled. */
  calories: z.number().int().min(0).max(4000).nullable(),
  itemOrder: z.number().int().min(0).max(50),
  notes: z.string().max(300).nullable().optional(),
});

const mealSchema = z.object({
  mealName: z.string().min(1).max(60),
  mealOrder: z.number().int().min(0).max(20),
  mealType: z
    .enum([
      'breakfast',
      'lunch',
      'dinner',
      'snack',
      'pre_workout',
      'post_workout',
      'other',
    ])
    .nullable(),
  notes: z.string().max(500).nullable(),
  items: z.array(itemSchema).max(50),
});

const setPlanSchema = z.object({
  clientId: z.string().uuid(),
  name: z.string().max(120).nullable().optional(),
  macros: macrosSchema,
  lifestyle: lifestyleSchema,
  cookingOilNote: z.string().max(300).nullable(),
  notes: z.string().max(2000).nullable(),
  meals: z.array(mealSchema).max(20),
});

export type SetMealPlanInput = z.infer<typeof setPlanSchema>;

export type SetMealPlanResult =
  | { ok: true; mealsWritten: number; itemsWritten: number }
  | { ok: false; error: string };

// ─── setClientMealPlan ──────────────────────────────────────────

/**
 * Save (upsert) a client's full diet plan — header, meals, and items.
 *
 * Replacement semantics: delete-then-insert for meals + items. The
 * client UI re-renders fresh; clients never log AGAINST plan rows
 * (they log against client_meals, free-form), so no actuals-protection
 * dance is needed unlike the workout flow.
 *
 * Admin-only. RLS also enforces.
 */
export async function setClientMealPlan(
  input: SetMealPlanInput
): Promise<SetMealPlanResult> {
  const parsed = setPlanSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }
  const data = parsed.data;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: 'Not signed in' };

    const { data: roleRow } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    const role = roleRow?.role ?? 'user';
    if (role !== 'admin' && role !== 'super_admin') {
      return { ok: false, error: 'Only coaches can edit diet plans.' };
    }

    // ─── 1. Upsert the plan header ─────────────────────────────
    const { error: headErr } = await supabase
      .from('client_meal_plan')
      .upsert(
        {
          client_id: data.clientId,
          name: data.name ?? null,
          daily_calories: data.macros.calories,
          daily_carbs_g_min: data.macros.carbsMin,
          daily_carbs_g_max: data.macros.carbsMax,
          daily_protein_g_min: data.macros.proteinMin,
          daily_protein_g_max: data.macros.proteinMax,
          daily_fats_g_min: data.macros.fatsMin,
          daily_fats_g_max: data.macros.fatsMax,
          daily_water_liters: data.lifestyle.waterLiters,
          daily_steps_target: data.lifestyle.stepsTarget,
          daily_sleep_hours: data.lifestyle.sleepHours,
          cooking_oil_note: data.cookingOilNote,
          notes: data.notes,
          updated_by: user.id,
        },
        { onConflict: 'client_id' }
      );
    if (headErr) {
      return { ok: false, error: `Header save failed: ${headErr.message}` };
    }

    // ─── 2. Wipe existing meals (cascades to items) ────────────
    const { error: delErr } = await supabase
      .from('client_meal_plan_meals')
      .delete()
      .eq('client_id', data.clientId);
    if (delErr) {
      return { ok: false, error: `Meal reset failed: ${delErr.message}` };
    }

    // ─── 3. Insert meals + items ───────────────────────────────
    let mealsWritten = 0;
    let itemsWritten = 0;

    for (const meal of data.meals) {
      const { data: mealRow, error: mealErr } = await supabase
        .from('client_meal_plan_meals')
        .insert({
          client_id: data.clientId,
          meal_name: meal.mealName,
          meal_order: meal.mealOrder,
          meal_type: meal.mealType,
          notes: meal.notes,
        })
        .select('id')
        .single();

      if (mealErr || !mealRow) {
        return {
          ok: false,
          error: `Meal insert failed: ${mealErr?.message ?? 'unknown'}`,
        };
      }
      mealsWritten++;

      if (meal.items.length > 0) {
        const itemRows = meal.items.map((it) => ({
          meal_id: mealRow.id,
          food_name: it.foodName,
          quantity: it.quantity,
          calories: it.calories,
          item_order: it.itemOrder,
          notes: it.notes ?? null,
        }));
        const { error: itemErr } = await supabase
          .from('client_meal_plan_items')
          .insert(itemRows);
        if (itemErr) {
          return {
            ok: false,
            error: `Item insert failed: ${itemErr.message}`,
          };
        }
        itemsWritten += itemRows.length;
      }
    }

    revalidatePath(`/admin/clients/${data.clientId}`);
    revalidatePath('/client/nutrition');
    revalidatePath('/client/dashboard');

    return { ok: true, mealsWritten, itemsWritten };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Plan save failed',
    };
  }
}
