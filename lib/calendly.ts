/**
 * Calendly booking URLs per specialist.
 *
 * To configure:
 *   1. Each specialist sets up a Calendly account + an event type
 *   2. Paste the direct event URL here (format: https://calendly.com/<user>/<event-slug>)
 *   3. Optionally query params can be appended: ?hide_gdpr_banner=1&background_color=0a0c09
 *
 * These URLs are embedded inline in the booking flow step after the pre-consult form.
 * Until real URLs are added, falls back to a notice in the CalendlyEmbed component.
 */

export interface CalendlyConfig {
  /** Full Calendly URL. Empty string disables embed for this specialist. */
  url: string;
  /** Override card title shown above the embed */
  title?: string;
}

export const CALENDLY_URLS: Record<string, CalendlyConfig> = {
  'siva-reddy': {
    url: 'https://calendly.com/purex-siva-reddy/30min',
    title: 'Book with Siva Reddy',
  },
  'chandralekha': {
    url: 'https://calendly.com/purex-chandralekha/30min',
    title: 'Book with Dr. Chandralekha',
  },
  'krishna': {
    url: 'https://calendly.com/purex-krishna/30min',
    title: 'Book with Krishna',
  },
  'paula-konasionok': {
    url: 'https://calendly.com/purex-paula/30min',
    title: 'Book with Paula Konasionok',
  },
  'amber-jasari': {
    url: 'https://calendly.com/purex-amber/30min',
    title: 'Book with Amber Jasari',
  },
  'siva-jampana': {
    url: 'https://calendly.com/purex-siva-jampana/30min',
    title: 'Discovery call with Siva Jampana',
  },
};

/** Appended to every Calendly URL for brand consistency */
export const CALENDLY_EMBED_PARAMS = {
  hide_gdpr_banner: '1',
  background_color: '0a0c09',
  text_color: 'e8ebe4',
  primary_color: 'c6ff3d',
};

/** Build full Calendly URL with brand params */
export function buildCalendlyUrl(expertSlug: string): string | null {
  const config = CALENDLY_URLS[expertSlug];
  if (!config?.url) return null;

  const url = new URL(config.url);
  Object.entries(CALENDLY_EMBED_PARAMS).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url.toString();
}

export function hasCalendlyConfigured(expertSlug: string): boolean {
  return !!CALENDLY_URLS[expertSlug]?.url;
}
