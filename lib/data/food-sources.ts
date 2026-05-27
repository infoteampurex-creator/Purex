/**
 * Food sources library — curated Indian + general foods tagged by
 * macro category AND meal type so clients see meal-appropriate
 * suggestions instead of a confusing bulk list.
 *
 * Coverage focus: typical Indian fitness-client meals (vegetarian
 * defaults + common non-veg protein sources). Calorie + macro values
 * are reasonable averages from USDA / IFCT (Indian Food Composition
 * Tables) — not lab-grade precision but good enough for a daily log
 * to within ±10 %.
 *
 * Extending this list later is safe — just append items. UI sorts
 * within each (mealType × category) section by `name`.
 *
 * NOT a medical / clinical nutrition source. See HEALTH_PASSPORT_DISCLAIMER
 * for the legal posture on health-related copy.
 */

// ─── Types ──────────────────────────────────────────────────────

export type MacroCategory = 'carbs' | 'protein' | 'fat' | 'fiber';

/**
 * Extended meal type — adds pre_workout to the DB enum's set
 * (breakfast/lunch/dinner/snack/other). Pre-workout is a UI-only
 * affordance for now; saved meals still use the DB enum (we store
 * pre-workout entries as 'snack' or 'other' until the enum extends).
 */
export type MealTypeExtended =
  | 'pre_workout'
  | 'breakfast'
  | 'lunch'
  | 'snack'
  | 'dinner';

export interface FoodSource {
  id: string;
  name: string;
  category: MacroCategory;
  mealTypes: MealTypeExtended[];
  /** Human-friendly portion size — e.g. "1 medium", "100 g cooked". */
  portion: string;
  kcal: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  /** True if the item is vegetarian (no fish/meat/egg). */
  veg: boolean;
  /** Common Indian-context staple — used for sort prioritisation. */
  indianStaple?: boolean;
}

// ─── Display metadata ───────────────────────────────────────────

export const MEAL_TYPE_META: Record<
  MealTypeExtended,
  { label: string; color: string; emoji: string; description: string }
> = {
  pre_workout: {
    label: 'Pre-Workout',
    color: '#ffd24d',
    emoji: '⚡',
    description: 'Quick fuel ~30-60 min before training.',
  },
  breakfast: {
    label: 'Breakfast',
    color: '#ff8a4d',
    emoji: '🌅',
    description: 'Sets the tone for the day.',
  },
  lunch: {
    label: 'Lunch',
    color: '#c6ff3d',
    emoji: '🍱',
    description: 'Main fuel block — protein + complex carbs.',
  },
  snack: {
    label: 'Snack',
    color: '#7dd3ff',
    emoji: '🥨',
    description: 'Mid-meal hold — keeps energy stable.',
  },
  dinner: {
    label: 'Dinner',
    color: '#a78bfa',
    emoji: '🌙',
    description: 'Lighter, recovery-focused.',
  },
};

export const MACRO_CATEGORY_META: Record<
  MacroCategory,
  { label: string; color: string; emoji: string }
> = {
  carbs:   { label: 'Carbs',   color: '#c6ff3d', emoji: '🌾' },
  protein: { label: 'Protein', color: '#ff8a4d', emoji: '💪' },
  fat:     { label: 'Fat',     color: '#ffd24d', emoji: '🥑' },
  fiber:   { label: 'Fiber',   color: '#7dd3ff', emoji: '🥬' },
};

// ─── The food library ───────────────────────────────────────────

export const FOOD_SOURCES: FoodSource[] = [
  // ─── CARBS ──────────────────────────────────────────────────
  {
    id: 'white-rice',
    name: 'White rice',
    category: 'carbs',
    mealTypes: ['lunch', 'dinner'],
    portion: '100 g cooked (~½ cup)',
    kcal: 130, protein: 2.7, carbs: 28, fats: 0.4, fiber: 0.4,
    veg: true, indianStaple: true,
  },
  {
    id: 'brown-rice',
    name: 'Brown rice',
    category: 'carbs',
    mealTypes: ['lunch', 'dinner'],
    portion: '100 g cooked',
    kcal: 112, protein: 2.6, carbs: 23, fats: 0.9, fiber: 1.8,
    veg: true, indianStaple: true,
  },
  {
    id: 'chapati',
    name: 'Roti / chapati',
    category: 'carbs',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 medium (~40 g)',
    kcal: 120, protein: 4, carbs: 22, fats: 3, fiber: 3,
    veg: true, indianStaple: true,
  },
  {
    id: 'jowar-roti',
    name: 'Jowar roti',
    category: 'carbs',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 medium',
    kcal: 100, protein: 3, carbs: 20, fats: 1, fiber: 2,
    veg: true, indianStaple: true,
  },
  {
    id: 'bajra-roti',
    name: 'Bajra roti',
    category: 'carbs',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 medium',
    kcal: 110, protein: 3, carbs: 21, fats: 2, fiber: 3,
    veg: true, indianStaple: true,
  },
  {
    id: 'idli',
    name: 'Idli',
    category: 'carbs',
    mealTypes: ['breakfast'],
    portion: '2 pcs',
    kcal: 80, protein: 2, carbs: 17, fats: 0.5, fiber: 1,
    veg: true, indianStaple: true,
  },
  {
    id: 'dosa-plain',
    name: 'Plain dosa',
    category: 'carbs',
    mealTypes: ['breakfast'],
    portion: '1 medium',
    kcal: 130, protein: 3, carbs: 21, fats: 4, fiber: 0.6,
    veg: true, indianStaple: true,
  },
  {
    id: 'upma',
    name: 'Upma',
    category: 'carbs',
    mealTypes: ['breakfast'],
    portion: '1 bowl (~150 g)',
    kcal: 200, protein: 5, carbs: 30, fats: 7, fiber: 2,
    veg: true, indianStaple: true,
  },
  {
    id: 'poha',
    name: 'Poha',
    category: 'carbs',
    mealTypes: ['breakfast'],
    portion: '1 bowl',
    kcal: 180, protein: 4, carbs: 30, fats: 5, fiber: 2,
    veg: true, indianStaple: true,
  },
  {
    id: 'oats',
    name: 'Oats',
    category: 'carbs',
    mealTypes: ['breakfast', 'pre_workout'],
    portion: '50 g dry',
    kcal: 190, protein: 7, carbs: 33, fats: 3, fiber: 5,
    veg: true,
  },
  {
    id: 'sweet-potato',
    name: 'Sweet potato',
    category: 'carbs',
    mealTypes: ['lunch', 'dinner', 'pre_workout'],
    portion: '100 g baked',
    kcal: 86, protein: 1.6, carbs: 20, fats: 0.1, fiber: 3,
    veg: true,
  },
  {
    id: 'banana',
    name: 'Banana',
    category: 'carbs',
    mealTypes: ['pre_workout', 'snack', 'breakfast'],
    portion: '1 medium',
    kcal: 105, protein: 1.3, carbs: 27, fats: 0.3, fiber: 3,
    veg: true,
  },
  {
    id: 'dates',
    name: 'Dates',
    category: 'carbs',
    mealTypes: ['pre_workout', 'snack'],
    portion: '3 pcs (~21 g)',
    kcal: 60, protein: 0.5, carbs: 16, fats: 0, fiber: 1.5,
    veg: true,
  },
  {
    id: 'khichdi',
    name: 'Khichdi (dal + rice)',
    category: 'carbs',
    mealTypes: ['dinner', 'lunch'],
    portion: '1 bowl',
    kcal: 200, protein: 8, carbs: 32, fats: 5, fiber: 4,
    veg: true, indianStaple: true,
  },
  {
    id: 'paratha-plain',
    name: 'Plain paratha',
    category: 'carbs',
    mealTypes: ['breakfast', 'lunch'],
    portion: '1 medium',
    kcal: 130, protein: 3, carbs: 18, fats: 5, fiber: 2,
    veg: true, indianStaple: true,
  },
  {
    id: 'quinoa',
    name: 'Quinoa',
    category: 'carbs',
    mealTypes: ['lunch', 'dinner'],
    portion: '100 g cooked',
    kcal: 120, protein: 4.4, carbs: 21, fats: 1.9, fiber: 2.8,
    veg: true,
  },
  {
    id: 'wholewheat-bread',
    name: 'Whole-wheat bread',
    category: 'carbs',
    mealTypes: ['breakfast', 'snack'],
    portion: '1 slice',
    kcal: 70, protein: 3, carbs: 12, fats: 1, fiber: 2,
    veg: true,
  },
  {
    id: 'makhana',
    name: 'Makhana (fox nuts)',
    category: 'carbs',
    mealTypes: ['snack', 'pre_workout'],
    portion: '30 g roasted',
    kcal: 105, protein: 3, carbs: 25, fats: 0.4, fiber: 1.5,
    veg: true, indianStaple: true,
  },
  {
    id: 'sabudana',
    name: 'Sabudana khichdi',
    category: 'carbs',
    mealTypes: ['breakfast', 'snack'],
    portion: '1 bowl',
    kcal: 250, protein: 3, carbs: 50, fats: 5, fiber: 2,
    veg: true, indianStaple: true,
  },
  {
    id: 'ragi-malt',
    name: 'Ragi malt / porridge',
    category: 'carbs',
    mealTypes: ['breakfast', 'pre_workout'],
    portion: '1 cup',
    kcal: 130, protein: 4, carbs: 26, fats: 1, fiber: 3,
    veg: true, indianStaple: true,
  },

  // ─── PROTEIN ────────────────────────────────────────────────
  {
    id: 'chicken-breast',
    name: 'Chicken breast',
    category: 'protein',
    mealTypes: ['lunch', 'dinner'],
    portion: '100 g cooked',
    kcal: 165, protein: 31, carbs: 0, fats: 3.6, fiber: 0,
    veg: false,
  },
  {
    id: 'chicken-thigh',
    name: 'Chicken thigh',
    category: 'protein',
    mealTypes: ['lunch', 'dinner'],
    portion: '100 g cooked',
    kcal: 209, protein: 26, carbs: 0, fats: 10.9, fiber: 0,
    veg: false,
  },
  {
    id: 'eggs-whole',
    name: 'Whole eggs',
    category: 'protein',
    mealTypes: ['breakfast', 'pre_workout', 'snack'],
    portion: '2 eggs',
    kcal: 156, protein: 12, carbs: 1, fats: 11, fiber: 0,
    veg: false,
  },
  {
    id: 'egg-whites',
    name: 'Egg whites',
    category: 'protein',
    mealTypes: ['breakfast', 'pre_workout'],
    portion: '3 whites',
    kcal: 51, protein: 11, carbs: 0.7, fats: 0.2, fiber: 0,
    veg: false,
  },
  {
    id: 'fish-rohu',
    name: 'Fish (rohu)',
    category: 'protein',
    mealTypes: ['lunch', 'dinner'],
    portion: '100 g cooked',
    kcal: 97, protein: 19.7, carbs: 0, fats: 1.4, fiber: 0,
    veg: false, indianStaple: true,
  },
  {
    id: 'fish-salmon',
    name: 'Salmon',
    category: 'protein',
    mealTypes: ['lunch', 'dinner'],
    portion: '100 g cooked',
    kcal: 208, protein: 20, carbs: 0, fats: 13, fiber: 0,
    veg: false,
  },
  {
    id: 'paneer',
    name: 'Paneer',
    category: 'protein',
    mealTypes: ['breakfast', 'lunch', 'dinner', 'snack'],
    portion: '100 g',
    kcal: 265, protein: 18, carbs: 1.2, fats: 20, fiber: 0,
    veg: true, indianStaple: true,
  },
  {
    id: 'tofu',
    name: 'Tofu',
    category: 'protein',
    mealTypes: ['lunch', 'dinner', 'snack'],
    portion: '100 g',
    kcal: 76, protein: 8, carbs: 1.9, fats: 4.8, fiber: 0.3,
    veg: true,
  },
  {
    id: 'toor-dal',
    name: 'Toor dal',
    category: 'protein',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 cup cooked',
    kcal: 200, protein: 16, carbs: 33, fats: 0.8, fiber: 8,
    veg: true, indianStaple: true,
  },
  {
    id: 'moong-dal',
    name: 'Moong dal',
    category: 'protein',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 cup cooked',
    kcal: 212, protein: 14, carbs: 39, fats: 0.8, fiber: 16,
    veg: true, indianStaple: true,
  },
  {
    id: 'chana-dal',
    name: 'Chana dal',
    category: 'protein',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 cup cooked',
    kcal: 269, protein: 14.5, carbs: 45, fats: 4.3, fiber: 12.5,
    veg: true, indianStaple: true,
  },
  {
    id: 'rajma',
    name: 'Rajma (kidney beans)',
    category: 'protein',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 cup cooked',
    kcal: 245, protein: 15, carbs: 44, fats: 0.9, fiber: 11,
    veg: true, indianStaple: true,
  },
  {
    id: 'chana',
    name: 'Chana (chickpeas)',
    category: 'protein',
    mealTypes: ['lunch', 'snack'],
    portion: '1 cup cooked',
    kcal: 269, protein: 14.5, carbs: 45, fats: 4.2, fiber: 12,
    veg: true, indianStaple: true,
  },
  {
    id: 'greek-yogurt',
    name: 'Greek yogurt',
    category: 'protein',
    mealTypes: ['breakfast', 'snack', 'pre_workout'],
    portion: '200 g',
    kcal: 130, protein: 23, carbs: 8, fats: 0.7, fiber: 0,
    veg: true,
  },
  {
    id: 'hung-curd',
    name: 'Hung curd',
    category: 'protein',
    mealTypes: ['breakfast', 'snack'],
    portion: '100 g',
    kcal: 100, protein: 10, carbs: 6, fats: 4, fiber: 0,
    veg: true, indianStaple: true,
  },
  {
    id: 'whey',
    name: 'Whey protein',
    category: 'protein',
    mealTypes: ['pre_workout', 'snack', 'breakfast'],
    portion: '1 scoop (~30 g)',
    kcal: 120, protein: 24, carbs: 3, fats: 1.5, fiber: 0,
    veg: true,
  },
  {
    id: 'soya-chunks',
    name: 'Soya chunks',
    category: 'protein',
    mealTypes: ['lunch', 'dinner'],
    portion: '50 g dry',
    kcal: 173, protein: 26, carbs: 17, fats: 0.5, fiber: 7,
    veg: true,
  },
  {
    id: 'sprouts',
    name: 'Sprouts (mixed)',
    category: 'protein',
    mealTypes: ['breakfast', 'snack'],
    portion: '1 cup',
    kcal: 100, protein: 8, carbs: 18, fats: 0.5, fiber: 4,
    veg: true, indianStaple: true,
  },
  {
    id: 'egg-bhurji',
    name: 'Egg bhurji',
    category: 'protein',
    mealTypes: ['breakfast'],
    portion: '2 eggs + masala',
    kcal: 200, protein: 14, carbs: 5, fats: 14, fiber: 1,
    veg: false, indianStaple: true,
  },
  {
    id: 'paneer-bhurji',
    name: 'Paneer bhurji',
    category: 'protein',
    mealTypes: ['breakfast', 'dinner'],
    portion: '100 g',
    kcal: 280, protein: 18, carbs: 6, fats: 22, fiber: 1,
    veg: true, indianStaple: true,
  },

  // ─── FAT ────────────────────────────────────────────────────
  {
    id: 'ghee',
    name: 'Ghee',
    category: 'fat',
    mealTypes: ['breakfast', 'lunch', 'dinner'],
    portion: '1 tsp',
    kcal: 45, protein: 0, carbs: 0, fats: 5, fiber: 0,
    veg: true, indianStaple: true,
  },
  {
    id: 'coconut-oil',
    name: 'Coconut oil',
    category: 'fat',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 tsp',
    kcal: 40, protein: 0, carbs: 0, fats: 4.5, fiber: 0,
    veg: true, indianStaple: true,
  },
  {
    id: 'mustard-oil',
    name: 'Mustard oil',
    category: 'fat',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 tsp',
    kcal: 40, protein: 0, carbs: 0, fats: 4.5, fiber: 0,
    veg: true, indianStaple: true,
  },
  {
    id: 'olive-oil',
    name: 'Olive oil',
    category: 'fat',
    mealTypes: ['lunch', 'dinner', 'snack'],
    portion: '1 tsp',
    kcal: 40, protein: 0, carbs: 0, fats: 4.5, fiber: 0,
    veg: true,
  },
  {
    id: 'almonds',
    name: 'Almonds',
    category: 'fat',
    mealTypes: ['pre_workout', 'snack', 'breakfast'],
    portion: '10 pcs (~14 g)',
    kcal: 81, protein: 3, carbs: 3, fats: 7, fiber: 2,
    veg: true,
  },
  {
    id: 'cashews',
    name: 'Cashews',
    category: 'fat',
    mealTypes: ['snack'],
    portion: '10 pcs (~17 g)',
    kcal: 95, protein: 3, carbs: 5, fats: 8, fiber: 0.5,
    veg: true,
  },
  {
    id: 'walnuts',
    name: 'Walnuts',
    category: 'fat',
    mealTypes: ['breakfast', 'snack'],
    portion: '10 halves (~28 g)',
    kcal: 185, protein: 4.3, carbs: 4, fats: 18, fiber: 2,
    veg: true,
  },
  {
    id: 'peanut-butter',
    name: 'Peanut butter',
    category: 'fat',
    mealTypes: ['pre_workout', 'breakfast', 'snack'],
    portion: '1 tbsp (~16 g)',
    kcal: 95, protein: 4, carbs: 3, fats: 8, fiber: 1,
    veg: true,
  },
  {
    id: 'avocado',
    name: 'Avocado',
    category: 'fat',
    mealTypes: ['breakfast', 'lunch'],
    portion: '½ medium',
    kcal: 160, protein: 2, carbs: 9, fats: 15, fiber: 7,
    veg: true,
  },
  {
    id: 'full-fat-curd',
    name: 'Full-fat curd',
    category: 'fat',
    mealTypes: ['breakfast', 'lunch', 'snack'],
    portion: '200 g',
    kcal: 150, protein: 8, carbs: 9, fats: 8, fiber: 0,
    veg: true, indianStaple: true,
  },
  {
    id: 'pumpkin-seeds',
    name: 'Pumpkin seeds',
    category: 'fat',
    mealTypes: ['snack', 'breakfast'],
    portion: '1 tbsp',
    kcal: 65, protein: 3, carbs: 1.5, fats: 5.5, fiber: 1,
    veg: true,
  },
  {
    id: 'coconut-grated',
    name: 'Grated coconut',
    category: 'fat',
    mealTypes: ['breakfast', 'snack'],
    portion: '2 tbsp',
    kcal: 50, protein: 0.5, carbs: 2, fats: 4.5, fiber: 1,
    veg: true, indianStaple: true,
  },

  // ─── FIBER ──────────────────────────────────────────────────
  {
    id: 'chia-seeds',
    name: 'Chia seeds',
    category: 'fiber',
    mealTypes: ['breakfast', 'snack', 'pre_workout'],
    portion: '1 tbsp',
    kcal: 60, protein: 2, carbs: 5, fats: 4, fiber: 5,
    veg: true,
  },
  {
    id: 'flax-seeds',
    name: 'Flax seeds',
    category: 'fiber',
    mealTypes: ['breakfast', 'snack'],
    portion: '1 tbsp',
    kcal: 55, protein: 2, carbs: 3, fats: 4, fiber: 3,
    veg: true,
  },
  {
    id: 'spinach',
    name: 'Spinach / palak',
    category: 'fiber',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 cup cooked',
    kcal: 40, protein: 5, carbs: 6, fats: 0.5, fiber: 4,
    veg: true, indianStaple: true,
  },
  {
    id: 'methi',
    name: 'Methi / fenugreek',
    category: 'fiber',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 cup cooked',
    kcal: 25, protein: 2.5, carbs: 5, fats: 0.5, fiber: 3,
    veg: true, indianStaple: true,
  },
  {
    id: 'bhindi',
    name: 'Bhindi / ladies finger',
    category: 'fiber',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 cup cooked',
    kcal: 33, protein: 2, carbs: 7, fats: 0.2, fiber: 3,
    veg: true, indianStaple: true,
  },
  {
    id: 'cabbage',
    name: 'Cabbage',
    category: 'fiber',
    mealTypes: ['lunch', 'dinner', 'snack'],
    portion: '1 cup',
    kcal: 22, protein: 1, carbs: 5, fats: 0.1, fiber: 2,
    veg: true,
  },
  {
    id: 'broccoli',
    name: 'Broccoli',
    category: 'fiber',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 cup cooked',
    kcal: 55, protein: 3.7, carbs: 11, fats: 0.6, fiber: 5,
    veg: true,
  },
  {
    id: 'cauliflower',
    name: 'Cauliflower / gobi',
    category: 'fiber',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 cup cooked',
    kcal: 27, protein: 2, carbs: 5, fats: 0.3, fiber: 2,
    veg: true, indianStaple: true,
  },
  {
    id: 'beans-long',
    name: 'Green beans',
    category: 'fiber',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 cup cooked',
    kcal: 44, protein: 2.4, carbs: 10, fats: 0.4, fiber: 4,
    veg: true,
  },
  {
    id: 'carrot',
    name: 'Carrot',
    category: 'fiber',
    mealTypes: ['snack', 'lunch', 'dinner'],
    portion: '1 medium',
    kcal: 25, protein: 0.5, carbs: 6, fats: 0.1, fiber: 1.7,
    veg: true,
  },
  {
    id: 'cucumber',
    name: 'Cucumber',
    category: 'fiber',
    mealTypes: ['snack', 'lunch', 'dinner'],
    portion: '1 medium',
    kcal: 16, protein: 0.8, carbs: 4, fats: 0.1, fiber: 1.5,
    veg: true,
  },
  {
    id: 'apple',
    name: 'Apple',
    category: 'fiber',
    mealTypes: ['snack', 'pre_workout', 'breakfast'],
    portion: '1 medium',
    kcal: 95, protein: 0.5, carbs: 25, fats: 0.3, fiber: 4.5,
    veg: true,
  },
  {
    id: 'pear',
    name: 'Pear',
    category: 'fiber',
    mealTypes: ['snack'],
    portion: '1 medium',
    kcal: 100, protein: 0.6, carbs: 27, fats: 0.2, fiber: 5.5,
    veg: true,
  },
  {
    id: 'guava',
    name: 'Guava',
    category: 'fiber',
    mealTypes: ['snack'],
    portion: '1 medium',
    kcal: 70, protein: 2.6, carbs: 15, fats: 1, fiber: 5.5,
    veg: true, indianStaple: true,
  },
  {
    id: 'orange',
    name: 'Orange',
    category: 'fiber',
    mealTypes: ['breakfast', 'snack'],
    portion: '1 medium',
    kcal: 62, protein: 1.2, carbs: 15, fats: 0.2, fiber: 3,
    veg: true,
  },
  {
    id: 'salad-mixed',
    name: 'Mixed salad',
    category: 'fiber',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 bowl',
    kcal: 50, protein: 2, carbs: 10, fats: 0.5, fiber: 4,
    veg: true,
  },
];

// ─── Query helpers ──────────────────────────────────────────────

/**
 * Filter foods for a (mealType, category) cell of the picker grid.
 * Sorted: Indian staples first, then alphabetical by name.
 */
export function foodsFor(
  mealType: MealTypeExtended,
  category: MacroCategory
): FoodSource[] {
  return FOOD_SOURCES
    .filter((f) => f.category === category && f.mealTypes.includes(mealType))
    .sort((a, b) => {
      if (!!a.indianStaple !== !!b.indianStaple) {
        return a.indianStaple ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
}

/** All meal types in the order we want them displayed in tabs. */
export const MEAL_TYPES_ORDERED: MealTypeExtended[] = [
  'pre_workout',
  'breakfast',
  'lunch',
  'snack',
  'dinner',
];

/** Macro category display order (carbs → protein → fat → fiber). */
export const MACRO_CATEGORIES_ORDERED: MacroCategory[] = [
  'carbs',
  'protein',
  'fat',
  'fiber',
];
