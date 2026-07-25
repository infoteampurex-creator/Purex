import type { MetadataRoute } from 'next';

const BASE = 'https://www.teampurex.com';

/**
 * /sitemap.xml — canonical list of every public URL on teampurex.com.
 *
 * Google + AI crawlers use this as the authoritative discovery list.
 * Every URL here is public and safe to index. Anything gated by auth
 * (/client/*, /admin/*) or private (/onboarding/*) is intentionally
 * excluded.
 *
 * priority values (0–1) are a hint, not a ranking factor Google
 * strictly respects — but they help internal crawl budget decisions
 * and are still read by AI crawlers as importance signals.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  // ISO date without time — Google prefers date-only lastModified for
  // page-level entries that aren't hot news. Bump manually or wire to
  // git-blame if we ever get precise per-page last-edit dates.
  const now = new Date().toISOString().slice(0, 10);

  const routes: MetadataRoute.Sitemap = [
    // ── Priority 1.0: brand root ───────────────────────────────
    { url: `${BASE}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },

    // ── Priority 0.9: primary conversion + team pages ──────────
    { url: `${BASE}/apply`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/experts`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/programs`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },

    // ── Priority 0.8: proof + social pages ─────────────────────
    { url: `${BASE}/transformations`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/purex-mothers`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/mother-strong`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },

    // ── Priority 0.7: individual coach + program pages ─────────
    { url: `${BASE}/experts/siva-reddy`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/experts/chandralekha`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/experts/krishna`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/experts/siva-jampana`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/experts/amber-jasari`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/programs/pure-foundation`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/programs/pure-core`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/programs/pure-elite`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/programs/enduro`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },

    // ── Priority 0.6: support pages ────────────────────────────
    { url: `${BASE}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/book`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },

    // ── Priority 0.3: legal (indexable but low-priority) ───────
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  return routes;
}
