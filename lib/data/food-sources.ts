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
 * Cuisine / regional grouping. Used for the optional cuisine filter
 * chip in the food browser — clients with global preferences can
 * narrow to their kitchen (Mediterranean, East Asian, etc.) instead
 * of scrolling past unfamiliar foods.
 *
 * 'universal' = items that read across all cuisines (eggs, chicken,
 * banana, olive oil, etc.) — always shown regardless of cuisine filter.
 */
export type Cuisine =
  | 'universal'
  | 'indian'
  | 'mediterranean'
  | 'western'
  | 'east_asian'
  | 'middle_eastern'
  | 'latin';

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
  /** Cuisine context. Optional — items without cuisine default to
   *  'universal' (always shown). Existing Indian-staple items can
   *  use indianStaple alone without restating cuisine='indian'. */
  cuisine?: Cuisine;
  /** Common Indian-context staple — used for sort prioritisation when
   *  the user hasn't picked a cuisine yet. Implies cuisine='indian'
   *  unless an explicit cuisine is set. */
  indianStaple?: boolean;
}

/** Resolve a food's effective cuisine, defaulting smartly. */
export function effectiveCuisine(food: FoodSource): Cuisine {
  if (food.cuisine) return food.cuisine;
  if (food.indianStaple) return 'indian';
  return 'universal';
}

export const CUISINE_META: Record<
  Cuisine,
  { label: string; flag: string }
> = {
  universal:      { label: 'All cuisines',  flag: '🌍' },
  indian:         { label: 'Indian',        flag: '🇮🇳' },
  mediterranean:  { label: 'Mediterranean', flag: '🫒' },
  western:        { label: 'Western',       flag: '🥗' },
  east_asian:     { label: 'East Asian',    flag: '🥢' },
  middle_eastern: { label: 'Middle East',   flag: '🥙' },
  latin:          { label: 'Latin',         flag: '🌮' },
};

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

  // ═══════════════════════════════════════════════════════════════
  // GLOBAL EXPANSION — for clients outside India (Mediterranean,
  // Western, East Asian, Middle Eastern, Latin). Items tagged with
  // explicit cuisine; universal items (eggs, banana, chicken, etc.)
  // were already in the Indian section above and serve global users
  // as-is — no need to duplicate them.
  // ═══════════════════════════════════════════════════════════════

  // ─── MEDITERRANEAN ──────────────────────────────────────────
  {
    id: 'pita-bread',
    name: 'Pita bread (whole wheat)',
    category: 'carbs',
    mealTypes: ['breakfast', 'lunch', 'snack'],
    portion: '1 medium (~60 g)',
    kcal: 165, protein: 6, carbs: 33, fats: 1.6, fiber: 5,
    veg: true, cuisine: 'mediterranean',
  },
  {
    id: 'couscous',
    name: 'Couscous',
    category: 'carbs',
    mealTypes: ['lunch', 'dinner'],
    portion: '100 g cooked',
    kcal: 112, protein: 3.8, carbs: 23, fats: 0.2, fiber: 1.4,
    veg: true, cuisine: 'mediterranean',
  },
  {
    id: 'bulgur',
    name: 'Bulgur',
    category: 'carbs',
    mealTypes: ['lunch', 'dinner'],
    portion: '100 g cooked',
    kcal: 83, protein: 3.1, carbs: 19, fats: 0.2, fiber: 4.5,
    veg: true, cuisine: 'mediterranean',
  },
  {
    id: 'feta',
    name: 'Feta cheese',
    category: 'protein',
    mealTypes: ['breakfast', 'lunch', 'snack'],
    portion: '50 g',
    kcal: 132, protein: 7, carbs: 2, fats: 11, fiber: 0,
    veg: true, cuisine: 'mediterranean',
  },
  {
    id: 'hummus',
    name: 'Hummus',
    category: 'protein',
    mealTypes: ['lunch', 'snack', 'breakfast'],
    portion: '50 g (~3 tbsp)',
    kcal: 120, protein: 5, carbs: 10, fats: 7, fiber: 3,
    veg: true, cuisine: 'mediterranean',
  },
  {
    id: 'olives',
    name: 'Olives',
    category: 'fat',
    mealTypes: ['lunch', 'snack', 'dinner'],
    portion: '10 pcs',
    kcal: 50, protein: 0.4, carbs: 3, fats: 4.5, fiber: 1.5,
    veg: true, cuisine: 'mediterranean',
  },
  {
    id: 'falafel',
    name: 'Falafel',
    category: 'protein',
    mealTypes: ['lunch', 'snack'],
    portion: '3 balls (~50 g)',
    kcal: 165, protein: 6, carbs: 16, fats: 9, fiber: 4,
    veg: true, cuisine: 'middle_eastern',
  },
  {
    id: 'tahini',
    name: 'Tahini',
    category: 'fat',
    mealTypes: ['breakfast', 'lunch', 'snack'],
    portion: '1 tbsp',
    kcal: 90, protein: 2.6, carbs: 3, fats: 8, fiber: 1.4,
    veg: true, cuisine: 'middle_eastern',
  },
  {
    id: 'tabouleh',
    name: 'Tabouleh',
    category: 'fiber',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 cup',
    kcal: 100, protein: 3, carbs: 14, fats: 4, fiber: 4,
    veg: true, cuisine: 'mediterranean',
  },
  {
    id: 'greek-salad',
    name: 'Greek salad',
    category: 'fiber',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 bowl',
    kcal: 180, protein: 6, carbs: 12, fats: 13, fiber: 4,
    veg: true, cuisine: 'mediterranean',
  },

  // ─── WESTERN / CONTINENTAL ──────────────────────────────────
  {
    id: 'oatmeal-cooked',
    name: 'Oatmeal (with milk)',
    category: 'carbs',
    mealTypes: ['breakfast', 'pre_workout'],
    portion: '1 cup cooked',
    kcal: 165, protein: 6, carbs: 28, fats: 3, fiber: 4,
    veg: true, cuisine: 'western',
  },
  {
    id: 'granola',
    name: 'Granola',
    category: 'carbs',
    mealTypes: ['breakfast', 'snack'],
    portion: '50 g',
    kcal: 220, protein: 5, carbs: 30, fats: 9, fiber: 4,
    veg: true, cuisine: 'western',
  },
  {
    id: 'protein-pancakes',
    name: 'Protein pancakes',
    category: 'protein',
    mealTypes: ['breakfast', 'pre_workout'],
    portion: '2 medium',
    kcal: 280, protein: 22, carbs: 28, fats: 8, fiber: 3,
    veg: true, cuisine: 'western',
  },
  {
    id: 'turkey-breast',
    name: 'Turkey breast',
    category: 'protein',
    mealTypes: ['lunch', 'dinner', 'snack'],
    portion: '100 g cooked',
    kcal: 135, protein: 30, carbs: 0, fats: 1, fiber: 0,
    veg: false, cuisine: 'western',
  },
  {
    id: 'cottage-cheese',
    name: 'Cottage cheese',
    category: 'protein',
    mealTypes: ['breakfast', 'snack', 'pre_workout'],
    portion: '100 g',
    kcal: 98, protein: 11, carbs: 3.4, fats: 4.3, fiber: 0,
    veg: true, cuisine: 'western',
  },
  {
    id: 'cheddar-cheese',
    name: 'Cheddar cheese',
    category: 'fat',
    mealTypes: ['breakfast', 'snack'],
    portion: '30 g',
    kcal: 120, protein: 7, carbs: 0.4, fats: 10, fiber: 0,
    veg: true, cuisine: 'western',
  },
  {
    id: 'protein-shake-western',
    name: 'Protein smoothie',
    category: 'protein',
    mealTypes: ['pre_workout', 'breakfast', 'snack'],
    portion: '1 glass (~300 ml)',
    kcal: 250, protein: 25, carbs: 25, fats: 5, fiber: 4,
    veg: true, cuisine: 'universal',
  },
  {
    id: 'beef-steak',
    name: 'Beef steak (lean)',
    category: 'protein',
    mealTypes: ['lunch', 'dinner'],
    portion: '100 g cooked',
    kcal: 250, protein: 26, carbs: 0, fats: 15, fiber: 0,
    veg: false, cuisine: 'western',
  },
  {
    id: 'tuna',
    name: 'Tuna (canned in water)',
    category: 'protein',
    mealTypes: ['lunch', 'snack', 'dinner'],
    portion: '100 g drained',
    kcal: 116, protein: 26, carbs: 0, fats: 1, fiber: 0,
    veg: false, cuisine: 'universal',
  },
  {
    id: 'rye-bread',
    name: 'Rye bread',
    category: 'carbs',
    mealTypes: ['breakfast', 'lunch', 'snack'],
    portion: '1 slice',
    kcal: 83, protein: 2.7, carbs: 15, fats: 1.1, fiber: 1.9,
    veg: true, cuisine: 'western',
  },

  // ─── EAST ASIAN ─────────────────────────────────────────────
  {
    id: 'jasmine-rice',
    name: 'Jasmine rice',
    category: 'carbs',
    mealTypes: ['lunch', 'dinner'],
    portion: '100 g cooked',
    kcal: 130, protein: 2.7, carbs: 28, fats: 0.3, fiber: 0.4,
    veg: true, cuisine: 'east_asian',
  },
  {
    id: 'sushi-rice',
    name: 'Sushi rice',
    category: 'carbs',
    mealTypes: ['lunch', 'dinner'],
    portion: '100 g cooked',
    kcal: 130, protein: 2.4, carbs: 29, fats: 0.2, fiber: 0.3,
    veg: true, cuisine: 'east_asian',
  },
  {
    id: 'rice-noodles',
    name: 'Rice noodles',
    category: 'carbs',
    mealTypes: ['lunch', 'dinner'],
    portion: '100 g cooked',
    kcal: 109, protein: 0.9, carbs: 25, fats: 0.2, fiber: 1,
    veg: true, cuisine: 'east_asian',
  },
  {
    id: 'soba-noodles',
    name: 'Soba noodles',
    category: 'carbs',
    mealTypes: ['lunch', 'dinner'],
    portion: '100 g cooked',
    kcal: 99, protein: 5.1, carbs: 21, fats: 0.1, fiber: 1,
    veg: true, cuisine: 'east_asian',
  },
  {
    id: 'edamame',
    name: 'Edamame',
    category: 'protein',
    mealTypes: ['snack', 'lunch', 'pre_workout'],
    portion: '1 cup shelled',
    kcal: 188, protein: 18, carbs: 14, fats: 8, fiber: 8,
    veg: true, cuisine: 'east_asian',
  },
  {
    id: 'tempeh',
    name: 'Tempeh',
    category: 'protein',
    mealTypes: ['lunch', 'dinner'],
    portion: '100 g',
    kcal: 195, protein: 19, carbs: 9, fats: 11, fiber: 0,
    veg: true, cuisine: 'east_asian',
  },
  {
    id: 'miso',
    name: 'Miso soup',
    category: 'protein',
    mealTypes: ['breakfast', 'lunch', 'dinner'],
    portion: '1 bowl',
    kcal: 60, protein: 5, carbs: 7, fats: 2, fiber: 1.5,
    veg: true, cuisine: 'east_asian',
  },
  {
    id: 'seaweed',
    name: 'Seaweed (nori)',
    category: 'fiber',
    mealTypes: ['snack', 'lunch'],
    portion: '5 g',
    kcal: 18, protein: 3, carbs: 2, fats: 0.5, fiber: 1.5,
    veg: true, cuisine: 'east_asian',
  },
  {
    id: 'shiitake',
    name: 'Shiitake mushrooms',
    category: 'fiber',
    mealTypes: ['lunch', 'dinner'],
    portion: '100 g cooked',
    kcal: 56, protein: 1.6, carbs: 15, fats: 0.2, fiber: 2.3,
    veg: true, cuisine: 'east_asian',
  },
  {
    id: 'sesame-oil',
    name: 'Sesame oil',
    category: 'fat',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 tsp',
    kcal: 40, protein: 0, carbs: 0, fats: 4.5, fiber: 0,
    veg: true, cuisine: 'east_asian',
  },

  // ─── LATIN / MEXICAN ────────────────────────────────────────
  {
    id: 'black-beans',
    name: 'Black beans',
    category: 'protein',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 cup cooked',
    kcal: 227, protein: 15, carbs: 41, fats: 0.9, fiber: 15,
    veg: true, cuisine: 'latin',
  },
  {
    id: 'corn-tortilla',
    name: 'Corn tortilla',
    category: 'carbs',
    mealTypes: ['breakfast', 'lunch', 'dinner'],
    portion: '1 medium (~25 g)',
    kcal: 60, protein: 1.5, carbs: 13, fats: 0.7, fiber: 1.5,
    veg: true, cuisine: 'latin',
  },
  {
    id: 'salsa-fresh',
    name: 'Fresh salsa',
    category: 'fiber',
    mealTypes: ['lunch', 'snack', 'dinner'],
    portion: '50 g',
    kcal: 18, protein: 1, carbs: 4, fats: 0.1, fiber: 1,
    veg: true, cuisine: 'latin',
  },
  {
    id: 'guacamole',
    name: 'Guacamole',
    category: 'fat',
    mealTypes: ['lunch', 'snack', 'dinner'],
    portion: '50 g',
    kcal: 80, protein: 1, carbs: 5, fats: 7, fiber: 3.5,
    veg: true, cuisine: 'latin',
  },
  {
    id: 'plantain',
    name: 'Plantain',
    category: 'carbs',
    mealTypes: ['lunch', 'pre_workout', 'snack'],
    portion: '100 g cooked',
    kcal: 116, protein: 0.8, carbs: 31, fats: 0.2, fiber: 2.3,
    veg: true, cuisine: 'latin',
  },
  {
    id: 'pinto-beans',
    name: 'Pinto beans',
    category: 'protein',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 cup cooked',
    kcal: 245, protein: 15, carbs: 45, fats: 1, fiber: 15,
    veg: true, cuisine: 'latin',
  },

  // ─── UNIVERSAL ADDITIONS ────────────────────────────────────
  {
    id: 'kale',
    name: 'Kale',
    category: 'fiber',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 cup cooked',
    kcal: 36, protein: 2.5, carbs: 7, fats: 0.5, fiber: 2.6,
    veg: true, cuisine: 'universal',
  },
  {
    id: 'zucchini',
    name: 'Zucchini',
    category: 'fiber',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 cup cooked',
    kcal: 17, protein: 1.2, carbs: 3.1, fats: 0.3, fiber: 1,
    veg: true, cuisine: 'universal',
  },
  {
    id: 'bell-pepper',
    name: 'Bell pepper',
    category: 'fiber',
    mealTypes: ['lunch', 'snack', 'dinner'],
    portion: '1 medium',
    kcal: 31, protein: 1, carbs: 7, fats: 0.3, fiber: 2.5,
    veg: true, cuisine: 'universal',
  },
  {
    id: 'berries-mixed',
    name: 'Mixed berries',
    category: 'fiber',
    mealTypes: ['breakfast', 'snack'],
    portion: '1 cup',
    kcal: 70, protein: 1, carbs: 17, fats: 0.5, fiber: 4,
    veg: true, cuisine: 'universal',
  },
  {
    id: 'grapes',
    name: 'Grapes',
    category: 'fiber',
    mealTypes: ['snack', 'pre_workout'],
    portion: '1 cup',
    kcal: 100, protein: 1, carbs: 27, fats: 0.2, fiber: 1.4,
    veg: true, cuisine: 'universal',
  },
  {
    id: 'lentils-green',
    name: 'Green lentils',
    category: 'protein',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 cup cooked',
    kcal: 230, protein: 18, carbs: 40, fats: 0.8, fiber: 16,
    veg: true, cuisine: 'universal',
  },
  {
    id: 'shrimp',
    name: 'Shrimp',
    category: 'protein',
    mealTypes: ['lunch', 'dinner'],
    portion: '100 g cooked',
    kcal: 99, protein: 24, carbs: 0.2, fats: 0.3, fiber: 0,
    veg: false, cuisine: 'universal',
  },

  // ═══════════════════════════════════════════════════════════════
  // BATCH 3 — Fills sparse cells (pre-workout fat/fiber, fruits,
  // drinks, more Indian dishes, pasta, sandwiches). User feedback:
  // "lot of data is missing in browse foods" → audit found
  // pre-workout × fat/fiber and several Indian dish categories
  // under-represented.
  // ═══════════════════════════════════════════════════════════════

  // ─── Pre-workout fat (was sparse — only almonds + PB) ──────
  {
    id: 'almond-butter',
    name: 'Almond butter',
    category: 'fat',
    mealTypes: ['pre_workout', 'breakfast', 'snack'],
    portion: '1 tbsp',
    kcal: 98, protein: 3.4, carbs: 3, fats: 9, fiber: 1.5,
    veg: true, cuisine: 'universal',
  },
  {
    id: 'macadamia',
    name: 'Macadamia nuts',
    category: 'fat',
    mealTypes: ['pre_workout', 'snack'],
    portion: '10 nuts (~20 g)',
    kcal: 144, protein: 1.6, carbs: 2.8, fats: 15, fiber: 1.7,
    veg: true, cuisine: 'universal',
  },
  {
    id: 'mct-oil',
    name: 'MCT oil',
    category: 'fat',
    mealTypes: ['pre_workout', 'breakfast'],
    portion: '1 tbsp',
    kcal: 100, protein: 0, carbs: 0, fats: 14, fiber: 0,
    veg: true, cuisine: 'universal',
  },
  {
    id: 'chia-pudding',
    name: 'Chia pudding',
    category: 'fat',
    mealTypes: ['pre_workout', 'breakfast', 'snack'],
    portion: '1 small cup',
    kcal: 180, protein: 6, carbs: 18, fats: 9, fiber: 8,
    veg: true, cuisine: 'universal',
  },

  // ─── Pre-workout fiber (was very sparse — only chia) ────────
  {
    id: 'oat-bran',
    name: 'Oat bran',
    category: 'fiber',
    mealTypes: ['pre_workout', 'breakfast'],
    portion: '30 g dry',
    kcal: 70, protein: 5, carbs: 19, fats: 2, fiber: 4.5,
    veg: true, cuisine: 'universal',
  },
  {
    id: 'psyllium-husk',
    name: 'Psyllium husk',
    category: 'fiber',
    mealTypes: ['pre_workout', 'breakfast', 'snack'],
    portion: '1 tbsp (~5 g)',
    kcal: 15, protein: 0.5, carbs: 4, fats: 0, fiber: 4,
    veg: true, cuisine: 'universal',
  },
  {
    id: 'raspberries',
    name: 'Raspberries',
    category: 'fiber',
    mealTypes: ['pre_workout', 'snack', 'breakfast'],
    portion: '1 cup',
    kcal: 64, protein: 1.5, carbs: 15, fats: 0.8, fiber: 8,
    veg: true, cuisine: 'universal',
  },
  {
    id: 'pomegranate',
    name: 'Pomegranate',
    category: 'fiber',
    mealTypes: ['pre_workout', 'breakfast', 'snack'],
    portion: '½ cup arils',
    kcal: 72, protein: 1.5, carbs: 16, fats: 1, fiber: 3.5,
    veg: true, indianStaple: true,
  },

  // ─── More Indian breakfast / lunch / dinner staples ───────
  {
    id: 'pongal',
    name: 'Pongal',
    category: 'carbs',
    mealTypes: ['breakfast'],
    portion: '1 bowl',
    kcal: 230, protein: 7, carbs: 36, fats: 6, fiber: 2,
    veg: true, indianStaple: true,
  },
  {
    id: 'uttapam',
    name: 'Uttapam',
    category: 'carbs',
    mealTypes: ['breakfast', 'dinner'],
    portion: '1 medium',
    kcal: 170, protein: 5, carbs: 28, fats: 4, fiber: 2,
    veg: true, indianStaple: true,
  },
  {
    id: 'thepla',
    name: 'Methi thepla',
    category: 'carbs',
    mealTypes: ['breakfast', 'snack', 'lunch'],
    portion: '1 medium',
    kcal: 120, protein: 4, carbs: 18, fats: 4, fiber: 3,
    veg: true, indianStaple: true,
  },
  {
    id: 'dhokla',
    name: 'Dhokla',
    category: 'carbs',
    mealTypes: ['breakfast', 'snack'],
    portion: '4 pcs (~120 g)',
    kcal: 160, protein: 7, carbs: 25, fats: 3, fiber: 3,
    veg: true, indianStaple: true,
  },
  {
    id: 'chole',
    name: 'Chole (chickpea curry)',
    category: 'protein',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 cup',
    kcal: 280, protein: 12, carbs: 35, fats: 10, fiber: 9,
    veg: true, indianStaple: true,
  },
  {
    id: 'dal-makhani',
    name: 'Dal makhani',
    category: 'protein',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 cup',
    kcal: 280, protein: 12, carbs: 28, fats: 14, fiber: 8,
    veg: true, indianStaple: true,
  },
  {
    id: 'palak-paneer',
    name: 'Palak paneer',
    category: 'protein',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 cup',
    kcal: 300, protein: 14, carbs: 12, fats: 22, fiber: 5,
    veg: true, indianStaple: true,
  },
  {
    id: 'paneer-tikka',
    name: 'Paneer tikka',
    category: 'protein',
    mealTypes: ['lunch', 'dinner', 'snack'],
    portion: '6 pcs (~150 g)',
    kcal: 340, protein: 22, carbs: 10, fats: 24, fiber: 1,
    veg: true, indianStaple: true,
  },
  {
    id: 'butter-chicken',
    name: 'Butter chicken',
    category: 'protein',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 cup',
    kcal: 380, protein: 26, carbs: 8, fats: 26, fiber: 1,
    veg: false, indianStaple: true,
  },
  {
    id: 'tandoori-chicken',
    name: 'Tandoori chicken',
    category: 'protein',
    mealTypes: ['lunch', 'dinner'],
    portion: '2 pcs (~150 g)',
    kcal: 240, protein: 30, carbs: 4, fats: 11, fiber: 0,
    veg: false, indianStaple: true,
  },
  {
    id: 'fish-curry-south',
    name: 'Fish curry (South Indian)',
    category: 'protein',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 cup',
    kcal: 220, protein: 22, carbs: 6, fats: 12, fiber: 2,
    veg: false, indianStaple: true,
  },
  {
    id: 'biryani-chicken',
    name: 'Chicken biryani',
    category: 'carbs',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 plate (~250 g)',
    kcal: 480, protein: 22, carbs: 55, fats: 18, fiber: 3,
    veg: false, indianStaple: true,
  },
  {
    id: 'biryani-veg',
    name: 'Veg biryani',
    category: 'carbs',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 plate (~250 g)',
    kcal: 430, protein: 9, carbs: 65, fats: 14, fiber: 4,
    veg: true, indianStaple: true,
  },
  {
    id: 'pulao',
    name: 'Pulao',
    category: 'carbs',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 cup',
    kcal: 250, protein: 5, carbs: 38, fats: 8, fiber: 2,
    veg: true, indianStaple: true,
  },
  {
    id: 'roti-with-ghee',
    name: 'Roti with ghee',
    category: 'carbs',
    mealTypes: ['lunch', 'dinner', 'breakfast'],
    portion: '1 medium',
    kcal: 145, protein: 4, carbs: 22, fats: 6, fiber: 3,
    veg: true, indianStaple: true,
  },
  {
    id: 'sambar',
    name: 'Sambar',
    category: 'protein',
    mealTypes: ['breakfast', 'lunch', 'dinner'],
    portion: '1 cup',
    kcal: 130, protein: 7, carbs: 18, fats: 3, fiber: 5,
    veg: true, indianStaple: true,
  },
  {
    id: 'rasam',
    name: 'Rasam',
    category: 'fiber',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 cup',
    kcal: 60, protein: 3, carbs: 10, fats: 1, fiber: 2,
    veg: true, indianStaple: true,
  },
  {
    id: 'curd-rice',
    name: 'Curd rice',
    category: 'carbs',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 bowl',
    kcal: 220, protein: 7, carbs: 35, fats: 6, fiber: 1,
    veg: true, indianStaple: true,
  },
  {
    id: 'raita',
    name: 'Raita',
    category: 'protein',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 small bowl',
    kcal: 80, protein: 4, carbs: 6, fats: 4, fiber: 1,
    veg: true, indianStaple: true,
  },
  {
    id: 'gajar-halwa',
    name: 'Gajar halwa',
    category: 'carbs',
    mealTypes: ['snack'],
    portion: '½ cup',
    kcal: 280, protein: 5, carbs: 38, fats: 12, fiber: 3,
    veg: true, indianStaple: true,
  },

  // ─── Indian drinks (sparse — none before) ─────────────────
  {
    id: 'milk',
    name: 'Whole milk',
    category: 'protein',
    mealTypes: ['breakfast', 'pre_workout', 'snack'],
    portion: '1 glass (200 ml)',
    kcal: 130, protein: 7, carbs: 10, fats: 7, fiber: 0,
    veg: true,
  },
  {
    id: 'milk-skim',
    name: 'Skim milk',
    category: 'protein',
    mealTypes: ['breakfast', 'pre_workout', 'snack'],
    portion: '1 glass (200 ml)',
    kcal: 70, protein: 7, carbs: 10, fats: 0.2, fiber: 0,
    veg: true,
  },
  {
    id: 'buttermilk-chaas',
    name: 'Buttermilk (chaas)',
    category: 'protein',
    mealTypes: ['lunch', 'dinner', 'snack'],
    portion: '1 glass',
    kcal: 50, protein: 4, carbs: 5, fats: 2, fiber: 0,
    veg: true, indianStaple: true,
  },
  {
    id: 'lassi-sweet',
    name: 'Sweet lassi',
    category: 'carbs',
    mealTypes: ['lunch', 'snack'],
    portion: '1 glass',
    kcal: 200, protein: 6, carbs: 30, fats: 6, fiber: 0,
    veg: true, indianStaple: true,
  },
  {
    id: 'lassi-salted',
    name: 'Salted lassi',
    category: 'protein',
    mealTypes: ['lunch', 'snack'],
    portion: '1 glass',
    kcal: 100, protein: 6, carbs: 8, fats: 5, fiber: 0,
    veg: true, indianStaple: true,
  },
  {
    id: 'black-coffee',
    name: 'Black coffee',
    category: 'fat',
    mealTypes: ['pre_workout', 'breakfast'],
    portion: '1 cup',
    kcal: 5, protein: 0.3, carbs: 0, fats: 0, fiber: 0,
    veg: true,
  },
  {
    id: 'green-tea',
    name: 'Green tea',
    category: 'fiber',
    mealTypes: ['pre_workout', 'breakfast', 'snack'],
    portion: '1 cup',
    kcal: 2, protein: 0.5, carbs: 0, fats: 0, fiber: 0,
    veg: true,
  },
  {
    id: 'coconut-water',
    name: 'Coconut water',
    category: 'carbs',
    mealTypes: ['pre_workout', 'snack'],
    portion: '1 glass (250 ml)',
    kcal: 45, protein: 2, carbs: 9, fats: 0.5, fiber: 3,
    veg: true, indianStaple: true,
  },

  // ─── More fruits ────────────────────────────────────────
  {
    id: 'mango',
    name: 'Mango',
    category: 'carbs',
    mealTypes: ['breakfast', 'snack', 'pre_workout'],
    portion: '1 cup chopped',
    kcal: 100, protein: 1.4, carbs: 25, fats: 0.6, fiber: 3,
    veg: true, indianStaple: true,
  },
  {
    id: 'papaya',
    name: 'Papaya',
    category: 'fiber',
    mealTypes: ['breakfast', 'snack'],
    portion: '1 cup',
    kcal: 60, protein: 1, carbs: 15, fats: 0.4, fiber: 2.5,
    veg: true, indianStaple: true,
  },
  {
    id: 'watermelon',
    name: 'Watermelon',
    category: 'fiber',
    mealTypes: ['snack', 'pre_workout'],
    portion: '1 cup',
    kcal: 46, protein: 1, carbs: 12, fats: 0.2, fiber: 0.6,
    veg: true,
  },
  {
    id: 'strawberries',
    name: 'Strawberries',
    category: 'fiber',
    mealTypes: ['breakfast', 'snack'],
    portion: '1 cup',
    kcal: 50, protein: 1, carbs: 12, fats: 0.5, fiber: 3,
    veg: true,
  },
  {
    id: 'blueberries',
    name: 'Blueberries',
    category: 'fiber',
    mealTypes: ['breakfast', 'snack', 'pre_workout'],
    portion: '1 cup',
    kcal: 84, protein: 1, carbs: 21, fats: 0.5, fiber: 4,
    veg: true,
  },
  {
    id: 'pineapple',
    name: 'Pineapple',
    category: 'carbs',
    mealTypes: ['breakfast', 'snack'],
    portion: '1 cup',
    kcal: 82, protein: 0.9, carbs: 22, fats: 0.2, fiber: 2.3,
    veg: true,
  },
  {
    id: 'kiwi',
    name: 'Kiwi',
    category: 'fiber',
    mealTypes: ['breakfast', 'snack'],
    portion: '1 medium',
    kcal: 42, protein: 0.8, carbs: 10, fats: 0.4, fiber: 2.1,
    veg: true,
  },

  // ─── Global staples ─────────────────────────────────────
  {
    id: 'pasta-wholewheat',
    name: 'Whole-wheat pasta',
    category: 'carbs',
    mealTypes: ['lunch', 'dinner'],
    portion: '100 g cooked',
    kcal: 124, protein: 5.3, carbs: 26, fats: 1.1, fiber: 4.5,
    veg: true, cuisine: 'mediterranean',
  },
  {
    id: 'sandwich-chicken',
    name: 'Chicken sandwich',
    category: 'protein',
    mealTypes: ['lunch', 'snack'],
    portion: '1 sandwich',
    kcal: 380, protein: 28, carbs: 38, fats: 12, fiber: 4,
    veg: false, cuisine: 'western',
  },
  {
    id: 'sandwich-veg',
    name: 'Veg sandwich',
    category: 'carbs',
    mealTypes: ['breakfast', 'lunch', 'snack'],
    portion: '1 sandwich',
    kcal: 280, protein: 10, carbs: 40, fats: 9, fiber: 5,
    veg: true, cuisine: 'western',
  },
  {
    id: 'omelette',
    name: 'Vegetable omelette',
    category: 'protein',
    mealTypes: ['breakfast'],
    portion: '2 eggs + veg',
    kcal: 220, protein: 14, carbs: 5, fats: 16, fiber: 1.5,
    veg: false, cuisine: 'universal',
  },
  {
    id: 'smoothie-bowl',
    name: 'Smoothie bowl',
    category: 'carbs',
    mealTypes: ['breakfast', 'snack'],
    portion: '1 bowl',
    kcal: 310, protein: 12, carbs: 50, fats: 7, fiber: 8,
    veg: true, cuisine: 'western',
  },
  {
    id: 'yogurt-parfait',
    name: 'Yogurt parfait',
    category: 'protein',
    mealTypes: ['breakfast', 'snack'],
    portion: '1 cup',
    kcal: 250, protein: 14, carbs: 32, fats: 7, fiber: 4,
    veg: true, cuisine: 'western',
  },
  {
    id: 'rice-bowl-poke',
    name: 'Poke bowl (tuna)',
    category: 'protein',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 bowl',
    kcal: 460, protein: 30, carbs: 50, fats: 14, fiber: 6,
    veg: false, cuisine: 'east_asian',
  },
  {
    id: 'falafel-wrap',
    name: 'Falafel wrap',
    category: 'protein',
    mealTypes: ['lunch', 'snack'],
    portion: '1 wrap',
    kcal: 420, protein: 14, carbs: 52, fats: 18, fiber: 8,
    veg: true, cuisine: 'mediterranean',
  },
  {
    id: 'protein-bar',
    name: 'Protein bar',
    category: 'protein',
    mealTypes: ['pre_workout', 'snack'],
    portion: '1 bar (~50 g)',
    kcal: 200, protein: 20, carbs: 22, fats: 6, fiber: 3,
    veg: true, cuisine: 'universal',
  },
  {
    id: 'rice-cake',
    name: 'Rice cake',
    category: 'carbs',
    mealTypes: ['pre_workout', 'snack'],
    portion: '2 cakes',
    kcal: 70, protein: 1.4, carbs: 14, fats: 0.6, fiber: 0.5,
    veg: true, cuisine: 'universal',
  },
  {
    id: 'mushroom-portobello',
    name: 'Portobello mushroom',
    category: 'fiber',
    mealTypes: ['lunch', 'dinner'],
    portion: '1 large cap',
    kcal: 22, protein: 2.5, carbs: 4, fats: 0.4, fiber: 1.3,
    veg: true, cuisine: 'universal',
  },
  {
    id: 'beetroot',
    name: 'Beetroot',
    category: 'fiber',
    mealTypes: ['lunch', 'dinner', 'pre_workout'],
    portion: '1 cup cooked',
    kcal: 60, protein: 2.2, carbs: 13, fats: 0.2, fiber: 3.4,
    veg: true,
  },
  {
    id: 'beetroot-juice',
    name: 'Beetroot juice',
    category: 'carbs',
    mealTypes: ['pre_workout', 'breakfast'],
    portion: '1 glass (200 ml)',
    kcal: 80, protein: 2, carbs: 18, fats: 0.2, fiber: 0,
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

/**
 * Suggest alternatives at a similar kcal — used by the "Swap" affordance
 * on /client/nutrition. Filters FOOD_SOURCES to entries within ±tolerance
 * (default ±15%) of the source kcal, ideally for the same meal type
 * (we fall back to all meal types if the strict filter returns too few).
 *
 * Sorted by closeness to source kcal, then Indian staples first.
 * Excludes the source item itself when a name match is given.
 */
export function findAlternativesAtSimilarKcal(
  sourceKcal: number,
  options: {
    mealType?: MealTypeExtended | null;
    excludeName?: string | null;
    tolerance?: number; // 0.15 = ±15%
    maxResults?: number;
    veg?: boolean | null;
  } = {}
): FoodSource[] {
  const {
    mealType = null,
    excludeName = null,
    tolerance = 0.15,
    maxResults = 8,
    veg = null,
  } = options;

  if (!Number.isFinite(sourceKcal) || sourceKcal <= 0) return [];

  const lo = sourceKcal * (1 - tolerance);
  const hi = sourceKcal * (1 + tolerance);

  const matchKcal = (f: FoodSource) => f.kcal >= lo && f.kcal <= hi;
  const matchMealType = (f: FoodSource) =>
    !mealType || f.mealTypes.includes(mealType);
  const matchName = (f: FoodSource) =>
    !excludeName ||
    f.name.trim().toLowerCase() !== excludeName.trim().toLowerCase();
  const matchVeg = (f: FoodSource) => veg === null || f.veg === veg;

  const sortByCloseness = (a: FoodSource, b: FoodSource) => {
    const da = Math.abs(a.kcal - sourceKcal);
    const db = Math.abs(b.kcal - sourceKcal);
    if (da !== db) return da - db;
    if (!!a.indianStaple !== !!b.indianStaple) {
      return a.indianStaple ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  };

  // First pass: strict (meal type + kcal + veg + not source).
  const strict = FOOD_SOURCES.filter(
    (f) => matchKcal(f) && matchMealType(f) && matchName(f) && matchVeg(f)
  ).sort(sortByCloseness);

  if (strict.length >= 3 || !mealType) {
    return strict.slice(0, maxResults);
  }

  // Fallback: relax meal type so the user still sees options.
  const relaxed = FOOD_SOURCES.filter(
    (f) => matchKcal(f) && matchName(f) && matchVeg(f)
  ).sort(sortByCloseness);

  return relaxed.slice(0, maxResults);
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
