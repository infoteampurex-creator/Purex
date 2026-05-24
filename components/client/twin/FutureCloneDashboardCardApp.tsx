'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { AvatarImage } from './AvatarImage';
import { MilestoneRail } from './MilestoneRail';
import { ProjectedMetrics } from './ProjectedMetrics';
import {
  isTwinEmpty,
  projectStats,
  twinOverallScore,
  FUTURE_STAGES,
  TWIN_PREVIEW_STATS,
  type TwinStats,
} from '@/lib/data/twin';
import { deriveProjectedDeltas } from '@/lib/data/twin-game';
import type { BodyProportions } from '@/lib/data/body-proportions';
import {
  avatarFor,
  projectedAvatarFor,
  bodyTypeLabel,
} from '@/lib/data/avatar-asset';
import type { Gender } from '@/lib/data/body-measurements';

interface Props {
  stats: TwinStats;
  workoutDoneToday: boolean;
  streakDays: number;
  proportions?: BodyProportions | null;
  hasMeasurements: boolean;
  gender?: Gender | null;
}

/**
 * Future Clone — your current avatar PNG vs your projected Day-90
 * avatar PNG (one body-type tier slimmer). Orange "+lift" arrow
 * between them, matching the user's reference design.
 */
export function FutureCloneDashboardCardApp({
  stats,
  workoutDoneToday: _workoutDoneToday,
  streakDays,
  proportions,
  hasMeasurements: _hasMeasurements,
  gender,
}: Props) {
  const showPreview = isTwinEmpty(stats);
  const sourceStats = showPreview ? TWIN_PREVIEW_STATS : stats;

  const future = FUTURE_STAGES.find((s) => s.key === '90d')!;
  const projected = projectStats(sourceStats, future);
  const projectedOverall = twinOverallScore(projected);
  const todayOverall = twinOverallScore(sourceStats);
  const lift = Math.max(0, projectedOverall - todayOverall);

  const deltas = deriveProjectedDeltas(sourceStats, projected);

  // Pick today's and projected avatars (photorealistic PNG).
  const todayBodyType = proportions?.bodyType ?? 'athletic';
  const todayAvatar = avatarFor(gender ?? null, todayBodyType);
  const projectedAvatar = projectedAvatarFor(gender ?? null, todayBodyType);

  return (
    <div
      className="relative rounded-3xl overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 50% 0%, rgba(255,210,77,0.18) 0%, transparent 55%),
          linear-gradient(180deg, #15110a 0%, #0a0c09 100%)
        `,
        border: '1px solid rgba(212,160,80,0.30)',
        boxShadow:
          '0 0 0 1px rgba(212,160,80,0.18), 0 24px 48px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
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
          {showPreview && (
            <span
              className="font-mono uppercase tracking-[0.18em] px-1.5 py-0.5 rounded"
              style={{
                fontSize: 9,
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
            Your future transformation projection
          </span>
        </h3>
      </div>

      {/* ─── Hero: Today avatar ⟶ +lift arrow ⟶ Day 90 avatar ─── */}
      <div className="relative px-3 pb-3 grid grid-cols-[1fr_auto_1fr] items-end gap-1">
        <motion.div
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col items-center"
        >
          <AvatarImage src={todayAvatar} width={150} accent="#7dd3ff" />
          <div
            className="font-mono uppercase tracking-[0.18em] font-bold mt-2"
            style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)' }}
          >
            Today
          </div>
          <div
            className="font-mono uppercase tracking-[0.14em]"
            style={{ fontSize: 8, color: 'rgba(255,255,255,0.40)' }}
          >
            {bodyTypeLabel(todayBodyType)}
          </div>
        </motion.div>

        {/* Arrow + lift indicator */}
        <div className="flex flex-col items-center justify-center pb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
            className="rounded-full px-3 py-1 mb-2"
            style={{
              background: 'linear-gradient(135deg, #ff8a4d 0%, #ffd24d 100%)',
              boxShadow: '0 0 16px rgba(255,138,77,0.45)',
            }}
          >
            <span
              className="font-display font-bold tabular-nums"
              style={{ fontSize: 14, color: '#0a0c09' }}
            >
              +{lift}
            </span>
          </motion.div>
          <motion.div
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            style={{ color: '#ff8a4d', filter: 'drop-shadow(0 0 6px #ff8a4d)' }}
          >
            <ArrowRight size={28} strokeWidth={2.5} />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
          className="flex flex-col items-center"
        >
          <AvatarImage src={projectedAvatar} width={150} accent="#ffd24d" glow />
          <div
            className="font-mono uppercase tracking-[0.18em] font-bold mt-2"
            style={{ fontSize: 9, color: '#ffd24d' }}
          >
            Day 90
          </div>
          <div
            className="font-mono uppercase tracking-[0.14em] font-bold"
            style={{ fontSize: 8, color: '#ff8a4d' }}
          >
            Prime
          </div>
        </motion.div>
      </div>

      {/* ─── Today vs Day 90 vitality scores ─── */}
      <div className="relative px-5 pb-3 flex items-center justify-between">
        <div className="text-center flex-1">
          <div
            className="font-display font-bold tabular-nums leading-none"
            style={{ fontSize: 20, color: 'rgba(245,245,240,0.92)' }}
          >
            {todayOverall}
          </div>
          <div
            className="font-mono uppercase tracking-[0.14em]"
            style={{ fontSize: 8, color: 'rgba(255,255,255,0.40)' }}
          >
            Vitality
          </div>
        </div>
        <div className="text-center flex-1">
          <div
            className="font-display font-bold tabular-nums leading-none"
            style={{
              fontSize: 20,
              color: '#ffd24d',
              textShadow: '0 0 12px rgba(255,210,77,0.45)',
            }}
          >
            {projectedOverall}
          </div>
          <div
            className="font-mono uppercase tracking-[0.14em] font-bold"
            style={{ fontSize: 8, color: '#ffd24d' }}
          >
            Projected
          </div>
        </div>
      </div>

      {/* ─── Milestone rail ─── */}
      <div className="relative px-5 pb-4">
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
