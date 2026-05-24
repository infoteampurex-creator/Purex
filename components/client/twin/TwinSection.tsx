'use client';

import { TwinDashboardCard } from './TwinDashboardCard';
import { FutureCloneDashboardCard } from './FutureCloneDashboardCard';
import { useIsApp } from '@/lib/hooks/useIsApp';
import type { TwinStats, TwinVisualState } from '@/lib/data/twin';
import type { CoachMission, LevelInfo } from '@/lib/data/twin-game';
import type { BodyProportions } from '@/lib/data/body-proportions';
import type { Gender } from '@/lib/data/body-measurements';

interface Props {
  stats: TwinStats;
  state: TwinVisualState;
  message: string;
  level: LevelInfo;
  streakDays: number;
  mission: CoachMission;
  workoutDoneToday: boolean;
  proportions?: BodyProportions | null;
  hasMeasurements?: boolean;
  gender?: Gender | null;
}

/**
 * Twin + Future Clone section — APP-ONLY.
 *
 * Wrapping both cards in this single client component (instead of
 * putting the grid in the server-side dashboard page and letting each
 * card decide via useIsApp) means the entire two-column grid disappears
 * on web — no empty container, no doubled space-y gap between the
 * neighbouring HealthyStreakCard and CommitmentWidget.
 */
export function TwinSection(props: Props) {
  const isApp = useIsApp();
  if (!isApp) return null;

  return (
    <div className="grid lg:grid-cols-2 gap-5 md:gap-6">
      <TwinDashboardCard
        stats={props.stats}
        state={props.state}
        message={props.message}
        level={props.level}
        streakDays={props.streakDays}
        mission={props.mission}
        proportions={props.proportions}
        hasMeasurements={props.hasMeasurements}
        gender={props.gender}
      />
      <FutureCloneDashboardCard
        stats={props.stats}
        workoutDoneToday={props.workoutDoneToday}
        streakDays={props.streakDays}
        proportions={props.proportions}
        hasMeasurements={props.hasMeasurements}
        gender={props.gender}
      />
    </div>
  );
}
