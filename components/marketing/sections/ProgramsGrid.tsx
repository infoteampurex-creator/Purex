import Link from 'next/link';
import {
  ArrowUpRight,
  Check,
  Flame,
  Trophy,
  Zap,
  Sparkles,
} from 'lucide-react';
import { FALLBACK_PROGRAMS } from '@/lib/constants';
import { cn } from '@/lib/cn';

export function ProgramsGrid() {
  // Separate the premium program (Enduro) from the standard four
  const premiumProgram = FALLBACK_PROGRAMS.find((p) => p.isPremium);
  const standardPrograms = FALLBACK_PROGRAMS.filter((p) => !p.isPremium);

  return (
    <section id="programs" className="py-20 md:py-28 bg-bg-inset">
      <div className="container-safe">
        <div className="max-w-3xl mb-12 md:mb-16">
          <span className="eyebrow">Programs</span>
          <h2 className="mt-3 font-display font-semibold text-display-lg tracking-tight">
            Five programs.{' '}
            <span className="text-accent">One clear path.</span>
          </h2>
          <p className="mt-4 text-base text-text-muted leading-relaxed">
            Choose how deep you want to go. Every programme includes medical oversight, physio integration, and full-team coordination. No up-sells, no hidden fees.
          </p>
        </div>

        {/* ════════════════════════════════════════════════════════════
            PREMIUM CARD — Enduro (HYROX & IRONMAN race prep)
            Full-width hero card with cinematic treatment. Stands apart
            from the standard 4-card grid with darker backdrop, animated
            border glow, and feature highlights.
        ════════════════════════════════════════════════════════════ */}
        {premiumProgram && (
          <Link
            href={`/programs/${premiumProgram.slug}`}
            className="group relative block mb-8 md:mb-10 rounded-2xl overflow-hidden"
          >
            {/* Animated gradient backdrop */}
            <div
              className="absolute inset-0 transition-all duration-700"
              style={{
                background: `
                  radial-gradient(ellipse at 0% 50%, rgba(198, 255, 61, 0.18) 0%, transparent 55%),
                  radial-gradient(ellipse at 100% 50%, rgba(125, 211, 255, 0.12) 0%, transparent 55%),
                  linear-gradient(180deg, #0d110b 0%, #0a0c09 100%)
                `,
              }}
            />

            {/* Border glow */}
            <div
              className="absolute inset-0 rounded-2xl border border-accent/30 group-hover:border-accent/60 transition-colors duration-700 pointer-events-none"
              style={{ boxShadow: '0 0 40px rgba(198, 255, 61, 0.15)' }}
            />

            {/* Floating particle accents */}
            <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(10)].map((_, i) => {
                const seed = i * 41;
                const left = 5 + (seed * 11) % 90;
                const top = 10 + (seed * 23) % 80;
                const size = 1 + ((seed * 7) % 3);
                const duration = 5 + ((seed * 13) % 4);
                const delay = (seed * 0.17) % 4;
                return (
                  <span
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      left: `${left}%`,
                      top: `${top}%`,
                      width: `${size}px`,
                      height: `${size}px`,
                      background: '#c6ff3d',
                      opacity: 0.4,
                      boxShadow: '0 0 6px rgba(198, 255, 61, 0.5)',
                      animation: `enduro-float ${duration}s ease-in-out ${delay}s infinite`,
                    }}
                  />
                );
              })}
            </div>

            <div className="relative grid md:grid-cols-[1.4fr_1fr] gap-6 md:gap-10 p-6 md:p-10 lg:p-12">
              {/* LEFT — Headline + features */}
              <div className="flex flex-col">
                {/* Premium badge */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/15 border border-accent/40">
                    <Sparkles
                      size={11}
                      strokeWidth={2.5}
                      className="text-accent"
                    />
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold">
                      Signature Programme
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.05] mb-4">
                  <span
                    style={{
                      background:
                        'linear-gradient(135deg, #ffffff 0%, #c6ff3d 70%, #eaff9a 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {premiumProgram.name}
                  </span>
                </h3>

                <p className="text-base md:text-lg text-text-muted leading-relaxed mb-6 max-w-[42ch]">
                  {premiumProgram.tagline}
                </p>

                {/* Race prep feature highlights */}
                <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
                  <FeatureChip icon={<Trophy size={14} />} label="HYROX Prep" />
                  <FeatureChip icon={<Zap size={14} />} label="IRONMAN Prep" />
                  <FeatureChip icon={<Flame size={14} />} label="Hybrid Training" />
                </div>

                {/* Description */}
                <p className="hidden md:block text-sm text-text-dim leading-relaxed mb-6 max-w-[55ch]">
                  {premiumProgram.description}
                </p>

                {/* CTA + price */}
                <div className="mt-auto pt-4 flex items-end justify-between gap-4 flex-wrap border-t border-accent/15">
                  <div>
                    <div className="font-display font-bold text-3xl md:text-4xl tracking-tight pt-4">
                      <span style={{ color: '#c6ff3d' }}>
                        {premiumProgram.priceDisplay}
                      </span>
                      <span className="ml-1 font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted font-bold">
                        {premiumProgram.priceSuffix.replace('/', '')}
                      </span>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 pt-4">
                    <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.22em] text-accent font-bold group-hover:tracking-[0.26em] transition-all">
                      Explore Enduro
                    </span>
                    <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-accent text-bg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ArrowUpRight size={18} strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT — Inclusions list */}
              <div className="md:border-l md:border-accent/15 md:pl-10">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-4">
                  What&rsquo;s Included
                </div>
                <ul className="space-y-2.5">
                  {premiumProgram.inclusions.slice(0, 6).map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-xs md:text-sm text-text leading-snug"
                    >
                      <Check
                        size={14}
                        className="text-accent flex-shrink-0 mt-0.5"
                        strokeWidth={2.5}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                  {premiumProgram.inclusions.length > 6 && (
                    <li className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim pt-1">
                      +{premiumProgram.inclusions.length - 6} more inside
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <style>{`
              @keyframes enduro-float {
                0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
                50% { transform: translateY(-30px) scale(1.3); opacity: 0.85; }
              }
            `}</style>
          </Link>
        )}

        {/* ════════════════════════════════════════════════════════════
            STANDARD CARDS — 4-column grid below the premium card
        ════════════════════════════════════════════════════════════ */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {standardPrograms.map((program) => (
            <Link
              key={program.slug}
              href={`/programs/${program.slug}`}
              className={cn(
                'group relative flex flex-col p-6 md:p-7 rounded-xl overflow-hidden',
                'transition-all duration-500 hover:-translate-y-1',
                program.isFeatured
                  ? 'bg-gradient-to-br from-accent/[0.12] to-accent/[0.02] border border-accent/40 hover:border-accent/70'
                  : 'bg-bg-card border border-border hover:border-accent/30'
              )}
            >
              {program.isFeatured && (
                <div className="absolute top-0 right-0 px-3 py-1.5 bg-accent text-bg font-mono text-[9px] uppercase tracking-[0.14em] font-bold rounded-bl-xl">
                  Flagship
                </div>
              )}

              <div className="flex-1">
                <div className="eyebrow-accent">{program.tag}</div>
                <h3 className="mt-4 font-display font-bold text-2xl md:text-[26px] tracking-tight leading-[1.1]">
                  {program.name}
                </h3>
                <p className="mt-3 text-sm text-text-muted leading-relaxed">
                  {program.tagline}
                </p>

                <ul className="mt-6 space-y-2">
                  {program.inclusions.slice(0, 3).map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-xs text-text-muted"
                    >
                      <Check
                        size={14}
                        className="text-accent flex-shrink-0 mt-0.5"
                      />
                      <span className="leading-snug">{item}</span>
                    </li>
                  ))}
                  {program.inclusions.length > 3 && (
                    <li className="text-xs text-text-dim font-mono uppercase tracking-[0.12em]">
                      +{program.inclusions.length - 3} more
                    </li>
                  )}
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-border/70 flex items-end justify-between">
                <div>
                  <div className="font-display font-bold text-3xl tracking-tight">
                    {program.priceDisplay}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted mt-1">
                    {program.priceSuffix.replace('/', '')}
                  </div>
                </div>
                <div
                  className={cn(
                    'w-10 h-10 flex items-center justify-center rounded-full border transition-all',
                    program.isFeatured
                      ? 'border-accent text-accent group-hover:bg-accent group-hover:text-bg'
                      : 'border-border group-hover:border-accent group-hover:text-accent'
                  )}
                >
                  <ArrowUpRight size={16} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureChip({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-bg-card/60 backdrop-blur-sm border border-accent/20">
      <span className="text-accent flex-shrink-0">{icon}</span>
      <span className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.14em] text-text font-bold whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}
