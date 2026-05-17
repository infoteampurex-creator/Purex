import { WelcomeHeader } from '@/components/client/dashboard/WelcomeHeader';
import { AdminSwitcher } from '@/components/client/AdminSwitcher';
import { CommitmentWidget } from '@/components/client/CommitmentWidget';
import { ScoreWidget } from '@/components/client/ScoreWidget';
import { TaskChecklist } from '@/components/client/dashboard/TaskChecklist';
import { TodaysPlanCard } from '@/components/client/dashboard/TodaysPlanCard';
import { TwinDashboardCard } from '@/components/client/twin/TwinDashboardCard';
import { FutureCloneDashboardCard } from '@/components/client/twin/FutureCloneDashboardCard';
import { getMockClientPact } from '@/lib/data/commitment';
import { getMockClientScore } from '@/lib/data/score';
import { getCurrentUserId, getClientTasksLive } from '@/lib/data/client-live';
import { getDailyPlan } from '@/lib/data/daily-plan';
import { EMPTY_DAILY_PLAN } from '@/lib/data/daily-plan-types';
import {
  deriveTwinStats,
  deriveVisualState,
  dailyTwinMessage,
  type DailyInputs,
} from '@/lib/data/twin';

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default async function ClientDashboardPage({ searchParams }: PageProps) {
  const pact = getMockClientPact();
  const score = getMockClientScore();

  const userId = await getCurrentUserId();
  const today = new Date().toISOString().slice(0, 10);

  // ?date=YYYY-MM-DD lets the client view (and log to) past days. Reject
  // anything that isn't a valid YYYY-MM-DD; default to today.
  const params = await searchParams;
  const requestedDate = params.date;
  const selectedDate =
    requestedDate && DATE_PATTERN.test(requestedDate) ? requestedDate : today;

  let tasks: Awaited<ReturnType<typeof getClientTasksLive>>['rows'] = [];
  let dailyPlan = EMPTY_DAILY_PLAN;

  if (userId) {
    const [tasksRes, plan] = await Promise.all([
      getClientTasksLive(userId, selectedDate),
      getDailyPlan(userId, selectedDate),
    ]);
    tasks = tasksRes.source === 'supabase' ? tasksRes.rows : [];
    dailyPlan = plan;
  }

  // ─── Twin + Future Clone — derived from logged inputs ───
  // TODO Phase 4: replace this mock with a real-data fetch that pulls
  // steps, sleep, water, workouts, nutrition, streak from Supabase.
  // For now we surface a deterministic snapshot so the visual system
  // is reviewable on the live dashboard.
  const twinInputs: DailyInputs = {
    steps: 8400,
    stepsGoal: 10000,
    sleepMinutes: 6 * 60 + 50,
    sleepGoalMinutes: 8 * 60,
    waterMl: 2200,
    waterGoalMl: 3000,
    workoutCompletedToday: true,
    workoutsLast7: 5,
    nutritionAdherencePct: 72,
    currentStreak: 9,
    bestStreak: 22,
  };
  const twinStats = deriveTwinStats(twinInputs);
  const twinState = deriveVisualState(twinStats, twinInputs.workoutCompletedToday);
  const twinMessage = dailyTwinMessage(twinState, today);

  return (
    <div className="space-y-6 md:space-y-7">
      <AdminSwitcher />

      <WelcomeHeader />

      {userId && (
        <TodaysPlanCard
          plan={dailyPlan}
          selectedDate={selectedDate}
          today={today}
        />
      )}

      {/* PureX Twin + Future Clone — visible to all clients */}
      <div className="grid lg:grid-cols-2 gap-5 md:gap-6">
        <TwinDashboardCard
          stats={twinStats}
          state={twinState}
          message={twinMessage}
        />
        <FutureCloneDashboardCard
          stats={twinStats}
          workoutDoneToday={twinInputs.workoutCompletedToday}
        />
      </div>

      <CommitmentWidget pact={pact} />

      <ScoreWidget score={score} />

      <TaskChecklist tasks={tasks} />
    </div>
  );
}
