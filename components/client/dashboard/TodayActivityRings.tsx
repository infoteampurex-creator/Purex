'use client';

import { motion } from 'framer-motion';
import { Footprints, Apple, Moon, Droplets } from 'lucide-react';
import type { DailyInputs, NutritionSnapshot } from '@/lib/data/twin';
import type { RingHistory } from '@/lib/data/twin-server';
import { Sparkline } from '@/components/client/Sparkline';

interface Props {
  inputs: DailyInputs;
  nutrition: NutritionSnapshot;
  /** Called when the user taps a ring — opens the unified log sheet
   *  scoped to that metric. */
  onLogTap: (target: 'steps' | 'meal' | 'sleep' | 'water') => void;
  /** 7-day per-metric history for the sparkline under each ring.
   *  Optional — when omitted the rings render without sparklines
   *  (e.g. anonymous / preview contexts). */
  history?: RingHistory | null;
}

/**
 * Google-Fit-inspired 3-ring strip that lives directly under the
 * Whoop-style PureX Score hero. Each ring shows progress vs the
 * day's goal; tap opens the matching quick-log surface.
 *
 * Four rings (Move / Fuel / Sleep / Water) wrap into 2 + 2 on
 * narrow phones for thumb reachability — easier than concentric
 * Apple Fitness rings on small screens.
 */
export function TodayActivityRings({
  inputs,
  nutrition,
  onLogTap,
  history,
}: Props) {
  // Preview mode: when nothing's been logged yet today, substitute
  // realistic sample values so the ring tiles read as "alive" instead
  // of a row of 0%. Same "Preview" chip pattern the Score hero and
  // Nutrition page already use. Flips back to real data the moment
  // the user logs anything.
  const noneLogged =
    inputs.steps === 0 &&
    inputs.sleepMinutes === 0 &&
    inputs.waterMl === 0 &&
    nutrition.caloriesConsumed === 0;

  const view = noneLogged
    ? {
        steps: 8400,
        stepsGoal: inputs.stepsGoal || 10000,
        cals: 1420,
        calsGoal: nutrition.caloriesTarget || 2000,
        sleep: 7 * 60 + 15, // 7h 15m
        sleepGoal: inputs.sleepGoalMinutes || 8 * 60,
        water: 1500,
        waterGoal: inputs.waterGoalMl || 2000,
      }
    : {
        steps: inputs.steps,
        stepsGoal: inputs.stepsGoal,
        cals: nutrition.caloriesConsumed,
        calsGoal: nutrition.caloriesTarget,
        sleep: inputs.sleepMinutes,
        sleepGoal: inputs.sleepGoalMinutes,
        water: inputs.waterMl,
        waterGoal: inputs.waterGoalMl,
      };

  const stepsPct = pct(view.steps, view.stepsGoal);
  const fuelPct = view.calsGoal ? pct(view.cals, view.calsGoal) : 0;
  const sleepPct = pct(view.sleep, view.sleepGoal);
  const waterPct = pct(view.water, view.waterGoal);

  // Sparkline data — only rendered when the user actually has some
  // logged history. If every value is 0 (fresh account) the sparkline
  // would be a flat line at the bottom which reads as noise, so we
  // hide it entirely and let the ring itself carry the visual.
  const showSpark = (arr: number[] | undefined): number[] | null => {
    if (!arr || arr.length < 2) return null;
    if (arr.every((v) => v === 0)) return null;
    return arr;
  };

  const rings = [
    {
      key: 'move' as const,
      target: 'steps' as const,
      icon: <Footprints size={14} />,
      label: 'Move',
      value: formatSteps(view.steps),
      goal: `/ ${formatSteps(view.stepsGoal)}`,
      pct: stepsPct,
      color: '#c6ff3d',
      spark: showSpark(history?.steps),
    },
    {
      key: 'fuel' as const,
      target: 'meal' as const,
      icon: <Apple size={14} />,
      label: 'Fuel',
      value: view.cals.toLocaleString(),
      goal: `/ ${view.calsGoal.toLocaleString()}`,
      pct: fuelPct,
      color: '#ff8a4d',
      spark: showSpark(history?.cals),
    },
    {
      key: 'sleep' as const,
      target: 'sleep' as const,
      icon: <Moon size={14} />,
      label: 'Sleep',
      value: formatSleep(view.sleep),
      goal: `/ ${formatSleep(view.sleepGoal)}`,
      pct: sleepPct,
      color: '#a78bfa',
      spark: showSpark(history?.sleepMinutes),
    },
    {
      key: 'water' as const,
      target: 'water' as const,
      icon: <Droplets size={14} />,
      label: 'Water',
      value: formatWater(view.water),
      goal: `/ ${formatWater(view.waterGoal)}`,
      pct: waterPct,
      color: '#7dd3ff',
      spark: showSpark(history?.waterMl),
    },
  ];

  return (
    <div>
      {noneLogged && (
        <div className="flex items-center justify-end mb-2">
          <span
            className="font-mono uppercase tracking-[0.16em] font-bold px-2 py-0.5 rounded-full"
            style={{
              fontSize: 9,
              color: '#ffd24d',
              background: 'rgba(255,210,77,0.10)',
              border: '1px solid rgba(255,210,77,0.32)',
            }}
          >
            Sample · tap to log real
          </span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {rings.map((r, i) => (
          <RingTile
            key={r.key}
            icon={r.icon}
            label={r.label}
            value={r.value}
            goal={r.goal}
            pct={r.pct}
            color={r.color}
            delay={0.05 + i * 0.06}
            onTap={() => onLogTap(r.target)}
            spark={r.spark}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

function RingTile({
  icon,
  label,
  value,
  goal,
  pct,
  color,
  delay,
  onTap,
  spark,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  goal: string;
  pct: number;
  color: string;
  delay: number;
  onTap: () => void;
  spark: number[] | null;
}) {
  const RADIUS = 28;
  const STROKE = 5;
  const CIRC = 2 * Math.PI * RADIUS;
  const dashOffset = CIRC * (1 - Math.min(100, pct) / 100);

  return (
    <motion.button
      type="button"
      onClick={onTap}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="text-left rounded-2xl border border-border bg-bg-card overflow-hidden active:scale-[0.98] transition-transform"
    >
      <div className="px-3.5 py-3 flex items-center gap-3">
        {/* Mini ring */}
        <div className="relative flex-shrink-0">
          <svg
            viewBox="0 0 80 80"
            className="w-[64px] h-[64px] -rotate-90"
          >
            <circle
              cx={40}
              cy={40}
              r={RADIUS}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={STROKE}
              fill="none"
            />
            <motion.circle
              cx={40}
              cy={40}
              r={RADIUS}
              stroke={color}
              strokeWidth={STROKE}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={CIRC}
              initial={{ strokeDashoffset: CIRC }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 0.9, delay: delay + 0.1, ease: [0.16, 1, 0.3, 1] }}
              style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
            />
          </svg>
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ color }}
          >
            {icon}
          </div>
        </div>

        {/* Stats */}
        <div className="min-w-0 flex-1">
          <div
            className="font-mono uppercase tracking-[0.16em] font-bold"
            style={{ fontSize: 9.5, color }}
          >
            {label}
          </div>
          <div className="flex items-baseline gap-1 tabular-nums mt-0.5">
            <span
              className="font-display font-bold leading-none truncate"
              style={{ fontSize: 18, color }}
            >
              {value}
            </span>
            <span
              className="font-mono"
              style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}
            >
              {goal}
            </span>
          </div>
          <div
            className="font-mono mt-0.5 flex items-center gap-1.5"
            style={{ fontSize: 9, color: 'rgba(255,255,255,0.40)' }}
          >
            <span>{Math.round(pct)}%</span>
            {spark ? (
              <>
                <span
                  className="uppercase tracking-[0.14em] font-bold"
                  style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.28)' }}
                >
                  7d
                </span>
                <Sparkline
                  data={spark}
                  width={54}
                  height={14}
                  color={color}
                  showDot={false}
                  strokeWidth={1.25}
                />
              </>
            ) : null}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// ─── helpers ────────────────────────────────────────────────────────

function pct(value: number, goal: number): number {
  if (!goal) return 0;
  return Math.max(0, Math.min(100, (value / goal) * 100));
}

function formatSteps(n: number): string {
  // Always use compact "k" notation for steps so the value fits inside
  // the 2-column activity ring tile on a 375 px viewport. The previous
  // logic showed "7,423" for anything under 10 k, which the tile
  // truncated to "7,…" on mobile (reported 2026-07-16).
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

function formatSleep(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatWater(ml: number): string {
  if (ml >= 1000) return `${(ml / 1000).toFixed(1)}L`;
  return `${ml}ml`;
}
