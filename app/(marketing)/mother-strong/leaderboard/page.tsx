import type { Metadata } from 'next';
import Link from 'next/link';
import { Trophy, Users, ArrowLeft } from 'lucide-react';
import {
  getMotherStrongConfig,
  getMotherStrongLeaderboard,
  getCurrentChallengeDay,
  getJourneyPosts,
} from '@/lib/data/mother-strong';
import { Leaderboard } from '@/components/mother-strong/Leaderboard';
import { JourneyFeed } from '@/components/mother-strong/JourneyFeed';

export const metadata: Metadata = {
  title: 'Leaderboard · PUREX Mother Strong',
  description:
    'Live leaderboard for the PUREX Mother Strong 60-day walking cohort — ranked by consistency, streak, and total steps.',
};

export const revalidate = 60; // ISR — refresh at most once a minute

export default async function MotherStrongLeaderboardPage() {
  const [board, config, day, journey] = await Promise.all([
    getMotherStrongLeaderboard(),
    getMotherStrongConfig(),
    getCurrentChallengeDay(),
    getJourneyPosts(12),
  ]);

  const cohortLabel = config.cohortLabel ?? "Mother's Day cohort";
  const activeCount = board.length;

  return (
    <main className="relative bg-bg text-text min-h-screen">
      {/* Background atmosphere */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(198, 255, 61, 0.08) 0%, transparent 55%)',
        }}
      />

      <div className="relative container-safe pt-24 md:pt-28 pb-16">
        {/* Back link */}
        <Link
          href="/mother-strong"
          className="inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.16em] text-text-muted hover:text-accent transition-colors font-bold"
          style={{ minHeight: 44 }}
        >
          <ArrowLeft size={13} />
          Mother Strong
        </Link>

        {/* Hero */}
        <header className="mt-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-accent font-bold mb-5">
            <span className="w-4 h-px bg-accent" />
            {cohortLabel}
            <span className="w-4 h-px bg-accent" />
          </div>
          <h1 className="font-display font-semibold text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.05] mb-5">
            Leaderboard
          </h1>
          <p
            className="text-text-muted leading-relaxed max-w-2xl"
            style={{ fontSize: 18 }}
          >
            Ranked by consistency, current streak, and total steps. Updates
            within a minute of the trainer logging each day&apos;s counts.
          </p>

          {/* Cohort stats */}
          <div className="mt-8 flex flex-wrap items-center gap-4 md:gap-6">
            {day > 0 && (
              <Stat
                icon={<Trophy size={14} />}
                label={`Day ${day} of 60`}
              />
            )}
            <Stat
              icon={<Users size={14} />}
              label={`${activeCount} ${activeCount === 1 ? 'mother' : 'mothers'} on the board`}
            />
            <Link
              href="/mother-strong/my-progress"
              className="font-mono text-[12px] uppercase tracking-[0.16em] text-accent hover:underline font-bold"
              style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center' }}
            >
              Find my progress →
            </Link>
          </div>
        </header>

        {/* Leaderboard */}
        <section className="mt-12 md:mt-14">
          <Leaderboard rows={board} dailyGoal={config.dailyGoal} />
        </section>

        {/* Journey feed */}
        {journey.length > 0 && (
          <section className="mt-16 md:mt-20">
            <div className="flex items-end justify-between mb-6">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold mb-2">
                  Day-by-day
                </div>
                <h2 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">
                  Mothers in motion
                </h2>
              </div>
            </div>
            <JourneyFeed posts={journey} />
          </section>
        )}
      </div>
    </main>
  );
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-card border border-border-soft text-xs font-mono uppercase tracking-[0.14em] text-text-muted font-bold">
      <span className="text-accent">{icon}</span>
      {label}
    </span>
  );
}
