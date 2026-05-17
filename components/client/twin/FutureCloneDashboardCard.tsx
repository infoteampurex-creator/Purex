'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { TwinSilhouette } from './TwinSilhouette';
import {
  deriveVisualState,
  projectStats,
  twinOverallScore,
  FUTURE_STAGES,
  type TwinStats,
} from '@/lib/data/twin';

interface Props {
  stats: TwinStats;
  workoutDoneToday: boolean;
}

/**
 * Compact dashboard card for the Future Clone. Defaults the preview
 * to the 90-day projection — far enough to feel meaningful, close
 * enough to feel reachable.
 */
export function FutureCloneDashboardCard({ stats, workoutDoneToday }: Props) {
  const preview = FUTURE_STAGES.find((s) => s.key === '90d')!;
  const projected = projectStats(stats, preview);
  const projectedState = deriveVisualState(projected, workoutDoneToday);
  const projectedOverall = twinOverallScore(projected);
  const todayOverall = twinOverallScore(stats);
  const lift = projectedOverall - todayOverall;

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 30% 0%, rgba(212, 160, 80, 0.10) 0%, transparent 55%),
          linear-gradient(180deg, #15110a 0%, #0a0c09 100%)
        `,
        borderColor: 'rgba(212, 160, 80, 0.30)',
        boxShadow: '0 0 0 1px rgba(212, 160, 80, 0.20), 0 8px 24px rgba(212, 160, 80, 0.06)',
      }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div
          className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] font-bold mb-2"
          style={{ color: '#d4a050' }}
        >
          <Sparkles size={11} />
          PureX Future Clone
        </div>
        <h3
          className="font-display font-bold tracking-tight"
          style={{ fontSize: 18 }}
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
            Your future transformation projection
          </span>
        </h3>
      </div>

      {/* Two silhouettes side by side with the lift indicator */}
      <div className="px-5 pb-4 grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
        {/* Today */}
        <div className="flex flex-col items-center">
          <TwinSilhouette
            stats={stats}
            state={deriveVisualState(stats, workoutDoneToday)}
            width={88}
            compact
          />
          <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted font-bold mt-2">
            Today
          </div>
          <div className="font-display font-bold text-text tabular-nums" style={{ fontSize: 18 }}>
            {todayOverall}
          </div>
        </div>

        {/* Lift arrow */}
        <div className="flex flex-col items-center px-1">
          <ArrowRight size={18} style={{ color: '#d4a050' }} />
          <div
            className="font-mono text-[10px] uppercase tracking-[0.16em] font-bold mt-2 tabular-nums"
            style={{ color: '#ffe69a' }}
          >
            +{lift}
          </div>
        </div>

        {/* 90-day projection */}
        <div className="flex flex-col items-center">
          <TwinSilhouette
            stats={projected}
            state={projectedState}
            width={88}
            compact
            futureBoost={0.5}
            auraOverride={preview.aura}
          />
          <div
            className="font-mono text-[9px] uppercase tracking-[0.16em] font-bold mt-2"
            style={{ color: preview.aura }}
          >
            {preview.label}
          </div>
          <div
            className="font-display font-bold tabular-nums"
            style={{ fontSize: 18, color: preview.aura }}
          >
            {projectedOverall}
          </div>
        </div>
      </div>

      {/* Tagline */}
      <div className="mx-5 mb-4 px-3 py-2.5 rounded-lg bg-bg-elevated/60 border border-border-soft">
        <p className="text-text leading-relaxed" style={{ fontSize: 13 }}>
          See yourself at 30, 90, 180, and 365 days from today — projected
          from your current consistency.
        </p>
      </div>

      {/* CTA */}
      <Link
        href="/client/future-clone"
        className="flex items-center justify-between px-5 py-3 border-t font-mono text-[11px] uppercase tracking-[0.18em] font-bold hover:opacity-90 transition-opacity"
        style={{
          borderColor: 'rgba(212, 160, 80, 0.15)',
          color: '#d4a050',
        }}
      >
        Open the timeline
        <ArrowRight size={13} />
      </Link>
    </div>
  );
}
