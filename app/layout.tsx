import type { Metadata, Viewport } from 'next';
import { fontDisplay, fontBody, fontMono } from '@/lib/fonts';
import { BRAND } from '@/lib/constants';
import './globals.css';

// Supabase project host — extracted at build time so <link rel="preconnect">
// can start the TLS handshake in parallel with the login page render.
// Cold-start on Android WebView opens directly at /login and hits ~8
// Supabase queries the moment the user reaches /client/dashboard. Warming
// the connection here saves ~200-400 ms per query on 4G.
const SUPABASE_ORIGIN = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) return null;
    return new URL(url).origin;
  } catch {
    return null;
  }
})();

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s · ${BRAND.name}`,
  },
  description: 'Premium integrated health coaching. Trainer, doctor, physio, and athletic coach working from one coordinated plan. HYROX and IRONMAN specialists. India and UK.',
  // Canonical site domain. Previously set to purex.fit — a stale
  // domain — which meant og:image and canonical URLs pointed at a
  // dead host, breaking every social share preview.
  metadataBase: new URL('https://www.teampurex.com'),
  openGraph: {
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: 'Integrated health coaching. Built for transformation.',
    type: 'website',
    url: 'https://www.teampurex.com',
    siteName: BRAND.name,
    images: ['/brand/og-image.jpg'],
    locale: 'en_GB',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: 'Integrated health coaching. Built for transformation.',
    images: ['/brand/og-image.jpg'],
  },
  // PWA manifest hint — signals installability and enables system-level
  // caching on Android WebView.
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: BRAND.name,
  },
  // Explicit canonical + alternate — helps Google resolve www vs apex
  // and helps AI crawlers stitch our brand across mirrors.
  alternates: {
    canonical: 'https://www.teampurex.com',
  },
};

// JSON-LD structured data — how Team Purex describes itself to Google
// and AI crawlers (ChatGPT, Claude, Perplexity, Gemini).
//
// Two schemas here:
//   1. Organization — brand identity, logo, socials, contact.
//   2. LocalBusiness — HealthClub subtype so we appear for "personal
//      trainer near me" / "fitness coach India" / "hybrid coach London".
//
// Each coach + program should get its own per-page JSON-LD in a
// follow-up (Person schema for coaches, Service schema for programs).
const ORG_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://www.teampurex.com/#organization',
  name: 'Team Purex',
  legalName: 'Team Purex',
  url: 'https://www.teampurex.com',
  logo: 'https://www.teampurex.com/brand/logo.png',
  description:
    'Premium integrated health coaching. Trainer, doctor, physio, athletic coach, and mental health specialist working from one coordinated plan. HYROX and IRONMAN specialists.',
  foundingDate: '2024',
  areaServed: [
    { '@type': 'Country', name: 'India' },
    { '@type': 'Country', name: 'United Kingdom' },
  ],
  slogan: 'Train for Life. Not Just Aesthetics.',
  sameAs: [
    // Add when live: Instagram, LinkedIn, YouTube, Facebook profile URLs.
    // Populated ones give AI crawlers a stronger identity signal.
  ],
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'contact.teampurex@gmail.com',
      areaServed: ['IN', 'GB'],
      availableLanguage: ['English'],
    },
  ],
};

const LOCAL_BIZ_LD = {
  '@context': 'https://schema.org',
  '@type': 'HealthAndBeautyBusiness',
  '@id': 'https://www.teampurex.com/#localbusiness',
  name: 'Team Purex',
  image: 'https://www.teampurex.com/brand/logo.png',
  url: 'https://www.teampurex.com',
  telephone: '+44-7778-899345',
  priceRange: '£££',
  description:
    'Integrated health coaching: personal trainers, doctors, physiotherapists, athletic coaches, and mental-health specialists working from one coordinated plan.',
  areaServed: [
    { '@type': 'Country', name: 'India' },
    { '@type': 'Country', name: 'United Kingdom' },
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Coaching Programs',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Pure Foundation',
          description: 'Foundational health coaching for lifestyle transformation.',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Pure Core',
          description: 'Intermediate hybrid athletic coaching.',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Pure Elite',
          description: 'Elite performance coaching — HYROX, IRONMAN, marathon prep.',
        },
      },
    ],
  },
};

const WEBSITE_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://www.teampurex.com/#website',
  url: 'https://www.teampurex.com',
  name: 'Team Purex',
  description: 'Integrated health coaching for HYROX, IRONMAN, and lifestyle transformation.',
  publisher: { '@id': 'https://www.teampurex.com/#organization' },
  inLanguage: 'en',
};

// Correct mobile viewport + theme color so the Android system-UI edges
// (status bar / nav bar) blend into the app's #0a0c09 background instead
// of rendering as white bands. Whoop / Fitbit look "native" partly
// because they nail these two settings.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0c09',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable}`}
    >
      <head>
        {/* Preconnect + DNS prefetch to Supabase so TLS is warm by the
            time the client dashboard fires its parallel queries. */}
        {SUPABASE_ORIGIN && (
          <>
            <link rel="preconnect" href={SUPABASE_ORIGIN} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={SUPABASE_ORIGIN} />
          </>
        )}
        {/* JSON-LD structured data — Google Rich Results + AI answer
            engines (ChatGPT, Claude, Perplexity, Gemini) use these
            schemas to understand what Team Purex is, what we offer,
            and where we operate. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_LD) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCAL_BIZ_LD) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_LD) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
