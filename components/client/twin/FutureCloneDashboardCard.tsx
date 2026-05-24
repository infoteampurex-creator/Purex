'use client';

import dynamic from 'next/dynamic';
import { useIsApp } from '@/lib/hooks/useIsApp';
import type { TwinStats } from '@/lib/data/twin';
import type { BodyProportions } from '@/lib/data/body-proportions';
import type { Gender } from '@/lib/data/body-measurements';

/**
 * Dispatcher — Future Clone card is APP-ONLY by product decision.
 *
 * Same reasoning as TwinDashboardCard: the transformation projection
 * is a premium app feature. Web browsers see nothing here so the
 * silhouette + +lift arrow doesn't set a misleading first impression
 * of the product.
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
  /** Live measurement-driven body proportions (app-only). */
  proportions?: BodyProportions | null;
  /** True if any body measurement has been logged. */
  hasMeasurements?: boolean;
  /** User's gender — drives avatar PNG selection. */
  gender?: Gender | null;
}

export function FutureCloneDashboardCard(props: Props) {
  const isApp = useIsApp();
  if (!isApp) return null;
  return (
    <FutureCloneDashboardCardApp
      {...props}
      proportions={props.proportions ?? null}
      hasMeasurements={props.hasMeasurements ?? false}
      gender={props.gender ?? null}
    />
  );
}
