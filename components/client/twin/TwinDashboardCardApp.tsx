'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles, Ruler } from 'lucide-react';
import { motion } from 'framer-motion';
import { TwinSilhouette } from './TwinSilhouette';
import { AnimatedNumber } from './AnimatedNumber';
import { StatRadial } from './StatRadial';
import { LevelChip } from './LevelChip';
import { StreakChip } from './StreakChip';
import { AiCoachCard } from './AiCoachCard';
import {
  deriveVisualState,
  isTwinEmpty,
  TWIN_PREVIEW_STATS,
  TWIN_STAT_META,
  twinOverallScore,
  type TwinStats,
  type TwinStatKey,
  type TwinVisualState,
} from '@/lib/data/twin';
import {
  TWIN_STATUS_CALIBRATING,
  TWIN_STATUS_GAMIFIED,
  type CoachMission,
  type LevelInfo,
} from '@/lib/data/twin-game';
import type { BodyProportions } from '@/lib/data/body-proportions';

interface Props {
  stats: TwinStats;
  state: TwinVisualState;
  message: string;
  level: LevelInfo;
  streakDays: number;
  mission: CoachMission;
  /** Live measurement-driven body shape (Phase 2). When null, the
   *  silhouette falls back to a neutral athletic shape. */
  proportions?: BodyProportions | null;
  /** True if the user has logged at least one body measurement.
   *  Used to show a calibration hint. */
  hasMeasurements: boolean;
}

const STAT_ORDER: TwinStatKey[] = [
  'energy',
  'strength',
  'endurance',
  'recovery',
  'discipline',
];

/**
 * Twin Clone hero card — silhouette as live avatar, vitality + stats
 * + AI Coach as supporting chrome.
 *
 * The silhouette's torso, leg, and neck widths morph based on the
 * user's logged body measurements (chest, waist, hips, thighs,
 * neck — Phase 2). When the user hasn't logged measurements yet,
 * the silhouette uses the neutral athletic shape with a small
 * "Log measurements to wake your Twin" hint.
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

  return (
    <div
      className="relative rounded-3xl overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 50% -20%, ${statusColor}1A 0%, transparent 55%),
          linear-gradient(180deg, #10130f 0%, #0a0c09 100%)
        `,
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow:
          '0 0 0 1px rgba(198,255,61,0.04), 0 24px 48px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Ambient glow behind the silhouette */}
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${statusColor}26, transparent 65%)`,
          filter: 'blur(20px)',
        }}
      />

      {/* ─── Status strip ─── */}
      <div className="relative px-5 pt-5 pb-3 flex items-center justify-between gap-3 flex-wrap">
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
          {showPreview && (
            <span
              className="font-mono uppercase tracking-[0.18em] px-1.5 py-0.5 rounded"
              style={{
                fontSize: 8,
                color: '#c6ff3d',
                backgroundColor: 'rgba(198,255,61,0.12)',
              }}
            >
              Preview
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <StreakChip days={streakDays} />
          <LevelChip info={level} />
        </div>
      </div>

      {/* ─── Hero: measurement-driven silhouette + Vitality below ─── */}
      <div className="relative flex flex-col items-center pt-2 pb-3">
        <TwinSilhouette
          stats={displayStats}
          state={displayState}
          width={180}
          hologram
          proportions={proportions ?? undefined}
        />
        <div className="flex items-baseline gap-2 mt-1">
          <AnimatedNumber value={overall} fontSize={36} />
          <span
            className="font-mono uppercase tracking-[0.22em] font-bold"
            style={{ fontSize: 10, color: 'rgba(245,245,240,0.55)' }}
          >
            Vitality
          </span>
        </div>

        {/* Body-type subtitle when proportions are known */}
        {proportions && hasMeasurements && (
          <div
            className="font-mono uppercase tracking-[0.18em] font-bold mt-1"
            style={{ fontSize: 9, color: statusColor }}
          >
            {proportions.bodyType} build
            {proportions.bmi != null && (
              <span style={{ color: 'rgba(245,245,240,0.40)' }}>
                {' '}· BMI {proportions.bmi.toFixed(1)}
              </span>
            )}
          </div>
        )}

        {/* Calibration nudge when no measurements logged yet */}
        {!hasMeasurements && (
          <Link
            href="#my-body"
            scroll={false}
            className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{
              fontSize: 10,
              color: '#7dd3ff',
              backgroundColor: 'rgba(125,211,255,0.10)',
              border: '1px solid rgba(125,211,255,0.25)',
            }}
          >
            <Ruler size={10} />
            <span className="font-mono uppercase tracking-[0.18em] font-bold">
              Log measurements
            </span>
          </Link>
        )}
      </div>

      {/* ─── 5 stat radials ─── */}
      <div className="relative px-3 pb-4">
        <div className="grid grid-cols-5 gap-1">
          {STAT_ORDER.map((key) => (
            <div key={key} className="flex justify-center">
              <StatRadial
                value={displayStats[key]}
                color={TWIN_STAT_META[key].color}
                label={TWIN_STAT_META[key].label}
                size={52}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ─── AI Coach ─── */}
      <div className="relative px-5 pb-4">
        <AiCoachCard mission={cardMission} />
      </div>

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
        Analyze my Twin
        <ArrowRight size={13} />
      </Link>
    </div>
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
