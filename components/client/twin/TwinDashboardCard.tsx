'use client';

import dynamic from 'next/dynamic';
import { useIsApp } from '@/lib/hooks/useIsApp';
import type { TwinStats, TwinVisualState } from '@/lib/data/twin';
import type { CoachMission, LevelInfo } from '@/lib/data/twin-game';
import type { BodyProportions } from '@/lib/data/body-proportions';
import type { Gender } from '@/lib/data/body-measurements';

/**
 * Dispatcher — Twin card is APP-ONLY by product decision.
 *
 * Renders nothing on web (desktop browsers, marketing visitors). The
 * gamified holographic experience — WebP avatar, ambient animation
 * layers, level / streak chips, AI coach mission — only ships inside
 * the Capacitor app. Browser visitors don't pay the bundle cost AND
 * don't see a stripped-down silhouette that would set a confusing
 * "this is what PureX looks like" impression.
 *
 * Lazy-load the app implementation via next/dynamic with ssr:false so
 * @capacitor/core never lands in the server-side React tree.
 */
const TwinDashboardCardApp = dynamic(
  () => import('./TwinDashboardCardApp').then((m) => m.TwinDashboardCardApp),
  { ssr: false, loading: () => null }
);

interface Props {
  stats: TwinStats;
  state: TwinVisualState;
  message: string;
  level: LevelInfo;
  streakDays: number;
  mission: CoachMission;
  /** Live measurement-driven body proportions (app-only). */
  proportions?: BodyProportions | null;
  /** True if any body measurement has been logged. */
  hasMeasurements?: boolean;
  /** User's gender — drives which avatar PNG set we pick from. */
  gender?: Gender | null;
}

export function TwinDashboardCard(props: Props) {
  const isApp = useIsApp();
  if (!isApp) return null;
  return (
    <TwinDashboardCardApp
      {...props}
      proportions={props.proportions ?? null}
      hasMeasurements={props.hasMeasurements ?? false}
      gender={props.gender ?? null}
    />
  );
}
