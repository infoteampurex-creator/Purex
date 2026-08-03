import Link from 'next/link';
import { Trophy, ChevronRight, Sparkles } from 'lucide-react';
import {
  PUREX_MOTHERS,
  PUREX_MOTHERS_META,
} from '@/lib/data/purex-mothers';

/**
 * Preview panel for the completed May-10 Team Purex Mothers cohort.
 *
 * Renders on /mother-strong as a hero-adjacent section — celebrates
 * the 9 finishers, links to /purex-mothers where each mother can
 * generate her appreciation card.
 *
 * Uses PureX's dark + gold palette to match the /mother-strong page.
 */
export function CompletedCohortPreview() {
  const collectiveM = (
    PUREX_MOTHERS_META.collectiveSteps / 1_000_000
  ).toFixed(1);
  const finisherNames = PUREX_MOTHERS.slice(0, 6).map((m) => m.name);
  const remainder = PUREX_MOTHERS.length - finisherNames.length;

  return (
    <section className="mt-12">
      <div
        className="relative rounded-3xl border overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse at 80% 0%, rgba(255,210,77,0.16) 0%, transparent 55%),
            radial-gradient(ellipse at 20% 100%, rgba(184,141,44,0.10) 0%, transparent 55%),
            linear-gradient(180deg, #14110d 0%, #0a0c09 100%)
          `,
          borderColor: 'rgba(255,210,77,0.30)',
          boxShadow: '0 24px 60px rgba(184,141,44,0.10)',
        }}
      >
        {/* Corner "completed" chip */}
        <div
          className="absolute top-4 right-4 inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.22em] font-bold rounded-full px-3 py-1"
          style={{
            fontSize: 10,
            color: '#0a0c09',
            background:
              'linear-gradient(135deg, #fbe6a3 0%, #ffd24d 50%, #b88d2c 100%)',
            boxShadow: '0 6px 16px rgba(255,210,77,0.30)',
          }}
        >
          <Trophy size={12} strokeWidth={2.5} />
          60 Days Completed
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-6 lg:gap-10 p-6 md:p-8 lg:p-10">
          {/* Left — pitch */}
          <div>
            <div
              className="inline-flex items-center gap-2 font-mono uppercase tracking-[0.22em] font-bold mb-5"
              style={{ fontSize: 11, color: '#ffd24d' }}
            >
              <span className="w-4 h-px" style={{ background: '#ffd24d' }} />
              Mother&apos;s Day 2026 cohort · finishers
            </div>
            <h2
              className="font-display font-semibold tracking-tight leading-[1.05]"
              style={{
                fontSize: 'clamp(28px, 4.5vw, 42px)',
                background:
                  'linear-gradient(180deg, #fbe6a3 0%, #ffd24d 55%, #b88d2c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              9 mothers just finished 60 days.
            </h2>
            <p
              className="mt-4 leading-relaxed max-w-xl"
              style={{ fontSize: 15, color: 'rgba(245,245,240,0.75)' }}
            >
              Strength training, diet discipline, 10,000 steps a day.
              Started on Mother&apos;s Day, completed on July 10.
              Each finisher has her own personalised appreciation card
              waiting — tap through and see the celebration.
            </p>

            {/* Names ribbon */}
            <div
              className="mt-6 rounded-xl px-4 py-3"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,210,77,0.15)',
              }}
            >
              <div
                className="font-mono uppercase tracking-[0.20em] font-bold"
                style={{ fontSize: 10, color: 'rgba(251,230,163,0.85)' }}
              >
                The 60-day finishers
              </div>
              <div
                className="font-display font-semibold mt-1.5 leading-relaxed"
                style={{
                  fontSize: 16,
                  color: 'rgba(245,245,240,0.95)',
                  fontStyle: 'italic',
                }}
              >
                {finisherNames.join(', ')}
                {remainder > 0 && (
                  <span style={{ color: 'rgba(245,245,240,0.55)' }}>
                    {' '}
                    + {remainder} more
                  </span>
                )}
              </div>
            </div>

            <Link
              href="/purex-mothers"
              className="inline-flex items-center gap-2 mt-6 rounded-full px-5 py-3 font-mono uppercase tracking-[0.22em] font-bold transition-transform hover:-translate-y-0.5"
              style={{
                fontSize: 12,
                color: '#0a0c09',
                background:
                  'linear-gradient(135deg, #fbe6a3 0%, #ffd24d 50%, #b88d2c 100%)',
                boxShadow: '0 18px 40px rgba(255,210,77,0.28)',
              }}
            >
              <Sparkles size={14} strokeWidth={2.5} />
              See the celebration
              <ChevronRight size={14} strokeWidth={2.5} />
            </Link>
          </div>

          {/* Right — stat panels */}
          <div className="grid grid-cols-2 gap-3 self-start">
            <StatPanel label="60" sub="days completed" />
            <StatPanel label="9" sub="finishers" />
            <StatPanel label={`${collectiveM}M`} sub="steps together" />
            <StatPanel label="Siva Reddy" sub="trainer" size="sm" />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatPanel({
  label,
  sub,
  size = 'lg',
}: {
  label: string;
  sub: string;
  size?: 'lg' | 'sm';
}) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        borderColor: 'rgba(255,210,77,0.22)',
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
      }}
    >
      <div
        className="font-display font-bold tracking-tight leading-none"
        style={{
          fontSize: size === 'lg' ? 32 : 18,
          color: '#ffd24d',
        }}
      >
        {label}
      </div>
      <div
        className="font-mono uppercase tracking-[0.18em] font-bold mt-2"
        style={{ fontSize: 10, color: 'rgba(245,245,240,0.60)' }}
      >
        {sub}
      </div>
    </div>
  );
}
