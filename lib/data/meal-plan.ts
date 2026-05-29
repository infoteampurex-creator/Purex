/**
 * Coach-assigned diet plan — pure shared types.
 *
 * Imported on server and client. Server-only fetching lives in
 * meal-plan-server.ts; mutations live in lib/actions/meal-plan.ts.
 */

export type PlanMealType =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'snack'
  | 'pre_workout'
  | 'post_workout'
  | 'other';

export interface MealPlanItem {
  id?: string;                   // present when loaded from DB; absent on draft items
  foodName: string;              // "Oats", "1 Whole Egg + 3 Egg Whites"
  quantity: string | null;       // "60g", "150ml", "275g (cooked)", null
  itemOrder: number;
  notes?: string | null;
}

export interface MealPlanMeal {
  id?: string;
  mealName: string;              // "Breakfast", "Pre-Workout"
  mealOrder: number;
  mealType: PlanMealType | null;
  notes: string | null;
  items: MealPlanItem[];
}

export interface MealPlanMacros {
  /** kcal — single target. */
  calories: number | null;
  /** grams — min and max support coach's range writing ("310-315g"). */
  carbsMin: number | null;
  carbsMax: number | null;
  proteinMin: number | null;
  proteinMax: number | null;
  fatsMin: number | null;
  fatsMax: number | null;
}

export interface MealPlanLifestyle {
  waterLiters: number | null;
  stepsTarget: number | null;
  sleepHours: number | null;
}

export interface MealPlan {
  clientId: string;
  name: string | null;
  macros: MealPlanMacros;
  lifestyle: MealPlanLifestyle;
  cookingOilNote: string | null;
  notes: string | null;
  meals: MealPlanMeal[];          // ordered by mealOrder
  updatedAt: string;              // ISO; updated_at from DB
  updatedBy: string | null;       // profile id
}

/** Empty meal plan for first-time clients — coach editor still renders
 *  without a special "no plan" branch. */
export function emptyMealPlan(clientId: string): MealPlan {
  return {
    clientId,
    name: null,
    macros: {
      calories: null,
      carbsMin: null, carbsMax: null,
      proteinMin: null, proteinMax: null,
      fatsMin: null, fatsMax: null,
    },
    lifestyle: { waterLiters: null, stepsTarget: null, sleepHours: null },
    cookingOilNote: null,
    notes: null,
    meals: [],
    updatedAt: new Date().toISOString(),
    updatedBy: null,
  };
}

export function isMealPlanEmpty(plan: MealPlan): boolean {
  return plan.meals.length === 0 && plan.macros.calories === null;
}

/** Display labels — match the meal_type CHECK constraint. */
export const MEAL_TYPE_LABELS: Record<PlanMealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
  pre_workout: 'Pre-Workout',
  post_workout: 'Post-Workout',
  other: 'Other',
};

/** Coach typed-name → enum mapping. Used by the paste parser so we can
 *  colour-code Pre-Workout, etc. on the client view. Falls through to
 *  null (renders neutral). */
export function guessMealType(mealName: string): PlanMealType | null {
  const n = mealName.trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (n.includes('preworkout') || n.includes('preworkout') || n === 'preworkout') return 'pre_workout';
  if (n.includes('postworkout')) return 'post_workout';
  if (n.includes('breakfast') || n.includes('brunch')) return 'breakfast';
  if (n.includes('lunch')) return 'lunch';
  if (n.includes('dinner') || n.includes('supper')) return 'dinner';
  if (n.includes('snack') || n.includes('midmorn') || n.includes('eveningsnack')) return 'snack';
  return null;
}
