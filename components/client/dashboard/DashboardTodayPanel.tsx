'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { TodayActivityRings } from './TodayActivityRings';
import { LogTodayButton, type LogTarget } from './LogTodayButton';
import type { DailyInputs, NutritionSnapshot } from '@/lib/data/twin';
import type { MealRow } from '@/lib/data/meals';
import type { QuickLogType } from './QuickLogSheet';

// Heavy sheets — only load when the user actually picks something to
// log. Same lazy pattern as PR #54.
const QuickLogSheet = dynamic(
  () => import('./QuickLogSheet').then((m) => ({ default: m.QuickLogSheet })),
  { ssr: false }
);
const MealLogSheet = dynamic(
  () => import('./MealLogSheet').then((m) => ({ default: m.MealLogSheet })),
  { ssr: false }
);

interface Props {
  inputs: DailyInputs;
  nutrition: NutritionSnapshot;
  todaysMeals: MealRow[];
  /** Today's logged weight in kg (or null). Pre-populates the weight
   *  QuickLogSheet's "current value" display. */
  todaysWeightKg: number | null;
}

/**
 * Wrapper around the redesigned dashboard's "today" controls.
 *
 * Owns the open-which-sheet state so the Activity Rings (tap a ring)
 * and the Log Today picker (tap a chip) both route into the same
 * pool of underlying log sheets. Net result: a clean dashboard with
 * one mental model — tap anywhere "today"-shaped, log a thing.
 */
export function DashboardTodayPanel({
  inputs,
  nutrition,
  todaysMeals,
  todaysWeightKg,
}: Props) {
  const [target, setTarget] = useState<LogTarget | null>(null);

  const handleClose = () => setTarget(null);

  const isQuick =
    target === 'weight' ||
    target === 'steps' ||
    target === 'sleep' ||
    target === 'water';

  const quickType: QuickLogType | null = isQuick
    ? (target as QuickLogType)
    : null;

  const currentValue =
    target === 'steps'
      ? inputs.steps
      : target === 'sleep'
      ? Math.round((inputs.sleepMinutes / 60) * 10) / 10
      : target === 'water'
      ? inputs.waterMl
      : target === 'weight'
      ? todaysWeightKg ?? 0
      : 0;

  return (
    <div className="space-y-4 md:space-y-5">
      <TodayActivityRings
        inputs={inputs}
        nutrition={nutrition}
        onLogTap={setTarget}
      />
      <LogTodayButton onPick={setTarget} />

      {/* Underlying sheets — gated on target so the chunks only load
          after the first tap, not on dashboard mount. */}
      {quickType && (
        <QuickLogSheet
          open={true}
          type={quickType}
          currentValue={currentValue}
          onClose={handleClose}
        />
      )}
      {target === 'meal' && (
        <MealLogSheet
          open={true}
          onClose={handleClose}
          today={{
            caloriesConsumed: nutrition.caloriesConsumed,
            caloriesTarget: nutrition.caloriesTarget,
            proteinG: nutrition.proteinG,
            proteinTargetG: nutrition.proteinTargetG,
          }}
          todaysMeals={todaysMeals}
        />
      )}
    </div>
  );
}
