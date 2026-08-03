import type { Metadata } from 'next';
import { FALLBACK_FAQS } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'FAQ · Team Purex',
  description:
    'Answers to common questions about Team Purex coaching — bookings, pricing, training methodology, medical involvement, HYROX and IRONMAN prep.',
};

/**
 * FAQ layout — a thin server component wrapper that emits the FAQPage
 * JSON-LD schema before the client-side FaqPage renders. Splitting it
 * out lets the interactive filter/accordion stay client-side while the
 * schema still ships as static HTML for Google + AI crawlers to
 * inline in their answer results.
 *
 * FAQPage schema is one of the highest-ROI SEO additions — it gets
 * pulled into Google "People also ask" boxes AND into direct AI
 * answers on ChatGPT, Claude, Perplexity.
 */
export default function FaqLayout({ children }: { children: React.ReactNode }) {
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': 'https://www.teampurex.com/faq#faqpage',
    mainEntity: FALLBACK_FAQS.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      {children}
    </>
  );
}
