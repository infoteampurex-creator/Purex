import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, Check, X, Sparkles } from 'lucide-react';
import { FALLBACK_PROGRAMS } from '@/lib/constants';
import { ProgramsGrid } from '@/components/marketing/sections/ProgramsGrid';

export const metadata: Metadata = {
  title: 'Programs & Pricing · PURE X',
  description:
    'Five programmes to match your level — Foundation, Core, Elite, Elite Couple, and our signature Enduro race-prep programme. Start with clarity, progress through consistency, finish as an athlete.',
};

const COMPARISON_FEATURES = [
  { label: 'Personalised plan',        foundation: true,  core: true,  elite: true,  couple: true },
  { label: 'Weight tracking',          foundation: true,  core: true,  elite: true,  couple: true },
  { label: 'Progress call',            foundation: 'Once', core: 'Weekly', elite: 'Weekly', couple: 'Weekly' },
  { label: 'App tracking (full)',      foundation: false, core: true,  elite: true,  couple: true },
  { label: 'Doctor consultation',      foundation: false, core: true,  elite: true,  couple: true },
  { label: 'Physio assessment',        foundation: false, core: true,  elite: true,  couple: true },
  { label: 'AI chat support',          foundation: false, core: true,  elite: true,  couple: true },
  { label: 'Streaks & challenges',     foundation: false, core: true,  elite: true,  couple: true },
  { label: '1-on-1 training',          foundation: false, core: false, elite: true,  couple: true },
  { label: 'Race prep (basic)',        foundation: false, core: false, elite: true,  couple: true },
  { label: 'Outdoor sessions',         foundation: false, core: false, elite: true,  couple: true },
  { label: 'Mental Health access',     foundation: false, core: false, elite: true,  couple: true },
  { label: 'Doubles race prep',        foundation: false, core: false, elite: false, couple: true },
  { label: 'Both partners included',   foundation: false, core: false, elite: false, couple: true },
];

export default function ProgramsPage() {
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
            Programs & Pricing
            <span className="w-4 h-px bg-accent" />
          </div>
          <h1 className="font-display font-semibold text-4xl md:text-6xl tracking-tight leading-[1.02] mb-5 max-w-3xl mx-auto">
            Start with <span className="text-accent">clarity</span>.
            <br />
            Finish as an <span className="text-accent">athlete</span>.
          </h1>
          <p className="text-lg md:text-xl text-text-muted leading-relaxed max-w-2xl mx-auto">
            Four tiers designed to match where you are — and take you where you want to go.
            Every plan is a system, not a script.
          </p>
        </div>
      </section>

      {/* Program cards */}
      <ProgramsGrid />

      {/* Comparison table */}
      <section className="relative py-16 md:py-24 border-t border-border-soft">
        <div className="container-safe">
          <div className="text-center mb-10 md:mb-14 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-3">
              <Sparkles size={12} />
              Side by side
            </div>
            <h2 className="font-display font-semibold text-3xl md:text-5xl tracking-tight leading-[1.05] mb-4">
              Compare plans.
            </h2>
            <p className="text-text-muted">
              All the features, at a glance. Each tier builds on the last — no gimmicks.
            </p>
          </div>

          {/* Responsive comparison table */}
          <div className="rounded-2xl border border-border bg-bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 md:p-5 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold w-[40%]">
                      Feature
                    </th>
                    <th className="p-4 md:p-5 text-center">
                      <div className="font-display font-semibold text-sm md:text-base">Foundation</div>
                      <div className="font-mono text-[10px] text-accent font-bold mt-1">₹1,999</div>
                    </th>
                    <th
                      className="p-4 md:p-5 text-center"
                      style={{ background: 'rgba(198, 255, 61, 0.04)' }}
                    >
                      <div className="font-display font-semibold text-sm md:text-base text-accent">
                        Core
                      </div>
                      <div className="font-mono text-[10px] text-accent font-bold mt-1">
                        ₹4,999/mo
                      </div>
                    </th>
                    <th className="p-4 md:p-5 text-center">
                      <div className="font-display font-semibold text-sm md:text-base">Elite</div>
                      <div className="font-mono text-[10px] text-accent font-bold mt-1">
                        ₹19,999/mo
                      </div>
                    </th>
                    <th className="p-4 md:p-5 text-center">
                      <div className="font-display font-semibold text-sm md:text-base">Couple</div>
                      <div className="font-mono text-[10px] text-accent font-bold mt-1">
                        ₹29,999/mo
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_FEATURES.map((row, i) => (
                    <tr
                      key={row.label}
                      className={i % 2 === 0 ? 'bg-bg/30' : ''}
                    >
                      <td className="p-4 md:p-5 text-sm text-text-muted border-r border-border-soft">
                        {row.label}
                      </td>
                      <Cell value={row.foundation} />
                      <Cell value={row.core} highlight />
                      <Cell value={row.elite} />
                      <Cell value={row.couple} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-5 p-4 rounded-xl border border-accent/25 bg-accent/[0.05]">
              <div className="flex items-start gap-3">
                <Sparkles size={14} className="text-accent flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <p className="text-xs md:text-sm text-text-muted leading-relaxed">
                  <span className="text-accent font-bold">Enduro</span> is our specialist
                  race-prep programme for HYROX, IRONMAN, and hybrid athletes. It sits
                  outside the standard tier comparison —{' '}
                  <Link href="/programs/enduro" className="text-accent hover:underline font-medium">
                    see the full Enduro page
                  </Link>{' '}
                  for race-day protocols, hybrid programming, and pro-athlete coaching.
                </p>
              </div>
            </div>
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
                Not sure which tier fits?
              </h3>
              <p className="text-text-muted text-lg mb-8 max-w-xl mx-auto">
                Book a free 20-minute discovery call. We'll match you to the right plan —
                not the biggest one.
              </p>
              <Link
                href="/book"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-accent text-bg font-semibold hover:bg-accent-hover transition-colors"
              >
                Get Started
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Cell({
  value,
  highlight = false,
}: {
  value: boolean | string;
  highlight?: boolean;
}) {
  return (
    <td
      className="p-4 md:p-5 text-center text-sm border-r border-border-soft last:border-r-0"
      style={highlight ? { background: 'rgba(198, 255, 61, 0.04)' } : undefined}
    >
      {value === true ? (
        <Check size={16} className="text-accent mx-auto" strokeWidth={2.5} />
      ) : value === false ? (
        <X size={14} className="text-text-dim mx-auto" strokeWidth={2} />
      ) : (
        <span className="text-text-muted font-mono text-xs">{value}</span>
      )}
    </td>
  );
}
