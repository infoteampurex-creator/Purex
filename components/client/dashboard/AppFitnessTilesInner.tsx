'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Footprints, Moon, Droplets, Apple, Plus } from 'lucide-react';
import type { DailyInputs } from '@/lib/data/twin';
import { QuickLogSheet, type QuickLogType } from './QuickLogSheet';

interface Props {
  inputs: DailyInputs;
}

/**
 * Internal renderer for the app-only fitness tiles. The outer
 * AppFitnessTiles.tsx dispatcher gates this behind useIsApp + dynamic
 * import so this module's JS never enters the web bundle.
 *
 * Each non-readonly tile (Steps / Sleep / Water) is tappable and
 * opens a QuickLogSheet to log manually for users without auto-source
 * apps. Nutrition tile is read-only — it's an admin-tracked metric.
 */
export function AppFitnessTilesInner({ inputs }: Props) {
  const [sheetType, setSheetType] = useState<QuickLogType | null>(null);
  const sheetCurrent =
    sheetType === 'steps'
      ? inputs.steps
      : sheetType === 'sleep'
      ? Math.round((inputs.sleepMinutes / 60) * 10) / 10
      : sheetType === 'water'
      ? inputs.waterMl
      : 0;


  const tiles: Array<{
    icon: React.ReactNode;
    label: string;
    value: string;
    goal: string;
    pct: number;
    color: string;
    /** When set, tapping the tile opens the quick-log sheet for this type. */
    quickLog?: QuickLogType;
  }> = [
    {
      icon: <Footprints size={14} />,
      label: 'Steps',
      value: formatSteps(inputs.steps),
      goal: `/ ${formatSteps(inputs.stepsGoal)}`,
      pct: pct(inputs.steps, inputs.stepsGoal),
      color: '#c6ff3d',
      quickLog: 'steps',
    },
    {
      icon: <Moon size={14} />,
      label: 'Sleep',
      value: formatSleep(inputs.sleepMinutes),
      goal: `/ ${formatSleep(inputs.sleepGoalMinutes)}`,
      pct: pct(inputs.sleepMinutes, inputs.sleepGoalMinutes),
      color: '#a78bfa',
      quickLog: 'sleep',
    },
    {
      icon: <Droplets size={14} />,
      label: 'Water',
      value: formatWater(inputs.waterMl),
      goal: `/ ${formatWater(inputs.waterGoalMl)}`,
      pct: pct(inputs.waterMl, inputs.waterGoalMl),
      color: '#7dd3ff',
      quickLog: 'water',
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
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="grid grid-cols-2 gap-3"
      >
        {tiles.map((t, i) => {
          const TileWrapper = t.quickLog
            ? ({ children }: { children: React.ReactNode }) => (
                <button
                  type="button"
                  onClick={() => setSheetType(t.quickLog!)}
                  className="text-left rounded-2xl border border-border bg-bg-card overflow-hidden w-full active:scale-[0.98] transition-transform"
                >
                  {children}
                </button>
              )
            : ({ children }: { children: React.ReactNode }) => (
                <div className="rounded-2xl border border-border bg-bg-card overflow-hidden">
                  {children}
                </div>
              );
          return (
            <motion.div
              key={t.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 + i * 0.06, ease: 'easeOut' }}
            >
              <TileWrapper>
                <div className="px-4 pt-3.5 pb-3 relative">
                  {/* + chip in the top-right of tappable tiles */}
                  {t.quickLog && (
                    <div
                      className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{
                        background: `${t.color}1A`,
                        border: `1px solid ${t.color}40`,
                        color: t.color,
                      }}
                    >
                      <Plus size={11} />
                    </div>
                  )}
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
              </TileWrapper>
            </motion.div>
          );
        })}
      </motion.div>

      <QuickLogSheet
        open={sheetType !== null}
        type={sheetType}
        currentValue={sheetCurrent}
        onClose={() => setSheetType(null)}
      />
    </>
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
