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
  metadataBase: new URL('https://purex.fit'),
  openGraph: {
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: 'Integrated health coaching. Built for transformation.',
    type: 'website',
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
      </head>
      <body>{children}</body>
    </html>
  );
}
