import 'server-only';
import { createClient } from '@/lib/supabase/server';
import {
  emptyMealPlan,
  type MealPlan,
  type MealPlanMeal,
  type MealPlanItem,
  type PlanMealType,
} from './meal-plan';

/**
 * Read the active meal plan for a client. Returns the empty plan
 * (no meals, no macros) when no row exists yet — lets the coach UI
 * render the editor + paste box without a special branch.
 *
 * RLS: admins can read any plan; clients can only read their own.
 */
export async function getMealPlanForClient(
  clientId: string
): Promise<MealPlan> {
  try {
    const supabase = await createClient();

    const [headRes, mealsRes] = await Promise.all([
      supabase
        .from('client_meal_plan')
        .select(
          'client_id, name, daily_calories, daily_carbs_g_min, daily_carbs_g_max, daily_protein_g_min, daily_protein_g_max, daily_fats_g_min, daily_fats_g_max, daily_water_liters, daily_steps_target, daily_sleep_hours, cooking_oil_note, notes, updated_at, updated_by'
        )
        .eq('client_id', clientId)
        .maybeSingle(),
      supabase
        .from('client_meal_plan_meals')
        .select('id, meal_name, meal_order, meal_type, notes')
        .eq('client_id', clientId)
        .order('meal_order', { ascending: true }),
    ]);

    if (!headRes.data) {
      return emptyMealPlan(clientId);
    }

    // Fetch items for the meals we have
    type MealRow = {
      id: string;
      meal_name: string;
      meal_order: number;
      meal_type: PlanMealType | null;
      notes: string | null;
    };
    const mealRows = (mealsRes.data ?? []) as MealRow[];
    const mealIds = mealRows.map((m) => m.id);

    let itemsByMeal = new Map<string, MealPlanItem[]>();
    if (mealIds.length > 0) {
      const { data: itemRows } = await supabase
        .from('client_meal_plan_items')
        .select('id, meal_id, food_name, quantity, calories, item_order, notes')
        .in('meal_id', mealIds)
        .order('item_order', { ascending: true });

      type ItemRow = {
        id: string;
        meal_id: string;
        food_name: string;
        quantity: string | null;
        calories: number | null;
        item_order: number;
        notes: string | null;
      };
      for (const r of (itemRows ?? []) as ItemRow[]) {
        if (!itemsByMeal.has(r.meal_id)) itemsByMeal.set(r.meal_id, []);
        itemsByMeal.get(r.meal_id)!.push({
          id: r.id,
          foodName: r.food_name,
          quantity: r.quantity,
          calories: r.calories,
          itemOrder: r.item_order,
          notes: r.notes,
        });
      }
    }

    const meals: MealPlanMeal[] = mealRows.map((m) => ({
      id: m.id,
      mealName: m.meal_name,
      mealOrder: m.meal_order,
      mealType: m.meal_type,
      notes: m.notes,
      items: itemsByMeal.get(m.id) ?? [],
    }));

    return {
      clientId: headRes.data.client_id,
      name: headRes.data.name,
      macros: {
        calories: headRes.data.daily_calories,
        carbsMin: headRes.data.daily_carbs_g_min,
        carbsMax: headRes.data.daily_carbs_g_max,
        proteinMin: headRes.data.daily_protein_g_min,
        proteinMax: headRes.data.daily_protein_g_max,
        fatsMin: headRes.data.daily_fats_g_min,
        fatsMax: headRes.data.daily_fats_g_max,
      },
      lifestyle: {
        waterLiters: headRes.data.daily_water_liters,
        stepsTarget: headRes.data.daily_steps_target,
        sleepHours: headRes.data.daily_sleep_hours,
      },
      cookingOilNote: headRes.data.cooking_oil_note,
      notes: headRes.data.notes,
      meals,
      updatedAt: headRes.data.updated_at,
      updatedBy: headRes.data.updated_by,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[meal-plan-server] getMealPlanForClient threw', err);
    return emptyMealPlan(clientId);
  }
}
