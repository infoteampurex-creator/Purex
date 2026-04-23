import Link from 'next/link';
import { ArrowUpRight, Check } from 'lucide-react';
import { FALLBACK_PROGRAMS } from '@/lib/constants';
import { cn } from '@/lib/cn';

export function ProgramsGrid() {
  return (
    <section id="programs" className="py-20 md:py-28 bg-bg-inset">
      <div className="container-safe">
        <div className="max-w-3xl mb-12 md:mb-16">
          <span className="eyebrow">Programs</span>
          <h2 className="mt-3 font-display font-semibold text-display-lg tracking-tight">
            Four programs.{' '}
            <span className="text-accent">One clear path.</span>
          </h2>
          <p className="mt-4 text-base text-text-muted leading-relaxed">
            Choose how deep you want to go. Every programme includes medical oversight, physio integration, and full-team coordination. No up-sells, no hidden fees.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {FALLBACK_PROGRAMS.map((program) => (
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
                <div className="eyebrow-accent">
                  {program.tag}
                </div>
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
          ))}
        </div>
      </div>
    </section>
  );
}
