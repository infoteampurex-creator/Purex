import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import {
  ArrowRight,
  Trophy,
  Users,
  Footprints,
  Sparkles,
  CalendarClock,
  BellRing,
} from 'lucide-react';
import {
  getMotherStrongActiveCount,
  getCurrentChallengeDay,
  getMotherStrongConfig,
} from '@/lib/data/mother-strong';

/**
 * Homepage teaser for the PUREX Mother Strong cohort.
 *
 * Async server component — fetches cohort stats + config, then picks
 * one of two visual treatments based on whether a cohort is currently
 * running:
 *
 *   1. Cohort is LIVE (day 1..60 of the configured window) → the
 *      existing accent-green card, with the live "Day X of 60" badge
 *      and the count of mothers walking strong.
 *
 *   2. Cohort is NOT live yet — either no challenge_start_date is
 *      set in admin Config, or the configured start date is in the
 *      future → a gold "Coming Soon" card mirroring the Pure Enduro
 *      premium treatment from ProgramsGrid.tsx. Includes the launch
 *      date if it's known, "PRE-REGISTER OPEN" badge, and CTAs that
 *      still let early visitors reserve a spot.
 *
 * Admin controls the flip by editing challenge_start_date in
 * /admin/mother-strong → Config. Cache invalidates within ~1 minute
 * via the 'mother-strong-leaderboard' tag.
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
  const isLive = day > 0 && day <= 60;

  if (!isLive) {
    return (
      <ComingSoonGoldCard
        cohortLabel={config.cohortLabel ?? "Mother's Day cohort"}
        challengeStartDate={config.challengeStartDate}
        whatsappGroupLink={config.whatsappGroupLink}
        activeCount={activeCount}
      />
    );
  }

  // ─── Cohort is live → existing green card ──────────────────────
  return (
    <ActiveGreenCard
      day={day}
      activeCount={activeCount}
      cohortLabel={config.cohortLabel ?? "Mother's Day cohort"}
    />
  );
}

// ════════════════════════════════════════════════════════════════════
// ACTIVE GREEN CARD — cohort is live (day 1..60)
// ════════════════════════════════════════════════════════════════════

function ActiveGreenCard({
  day,
  activeCount,
  cohortLabel,
}: {
  day: number;
  activeCount: number;
  cohortLabel: string;
}) {
  const headline =
    activeCount > 0
      ? 'A cohort of mothers is walking right now.'
      : 'The cohort just opened. Be the first name on the board.';

  return (
    <section className="relative py-20 md:py-28 border-t border-border overflow-hidden">
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
          <div>
            <Eyebrow tone="green" />
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            <StatCard
              icon={<Trophy size={16} />}
              label="Cohort"
              value={cohortLabel}
              mono
            />
            <StatCard
              icon={<Footprints size={16} />}
              label="Today"
              value={`Day ${day} of 60`}
            />
            {activeCount > 0 ? (
              <StatCard
                icon={<Users size={16} />}
                label={
                  activeCount === 1 ? 'Mother walking strong' : 'Mothers walking strong'
                }
                value={`${activeCount}`}
                big
              />
            ) : (
              <StatCard
                icon={<Users size={16} />}
                label="Open for registration"
                value="Be the first"
                mono
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// COMING SOON GOLD CARD — mirrors the Pure Enduro premium treatment
// ════════════════════════════════════════════════════════════════════

function ComingSoonGoldCard({
  cohortLabel,
  challengeStartDate,
  whatsappGroupLink,
  activeCount,
}: {
  cohortLabel: string;
  challengeStartDate: string | null;
  whatsappGroupLink: string | null;
  activeCount: number;
}) {
  // Format the date + countdown when we have a start date.
  const launchInfo = formatLaunch(challengeStartDate);

  return (
    <section className="relative py-20 md:py-28 border-t border-border overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 80% 20%, rgba(212, 160, 80, 0.10) 0%, transparent 55%)',
        }}
      />

      <div className="relative container-safe">
        <div
          className="group relative rounded-3xl overflow-hidden p-6 md:p-10 lg:p-12 grid lg:grid-cols-[1.4fr_1fr] gap-8 md:gap-10 items-center"
          style={{
            background: `
              radial-gradient(ellipse at 30% 0%, rgba(212, 160, 80, 0.14) 0%, transparent 55%),
              radial-gradient(ellipse at 100% 100%, rgba(255, 245, 204, 0.06) 0%, transparent 60%),
              linear-gradient(180deg, #15110a 0%, #0a0c09 100%)
            `,
            boxShadow:
              '0 0 0 1px rgba(212, 160, 80, 0.35), 0 10px 40px rgba(212, 160, 80, 0.08)',
          }}
        >
          {/* Animated golden shimmer sweep on hover */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none overflow-hidden"
          >
            <div
              className="absolute -inset-y-[50%] w-1/3 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
              style={{
                background:
                  'linear-gradient(105deg, transparent 30%, rgba(255, 230, 150, 0.18) 50%, transparent 70%)',
                animation: 'ms-shimmer 2.5s ease-in-out infinite',
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
                animation: 'ms-shimmer 6s ease-in-out infinite',
                transform: 'skewX(-20deg)',
              }}
            />
          </div>

          {/* Floating gold particles on hover */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          >
            {[...Array(6)].map((_, i) => {
              const seed = i * 41;
              const left = 10 + ((seed * 13) % 80);
              const top = 15 + ((seed * 23) % 70);
              const duration = 4 + ((seed * 11) % 3);
              const delay = (seed * 0.13) % 2;
              return (
                <span
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    width: 2,
                    height: 2,
                    background: '#ffe69a',
                    boxShadow: '0 0 4px rgba(255, 230, 150, 0.8)',
                    animation: `ms-particle ${duration}s ease-in-out ${delay}s infinite`,
                  }}
                />
              );
            })}
          </div>

          {/* COMING SOON badge top-right */}
          <div
            className="absolute top-0 right-0 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] font-bold rounded-bl-xl z-10"
            style={{
              background:
                'linear-gradient(135deg, #d4a050 0%, #ffe69a 50%, #d4a050 100%)',
              color: '#1a1308',
            }}
          >
            <span className="inline-flex items-center gap-1">
              <Sparkles size={9} strokeWidth={2.5} />
              Coming soon
            </span>
          </div>

          {/* Left: copy + CTAs */}
          <div className="relative z-10">
            <div
              className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] font-bold mb-4"
              style={{ color: '#d4a050' }}
            >
              <span
                className="w-4 h-px"
                style={{ background: '#d4a050' }}
              />
              PUREX Mother Strong
              <span
                className="w-4 h-px"
                style={{ background: '#d4a050' }}
              />
            </div>

            <h2
              className="font-display font-bold text-3xl md:text-4xl lg:text-5xl tracking-tight leading-[1.05] mb-4"
            >
              <span
                style={{
                  background:
                    'linear-gradient(135deg, #ffffff 0%, #ffe69a 60%, #d4a050 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                A new cohort is opening soon.
              </span>
            </h2>

            <p
              className="text-text-muted leading-relaxed max-w-xl mb-6"
              style={{ fontSize: 17 }}
            >
              A free 60-day walking program for mothers — 10,000 steps a day,
              witnessed by the team. Registration opens on launch day.
              Join the WhatsApp group below to be notified the moment the
              form unlocks.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              {whatsappGroupLink ? (
                <a
                  href={whatsappGroupLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 rounded-full font-semibold transition-all hover:opacity-95"
                  style={{
                    height: 52,
                    minHeight: 52,
                    fontSize: 16,
                    background: '#25D366',
                    color: '#ffffff',
                    boxShadow: '0 4px 20px rgba(37, 211, 102, 0.25)',
                  }}
                >
                  <BellRing size={15} strokeWidth={2.5} />
                  Join the WhatsApp group
                </a>
              ) : (
                <Link
                  href="/mother-strong"
                  className="inline-flex items-center justify-center gap-2 px-6 rounded-full font-semibold transition-all hover:shadow-lg"
                  style={{
                    height: 52,
                    minHeight: 52,
                    fontSize: 16,
                    background:
                      'linear-gradient(135deg, #d4a050 0%, #ffe69a 50%, #d4a050 100%)',
                    color: '#1a1308',
                    boxShadow: '0 4px 20px rgba(212, 160, 80, 0.25)',
                  }}
                >
                  <BellRing size={15} strokeWidth={2.5} />
                  Notify me
                </Link>
              )}
              <Link
                href="/mother-strong"
                className="inline-flex items-center justify-center gap-2 px-6 rounded-full border font-semibold transition-colors"
                style={{
                  height: 52,
                  minHeight: 52,
                  fontSize: 16,
                  borderColor: 'rgba(212, 160, 80, 0.35)',
                  color: '#d4a050',
                  background: 'rgba(212, 160, 80, 0.05)',
                }}
              >
                Learn more
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          {/* Right: stat cards (gold-tinted) */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            <GoldStatCard
              icon={<Trophy size={16} />}
              label="Cohort"
              value={cohortLabel}
              mono
            />
            {launchInfo ? (
              <GoldStatCard
                icon={<CalendarClock size={16} />}
                label="Launching"
                value={launchInfo.dateLabel}
                sub={launchInfo.countdownLabel}
              />
            ) : (
              <GoldStatCard
                icon={<CalendarClock size={16} />}
                label="Launching"
                value="This summer"
                sub="Exact date announced soon"
              />
            )}
            <GoldStatCard
              icon={<Users size={16} />}
              label="Pre-registered"
              value={
                activeCount > 0
                  ? `${activeCount} ${activeCount === 1 ? 'mother' : 'mothers'}`
                  : 'Be the first'
              }
              mono={activeCount === 0}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ms-shimmer {
          0% { transform: translateX(-200%) skewX(-20deg); }
          100% { transform: translateX(800%) skewX(-20deg); }
        }
        @keyframes ms-particle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
          50% { transform: translateY(-25px) scale(1.4); opacity: 0.95; }
        }
      `}</style>
    </section>
  );
}

// ─── Shared ────────────────────────────────────────────────────────

function Eyebrow({ tone }: { tone: 'green' | 'gold' }) {
  const color = tone === 'green' ? '#c6ff3d' : '#d4a050';
  return (
    <div
      className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] font-bold mb-4"
      style={{ color }}
    >
      <span className="w-4 h-px" style={{ background: color }} />
      PUREX Mother Strong
      <span className="w-4 h-px" style={{ background: color }} />
    </div>
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

function GoldStatCard({
  icon,
  label,
  value,
  sub,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  mono?: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-4 md:p-5 border"
      style={{
        background: 'rgba(20, 16, 8, 0.5)',
        borderColor: 'rgba(212, 160, 80, 0.25)',
      }}
    >
      <div
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] font-bold mb-2"
        style={{ color: 'rgba(212, 160, 80, 0.85)' }}
      >
        <span>{icon}</span>
        {label}
      </div>
      <div
        className="font-display font-bold tracking-tight leading-snug"
        style={{
          fontSize: 22,
          color: mono ? '#f4f7eb' : '#ffe69a',
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          className="font-mono text-[11px] mt-2"
          style={{ color: 'rgba(212, 160, 80, 0.7)' }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

// ─── Date / countdown helpers ─────────────────────────────────────

function formatLaunch(
  challengeStartDate: string | null
): { dateLabel: string; countdownLabel: string } | null {
  if (!challengeStartDate) return null;

  const start = new Date(challengeStartDate + 'T00:00:00');
  if (Number.isNaN(start.getTime())) return null;

  // Compare in Asia/Kolkata to match the rest of the cohort logic.
  const today = new Date(
    new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) +
      'T00:00:00'
  );

  // Past dates fall through to null — the active card handles those.
  const diffDays = Math.floor(
    (start.getTime() - today.getTime()) / 86400000
  );
  if (diffDays < 0) return null;

  const dateLabel = start.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  let countdownLabel: string;
  if (diffDays === 0) countdownLabel = 'Today';
  else if (diffDays === 1) countdownLabel = 'Tomorrow';
  else if (diffDays < 7) countdownLabel = `In ${diffDays} days`;
  else if (diffDays < 60) countdownLabel = `In ${Math.round(diffDays / 7)} weeks`;
  else countdownLabel = `In ~${Math.round(diffDays / 30)} months`;

  return { dateLabel, countdownLabel };
}
