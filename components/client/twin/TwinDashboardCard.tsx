'use client';

import dynamic from 'next/dynamic';
import { TwinDashboardCardWeb } from './TwinDashboardCardWeb';
import { useIsApp } from '@/lib/hooks/useIsApp';
import type { TwinStats, TwinVisualState } from '@/lib/data/twin';
import type { CoachMission, LevelInfo } from '@/lib/data/twin-game';

/**
 * Dispatcher — picks Web vs App layout based on Capacitor detection.
 *
 * The gamified holographic app card lives in TwinDashboardCardApp.tsx
 * and is **lazy-loaded only when the user is in the mobile app**.
 * Browser visitors never pay the bundle cost for the gamification
 * primitives (StatRadial, LevelChip, StreakChip, AiCoachCard, etc.).
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
}

export function TwinDashboardCard(props: Props) {
  const isApp = useIsApp();
  if (!isApp) {
    return (
      <TwinDashboardCardWeb
        stats={props.stats}
        state={props.state}
        message={props.message}
      />
    );
  }
  return <TwinDashboardCardApp {...props} />;
}
