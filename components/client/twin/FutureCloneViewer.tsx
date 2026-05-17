'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { TwinSilhouette } from './TwinSilhouette';
import { TwinStatsPanel } from './TwinStatsPanel';
import {
  deriveVisualState,
  projectStats,
  twinOverallScore,
  FUTURE_STAGES,
  FUTURE_CLONE_DISCLAIMER,
  type FutureStageKey,
  type TwinStats,
} from '@/lib/data/twin';

interface Props {
  /** Today's actual Twin stats (used as the projection baseline). */
  todayStats: TwinStats;
  /** Did the user complete a workout today? Drives Twin visual state. */
  workoutDoneToday: boolean;
  /** Optional initial stage. Defaults to '30d' (one month out — the
   *  most motivational view for someone just starting). */
  initialStage?: FutureStageKey;
}

/**
 * PureX Future Clone — interactive timeline projection.
 *
 * Renders the same silhouette as PureX Twin but progressively boosted
 * across 5 stages: Today → 30d → 90d → 6mo → 1yr. The user taps any
 * stage on the timeline and the silhouette + stats + colours cross-
 * fade with framer-motion's AnimatePresence.
 *
 * The projection is a deliberate over-simplification — a small
 * multiplier on each stat per stage — so it stays motivational
 * without making medical claims.
 */
export function FutureCloneViewer({
  todayStats,
  workoutDoneToday,
  initialStage = '30d',
}: Props) {
  const [activeKey, setActiveKey] = useState<FutureStageKey>(initialStage);

  const activeStage = FUTURE_STAGES.find((s) => s.key === activeKey)!;

  const projectedStats = useMemo(
    () => projectStats(todayStats, activeStage),
    [todayStats, activeStage]
  );
  const projectedState = useMemo(
    () => deriveVisualState(projectedStats, workoutDoneToday),
    [projectedStats, workoutDoneToday]
  );
  const projectedOverall = twinOverallScore(projectedStats);

  // Future boost (0..1) — used to brighten the aura + lift posture.
  const futureBoost = (activeStage.projectionMultiplier - 1) / 1; // 0..1 across stages

  return (
    <div className="space-y-8 md:space-y-10">
      {/* ─── Stage timeline ─── */}
      <Timeline activeKey={activeKey} onSelect={setActiveKey} />

      {/* ─── Silhouette + projected stats grid ─── */}
      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 md:gap-12 items-start">
        {/* Silhouette panel */}
        <div className="rounded-3xl border border-border bg-bg-card/60 backdrop-blur-sm p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeKey}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="flex flex-col items-center"
            >
              <TwinSilhouette
                stats={projectedStats}
                state={projectedState}
                width={280}
                futureBoost={futureBoost}
                auraOverride={activeStage.aura}
              />

              <div className="mt-6 text-center">
                <div
                  className="font-display font-bold leading-none"
                  style={{ fontSize: 72, color: activeStage.aura }}
                >
                  {projectedOverall}
                </div>
                <div
                  className="font-mono uppercase tracking-[0.22em] font-bold mt-1"
                  style={{ fontSize: 11, color: activeStage.aura }}
                >
                  Projected vitality
                </div>
              </div>

              <div
                className="mt-6 px-4 py-3 rounded-xl max-w-sm border"
                style={{
                  background: `${activeStage.aura}10`,
                  borderColor: `${activeStage.aura}30`,
                }}
              >
                <div
                  className="font-mono text-[10px] uppercase tracking-[0.18em] font-bold mb-1"
                  style={{ color: activeStage.aura }}
                >
                  {activeStage.athleteLevel}
                </div>
                <p
                  className="text-text leading-relaxed"
                  style={{ fontSize: 14 }}
                >
                  {activeStage.description}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Stats panel */}
        <div className="rounded-3xl border border-border bg-bg-card p-6 md:p-8">
          <div className="flex items-baseline justify-between mb-5">
            <div>
              <h2 className="font-display font-semibold text-xl tracking-tight">
                The shift
              </h2>
              <p className="text-text-muted mt-1" style={{ fontSize: 14 }}>
                Today &rarr; {activeStage.label}
              </p>
            </div>
            <div className="text-right tabular-nums">
              <div
                className="font-display font-bold leading-none"
                style={{ fontSize: 22, color: activeStage.aura }}
              >
                +{Math.round((activeStage.projectionMultiplier - 1) * 100)}%
              </div>
              <div className="font-mono uppercase tracking-[0.16em] text-text-muted font-bold mt-1" style={{ fontSize: 9 }}>
                Average lift
              </div>
            </div>
          </div>

          <TwinStatsPanel stats={todayStats} projected={projectedStats} />

          <div className="mt-6 pt-5 border-t border-border-soft text-[11px] text-text-dim leading-relaxed">
            {FUTURE_CLONE_DISCLAIMER}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Timeline component ───────────────────────────────────────────

function Timeline({
  activeKey,
  onSelect,
}: {
  activeKey: FutureStageKey;
  onSelect: (k: FutureStageKey) => void;
}) {
  const activeIndex = FUTURE_STAGES.findIndex((s) => s.key === activeKey);
  const progressPct = (activeIndex / (FUTURE_STAGES.length - 1)) * 100;

  return (
    <div className="rounded-3xl border border-border bg-bg-card/60 p-5 md:p-7">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted font-bold mb-4">
        <Sparkles size={11} className="text-accent" />
        Timeline
        <span className="text-text-dim">·</span>
        <span className="text-text">Tap a stage</span>
      </div>

      {/* Track */}
      <div className="relative pt-3 pb-1">
        {/* Base line */}
        <div className="absolute left-0 right-0 top-1/2 h-px bg-border-soft -translate-y-1/2" />
        {/* Progress fill */}
        <motion.div
          className="absolute left-0 top-1/2 h-px bg-accent -translate-y-1/2"
          style={{ boxShadow: '0 0 8px rgba(198, 255, 61, 0.6)' }}
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />

        {/* Nodes */}
        <div className="relative grid grid-cols-5">
          {FUTURE_STAGES.map((stage, i) => {
            const isActive = stage.key === activeKey;
            const isPast = i <= activeIndex;
            return (
              <button
                key={stage.key}
                type="button"
                onClick={() => onSelect(stage.key)}
                className="group flex flex-col items-center justify-start py-1 relative"
              >
                {/* Node */}
                <motion.span
                  aria-hidden
                  className="block rounded-full border-2"
                  style={{
                    width: isActive ? 18 : 12,
                    height: isActive ? 18 : 12,
                    background: isPast ? stage.aura : 'transparent',
                    borderColor: isPast ? stage.aura : '#3a4438',
                    boxShadow: isActive
                      ? `0 0 16px ${stage.aura}`
                      : isPast
                        ? `0 0 6px ${stage.aura}`
                        : 'none',
                  }}
                  animate={{ scale: isActive ? [1, 1.15, 1] : 1 }}
                  transition={{
                    duration: 2,
                    repeat: isActive ? Infinity : 0,
                    ease: 'easeInOut',
                  }}
                />
                {/* Label */}
                <span
                  className="font-mono uppercase tracking-[0.14em] font-bold mt-3 transition-colors"
                  style={{
                    fontSize: 10,
                    color: isActive ? stage.aura : isPast ? '#a0a69a' : '#5a6055',
                  }}
                >
                  {stage.label}
                </span>
                {/* Days */}
                <span
                  className="text-[9px] font-mono text-text-dim mt-0.5 transition-colors group-hover:text-text-muted"
                >
                  {stage.daysOut === 0 ? 'baseline' : `+${stage.daysOut}d`}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
