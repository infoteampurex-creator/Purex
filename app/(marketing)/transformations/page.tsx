import type { Metadata } from 'next';
import { TransformationGallery } from '@/components/marketing/sections/TransformationGallery';

export const metadata: Metadata = {
  title: 'Transformations · PURE X',
  description:
    'Real clients. Real journeys. Browse transformation stories from PURE X members — hybrid athletes, lifestyle changes, marathon training, and sustainable performance.',
};

export default function TransformationsPage() {
  return (
    <main className="relative bg-bg text-text">
      {/* Hero */}
      <section className="relative pt-28 md:pt-36 pb-8 md:pb-12 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, rgba(198, 255, 61, 0.08) 0%, transparent 55%)',
          }}
        />
        <div className="container-safe relative text-center">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-accent font-bold mb-5">
            <span className="w-4 h-px bg-accent" />
            Stories of Transformation
            <span className="w-4 h-px bg-accent" />
          </div>
          <h1 className="font-display font-semibold text-4xl md:text-6xl tracking-tight leading-[1.02] mb-5 max-w-3xl mx-auto">
            Real journeys. <span className="text-accent">Sustainable change</span>.
          </h1>
          <p className="text-lg md:text-xl text-text-muted leading-relaxed max-w-2xl mx-auto">
            Five members. Five very different lives. One thing in common — they
            stopped chasing quick fixes and started building systems that lasted.
          </p>
        </div>
      </section>

      {/* Gallery (re-uses the homepage component — modal opens on click) */}
      <TransformationGallery />
    </main>
  );
}
