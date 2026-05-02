import type { Metadata } from 'next';
import { fontDisplay, fontBody, fontMono } from '@/lib/fonts';
import { BRAND } from '@/lib/constants';
import './globals.css';

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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
