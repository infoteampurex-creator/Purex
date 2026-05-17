import { WelcomeHeader } from '@/components/client/dashboard/WelcomeHeader';
import { AdminSwitcher } from '@/components/client/AdminSwitcher';
import { CommitmentWidget } from '@/components/client/CommitmentWidget';
import { ScoreWidget } from '@/components/client/ScoreWidget';
import { TaskChecklist } from '@/components/client/dashboard/TaskChecklist';
import { TodaysPlanCard } from '@/components/client/dashboard/TodaysPlanCard';
import { TwinDashboardCard } from '@/components/client/twin/TwinDashboardCard';
import { FutureCloneDashboardCard } from '@/components/client/twin/FutureCloneDashboardCard';
import { HealthyStreakCard } from '@/components/client/twin/HealthyStreakCard';
import { getMockClientPact } from '@/lib/data/commitment';
import { getMockClientScore } from '@/lib/data/score';
import { getCurrentUserId, getClientTasksLive } from '@/lib/data/client-live';
import { getDailyPlan } from '@/lib/data/daily-plan';
import { EMPTY_DAILY_PLAN } from '@/lib/data/daily-plan-types';
import {
  computeHealthScore,
  deriveTwinStats,
  deriveVisualState,
  dailyTwinMessage,
  type DailyInputs,
} from '@/lib/data/twin';
import { getTwinDailyInputs, getStreakHistory } from '@/lib/data/twin-server';

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

  // ─── Twin + Future Clone + Healthy Streak (Phase 4 — live data) ───
  // Pull real inputs from client_daily_logs + client_workouts. When the
  // client has no logs yet we fall through to deterministic empty
  // inputs so the Twin renders in 'depleted' state with a "no data
  // yet" feel rather than fake numbers.
  let twinInputs: DailyInputs = emptyTwinInputs();
  let streakHistory: Awaited<ReturnType<typeof getStreakHistory>> = [];
  if (userId) {
    const [inputsResult, history] = await Promise.all([
      getTwinDailyInputs(userId, today),
      getStreakHistory(userId, 7),
    ]);
    twinInputs = inputsResult.inputs;
    streakHistory = history;
  }
  const twinStats = deriveTwinStats(twinInputs);
  const twinState = deriveVisualState(twinStats, twinInputs.workoutCompletedToday);
  const twinMessage = dailyTwinMessage(twinState, today);
  const todayScore = computeHealthScore({
    steps: twinInputs.steps,
    stepsGoal: twinInputs.stepsGoal,
    sleepMinutes: twinInputs.sleepMinutes,
    sleepGoalMinutes: twinInputs.sleepGoalMinutes,
    waterMl: twinInputs.waterMl,
    waterGoalMl: twinInputs.waterGoalMl,
    workoutCompletedToday: twinInputs.workoutCompletedToday,
    nutritionAdherencePct: twinInputs.nutritionAdherencePct,
  }).total;

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

      {/* Healthy Streak — current/best/today + 7-day calendar */}
      <HealthyStreakCard
        history={streakHistory}
        todayScore={todayScore}
      />

      {/* PureX Twin + Future Clone — derived from live data */}
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

function emptyTwinInputs(): DailyInputs {
  return {
    steps: 0,
    stepsGoal: 10000,
    sleepMinutes: 0,
    sleepGoalMinutes: 8 * 60,
    waterMl: 0,
    waterGoalMl: 8 * 250,
    workoutCompletedToday: false,
    workoutsLast7: 0,
    nutritionAdherencePct: 0,
    currentStreak: 0,
    bestStreak: 0,
  };
}
