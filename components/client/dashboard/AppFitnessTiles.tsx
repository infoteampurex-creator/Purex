'use client';

import { motion } from 'framer-motion';
import { Footprints, Moon, Droplets, Apple } from 'lucide-react';
import { useIsApp } from '@/lib/hooks/useIsApp';
import type { DailyInputs } from '@/lib/data/twin';

interface Props {
  inputs: DailyInputs;
}

/**
 * Raw fitness numbers — steps, sleep, water, nutrition adherence —
 * surfaced as a 2×2 tile grid above the Twin card. App-only by design:
 * the website's dashboard sticks to the visual Twin/Future-Clone
 * abstractions, while the mobile app surfaces the underlying tracker
 * data the user expects to see day-to-day.
 *
 * Renders nothing on web (returns null after the useIsApp hook
 * resolves). On first paint inside the app this also renders nothing
 * for one frame — accepted to avoid hydration mismatches.
 */
export function AppFitnessTiles({ inputs }: Props) {
  const isApp = useIsApp();
  if (!isApp) return null;

  const tiles: Array<{
    icon: React.ReactNode;
    label: string;
    value: string;
    goal: string;
    pct: number;
    color: string;
  }> = [
    {
      icon: <Footprints size={14} />,
      label: 'Steps',
      value: formatSteps(inputs.steps),
      goal: `/ ${formatSteps(inputs.stepsGoal)}`,
      pct: pct(inputs.steps, inputs.stepsGoal),
      color: '#c6ff3d',
    },
    {
      icon: <Moon size={14} />,
      label: 'Sleep',
      value: formatSleep(inputs.sleepMinutes),
      goal: `/ ${formatSleep(inputs.sleepGoalMinutes)}`,
      pct: pct(inputs.sleepMinutes, inputs.sleepGoalMinutes),
      color: '#a78bfa',
    },
    {
      icon: <Droplets size={14} />,
      label: 'Water',
      value: formatWater(inputs.waterMl),
      goal: `/ ${formatWater(inputs.waterGoalMl)}`,
      pct: pct(inputs.waterMl, inputs.waterGoalMl),
      color: '#7dd3ff',
    },
    {
      icon: <Apple size={14} />,
      label: 'Nutrition',
      value: `${Math.round(inputs.nutritionAdherencePct)}%`,
      goal: '/ 100%',
      pct: inputs.nutritionAdherencePct,
      color: '#ff8a4d',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="grid grid-cols-2 gap-3"
    >
      {tiles.map((t, i) => (
        <motion.div
          key={t.label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 + i * 0.06, ease: 'easeOut' }}
          className="rounded-2xl border border-border bg-bg-card overflow-hidden"
        >
          <div className="px-4 pt-3.5 pb-3">
            <div
              className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] font-bold mb-1.5"
              style={{ color: t.color }}
            >
              {t.icon}
              {t.label}
            </div>
            <div className="flex items-baseline gap-1.5 tabular-nums">
              <span
                className="font-display font-bold leading-none"
                style={{ fontSize: 22, color: t.color }}
              >
                {t.value}
              </span>
              <span className="font-mono text-[10px] text-text-muted">
                {t.goal}
              </span>
            </div>
            <div className="mt-2.5 h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, t.pct)}%` }}
                transition={{ duration: 0.9, delay: 0.15 + i * 0.06, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ backgroundColor: t.color }}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

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
  if (ml >= 1000) return `${(ml / 1000).toFixed(1)} L`;
  return `${ml} ml`;
}
