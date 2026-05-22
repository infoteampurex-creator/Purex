'use client';

import dynamic from 'next/dynamic';
import { FutureCloneDashboardCardWeb } from './FutureCloneDashboardCardWeb';
import { useIsApp } from '@/lib/hooks/useIsApp';
import type { TwinStats } from '@/lib/data/twin';

/**
 * Dispatcher — picks Web vs App layout based on Capacitor detection.
 *
 * The gamified milestone-rail + transformation-beam version lives in
 * FutureCloneDashboardCardApp.tsx and is **lazy-loaded only when the
 * user is in the mobile app**. Browser visitors never pay the bundle
 * cost for MilestoneRail, TransformationBeam, ProjectedMetrics, etc.
 */
const FutureCloneDashboardCardApp = dynamic(
  () =>
    import('./FutureCloneDashboardCardApp').then(
      (m) => m.FutureCloneDashboardCardApp
    ),
  { ssr: false, loading: () => null }
);

interface Props {
  stats: TwinStats;
  workoutDoneToday: boolean;
  streakDays: number;
}

export function FutureCloneDashboardCard(props: Props) {
  const isApp = useIsApp();
  if (!isApp) {
    return (
      <FutureCloneDashboardCardWeb
        stats={props.stats}
        workoutDoneToday={props.workoutDoneToday}
      />
    );
  }
  return <FutureCloneDashboardCardApp {...props} />;
}
