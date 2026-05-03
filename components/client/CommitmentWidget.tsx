'use client';

import Link from 'next/link';
import { Flame, TrendingUp, ArrowRight } from 'lucide-react';
import type { CommitmentPact } from '@/lib/data/commitment';
import { COMMITMENT_MILESTONES } from '@/lib/data/commitment';
import { cn } from '@/lib/cn';

interface CommitmentWidgetProps {
  pact: CommitmentPact | null;
}

/**
 * Always-visible widget on the client dashboard showing 100-day progress.
 *
 * If the client hasn't signed a pact yet, shows an inviting empty state
 * pointing to the pact creation flow.
 */
export function CommitmentWidget({ pact }: CommitmentWidgetProps) {
  // Empty state — no pact signed yet
  if (!pact) {
    return (
      <Link
        href="/client/commitment"
        className="group relative block rounded-2xl bg-bg-card border border-border hover:border-accent/40 transition-all duration-500 overflow-hidden p-6 md:p-8"
      >
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'rgba(198, 255, 61, 0.1)',
              border: '1px solid rgba(198, 255, 61, 0.3)',
              color: '#c6ff3d',
            }}
          >
            <Flame size={22} strokeWidth={2} />
          </div>
          <div className="flex-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-1.5">
              100-Day Commitment
            </div>
            <h3 className="font-display font-semibold text-lg md:text-xl tracking-tight leading-tight mb-1">
              Ready to make the pact?
            </h3>
            <p className="text-sm text-text-muted leading-relaxed">
              Sign a 100-day commitment to your future self. Witnessed by your coach.
            </p>
          </div>
          <div className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold group-hover:gap-2 transition-all flex-shrink-0">
            Begin pact
            <ArrowRight size={11} strokeWidth={2.5} />
          </div>
        </div>
      </Link>
    );
  }

  const progressPercent = (pact.metrics.currentDay / 100) * 100;
  const streakColor =
    pact.metrics.streakPercent >= 85
      ? '#c6ff3d'
      : pact.metrics.streakPercent >= 70
        ? '#ffb84d'
        : '#ff6b5b';
  const streakStatus =
    pact.metrics.streakPercent >= 85
      ? 'ON TRACK'
      : pact.metrics.streakPercent >= 70
        ? 'HOLD FIRM'
        : 'AT RISK';

  return (
    <Link
      href="/client/commitment"
      className="group relative block rounded-2xl bg-bg-card border border-accent/25 p-5 md:p-6 overflow-hidden hover:border-accent/50 transition-all duration-500"
    >
      {/* Ambient green glow */}
      <div
        aria-hidden
        className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none opacity-70 group-hover:opacity-100 transition-opacity duration-700"
        style={{
          background:
            'radial-gradient(circle, rgba(198, 255, 61, 0.15) 0%, transparent 70%)',
        }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-5 relative">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-1.5">
            <Flame size={12} strokeWidth={2.5} />
            Your 100-Day Pact
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-bold text-3xl md:text-4xl tracking-tight text-white leading-none">
              Day {pact.metrics.currentDay}
            </span>
            <span className="font-mono text-sm text-text-muted font-medium">
              of 100
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border"
            style={{
              background: `${streakColor}14`,
              borderColor: `${streakColor}66`,
              color: streakColor,
            }}
          >
            <TrendingUp size={10} strokeWidth={2.5} />
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] font-bold">
              {streakStatus}
            </span>
          </div>
          <div className="font-mono text-[10px] text-text-muted">
            <span className="font-bold text-text" style={{ color: streakColor }}>
              {pact.metrics.streakPercent}%
            </span>{' '}
            streak
          </div>
        </div>
      </div>

      {/* Progress bar with milestones */}
      <div className="relative mb-3">
        {/* Track */}
        <div className="h-2.5 rounded-full bg-bg-elevated overflow-hidden relative">
          <div
            className="h-full transition-all duration-1000"
            style={{
              width: `${progressPercent}%`,
              background:
                'linear-gradient(90deg, #c6ff3d 0%, #68a00c 70%, #c6ff3d 100%)',
              boxShadow: '0 0 12px rgba(198, 255, 61, 0.5)',
            }}
          />
        </div>

        {/* Milestone markers */}
        <div className="absolute inset-0 flex items-center pointer-events-none">
          {COMMITMENT_MILESTONES.map((m) => {
            const passed = pact.metrics.currentDay >= m.day;
            return (
              <div
                key={m.day}
                className="absolute -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${m.day}%` }}
              >
                <div
                  className={cn(
                    'w-3 h-3 rounded-full border-2 transition-all duration-500',
                    passed
                      ? 'bg-accent border-accent scale-110'
                      : 'bg-bg-elevated border-border-soft'
                  )}
                  style={{
                    boxShadow: passed ? '0 0 8px rgba(198, 255, 61, 0.7)' : 'none',
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Milestone labels row */}
      <div className="relative h-4 pointer-events-none mb-5">
        {COMMITMENT_MILESTONES.map((m) => {
          const passed = pact.metrics.currentDay >= m.day;
          return (
            <div
              key={m.day}
              className="absolute -translate-x-1/2 text-center"
              style={{ left: `${m.day}%` }}
            >
              <div
                className={cn(
                  'font-mono text-[8px] md:text-[9px] uppercase tracking-[0.14em] font-bold transition-colors duration-500',
                  passed ? 'text-accent' : 'text-text-dim'
                )}
              >
                D{m.day}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-4 gap-3 pt-4 border-t border-border-soft">
        <MiniStat
          value={pact.metrics.workoutsLogged}
          target={pact.commitments.workoutSessions}
          label="Workouts"
        />
        <MiniStat
          value={pact.metrics.nutritionDaysLogged}
          target={pact.commitments.nutritionLogs / 3} // approx days
          label="Food Days"
          asDays
        />
        <MiniStat
          value={pact.metrics.callsCompleted}
          target={pact.commitments.weeklyCalls}
          label="Calls"
        />
        <MiniStat
          value={pact.metrics.physioCheckInsCompleted}
          target={pact.commitments.physioCheckIns}
          label="Physio"
        />
      </div>

      {/* View pact CTA */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-soft">
        <div className="text-xs text-text-muted">
          Witnessed by{' '}
          <span className="text-text font-medium">{pact.witnessName}</span>
        </div>
        <div className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold group-hover:gap-2 transition-all">
          View Pact
          <ArrowRight size={11} strokeWidth={2.5} />
        </div>
      </div>
    </Link>
  );
}

function MiniStat({
  value,
  target,
  label,
  asDays = false,
}: {
  value: number;
  target: number;
  label: string;
  asDays?: boolean;
}) {
  const percent = Math.min((value / target) * 100, 100);
  return (
    <div>
      <div className="flex items-baseline gap-1 mb-1.5">
        <span className="font-display font-bold text-lg text-white leading-none">
          {Math.round(value)}
        </span>
        <span className="font-mono text-[9px] text-text-muted">
          /{Math.round(target)}
          {asDays ? 'd' : ''}
        </span>
      </div>
      <div className="h-1 rounded-full bg-bg-elevated overflow-hidden mb-1">
        <div
          className="h-full bg-accent transition-all duration-1000"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-text-muted">
        {label}
      </div>
    </div>
  );
}
