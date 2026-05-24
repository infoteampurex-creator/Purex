'use client';

import Link from 'next/link';
import { ArrowRight, Lock, Sparkles, Ruler } from 'lucide-react';
import { motion } from 'framer-motion';
import { AvatarImage } from './AvatarImage';
import { EmojiStatBars } from './EmojiStatBars';
import { LevelChip } from './LevelChip';
import { StreakChip } from './StreakChip';
import { AiCoachCard } from './AiCoachCard';
import {
  deriveVisualState,
  isTwinEmpty,
  TWIN_PREVIEW_STATS,
  twinOverallScore,
  type TwinStats,
  type TwinVisualState,
} from '@/lib/data/twin';
import {
  TWIN_STATUS_CALIBRATING,
  TWIN_STATUS_GAMIFIED,
  type CoachMission,
  type LevelInfo,
} from '@/lib/data/twin-game';
import type { BodyProportions } from '@/lib/data/body-proportions';
import { avatarFor, bodyTypeLabel } from '@/lib/data/avatar-asset';

interface Props {
  stats: TwinStats;
  state: TwinVisualState;
  message: string;
  level: LevelInfo;
  streakDays: number;
  mission: CoachMission;
  proportions?: BodyProportions | null;
  hasMeasurements: boolean;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
}

/**
 * Twin Clone hero card — Gemini-generated character PNG over
 * holographic ring base + circuit grid, with emoji stat bars and
 * the "LOCKED IN" gamification badge from the user's reference.
 *
 * Avatar swaps automatically as the user's BMI changes (heavy →
 * solid → athletic → lean), giving the "live morph" feeling without
 * any 3D / Three.js / per-pixel rigging cost.
 */
export function TwinDashboardCardApp({
  stats,
  state,
  message,
  level,
  streakDays,
  mission,
  proportions,
  hasMeasurements,
  gender,
}: Props) {
  const isEmpty = isTwinEmpty(stats);
  const showPreview = isEmpty;
  const displayStats = showPreview ? TWIN_PREVIEW_STATS : stats;
  const displayState: TwinVisualState = showPreview
    ? deriveVisualState(TWIN_PREVIEW_STATS, false)
    : state;
  const overall = twinOverallScore(displayStats);

  const statusLabel =
    isEmpty && !showPreview
      ? TWIN_STATUS_CALIBRATING
      : TWIN_STATUS_GAMIFIED[displayState];
  const statusColor = STATUS_COLORS[displayState];

  const cardMission: CoachMission = showPreview
    ? {
        headline: 'Twin is calibrating',
        body: 'This is a preview. Log today to unlock your real readout.',
        tone: 'calibrate',
      }
    : mission ?? { headline: 'Twin is building', body: message, tone: 'build' };

  // Pick the right PNG. Falls back to athletic when no measurements.
  const bodyType = proportions?.bodyType ?? 'athletic';
  const avatarSrc = avatarFor(gender ?? null, bodyType);

  return (
    <div
      className="relative rounded-3xl overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 50% 0%, ${statusColor}1F 0%, transparent 50%),
          linear-gradient(180deg, #0e1417 0%, #0a0c09 100%)
        `,
        border: `1px solid ${statusColor}26`,
        boxShadow:
          `0 0 0 1px ${statusColor}14, 0 24px 48px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      {/* ─── Status strip ─── */}
      <div className="relative px-5 pt-5 pb-2 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold">
            <Sparkles size={11} />
            PureX Twin
          </div>
          <span
            className="inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.20em] font-bold px-2 py-0.5 rounded-full"
            style={{
              fontSize: 9,
              color: statusColor,
              backgroundColor: `${statusColor}1A`,
              border: `1px solid ${statusColor}33`,
            }}
          >
            <motion.span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: statusColor }}
              animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.3, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
            {statusLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <StreakChip days={streakDays} />
          <LevelChip info={level} />
        </div>
      </div>

      {/* ─── Title + Vitality readout ─── */}
      <div className="relative px-5 pb-3 flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display font-semibold text-lg tracking-tight">
            Your live fitness clone
          </h3>
          {hasMeasurements && proportions && (
            <div
              className="font-mono uppercase tracking-[0.18em] font-bold mt-1"
              style={{ fontSize: 9, color: statusColor }}
            >
              {bodyTypeLabel(proportions.bodyType)}
              {proportions.bmi != null && (
                <span style={{ color: 'rgba(255,255,255,0.40)' }}>
                  {' '}· BMI {proportions.bmi.toFixed(1)}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="text-right tabular-nums flex-shrink-0">
          <div
            className="font-display font-bold leading-none"
            style={{ fontSize: 36, color: statusColor }}
          >
            {overall}
          </div>
          <div
            className="font-mono uppercase tracking-[0.18em] text-text-muted font-bold mt-0.5"
            style={{ fontSize: 9 }}
          >
            Vitality
          </div>
        </div>
      </div>

      {/* ─── LOCKED IN badge ─── */}
      <div className="relative px-5 pb-2">
        <LockedInBadge active={!isEmpty} />
      </div>

      {/* ─── Hero zone: avatar large + stat bars beside ─── */}
      <div className="relative px-3 pb-3 grid grid-cols-[1fr_1fr] gap-3 items-end">
        <div className="flex justify-center -ml-2">
          <AvatarImage src={avatarSrc} width={200} accent={statusColor} />
        </div>
        <div className="pb-5">
          <EmojiStatBars stats={displayStats} compact />
        </div>
      </div>

      {/* ─── AI Coach mission ─── */}
      <div className="relative px-5 pb-4">
        <AiCoachCard mission={cardMission} />
      </div>

      {/* ─── Calibration nudge if no measurements yet ─── */}
      {!hasMeasurements && (
        <div className="relative px-5 pb-3">
          <div
            className="rounded-xl px-3 py-2.5 flex items-center gap-2"
            style={{
              background: 'rgba(125,211,255,0.08)',
              border: '1px solid rgba(125,211,255,0.25)',
            }}
          >
            <Ruler size={12} style={{ color: '#7dd3ff' }} />
            <span
              className="font-mono"
              style={{ fontSize: 11, color: 'rgba(125,211,255,0.95)' }}
            >
              Log your measurements — Twin morphs to match your real body.
            </span>
          </div>
        </div>
      )}

      {/* ─── CTA ─── */}
      <Link
        href="/client/twin"
        className="relative flex items-center justify-between px-5 py-3.5 border-t font-mono uppercase tracking-[0.20em] font-bold transition-colors hover:bg-accent/[0.04]"
        style={{
          fontSize: 11,
          color: '#c6ff3d',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        Open Full Twin View
        <ArrowRight size={13} />
      </Link>
    </div>
  );
}

// ─── LOCKED IN badge — matches the gold lock in the reference ────────

function LockedInBadge({ active }: { active: boolean }) {
  const color = active ? '#ffd24d' : '#a0a69a';
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
      style={{
        background: `linear-gradient(135deg, ${color}26 0%, ${color}0F 100%)`,
        border: `1px solid ${color}55`,
        boxShadow: active ? `0 0 12px ${color}33` : undefined,
      }}
    >
      <Lock size={11} style={{ color }} />
      <span
        className="font-mono uppercase tracking-[0.20em] font-bold"
        style={{ fontSize: 10, color }}
      >
        Locked In
      </span>
    </motion.div>
  );
}

const STATUS_COLORS: Record<TwinVisualState, string> = {
  depleted: '#8ea876',
  recovering: '#7dd3ff',
  focused: '#c6ff3d',
  charged: '#ffd24d',
  peak: '#ff8a4d',
  hybrid: '#ffffff',
};
