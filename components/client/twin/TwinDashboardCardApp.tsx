'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
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

interface Props {
  stats: TwinStats;
  state: TwinVisualState;
  message: string;
  level: LevelInfo;
  streakDays: number;
  mission: CoachMission;
}

const STAT_ORDER: TwinStatKey[] = [
  'energy',
  'strength',
  'endurance',
  'recovery',
  'discipline',
];

/**
 * Twin Clone hero card — Apple-Watch / Whoop style.
 *
 * Layout (top→bottom):
 *   • Status strip: title + state badge + Streak + Level chips
 *   • Hero zone: giant Vitality score inside a thick glowing ring,
 *     state-colour tinted
 *   • 5 stat radials in a row beneath (one per Energy / Strength /
 *     Endurance / Recovery / Discipline)
 *   • AI Coach mission card
 *   • CTA: "Analyze my Twin"
 *
 * Deliberately NO human silhouette — premium fitness apps (Whoop,
 * Oura, Apple Watch, Garmin) use rings + scores, not body shapes.
 */
export function TwinDashboardCardApp({
  stats,
  state,
  message,
  level,
  streakDays,
  mission,
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
      {/* Ambient glow */}
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

      {/* ─── Hero: Vitality ring ─── */}
      <div className="relative flex flex-col items-center pt-2 pb-4">
        <VitalityRing value={overall} color={statusColor} />
        <div
          className="font-mono uppercase tracking-[0.22em] font-bold mt-3"
          style={{ fontSize: 10, color: 'rgba(245,245,240,0.55)' }}
        >
          Vitality
        </div>
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

// ─── Vitality ring — the centerpiece ────────────────────────────────

function VitalityRing({ value, color }: { value: number; color: string }) {
  const size = 180;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = c - (c * clamped) / 100;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={`vit-grad-${color.replace('#', '')}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={1} />
            <stop offset="100%" stopColor={color} stopOpacity={0.55} />
          </linearGradient>
          <filter id="vit-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        {/* Glow under the arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke + 4}
          strokeOpacity={0.20}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ filter: 'url(#vit-glow)' }}
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#vit-grad-${color.replace('#', '')})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>

      {/* Centre number */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatedNumber value={value} fontSize={56} />
      </div>
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
