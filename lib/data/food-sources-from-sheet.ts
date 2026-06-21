import 'server-only';
import { fetchSheet, isSheetsConfigured } from '@/lib/google/sheets-client';
import {
  type Cuisine,
  type FoodSource,
  type MacroCategory,
  type MealTypeExtended,
} from './food-sources';

/**
 * Reads admin-curated food rows from the Google Sheet referenced by
 * env var SHEET_FOOD_LIBRARY_ID. SUPPLEMENTS the in-code FOOD_SOURCES
 * — never replaces them — so the swap feature shipped in PR #56
 * stays fully functional even when the integration is unconfigured.
 *
 * Sheet schema (first row is the header, ignored):
 *
 *   A: id              — kebab-case unique identifier
 *   B: name            — display name
 *   C: category        — carbs | protein | fat | fiber
 *   D: meal_types      — comma-separated: breakfast,lunch,snack,...
 *   E: portion         — "1 medium", "100 g cooked", etc.
 *   F: kcal            — integer
 *   G: protein_g       — integer
 *   H: carbs_g         — integer
 *   I: fats_g          — integer
 *   J: fiber_g         — integer
 *   K: veg             — TRUE | FALSE (case-insensitive)
 *   L: cuisine         — universal | indian | mediterranean | western | east_asian | middle_eastern | latin
 *   M: indian_staple   — TRUE | FALSE
 *
 * Rows with a blank id or invalid kcal are skipped (with a warning
 * in Vercel logs so the admin can fix them).
 */
export async function getSheetFoodSources(): Promise<FoodSource[]> {
  if (!isSheetsConfigured()) return [];
  const spreadsheetId = process.env.SHEET_FOOD_LIBRARY_ID;
  if (!spreadsheetId) return [];

  try {
    // Read up to ~2000 rows — generous headroom for admin additions
    // without bloating the cached payload.
    const rows = await fetchSheet({
      spreadsheetId,
      range: 'Foods!A2:M2000',
    });

    const parsed: FoodSource[] = [];
    rows.forEach((r, i) => {
      const food = parseRow(r);
      if (!food) {
        // eslint-disable-next-line no-console
        console.warn(
          `[food-sources-from-sheet] skipping invalid row ${i + 2}`,
          { row: r.slice(0, 4) }
        );
        return;
      }
      parsed.push(food);
    });
    return parsed;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      '[food-sources-from-sheet] fetch failed — falling back to in-code library',
      err instanceof Error ? err.message : err
    );
    return [];
  }
}

// ─── Row parser ─────────────────────────────────────────────────

function parseRow(r: string[]): FoodSource | null {
  const [
    id,
    name,
    category,
    mealTypes,
    portion,
    kcal,
    protein,
    carbs,
    fats,
    fiber,
    veg,
    cuisine,
    indianStaple,
  ] = r;

  if (!id?.trim() || !name?.trim()) return null;
  const cat = parseCategory(category);
  if (!cat) return null;
  const mt = parseMealTypes(mealTypes);
  if (mt.length === 0) return null;
  const kcalN = parseInt(kcal ?? '', 10);
  if (!Number.isFinite(kcalN) || kcalN <= 0) return null;

  return {
    id: id.trim(),
    name: name.trim(),
    category: cat,
    mealTypes: mt,
    portion: portion?.trim() || '1 serving',
    kcal: kcalN,
    protein: toInt(protein),
    carbs: toInt(carbs),
    fats: toInt(fats),
    fiber: toInt(fiber),
    veg: parseBool(veg),
    cuisine: parseCuisine(cuisine),
    indianStaple: parseBool(indianStaple) || undefined,
  };
}

function toInt(v: string | undefined): number {
  const n = parseInt(v ?? '', 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function parseBool(v: string | undefined): boolean {
  return /^(true|yes|y|1)$/i.test((v ?? '').trim());
}

function parseCategory(v: string | undefined): MacroCategory | null {
  const x = (v ?? '').trim().toLowerCase();
  if (x === 'carbs' || x === 'protein' || x === 'fat' || x === 'fiber') {
    return x;
  }
  return null;
}

function parseMealTypes(v: string | undefined): MealTypeExtended[] {
  if (!v) return [];
  const allowed = new Set<MealTypeExtended>([
    'pre_workout',
    'breakfast',
    'lunch',
    'snack',
    'dinner',
  ]);
  return v
    .split(/[,;|]/)
    .map((s) => s.trim().toLowerCase().replace(/-/g, '_'))
    .filter((s): s is MealTypeExtended => allowed.has(s as MealTypeExtended));
}

function parseCuisine(v: string | undefined): Cuisine | undefined {
  if (!v) return undefined;
  const x = v.trim().toLowerCase().replace(/-/g, '_');
  const allowed: Cuisine[] = [
    'universal',
    'indian',
    'mediterranean',
    'western',
    'east_asian',
    'middle_eastern',
    'latin',
  ];
  return allowed.includes(x as Cuisine) ? (x as Cuisine) : undefined;
}
