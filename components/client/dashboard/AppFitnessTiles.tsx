'use client';

import dynamic from 'next/dynamic';
import { useIsApp } from '@/lib/hooks/useIsApp';
import type { DailyInputs, NutritionSnapshot } from '@/lib/data/twin';
import type { MealRow } from '@/lib/data/meals';

/**
 * App-only 2×2 fitness tiles (Steps / Sleep / Water / Nutrition).
 *
 * Dispatcher: renders null on web — and crucially, **dynamically
 * imports** the inner renderer so the framer-motion + lucide-icons
 * code for the tiles never lands in the web bundle.
 */
const AppFitnessTilesInner = dynamic(
  () =>
    import('./AppFitnessTilesInner').then((m) => m.AppFitnessTilesInner),
  { ssr: false, loading: () => null }
);

interface Props {
  inputs: DailyInputs;
  nutrition: NutritionSnapshot;
  todaysMeals: MealRow[];
}

export function AppFitnessTiles({ inputs, nutrition, todaysMeals }: Props) {
  const isApp = useIsApp();
  if (!isApp) return null;
  return (
    <AppFitnessTilesInner
      inputs={inputs}
      nutrition={nutrition}
      todaysMeals={todaysMeals}
    />
  );
}
