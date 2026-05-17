'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { TwinSilhouette } from './TwinSilhouette';
import { TwinStatsPanel } from './TwinStatsPanel';
import { TwinStatusBadge } from './TwinStatusBadge';
import { AnimatedNumber } from './AnimatedNumber';
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
  /** Optional initial stage. Defaults to '30d'. */
  initialStage?: FutureStageKey;
}

/**
 * PureX Future Clone — interactive timeline projection.
 *
 * Drag the slider (or click any stage marker) — silhouette evolves,
 * vitality counts up/down via spring animation, aura colours
 * crossfade, athlete-level label updates. The silhouette posture +
 * shoulder width + stance widens with each stage so the *body
 * itself* visibly evolves, not just the colour palette.
 */
export function FutureCloneViewer({
  todayStats,
  workoutDoneToday,
  initialStage = '30d',
}: Props) {
  const initialIndex = Math.max(
    0,
    FUTURE_STAGES.findIndex((s) => s.key === initialStage)
  );
  const [stageIndex, setStageIndex] = useState(initialIndex);
  const activeStage = FUTURE_STAGES[stageIndex];

  const projectedStats = useMemo(
    () => projectStats(todayStats, activeStage),
    [todayStats, activeStage]
  );
  const projectedState = useMemo(
    () => deriveVisualState(projectedStats, workoutDoneToday),
    [projectedStats, workoutDoneToday]
  );
  const projectedOverall = twinOverallScore(projectedStats);

  // evolution: 0 at today, 1 at 1yr
  const evolution = stageIndex / (FUTURE_STAGES.length - 1);

  return (
    <div className="space-y-8 md:space-y-10">
      {/* ─── Slider ─── */}
      <StageSlider
        stageIndex={stageIndex}
        onChange={setStageIndex}
      />

      {/* ─── Silhouette + projected stats grid ─── */}
      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 md:gap-12 items-start">
        {/* Silhouette panel */}
        <div className="rounded-3xl border border-border bg-bg-card/60 backdrop-blur-sm p-6 md:p-8">
          <div className="flex flex-col items-center">
            <TwinSilhouette
              stats={projectedStats}
              state={projectedState}
              width={280}
              evolution={evolution}
              auraOverride={activeStage.aura}
            />

            {/* Vitality + status — number animates with spring */}
            <div className="mt-6 text-center">
              <AnimatedNumber
                value={projectedOverall}
                color={activeStage.aura}
                fontSize={72}
              />
              <div
                className="font-mono uppercase tracking-[0.22em] font-bold mt-1"
                style={{ fontSize: 11, color: activeStage.aura }}
              >
                Projected vitality
              </div>
              <div className="mt-3 flex justify-center">
                <TwinStatusBadge state={projectedState} />
              </div>
            </div>

            {/* Stage description card (crossfades on change) */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStage.key}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35 }}
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
              </motion.div>
            </AnimatePresence>
          </div>
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

// ─── Slider component ────────────────────────────────────────────

function StageSlider({
  stageIndex,
  onChange,
}: {
  stageIndex: number;
  onChange: (i: number) => void;
}) {
  const activeStage = FUTURE_STAGES[stageIndex];
  const progressPct = (stageIndex / (FUTURE_STAGES.length - 1)) * 100;

  return (
    <div className="rounded-3xl border border-border bg-bg-card/60 p-5 md:p-7">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted font-bold">
          <Sparkles size={11} className="text-accent" />
          Timeline
          <span className="text-text-dim">·</span>
          <span className="text-text">Drag the slider</span>
        </div>
        <div
          className="font-mono uppercase tracking-[0.18em] font-bold"
          style={{ fontSize: 11, color: activeStage.aura }}
        >
          {activeStage.label}
        </div>
      </div>

      <div className="relative pt-1 pb-2">
        {/* Track */}
        <div className="absolute left-2 right-2 top-1/2 h-px bg-border-soft -translate-y-1/2" />
        {/* Progress fill */}
        <motion.div
          className="absolute left-2 top-1/2 h-px -translate-y-1/2"
          style={{
            background: activeStage.aura,
            boxShadow: `0 0 10px ${activeStage.aura}90`,
            width: `calc(${progressPct}% - 8px * ${progressPct / 100} * 2)`,
          }}
          animate={{
            width: `calc(${progressPct}% - 8px * ${progressPct / 100} * 2)`,
          }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />

        {/* Native range input — accessible + drag + keyboard */}
        <input
          type="range"
          min={0}
          max={FUTURE_STAGES.length - 1}
          step={1}
          value={stageIndex}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          aria-label="Projection timeline"
          className="future-clone-slider"
          style={{
            width: '100%',
            height: 32,
            background: 'transparent',
            appearance: 'none',
            WebkitAppearance: 'none',
            cursor: 'pointer',
            position: 'relative',
            zIndex: 2,
          }}
        />

        {/* Stage markers (visual only — actual interaction is on the range) */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 pointer-events-none">
          <div className="relative grid grid-cols-5">
            {FUTURE_STAGES.map((stage, i) => {
              const isActive = i === stageIndex;
              const isPast = i <= stageIndex;
              return (
                <div key={stage.key} className="flex justify-center">
                  <motion.span
                    aria-hidden
                    className="block rounded-full border-2"
                    style={{
                      width: isActive ? 18 : 10,
                      height: isActive ? 18 : 10,
                      background: isPast ? stage.aura : '#0a0c09',
                      borderColor: isPast ? stage.aura : '#3a4438',
                      boxShadow: isActive
                        ? `0 0 16px ${stage.aura}`
                        : isPast
                          ? `0 0 6px ${stage.aura}`
                          : 'none',
                    }}
                    animate={{ scale: isActive ? [1, 1.12, 1] : 1 }}
                    transition={{
                      duration: 2,
                      repeat: isActive ? Infinity : 0,
                      ease: 'easeInOut',
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stage labels under the track */}
      <div className="grid grid-cols-5 mt-3">
        {FUTURE_STAGES.map((stage, i) => {
          const isActive = i === stageIndex;
          const isPast = i <= stageIndex;
          return (
            <button
              key={stage.key}
              type="button"
              onClick={() => onChange(i)}
              className="flex flex-col items-center group"
            >
              <span
                className="font-mono uppercase tracking-[0.14em] font-bold transition-colors"
                style={{
                  fontSize: 10,
                  color: isActive ? stage.aura : isPast ? '#a0a69a' : '#5a6055',
                }}
              >
                {stage.label}
              </span>
              <span className="text-[9px] font-mono text-text-dim mt-0.5">
                {stage.daysOut === 0 ? 'baseline' : `+${stage.daysOut}d`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Inline range slider styles — premium thumb */}
      <style>{`
        .future-clone-slider {
          outline: none;
        }
        .future-clone-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: ${activeStage.aura};
          border: 3px solid #0a0c09;
          box-shadow: 0 0 18px ${activeStage.aura}aa;
          cursor: grab;
          transition: transform 0.15s ease;
        }
        .future-clone-slider::-webkit-slider-thumb:active {
          cursor: grabbing;
          transform: scale(1.15);
        }
        .future-clone-slider::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: ${activeStage.aura};
          border: 3px solid #0a0c09;
          box-shadow: 0 0 18px ${activeStage.aura}aa;
          cursor: grab;
          transition: transform 0.15s ease;
        }
        .future-clone-slider::-moz-range-thumb:active {
          cursor: grabbing;
          transform: scale(1.15);
        }
        .future-clone-slider::-webkit-slider-runnable-track {
          height: 32px;
          background: transparent;
        }
        .future-clone-slider::-moz-range-track {
          height: 32px;
          background: transparent;
        }
        .future-clone-slider:focus-visible::-webkit-slider-thumb {
          outline: 2px solid ${activeStage.aura};
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
