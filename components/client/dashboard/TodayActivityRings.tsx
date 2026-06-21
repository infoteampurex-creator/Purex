'use client';

import { motion } from 'framer-motion';
import { Footprints, Apple, Moon, Droplets } from 'lucide-react';
import type { DailyInputs, NutritionSnapshot } from '@/lib/data/twin';

interface Props {
  inputs: DailyInputs;
  nutrition: NutritionSnapshot;
  /** Called when the user taps a ring — opens the unified log sheet
   *  scoped to that metric. */
  onLogTap: (target: 'steps' | 'meal' | 'sleep' | 'water') => void;
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
export function TodayActivityRings({ inputs, nutrition, onLogTap }: Props) {
  const stepsPct = pct(inputs.steps, inputs.stepsGoal);
  const fuelPct = nutrition.caloriesTarget
    ? pct(nutrition.caloriesConsumed, nutrition.caloriesTarget)
    : 0;
  const sleepPct = pct(inputs.sleepMinutes, inputs.sleepGoalMinutes);
  const waterPct = pct(inputs.waterMl, inputs.waterGoalMl);

  const rings = [
    {
      key: 'move' as const,
      target: 'steps' as const,
      icon: <Footprints size={14} />,
      label: 'Move',
      value: formatSteps(inputs.steps),
      goal: `/ ${formatSteps(inputs.stepsGoal)}`,
      pct: stepsPct,
      color: '#c6ff3d',
    },
    {
      key: 'fuel' as const,
      target: 'meal' as const,
      icon: <Apple size={14} />,
      label: 'Fuel',
      value: nutrition.caloriesConsumed.toLocaleString(),
      goal: `/ ${nutrition.caloriesTarget.toLocaleString()}`,
      pct: fuelPct,
      color: '#ff8a4d',
    },
    {
      key: 'sleep' as const,
      target: 'sleep' as const,
      icon: <Moon size={14} />,
      label: 'Sleep',
      value: formatSleep(inputs.sleepMinutes),
      goal: `/ ${formatSleep(inputs.sleepGoalMinutes)}`,
      pct: sleepPct,
      color: '#a78bfa',
    },
    {
      key: 'water' as const,
      target: 'water' as const,
      icon: <Droplets size={14} />,
      label: 'Water',
      value: formatWater(inputs.waterMl),
      goal: `/ ${formatWater(inputs.waterGoalMl)}`,
      pct: waterPct,
      color: '#7dd3ff',
    },
  ];

  return (
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
        />
      ))}
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
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  goal: string;
  pct: number;
  color: string;
  delay: number;
  onTap: () => void;
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
            className="font-mono mt-0.5"
            style={{ fontSize: 9, color: 'rgba(255,255,255,0.40)' }}
          >
            {Math.round(pct)}%
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
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
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
