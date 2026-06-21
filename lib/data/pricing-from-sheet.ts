import 'server-only';
import { fetchSheet, isSheetsConfigured } from '@/lib/google/sheets-client';

/**
 * Program / pricing shape — keep in lock-step with the in-code
 * FALLBACK_PROGRAMS objects in lib/constants.ts so the merged list
 * is type-uniform.
 */
export interface Program {
  slug: string;
  name: string;
  tag: string;
  tagline: string;
  description: string;
  priceInr: number;
  priceDisplay: string;
  priceSuffix: string;
  durationMonths: number;
  isFeatured: boolean;
  isPremium: boolean;
  inclusions: string[];
}

/**
 * Reads admin-curated program rows from the Google Sheet at
 * SHEET_PRICING_ID. Returns [] when the integration isn't
 * configured so consumers can fall back to FALLBACK_PROGRAMS.
 *
 * Sheet schema (first row is the header, ignored):
 *
 *   A: slug                 — kebab-case unique id (e.g. pure-core)
 *   B: name                 — display name
 *   C: tag                  — short pill (e.g. "Most Popular")
 *   D: tagline              — one-line hook
 *   E: description          — paragraph
 *   F: price_inr            — integer (₹ amount)
 *   G: price_display        — formatted display ("₹4,999")
 *   H: price_suffix         — "/month", "", etc.
 *   I: duration_months      — integer
 *   J: is_featured          — TRUE | FALSE
 *   K: is_premium           — TRUE | FALSE
 *   L: inclusions           — pipe-separated list ("Doctor consult|Physio|Weekly call")
 *
 * Pipe (|) is the separator for inclusions because commas appear
 * inside many inclusion strings ("HYROX, IRONMAN, Marathon prep").
 *
 * Invalid rows (blank slug / non-numeric price) are skipped + logged.
 */
export async function getSheetPrograms(): Promise<Program[]> {
  if (!isSheetsConfigured()) return [];
  const spreadsheetId = process.env.SHEET_PRICING_ID;
  if (!spreadsheetId) return [];

  try {
    const rows = await fetchSheet({
      spreadsheetId,
      range: 'Pricing!A2:L200',
    });

    const parsed: Program[] = [];
    rows.forEach((r, i) => {
      const program = parseRow(r);
      if (!program) {
        // eslint-disable-next-line no-console
        console.warn(
          `[pricing-from-sheet] skipping invalid row ${i + 2}`,
          { row: r.slice(0, 3) }
        );
        return;
      }
      parsed.push(program);
    });
    return parsed;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      '[pricing-from-sheet] fetch failed — falling back to in-code FALLBACK_PROGRAMS',
      err instanceof Error ? err.message : err
    );
    return [];
  }
}

function parseRow(r: string[]): Program | null {
  const [
    slug,
    name,
    tag,
    tagline,
    description,
    priceInr,
    priceDisplay,
    priceSuffix,
    durationMonths,
    isFeatured,
    isPremium,
    inclusions,
  ] = r;

  if (!slug?.trim() || !name?.trim()) return null;
  const price = parseInt(priceInr ?? '', 10);
  if (!Number.isFinite(price) || price < 0) return null;
  const duration = parseInt(durationMonths ?? '', 10);
  if (!Number.isFinite(duration) || duration < 0) return null;

  return {
    slug: slug.trim(),
    name: name.trim(),
    tag: (tag ?? '').trim(),
    tagline: (tagline ?? '').trim(),
    description: (description ?? '').trim(),
    priceInr: price,
    priceDisplay: (priceDisplay ?? '').trim() || `₹${price.toLocaleString('en-IN')}`,
    priceSuffix: (priceSuffix ?? '').trim(),
    durationMonths: duration,
    isFeatured: parseBool(isFeatured),
    isPremium: parseBool(isPremium),
    inclusions: (inclusions ?? '')
      .split('|')
      .map((s) => s.trim())
      .filter((s) => s.length > 0),
  };
}

function parseBool(v: string | undefined): boolean {
  return /^(true|yes|y|1)$/i.test((v ?? '').trim());
}
