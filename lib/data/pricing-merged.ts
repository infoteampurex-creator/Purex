import 'server-only';
import { FALLBACK_PROGRAMS } from '@/lib/constants';
import { getSheetPrograms, type Program } from './pricing-from-sheet';

/**
 * Returns the FALLBACK_PROGRAMS list merged with admin-added rows
 * from SHEET_PRICING_ID (when configured). Dedup by `slug` — Sheet
 * row wins, so the admin can override pricing or copy on a built-in
 * program by adding a row with the matching slug. Order: in-code
 * programs first (preserving the original ordering for the marketing
 * page), then any Sheet-only additions appended at the end.
 *
 * Sheet fetch is cached for 5 minutes by sheets-client.
 */
export async function getMergedPrograms(): Promise<Program[]> {
  const sheetPrograms = await getSheetPrograms();

  // Normalize the in-code list to the shared Program shape (loses
  // `as const` narrowness, gains writable arrays + uniform booleans).
  const baseline: Program[] = FALLBACK_PROGRAMS.map((p) => ({
    slug: p.slug,
    name: p.name,
    tag: p.tag,
    tagline: p.tagline,
    description: p.description,
    priceInr: p.priceInr,
    priceDisplay: p.priceDisplay,
    priceSuffix: p.priceSuffix,
    durationMonths: p.durationMonths,
    isFeatured: p.isFeatured,
    isPremium: p.isPremium,
    inclusions: [...p.inclusions],
  }));

  if (sheetPrograms.length === 0) return baseline;

  const bySlug = new Map<string, Program>();
  for (const p of baseline) bySlug.set(p.slug, p);
  const sheetOnly: Program[] = [];
  for (const p of sheetPrograms) {
    if (bySlug.has(p.slug)) {
      bySlug.set(p.slug, p); // Sheet override
    } else {
      sheetOnly.push(p);
    }
  }

  // Preserve original ordering: walk baseline order using map lookups,
  // then append Sheet-only additions at the end.
  const ordered = baseline.map((p) => bySlug.get(p.slug) ?? p);
  return [...ordered, ...sheetOnly];
}

export type { Program };
