import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import { ArrowRight, Trophy, Users, Footprints } from 'lucide-react';
import {
  getMotherStrongActiveCount,
  getCurrentChallengeDay,
  getMotherStrongConfig,
} from '@/lib/data/mother-strong';

/**
 * Homepage teaser for the PUREX Mother Strong cohort.
 *
 * Async server component — fetches the live cohort stats and the
 * configured WhatsApp link / cohort label, then renders a single
 * accent-bordered card with two CTAs (register + leaderboard).
 *
 * The teaser hides itself completely when no cohort is configured
 * (no challenge start date set) — keeps the homepage honest off-
 * season.
 *
 * Fetches are wrapped in unstable_cache with the
 * 'mother-strong-leaderboard' tag — the same tag every mutation
 * already calls updateTag() on — so the homepage stays statically
 * renderable (no cookie reads on the cached path) while still
 * invalidating cleanly when admin actions fire.
 */
const getTeaserData = unstable_cache(
  async () => {
    const [activeCount, day, config] = await Promise.all([
      getMotherStrongActiveCount(),
      getCurrentChallengeDay(),
      getMotherStrongConfig(),
    ]);
    return { activeCount, day, config };
  },
  ['mother-strong-teaser'],
  {
    tags: ['mother-strong-leaderboard'],
    revalidate: 300,
  }
);

export async function MotherStrongTeaser() {
  const { activeCount, day, config } = await getTeaserData();

  // Hide the section when there's no live cohort (no start date set and
  // no participants registered). Avoids a sad "0 mothers" card.
  if (activeCount === 0 && day === 0) {
    return null;
  }

  const cohortLabel = config.cohortLabel ?? "Mother's Day cohort";
  const isLive = day > 0 && day <= 60;
  const headline = isLive
    ? 'A cohort of mothers is walking right now.'
    : activeCount > 0
      ? 'A new cohort is forming.'
      : 'Mother Strong.';

  return (
    <section className="relative py-20 md:py-28 border-t border-border overflow-hidden">
      {/* Atmospheric backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 80% 20%, rgba(198, 255, 61, 0.10) 0%, transparent 50%)',
        }}
      />

      <div className="relative container-safe">
        <div className="rounded-3xl border border-accent/30 bg-bg-card/60 backdrop-blur-sm p-6 md:p-10 lg:p-12 grid lg:grid-cols-[1.4fr_1fr] gap-8 md:gap-10 items-center">
          {/* Left: copy + CTAs */}
          <div>
            <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-accent font-bold mb-4">
              <span className="w-4 h-px bg-accent" />
              PUREX Mother Strong
              <span className="w-4 h-px bg-accent" />
            </div>
            <h2 className="font-display font-semibold text-3xl md:text-4xl lg:text-5xl tracking-tight leading-[1.05] mb-4">
              {headline}
            </h2>
            <p
              className="text-text-muted leading-relaxed max-w-xl mb-6"
              style={{ fontSize: 17 }}
            >
              Free 60-day walking challenge for mothers — 10,000 steps a day,
              witnessed by the team. The cohort logs each day&apos;s steps for
              you. You just walk.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/mother-strong"
                className="inline-flex items-center justify-center gap-2 px-6 rounded-full bg-accent text-bg font-semibold hover:bg-accent-hover transition-colors"
                style={{ height: 52, minHeight: 52, fontSize: 16 }}
              >
                Join the cohort
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/mother-strong/leaderboard"
                className="inline-flex items-center justify-center gap-2 px-6 rounded-full border border-accent/40 bg-accent/5 text-accent font-semibold hover:bg-accent/10 transition-colors"
                style={{ height: 52, minHeight: 52, fontSize: 16 }}
              >
                See the leaderboard
              </Link>
            </div>
          </div>

          {/* Right: live cohort stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            <StatCard
              icon={<Trophy size={16} />}
              label="Cohort"
              value={cohortLabel}
              mono
            />
            {isLive && (
              <StatCard
                icon={<Footprints size={16} />}
                label="Today"
                value={`Day ${day} of 60`}
              />
            )}
            <StatCard
              icon={<Users size={16} />}
              label={activeCount === 1 ? 'Mother walking strong' : 'Mothers walking strong'}
              value={`${activeCount}`}
              big
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  big,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  big?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-bg-card/80 border border-border-soft p-4 md:p-5">
      <div className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted font-bold mb-2">
        <span className="text-accent">{icon}</span>
        {label}
      </div>
      <div
        className={`font-display font-bold tracking-tight ${mono ? 'text-text' : 'text-accent'} ${big ? 'tabular-nums' : ''} leading-none`}
        style={{ fontSize: big ? 42 : 22 }}
      >
        {value}
      </div>
    </div>
  );
}
