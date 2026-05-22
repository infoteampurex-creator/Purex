'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
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
import { useIsApp } from '@/lib/hooks/useIsApp';

interface Props {
  stats: TwinStats;
  state: TwinVisualState;
  /** Free-form coach message — used only when `mission` isn't passed. */
  message: string;
  /** Gamification overlays — required on the new app dashboard. */
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
 * Twin Clone hero card — the redesigned holographic AI body twin.
 *
 * Layout (top→bottom):
 *   • Status strip: title + LIVE/CALIBRATING badge + Level + Streak
 *   • Hero zone: vitality score (huge) + holographic silhouette centered
 *   • Stat radials: 5 circular meters in a row beneath
 *   • AI Coach mission card
 *   • CTA: "Analyze my Twin"
 *
 * In the app, an empty-stats account swaps in TWIN_PREVIEW_STATS so
 * the silhouette renders with aura/breathing/zones, and the status
 * shows "CALIBRATING".
 */
export function TwinDashboardCard({
  stats,
  state,
  message,
  level,
  streakDays,
  mission,
}: Props) {
  const isApp = useIsApp();
  const isEmpty = isTwinEmpty(stats);
  const showPreview = isApp && isEmpty;

  const displayStats = showPreview ? TWIN_PREVIEW_STATS : stats;
  const displayState: TwinVisualState = showPreview
    ? deriveVisualState(TWIN_PREVIEW_STATS, false)
    : state;
  const overall = twinOverallScore(displayStats);

  // Status label — "CALIBRATING" when we have literally no data, else
  // a gamified state name. Falls back to message when no mission set.
  const statusLabel =
    isEmpty && !showPreview
      ? TWIN_STATUS_CALIBRATING
      : TWIN_STATUS_GAMIFIED[displayState];

  // Mission card content — show the generated mission, but in the
  // showPreview case override with a "waking your Twin" prompt so the
  // copy matches the synthetic stats.
  const cardMission: CoachMission = showPreview
    ? {
        headline: 'Twin is calibrating',
        body: 'This is a preview of your Twin. Log today to unlock your real readout.',
        tone: 'calibrate',
      }
    : mission ?? {
        headline: 'Twin is building',
        body: message,
        tone: 'build',
      };

  // Status accent colour — picks from the brand palette by state.
  const statusColor = STATUS_COLORS[displayState];

  return (
    <div
      className="relative rounded-3xl overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 50% -20%, rgba(198,255,61,0.10) 0%, transparent 55%),
          linear-gradient(180deg, #10130f 0%, #0a0c09 100%)
        `,
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow:
          '0 0 0 1px rgba(198,255,61,0.04), 0 24px 48px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Ambient corner glow */}
      <div
        className="absolute -top-24 -left-24 w-64 h-64 rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(198,255,61,0.14), transparent 65%)',
          filter: 'blur(8px)',
        }}
      />

      {/* ─── Status strip ─── */}
      <div className="relative px-5 pt-5 pb-2 flex items-center justify-between gap-3 flex-wrap">
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

      {/* ─── Hero zone: silhouette + vitality ─── */}
      <div className="relative px-5 pt-2 pb-3 grid grid-cols-[1fr_auto] items-center gap-3">
        {/* Silhouette */}
        <div className="flex justify-center -my-4">
          <TwinSilhouette
            stats={displayStats}
            state={displayState}
            width={170}
            hologram
          />
        </div>
        {/* Vitality readout */}
        <div className="text-right tabular-nums">
          <AnimatedNumber value={overall} fontSize={42} />
          <div
            className="font-mono uppercase tracking-[0.18em] text-text-muted font-bold mt-1"
            style={{ fontSize: 9 }}
          >
            Vitality
          </div>
          <div
            className="font-mono uppercase tracking-[0.14em] mt-3"
            style={{ fontSize: 8, color: 'rgba(255,255,255,0.40)' }}
          >
            Body battery
          </div>
          <div
            className="font-display font-bold tabular-nums leading-none mt-1"
            style={{ fontSize: 18, color: statusColor }}
          >
            {Math.round((displayStats.energy + displayStats.recovery) / 2)}%
          </div>
        </div>
      </div>

      {/* ─── Stat radials ─── */}
      <div className="px-3 pb-4">
        <div className="grid grid-cols-5 gap-1">
          {STAT_ORDER.map((key) => (
            <div key={key} className="flex justify-center">
              <StatRadial
                value={displayStats[key]}
                color={TWIN_STAT_META[key].color}
                label={TWIN_STAT_META[key].label}
                size={56}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ─── AI Coach mission ─── */}
      <div className="px-5 pb-4">
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
