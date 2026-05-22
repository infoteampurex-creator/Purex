'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { TwinSilhouette } from './TwinSilhouette';
import { TransformationBeam } from './TransformationBeam';
import { MilestoneRail } from './MilestoneRail';
import { ProjectedMetrics } from './ProjectedMetrics';
import {
  deriveVisualState,
  isTwinEmpty,
  projectStats,
  twinOverallScore,
  FUTURE_STAGES,
  TWIN_PREVIEW_STATS,
  type TwinStats,
} from '@/lib/data/twin';
import { deriveProjectedDeltas } from '@/lib/data/twin-game';

interface Props {
  stats: TwinStats;
  workoutDoneToday: boolean;
  streakDays: number;
}

/**
 * Future Clone — the aspirational card. Shows Today's twin and a
 * 90-day projected twin separated by an animated transformation beam.
 * Below: milestone rail (Day 1 / 30 / 60 / 90) + projected metric pills.
 *
 * In the app, an empty-stats account swaps in TWIN_PREVIEW_STATS so
 * both silhouettes render with visible animation, and the card shows
 * a "Preview" badge.
 */
export function FutureCloneDashboardCardApp({
  stats,
  workoutDoneToday,
  streakDays,
}: Props) {
  // Empty-stats accounts get a synthetic-preview Twin so both
  // silhouettes (today + Day 90) render with visible animation.
  const showPreview = isTwinEmpty(stats);
  const sourceStats = showPreview ? TWIN_PREVIEW_STATS : stats;

  const future = FUTURE_STAGES.find((s) => s.key === '90d')!;
  const projected = projectStats(sourceStats, future);
  const projectedState = deriveVisualState(projected, workoutDoneToday);
  const projectedOverall = twinOverallScore(projected);
  const todayOverall = twinOverallScore(sourceStats);
  const lift = Math.max(0, projectedOverall - todayOverall);

  const deltas = deriveProjectedDeltas(sourceStats, projected);

  return (
    <div
      className="relative rounded-3xl overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 50% -20%, rgba(212,160,80,0.16) 0%, transparent 55%),
          linear-gradient(180deg, #15110a 0%, #0a0c09 100%)
        `,
        border: '1px solid rgba(212,160,80,0.30)',
        boxShadow:
          '0 0 0 1px rgba(212,160,80,0.18), 0 24px 48px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Ambient gold glow corner */}
      <div
        className="absolute -top-24 -right-24 w-64 h-64 rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(255,210,77,0.18), transparent 65%)',
          filter: 'blur(10px)',
        }}
      />

      {/* ─── Header ─── */}
      <div className="relative px-5 pt-5 pb-3">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <div
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] font-bold"
            style={{ color: '#d4a050' }}
          >
            <Sparkles size={11} />
            PureX Future Clone
          </div>
          <span
            className="font-mono uppercase tracking-[0.18em] px-1.5 py-0.5 rounded"
            style={{
              fontSize: 9,
              color: '#ffd24d',
              backgroundColor: 'rgba(255,210,77,0.10)',
              border: '1px solid rgba(255,210,77,0.18)',
            }}
          >
            90-day projection
          </span>
          {showPreview && (
            <span
              className="font-mono uppercase tracking-[0.18em] px-1.5 py-0.5 rounded"
              style={{
                fontSize: 8,
                color: '#d4a050',
                backgroundColor: 'rgba(212,160,80,0.18)',
              }}
            >
              Preview
            </span>
          )}
        </div>
        <h3
          className="font-display font-bold tracking-tight"
          style={{ fontSize: 20 }}
        >
          <span
            style={{
              background:
                'linear-gradient(135deg, #ffffff 0%, #ffe69a 50%, #d4a050 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Your upgraded self in 90 days
          </span>
        </h3>
      </div>

      {/* ─── Side-by-side: Today | Beam | Day 90 ─── */}
      <div className="relative px-5 pb-4 grid grid-cols-[1fr_120px_1fr] gap-2 items-center">
        {/* Today */}
        <motion.div
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col items-center"
        >
          <TwinSilhouette
            stats={sourceStats}
            state={deriveVisualState(sourceStats, workoutDoneToday)}
            width={90}
            compact
            hologram
          />
          <div
            className="font-mono uppercase tracking-[0.18em] font-bold mt-2"
            style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)' }}
          >
            Today
          </div>
          <div
            className="font-display font-bold tabular-nums"
            style={{ fontSize: 22, color: 'rgba(255,255,255,0.92)' }}
          >
            {todayOverall}
          </div>
          <div
            className="font-mono uppercase tracking-[0.16em]"
            style={{ fontSize: 8, color: 'rgba(255,255,255,0.40)' }}
          >
            Rookie
          </div>
        </motion.div>

        {/* Beam */}
        <TransformationBeam lift={lift} color="#ffd24d" />

        {/* Day 90 */}
        <motion.div
          initial={{ opacity: 0, x: 6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
          className="flex flex-col items-center"
        >
          <TwinSilhouette
            stats={projected}
            state={projectedState}
            width={90}
            compact
            evolution={0.55}
            auraOverride={future.aura}
            hologram
          />
          <div
            className="font-mono uppercase tracking-[0.18em] font-bold mt-2"
            style={{ fontSize: 9, color: '#ffd24d' }}
          >
            Day 90
          </div>
          <div
            className="font-display font-bold tabular-nums"
            style={{
              fontSize: 22,
              color: '#ffd24d',
              textShadow: '0 0 12px rgba(255,210,77,0.45)',
            }}
          >
            {projectedOverall}
          </div>
          <div
            className="font-mono uppercase tracking-[0.16em] font-bold"
            style={{ fontSize: 8, color: '#ff8a4d' }}
          >
            Prime
          </div>
        </motion.div>
      </div>

      {/* ─── Milestone rail ─── */}
      <div className="relative px-5 pb-4">
        <div
          className="font-mono uppercase tracking-[0.18em] font-bold mb-2.5"
          style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}
        >
          Transformation milestones
        </div>
        <MilestoneRail streakDays={streakDays} />
      </div>

      {/* ─── Projected metrics ─── */}
      <div className="relative px-5 pb-4">
        <div
          className="font-mono uppercase tracking-[0.18em] font-bold mb-2"
          style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}
        >
          Projected lift
        </div>
        <ProjectedMetrics deltas={deltas} />
      </div>

      {/* ─── CTA ─── */}
      <Link
        href="/client/future-clone"
        className="relative flex items-center justify-between px-5 py-3.5 border-t font-mono uppercase tracking-[0.20em] font-bold transition-opacity hover:opacity-90"
        style={{
          fontSize: 11,
          color: '#ffd24d',
          borderColor: 'rgba(212,160,80,0.15)',
          backgroundColor: 'rgba(212,160,80,0.04)',
        }}
      >
        Reveal my Day 90 self
        <ArrowRight size={13} />
      </Link>
    </div>
  );
}
