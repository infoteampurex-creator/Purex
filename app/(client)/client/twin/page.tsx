import Link from 'next/link';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { TwinSilhouette } from '@/components/client/twin/TwinSilhouette';
import { TwinStatsPanel } from '@/components/client/twin/TwinStatsPanel';
import { TwinStatusBadge } from '@/components/client/twin/TwinStatusBadge';
import { AnimatedNumber } from '@/components/client/twin/AnimatedNumber';
import {
  deriveTwinStats,
  deriveVisualState,
  dailyTwinMessage,
  twinOverallScore,
} from '@/lib/data/twin';
import { getTwinDailyInputs } from '@/lib/data/twin-server';
import { getCurrentUserId } from '@/lib/data/client-live';

export const metadata = { title: 'PureX Twin · Your live fitness clone' };
export const dynamic = 'force-dynamic';

export default async function TwinPage() {
  // Pull live data when a user is logged in; fall back to empty
  // inputs (deterministic zeros) so the page renders for anonymous
  // / preview contexts without crashing.
  const userId = await getCurrentUserId();
  const { inputs } = userId
    ? await getTwinDailyInputs(userId)
    : { inputs: emptyPreviewInputs() };

  const stats = deriveTwinStats(inputs);
  const state = deriveVisualState(stats, inputs.workoutCompletedToday);
  const overall = twinOverallScore(stats);
  const today = new Date().toISOString().slice(0, 10);
  const message = dailyTwinMessage(state, today);

  return (
    <main className="relative bg-bg text-text min-h-screen">
      {/* Background atmosphere */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(198, 255, 61, 0.10) 0%, transparent 55%)',
        }}
      />

      <div className="relative container-safe pt-6 pb-16 max-w-5xl mx-auto">
        <Link
          href="/client/dashboard"
          className="inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.16em] text-text-muted hover:text-accent transition-colors font-bold mb-4"
          style={{ minHeight: 44 }}
        >
          <ArrowLeft size={13} />
          Back to dashboard
        </Link>

        {/* Hero */}
        <header className="mb-8 md:mb-10">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-accent font-bold mb-3">
            <Sparkles size={11} />
            PureX Twin
          </div>
          <h1 className="font-display font-semibold text-3xl md:text-5xl tracking-tight leading-[1.05] mb-3">
            Your live fitness clone.
          </h1>
          <p
            className="text-text-muted leading-relaxed max-w-2xl"
            style={{ fontSize: 17 }}
          >
            How you&apos;re performing today, rendered. Steps, sleep,
            workouts, water, nutrition, recovery, and streak all feed
            into the five vectors below. Your Twin breathes with your day.
          </p>
        </header>

        {/* Main grid: silhouette on left, stats on right */}
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 md:gap-12 items-start">
          {/* Silhouette + vitality */}
          <div className="rounded-3xl border border-border bg-bg-card/60 backdrop-blur-sm p-6 md:p-8">
            <div className="flex flex-col items-center">
              <TwinSilhouette stats={stats} state={state} width={280} />
              <div className="mt-6 text-center">
                <AnimatedNumber value={overall} fontSize={72} />
                <div className="font-mono uppercase tracking-[0.22em] text-text-muted font-bold mt-1" style={{ fontSize: 11 }}>
                  Vitality
                </div>
                <div className="mt-4 flex justify-center">
                  <TwinStatusBadge state={state} />
                </div>
              </div>

              <div className="mt-6 px-4 py-3 rounded-xl bg-accent/5 border border-accent/20 max-w-sm">
                <p className="text-text leading-relaxed text-center" style={{ fontSize: 15 }}>
                  {message}
                </p>
              </div>
            </div>
          </div>

          {/* Stats panel */}
          <div className="rounded-3xl border border-border bg-bg-card p-6 md:p-8">
            <h2 className="font-display font-semibold text-xl tracking-tight mb-1">
              The five vectors
            </h2>
            <p className="text-text-muted mb-6" style={{ fontSize: 14 }}>
              Each stat is computed from the data you (and your trainer) log
              every day.
            </p>
            <TwinStatsPanel stats={stats} />
          </div>
        </div>

        {/* Cross-link to Future Clone */}
        <Link
          href="/client/future-clone"
          className="mt-8 md:mt-10 block rounded-2xl border border-amber/40 bg-gradient-to-br from-amber/10 via-bg-card to-bg-card p-5 md:p-6 group hover:border-amber/60 transition-colors"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] font-bold mb-2" style={{ color: '#ffd24d' }}>
                <Sparkles size={11} />
                Next
              </div>
              <h3 className="font-display font-semibold text-xl tracking-tight">
                Meet your Future Clone
              </h3>
              <p className="text-text-muted mt-1" style={{ fontSize: 14 }}>
                The version of you 30, 90, 180, and 365 days from now —
                projected from your current consistency.
              </p>
            </div>
            <ArrowRight
              size={20}
              className="text-amber group-hover:translate-x-1 transition-transform flex-shrink-0"
            />
          </div>
        </Link>
      </div>
    </main>
  );
}

/**
 * Deterministic empty inputs used when no user is logged in (e.g.
 * preview / SSR-only contexts). All zeros — the Twin renders in
 * 'depleted' state with a clear "no data yet" feel rather than
 * showing fake numbers.
 */
function emptyPreviewInputs() {
  return {
    steps: 0,
    stepsGoal: 10000,
    sleepMinutes: 0,
    sleepGoalMinutes: 8 * 60,
    waterMl: 0,
    waterGoalMl: 8 * 250,
    workoutCompletedToday: false,
    workoutsLast7: 0,
    nutritionAdherencePct: 0,
    currentStreak: 0,
    bestStreak: 0,
  };
}
