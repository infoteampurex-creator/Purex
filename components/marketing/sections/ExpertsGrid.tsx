import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import { FALLBACK_EXPERTS } from '@/lib/constants';
import { ExpertCard } from './ExpertCard';

export function ExpertsGrid() {
  // Split experts by location
  const indiaTeam = FALLBACK_EXPERTS.filter((e) => e.location === 'India');
  const ukTeam = FALLBACK_EXPERTS.filter((e) => e.location === 'UK');

  return (
    <section id="experts" className="py-20 md:py-28">
      <div className="container-safe">
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-14">
          <div>
            <span className="eyebrow">Meet The Team</span>
            <h2 className="mt-3 font-display font-semibold text-display-lg tracking-tight max-w-2xl">
              Six specialists.{' '}
              <span className="text-accent">One plan.</span>
            </h2>
            <p className="mt-4 text-base text-text-muted max-w-xl leading-relaxed">
              A coordinated team across two countries — not a solo trainer. India handles
              training, medical, and rehab. UK handles performance coaching, mental
              health, and founder oversight.
            </p>
          </div>
          <Link
            href="/experts"
            className="inline-flex items-center gap-2 text-sm text-text hover:text-accent transition-colors font-medium"
          >
            View all profiles
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* INDIA TEAM */}
        <LocationHeader
          flag="🇮🇳"
          country="India"
          tagline="Training · Medical · Rehab"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5 mb-12 md:mb-16">
          {indiaTeam.map((expert) => (
            <ExpertCard key={expert.slug} expert={expert} />
          ))}
        </div>

        {/* UK TEAM */}
        <LocationHeader
          flag="🇬🇧"
          country="United Kingdom"
          tagline="Performance · Mental Health · Operations"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {ukTeam.map((expert) => (
            <ExpertCard key={expert.slug} expert={expert} />
          ))}
        </div>
      </div>
    </section>
  );
}

function LocationHeader({
  flag,
  country,
  tagline,
}: {
  flag: string;
  country: string;
  tagline: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5 md:mb-7">
      {/* Flag + country chip */}
      <div className="inline-flex items-center gap-2 bg-bg-card border border-border rounded-full px-3 py-1.5">
        <span className="text-sm leading-none">{flag}</span>
        <MapPin size={11} className="text-accent" strokeWidth={2.5} />
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text font-bold">
          {country}
        </span>
      </div>

      {/* Tagline */}
      <div className="hidden sm:flex items-center gap-2 flex-1">
        <div className="h-px flex-1 bg-border-soft" />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
          {tagline}
        </span>
      </div>
    </div>
  );
}
