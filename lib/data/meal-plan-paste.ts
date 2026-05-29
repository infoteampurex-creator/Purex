/**
 * Diet plan paste parser.
 *
 * Built around the actual format Siva uses on WhatsApp — bold-wrapped
 * section headers, bullet-prefixed items, em-dash-separated
 * "Food – Quantity", a special *Daily Macros* block at the bottom,
 * and a free-form Notes footer with lifestyle targets.
 *
 * Reference input (one client's full daily plan):
 *
 *   *Breakfast*
 *   • Oats – 60g
 *   • Skim Milk – 150ml
 *   • 1 Whole Egg + 3 Egg Whites
 *   …
 *
 *   *Lunch*
 *   • White Rice – 275g (cooked)
 *   …
 *
 *   *Cooking Oil*
 *   • Olive Oil – 10ml (total for the day)
 *
 *   *Daily Macros*
 *   • Calories – 2,500 kcal
 *   • Carbs – 310–315g
 *   • Protein – 185–190g
 *   • Fats – 53–56g
 *
 *   Note-
 *   4 ltrs water intake is mandatory
 *   10k steps everyday
 *   7 hours sleep
 *
 * Output is a structured `ParsedDietPlan` ready to seed the editor.
 * No DB lookups — pure parsing. Library matching (for fuzzy food
 * names) happens in the server action so the cached library doesn't
 * leak into the client bundle.
 */

import type { PlanMealType } from './meal-plan';
import { guessMealType } from './meal-plan';

// ─── Output shapes ──────────────────────────────────────────────

export interface ParsedItem {
  /** Verbatim food name as the coach typed it. */
  foodName: string;
  /** Quantity text — "60g", "150ml", "275g (cooked)", null if absent. */
  quantity: string | null;
}

export interface ParsedMeal {
  name: string;                        // "Breakfast", "Pre-Workout"
  mealType: PlanMealType | null;       // enum hint for client UI colour
  items: ParsedItem[];
}

export interface ParsedMacros {
  calories: number | null;
  carbsMin: number | null;
  carbsMax: number | null;
  proteinMin: number | null;
  proteinMax: number | null;
  fatsMin: number | null;
  fatsMax: number | null;
}

export interface ParsedLifestyle {
  waterLiters: number | null;
  stepsTarget: number | null;
  sleepHours: number | null;
}

export interface ParsedDietPlan {
  meals: ParsedMeal[];
  cookingOilNote: string | null;
  macros: ParsedMacros;
  lifestyle: ParsedLifestyle;
  /** Anything in the Notes section we couldn't pull into a structured
   *  lifestyle field — preserved so the coach can read it back. */
  notesFreeText: string | null;
  /** Items the parser couldn't split into food+quantity — surfaced so
   *  the preview can flag them for the coach. Empty when everything
   *  parsed cleanly. Each entry: { mealName, raw }. */
  unparsedLines: Array<{ mealName: string; raw: string }>;
}

// ─── Parser internals ───────────────────────────────────────────

/** Strip leading markdown bullet/asterisk and trailing decoration. */
function stripMarkdown(line: string): string {
  return line
    .replace(/^[\s*_~`#>•·\-]+/, '')
    .replace(/[\s*_~`]+$/, '')
    .trim();
}

/** Detect a bullet-style item line (•, -, ·). The asterisk `*` is
 *  reserved for bold-wrapped section headers, so we deliberately do
 *  NOT treat it as a bullet — otherwise "*Breakfast*" would look like
 *  a bullet point. */
function isBulletLine(line: string): boolean {
  return /^[\s]*[•·\-]/.test(line);
}

/** Parse a section header like "*Breakfast*" or "*Daily Macros*".
 *  Returns the section title (e.g. "Breakfast") or null. */
function parseSectionHeader(line: string): string | null {
  const t = line.trim();
  // Must be wrapped in asterisks AND contain no bullet — bullet lines
  // are items, even when the food name happens to be bold-wrapped.
  if (isBulletLine(t)) return null;
  const m = t.match(/^\*+\s*([^*]+?)\s*\*+\s*$/);
  if (!m) return null;
  return m[1].trim();
}

/** Split "Oats – 60g" → { foodName: "Oats", quantity: "60g" }.
 *  Recognises em-dash (–), en-dash (—), and " - " (hyphen with spaces).
 *  Lines without a separator return quantity = null. */
function splitFoodAndQuantity(line: string): {
  foodName: string;
  quantity: string | null;
} {
  // Look for a separator: – — or " - "
  const dashMatch = line.match(/^(.+?)\s+[–—]\s+(.+)$/);
  if (dashMatch) {
    return { foodName: dashMatch[1].trim(), quantity: dashMatch[2].trim() };
  }
  // Hyphen with required spaces — avoid splitting hyphenated names like
  // "low-fat".
  const hyphenMatch = line.match(/^(.+?)\s+-\s+(.+)$/);
  if (hyphenMatch) {
    return { foodName: hyphenMatch[1].trim(), quantity: hyphenMatch[2].trim() };
  }
  return { foodName: line.trim(), quantity: null };
}

/** Strip a bullet prefix (•, ·, -) from a content line. Asterisks are
 *  intentionally excluded — same reason as in isBulletLine. */
function stripBullet(line: string): string {
  return line.replace(/^[\s]*[•·\-]+\s*/, '').trim();
}

/** Pull a number (possibly with commas and decimals) from a string.
 *  Used for macro + lifestyle extraction. Returns null when no number. */
function firstNumber(s: string): number | null {
  const m = s.match(/(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)/);
  if (!m) return null;
  return parseFloat(m[1].replace(/,/g, ''));
}

/** Extract a range like "310–315" / "185-190". Returns { min, max }
 *  when both sides found; { min: x, max: null } when just one number. */
function parseRange(s: string): { min: number | null; max: number | null } {
  // Strip everything except digits, decimals, commas, and dashes.
  const cleaned = s.replace(/[^\d.,\-–—]/g, '');
  const parts = cleaned.split(/[–—\-]/).filter(Boolean);
  if (parts.length === 0) return { min: null, max: null };
  const a = firstNumber(parts[0]);
  const b = parts.length > 1 ? firstNumber(parts[1]) : null;
  if (a !== null && b !== null) {
    return { min: Math.min(a, b), max: Math.max(a, b) };
  }
  return { min: a, max: null };
}

/** Single-target macro (e.g. Calories — no range typically). */
function singleMacro(s: string): number | null {
  return firstNumber(s);
}

/** Lifestyle extraction — "4 ltrs water" → 4, "10k steps" → 10000,
 *  "7 hours sleep" → 7. Operates on lower-case strings. */
function extractLifestyle(line: string, out: ParsedLifestyle): void {
  const low = line.toLowerCase();

  // Water: "4 ltrs", "4 liters", "4l water", "4 litre"
  if (/water|hydrat/i.test(low) && out.waterLiters === null) {
    const m = low.match(/(\d+(?:\.\d+)?)\s*(?:l|ltr|ltrs|liter|liters|litre|litres)\b/);
    if (m) out.waterLiters = parseFloat(m[1]);
  }

  // Steps: "10k steps", "10000 steps"
  if (/steps?/i.test(low) && out.stepsTarget === null) {
    // Pattern: digits + optional 'k' before "steps"
    const m = low.match(/(\d+(?:\.\d+)?)\s*(k?)\s*steps?/);
    if (m) {
      const n = parseFloat(m[1]);
      out.stepsTarget = m[2] === 'k' ? Math.round(n * 1000) : Math.round(n);
    }
  }

  // Sleep: "7 hours sleep", "7-8 hours sleep", "8 hrs"
  if (/sleep|rest/i.test(low) && out.sleepHours === null) {
    const m = low.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/);
    if (m) out.sleepHours = parseFloat(m[1]);
  }
}

// ─── Section role detection ─────────────────────────────────────

type SectionRole = 'meal' | 'cooking_oil' | 'macros' | 'notes';

function sectionRole(headerTitle: string): SectionRole {
  const t = headerTitle.toLowerCase();
  if (t.includes('cooking oil') || t === 'oil' || t.includes('fats for the day')) {
    return 'cooking_oil';
  }
  if (
    t.includes('daily macro') ||
    t === 'macros' ||
    t.includes('total macro') ||
    t.includes('day total')
  ) {
    return 'macros';
  }
  if (t.startsWith('note') || t.includes('lifestyle') || t.includes('rules')) {
    return 'notes';
  }
  return 'meal';
}

/** Detect an in-line "Note-" / "Notes:" line that starts the trailing
 *  free-form footer in Siva's plans even when not wrapped in asterisks. */
function isNotesLine(line: string): boolean {
  return /^\s*notes?\s*[-:–—]/i.test(line);
}

// ─── Main parser ────────────────────────────────────────────────

export function parsePastedDietPlan(raw: string): ParsedDietPlan {
  const out: ParsedDietPlan = {
    meals: [],
    cookingOilNote: null,
    macros: {
      calories: null,
      carbsMin: null, carbsMax: null,
      proteinMin: null, proteinMax: null,
      fatsMin: null, fatsMax: null,
    },
    lifestyle: { waterLiters: null, stepsTarget: null, sleepHours: null },
    notesFreeText: null,
    unparsedLines: [],
  };

  let currentMeal: ParsedMeal | null = null;
  let mode: SectionRole = 'meal';
  const notesAccumulator: string[] = [];

  for (const rawLine of raw.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Detect a header
    const header = parseSectionHeader(trimmed);
    if (header) {
      const role = sectionRole(header);
      mode = role;
      currentMeal = null;
      if (role === 'meal') {
        currentMeal = {
          name: header,
          mealType: guessMealType(header),
          items: [],
        };
        out.meals.push(currentMeal);
      }
      continue;
    }

    // "Note-" inline trigger (not bold-wrapped)
    if (isNotesLine(trimmed)) {
      mode = 'notes';
      currentMeal = null;
      const rest = trimmed.replace(/^\s*notes?\s*[-:–—]\s*/i, '').trim();
      if (rest) {
        notesAccumulator.push(rest);
        extractLifestyle(rest, out.lifestyle);
      }
      continue;
    }

    // Dispatch by mode
    if (mode === 'macros') {
      const content = stripBullet(trimmed).toLowerCase();
      if (content.startsWith('calorie') || content.startsWith('kcal') || content.startsWith('cal ')) {
        out.macros.calories = singleMacro(content);
      } else if (content.startsWith('carb')) {
        const r = parseRange(content);
        out.macros.carbsMin = r.min;
        out.macros.carbsMax = r.max;
      } else if (content.startsWith('protein')) {
        const r = parseRange(content);
        out.macros.proteinMin = r.min;
        out.macros.proteinMax = r.max;
      } else if (content.startsWith('fat')) {
        const r = parseRange(content);
        out.macros.fatsMin = r.min;
        out.macros.fatsMax = r.max;
      }
      continue;
    }

    if (mode === 'cooking_oil') {
      const content = stripBullet(trimmed);
      if (content && !out.cookingOilNote) {
        out.cookingOilNote = content;
      } else if (content) {
        // multiple lines — append
        out.cookingOilNote = `${out.cookingOilNote}; ${content}`;
      }
      continue;
    }

    if (mode === 'notes') {
      const content = stripBullet(trimmed);
      if (content) {
        notesAccumulator.push(content);
        extractLifestyle(content, out.lifestyle);
      }
      continue;
    }

    // mode === 'meal'
    if (!currentMeal) {
      // Stray line before any meal header — start a "Misc" bucket so
      // we don't silently drop content.
      currentMeal = {
        name: 'Misc',
        mealType: null,
        items: [],
      };
      out.meals.push(currentMeal);
    }
    const content = stripBullet(trimmed);
    if (!content) continue;
    const { foodName, quantity } = splitFoodAndQuantity(content);
    if (!foodName) {
      out.unparsedLines.push({ mealName: currentMeal.name, raw: trimmed });
      continue;
    }
    currentMeal.items.push({ foodName, quantity });
  }

  if (notesAccumulator.length > 0) {
    out.notesFreeText = notesAccumulator.join('\n');
  }

  return out;
}
