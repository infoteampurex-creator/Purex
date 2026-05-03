import Link from 'next/link';
import { ArrowUpRight, Check, Crown } from 'lucide-react';
import { FALLBACK_PROGRAMS } from '@/lib/constants';
import { cn } from '@/lib/cn';

export function ProgramsGrid() {
  const premiumProgram = FALLBACK_PROGRAMS.find((p) => p.isPremium);
  const standardPrograms = FALLBACK_PROGRAMS.filter((p) => !p.isPremium);

  return (
    <section id="programs" className="py-20 md:py-28 bg-bg-inset">
      <div className="container-safe">
        <div className="max-w-3xl mb-12 md:mb-16">
          <span className="eyebrow">Programs</span>
          <h2 className="mt-3 font-display font-semibold text-display-lg tracking-tight">
            Choose your path.{' '}
            <span className="text-accent">Train with intent.</span>
          </h2>
          <p className="mt-4 text-base text-text-muted leading-relaxed">
            Every programme includes medical oversight, physio integration, and full-team coordination. No up-sells, no hidden fees.
          </p>
        </div>

        {/* ════════════════════════════════════════════════════
            STANDARD PROGRAMS — 3 cards in a clean grid
        ════════════════════════════════════════════════════ */}
        <div className="grid md:grid-cols-3 gap-4 md:gap-5 mb-6 md:mb-8">
          {standardPrograms.map((program) => (
            <StandardCard key={program.slug} program={program} />
          ))}
        </div>

        {/* ════════════════════════════════════════════════════
            PURE ENDURO — Same size as standard, GOLD premium look
        ════════════════════════════════════════════════════ */}
        {premiumProgram && (
          <div className="grid md:grid-cols-3 gap-4 md:gap-5">
            {/* Empty spacer to align Enduro to the left column on desktop,
                 OR center on mobile. We use 1/3 width on desktop so card
                 visually mirrors a standard card size. */}
            <div className="md:col-start-1">
              <PremiumGoldCard program={premiumProgram} />
            </div>

            {/* The "label" panel on the right — explains why Enduro is special */}
            <div className="hidden md:block md:col-span-2 self-stretch">
              <div className="h-full flex items-center pl-2">
                <div className="border-l-2 border-amber-500/30 pl-6 py-3">
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] font-bold mb-2"
                       style={{ color: '#d4a050' }}>
                    Signature Add-On
                  </div>
                  <p className="text-sm text-text-muted leading-relaxed max-w-md">
                    A specialist race-prep programme for HYROX, IRONMAN, and hybrid
                    athletes. Available alongside any plan above — or as a standalone
                    track for serious endurance work.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Standard program card ──────────────────────────────────────
type Program = (typeof FALLBACK_PROGRAMS)[number];

function StandardCard({ program }: { program: Program }) {
  return (
    <Link
      href={`/programs/${program.slug}`}
      className={cn(
        'group relative flex flex-col p-6 md:p-7 rounded-xl overflow-hidden h-full',
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
            <li key={item} className="flex items-start gap-2 text-xs text-text-muted">
              <Check size={14} className="text-accent flex-shrink-0 mt-0.5" />
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
  );
}

// ─── Pure Enduro card — gold premium treatment ─────────────────
function PremiumGoldCard({ program }: { program: Program }) {
  return (
    <Link
      href={`/programs/${program.slug}`}
      className="group relative flex flex-col p-6 md:p-7 rounded-xl overflow-hidden h-full transition-all duration-500 hover:-translate-y-1"
      style={{
        background: `
          radial-gradient(ellipse at 30% 0%, rgba(212, 160, 80, 0.12) 0%, transparent 50%),
          radial-gradient(ellipse at 100% 100%, rgba(255, 245, 204, 0.06) 0%, transparent 60%),
          linear-gradient(180deg, #15110a 0%, #0a0c09 100%)
        `,
        boxShadow: '0 0 0 1px rgba(212, 160, 80, 0.35), 0 8px 30px rgba(212, 160, 80, 0.08)',
      }}
    >
      {/* Animated golden shimmer sweep — like premium watch ads */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none overflow-hidden"
      >
        <div
          className="absolute -inset-y-[50%] w-1/3 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          style={{
            background:
              'linear-gradient(105deg, transparent 30%, rgba(255, 230, 150, 0.18) 50%, transparent 70%)',
            animation: 'enduro-shimmer 2.5s ease-in-out infinite',
            transform: 'skewX(-20deg)',
          }}
        />
      </div>

      {/* Static idle gold shimmer (faint, always running) */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none overflow-hidden opacity-50"
      >
        <div
          className="absolute -inset-y-[50%] w-1/4"
          style={{
            background:
              'linear-gradient(105deg, transparent 30%, rgba(255, 230, 150, 0.08) 50%, transparent 70%)',
            animation: 'enduro-shimmer 6s ease-in-out infinite',
            transform: 'skewX(-20deg)',
          }}
        />
      </div>

      {/* Gold particles floating on hover */}
      <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        {[...Array(6)].map((_, i) => {
          const seed = i * 41;
          const left = 10 + (seed * 13) % 80;
          const top = 15 + (seed * 23) % 70;
          const duration = 4 + ((seed * 11) % 3);
          const delay = (seed * 0.13) % 2;
          return (
            <span
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: '2px',
                height: '2px',
                background: '#ffe69a',
                boxShadow: '0 0 4px rgba(255, 230, 150, 0.8)',
                animation: `enduro-particle ${duration}s ease-in-out ${delay}s infinite`,
              }}
            />
          );
        })}
      </div>

      {/* SIGNATURE badge top-right */}
      <div className="absolute top-0 right-0 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] font-bold rounded-bl-xl"
           style={{
             background: 'linear-gradient(135deg, #d4a050 0%, #ffe69a 50%, #d4a050 100%)',
             color: '#1a1308',
           }}>
        <span className="inline-flex items-center gap-1">
          <Crown size={9} strokeWidth={2.5} />
          Signature
        </span>
      </div>

      {/* Card content */}
      <div className="flex-1 relative z-10">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] font-bold"
             style={{ color: '#d4a050' }}>
          {program.tag}
        </div>
        <h3 className="mt-4 font-display font-bold text-2xl md:text-[26px] tracking-tight leading-[1.1]">
          <span
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #ffe69a 60%, #d4a050 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {program.name}
          </span>
        </h3>
        <p className="mt-3 text-sm text-text-muted leading-relaxed">
          {program.tagline}
        </p>

        <ul className="mt-6 space-y-2">
          {program.inclusions.slice(0, 3).map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs text-text-muted">
              <Check size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#d4a050' }} />
              <span className="leading-snug">{item}</span>
            </li>
          ))}
          {program.inclusions.length > 3 && (
            <li className="text-xs font-mono uppercase tracking-[0.12em]" style={{ color: '#a07832' }}>
              +{program.inclusions.length - 3} more
            </li>
          )}
        </ul>
      </div>

      <div className="relative z-10 mt-8 pt-6 border-t flex items-end justify-between"
           style={{ borderColor: 'rgba(212, 160, 80, 0.25)' }}>
        <div>
          <div className="font-display font-bold text-3xl tracking-tight"
               style={{
                 background: 'linear-gradient(135deg, #ffe69a 0%, #d4a050 100%)',
                 WebkitBackgroundClip: 'text',
                 WebkitTextFillColor: 'transparent',
                 backgroundClip: 'text',
               }}>
            {program.priceDisplay}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] mt-1"
               style={{ color: '#a07832' }}>
            {program.priceSuffix.replace('/', '')}
          </div>
        </div>
        <div
          className="w-10 h-10 flex items-center justify-center rounded-full border transition-all group-hover:scale-110"
          style={{
            borderColor: '#d4a050',
            color: '#d4a050',
          }}
        >
          <ArrowUpRight size={16} />
        </div>
      </div>

      <style>{`
        @keyframes enduro-shimmer {
          0% { transform: translateX(-200%) skewX(-20deg); }
          100% { transform: translateX(800%) skewX(-20deg); }
        }
        @keyframes enduro-particle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
          50% { transform: translateY(-25px) scale(1.4); opacity: 0.95; }
        }
      `}</style>
    </Link>
  );
}
