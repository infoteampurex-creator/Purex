'use server';

import {
  parsePastedDietPlan,
  type ParsedDietPlan,
} from '@/lib/data/meal-plan-paste';

// ─── previewPastedDietPlan ──────────────────────────────────────

/**
 * Parse a free-text diet plan into a structured preview. NO DB writes
 * and no library lookups — that's deliberate: the diet plan stores
 * verbatim food names because the food library is still a static TS
 * constant (FOOD_SOURCES) without UUIDs to FK against. Library
 * matching for nutrition compliance happens at log time, not plan time.
 *
 * Returns the parsed structure plus the original text so the editor
 * can keep the raw paste available for "Edit text" round-tripping.
 */
export async function previewPastedDietPlan(text: string): Promise<
  | { ok: true; plan: ParsedDietPlan }
  | { ok: false; error: string }
> {
  if (!text || text.trim().length === 0) {
    return { ok: false, error: 'Paste some text first.' };
  }
  const plan = parsePastedDietPlan(text);
  // Soft sanity check — empty parse usually means the format was wrong
  // (e.g. no asterisk-wrapped headers). Surface a hint instead of
  // committing an empty plan.
  if (
    plan.meals.length === 0 &&
    plan.macros.calories === null &&
    plan.lifestyle.waterLiters === null
  ) {
    return {
      ok: false,
      error:
        'Couldn\'t parse anything — make sure section headers are wrapped in *asterisks* (e.g. *Breakfast*) and items start with • or - .',
    };
  }
  return { ok: true, plan };
}
