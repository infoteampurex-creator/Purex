import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { FALLBACK_TRANSFORMATIONS, FALLBACK_EXPERTS } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Transformations · PURE X',
  description:
    'Real clients. Real results. Browse transformation stories from PURE X athletes — HYROX, IRONMAN, fat loss, and performance journeys.',
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
            Real clients. <span className="text-accent">Real results</span>.
          </h1>
          <p className="text-lg md:text-xl text-text-muted leading-relaxed max-w-2xl mx-auto">
            No before-and-afters built on shortcuts. These are 16 to 36-week journeys
            from real people, under real medical supervision, with real data behind every
            number.
          </p>
        </div>
      </section>

      {/* Transformation gallery */}
      <section className="relative py-12 md:py-16">
        <div className="container-safe">
          <div className="grid md:grid-cols-2 gap-5 md:gap-6">
            {FALLBACK_TRANSFORMATIONS.map((story) => {
              const expert = FALLBACK_EXPERTS.find((e) => e.slug === story.expert);
              return (
                <article
                  key={story.slug}
                  className="group relative rounded-2xl bg-bg-card border border-border p-6 md:p-7 hover:border-accent/40 transition-all duration-500"
                >
                  {/* Corner accent glow on hover */}
                  <div
                    aria-hidden
                    className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                    style={{
                      background:
                        'radial-gradient(circle, rgba(198, 255, 61, 0.15) 0%, transparent 70%)',
                    }}
                  />

                  {/* Header */}
                  <div className="flex items-center justify-between mb-4 gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold mb-1">
                        {story.goal}
                      </div>
                      <h2 className="font-display font-semibold text-xl md:text-2xl tracking-tight text-text truncate">
                        {story.clientName}
                      </h2>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border-soft flex-shrink-0">
                      <TrendingUp size={11} className="text-accent" strokeWidth={2.5} />
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold">
                        {story.durationWeeks}wk
                      </span>
                    </div>
                  </div>

                  {/* Headline */}
                  <p className="font-display font-medium text-lg md:text-xl text-text leading-tight mb-5">
                    {story.headline}
                  </p>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    {story.stats.map((s) => (
                      <div
                        key={s.label}
                        className="rounded-lg bg-bg/50 border border-border-soft px-3 py-2.5 text-center"
                      >
                        <div className="font-display font-bold text-base md:text-lg text-accent leading-none">
                          {s.value}
                        </div>
                        <div className="font-mono text-[8px] md:text-[9px] uppercase tracking-[0.12em] text-text-muted mt-1.5">
                          {s.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer: coach + plan */}
                  <div className="flex items-center justify-between pt-4 border-t border-border-soft">
                    <div className="text-xs text-text-muted">
                      Coached by{' '}
                      {expert ? (
                        <Link
                          href={`/experts/${expert.slug}`}
                          className="text-text hover:text-accent transition-colors font-medium"
                        >
                          {expert.name}
                        </Link>
                      ) : (
                        <span className="text-text">—</span>
                      )}
                    </div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-dim">
                      {story.program.replace('pure-', '').replace('-', ' ')}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-16 md:py-20 border-t border-border-soft">
        <div className="container-safe">
          <div className="rounded-3xl bg-bg-card border border-accent/30 p-8 md:p-14 text-center relative overflow-hidden">
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 100%, rgba(198, 255, 61, 0.12) 0%, transparent 60%)',
              }}
            />
            <div className="relative">
              <h3 className="font-display font-semibold text-3xl md:text-5xl tracking-tight leading-[1.05] mb-4 max-w-2xl mx-auto">
                Your story starts here.
              </h3>
              <p className="text-text-muted text-lg mb-8 max-w-xl mx-auto">
                Book a discovery call and let us design a plan that fits your life — not a
                template.
              </p>
              <Link
                href="/book"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-accent text-bg font-semibold hover:bg-accent-hover transition-colors"
              >
                Book a Consultation
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
