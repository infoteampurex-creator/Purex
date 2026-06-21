import 'server-only';
import { FOOD_SOURCES, type FoodSource } from './food-sources';
import { getSheetFoodSources } from './food-sources-from-sheet';

/**
 * Returns the in-code curated FOOD_SOURCES merged with admin-added
 * rows from the Sheets sync (when configured). Dedup by `id` — Sheet
 * row wins when the id collides, so the admin can override a built-in
 * food's macros by adding a row with the same id.
 *
 * Safe to call from any server component. The Sheet fetch is cached
 * for 5 minutes (see lib/google/sheets-client.ts).
 */
export async function getMergedFoodSources(): Promise<FoodSource[]> {
  const sheetSources = await getSheetFoodSources();
  if (sheetSources.length === 0) return FOOD_SOURCES;

  const byId = new Map<string, FoodSource>();
  for (const f of FOOD_SOURCES) byId.set(f.id, f);
  for (const f of sheetSources) byId.set(f.id, f); // Sheet overrides
  return Array.from(byId.values());
}
