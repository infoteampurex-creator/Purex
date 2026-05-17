import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { FutureCloneViewer } from '@/components/client/twin/FutureCloneViewer';
import {
  deriveTwinStats,
  type DailyInputs,
} from '@/lib/data/twin';

export const metadata = {
  title: 'PureX Future Clone · Your transformation projection',
};

// TODO Phase 4: real-data fetch. Mirrors /client/twin for now.
function getTodaysInputs(): DailyInputs {
  return {
    steps: 8400,
    stepsGoal: 10000,
    sleepMinutes: 6 * 60 + 50,
    sleepGoalMinutes: 8 * 60,
    waterMl: 2200,
    waterGoalMl: 3000,
    workoutCompletedToday: true,
    workoutsLast7: 5,
    nutritionAdherencePct: 72,
    currentStreak: 9,
    bestStreak: 22,
  };
}

export default function FutureClonePage() {
  const inputs = getTodaysInputs();
  const stats = deriveTwinStats(inputs);

  return (
    <main className="relative bg-bg text-text min-h-screen">
      {/* Background atmosphere — warmer, gold-leaning for the future surface */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 80% 0%, rgba(212, 160, 80, 0.12) 0%, transparent 55%), radial-gradient(ellipse at 20% 60%, rgba(125, 211, 255, 0.08) 0%, transparent 55%)',
        }}
      />

      <div className="relative container-safe pt-6 pb-16 max-w-6xl mx-auto">
        <Link
          href="/client/dashboard"
          className="inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.16em] text-text-muted hover:text-accent transition-colors font-bold mb-4"
          style={{ minHeight: 44 }}
        >
          <ArrowLeft size={13} />
          Back to dashboard
        </Link>

        <header className="mb-8 md:mb-10">
          <div
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] font-bold mb-3"
            style={{ color: '#d4a050' }}
          >
            <Sparkles size={11} />
            PureX Future Clone
          </div>
          <h1 className="font-display font-bold text-3xl md:text-5xl tracking-tight leading-[1.05] mb-3">
            <span
              style={{
                background:
                  'linear-gradient(135deg, #ffffff 0%, #ffe69a 50%, #d4a050 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Who you can become.
            </span>
          </h1>
          <p
            className="text-text-muted leading-relaxed max-w-2xl"
            style={{ fontSize: 17 }}
          >
            Five projection stages, all built from the same five vectors as
            your live Twin — just compounded over time. Tap any stage on
            the timeline and the silhouette evolves.
          </p>
        </header>

        <FutureCloneViewer
          todayStats={stats}
          workoutDoneToday={inputs.workoutCompletedToday}
        />
      </div>
    </main>
  );
}
