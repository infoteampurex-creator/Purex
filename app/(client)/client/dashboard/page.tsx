import { WelcomeHeader } from '@/components/client/dashboard/WelcomeHeader';
import { AdminSwitcher } from '@/components/client/AdminSwitcher';
import { CommitmentWidget } from '@/components/client/CommitmentWidget';
import { ScoreWidget } from '@/components/client/ScoreWidget';
import { TaskChecklist } from '@/components/client/dashboard/TaskChecklist';
import { TodaysPlanCard } from '@/components/client/dashboard/TodaysPlanCard';
import { getMockClientPact } from '@/lib/data/commitment';
import { getMockClientScore } from '@/lib/data/score';
import { getCurrentUserId, getClientTasksLive } from '@/lib/data/client-live';
import { getDailyPlan, EMPTY_DAILY_PLAN } from '@/lib/data/daily-plan';

export default async function ClientDashboardPage() {
  // These now return null when no real data exists (production mode).
  const pact = getMockClientPact();
  const score = getMockClientScore();

  const userId = await getCurrentUserId();
  const today = new Date().toISOString().slice(0, 10);

  let tasks: Awaited<ReturnType<typeof getClientTasksLive>>['rows'] = [];
  let dailyPlan = EMPTY_DAILY_PLAN;

  if (userId) {
    const [tasksRes, plan] = await Promise.all([
      getClientTasksLive(userId),
      getDailyPlan(userId, today),
    ]);
    tasks = tasksRes.source === 'supabase' ? tasksRes.rows : [];
    dailyPlan = plan;
  }

  return (
    <div className="space-y-6 md:space-y-7">
      {/* Admin-only shortcut — shows only if logged-in user has admin role */}
      <AdminSwitcher />

      <WelcomeHeader />

      {/* Today's Plan — set by trainer; client logs actuals + workout completion */}
      {userId && <TodaysPlanCard clientId={userId} plan={dailyPlan} />}

      {/* 100-Day Commitment — empty state if no pact signed */}
      <CommitmentWidget pact={pact} />

      {/* PURE X Score — empty state until score data exists */}
      <ScoreWidget score={score} />

      {/* Today's tasks — empty state when none assigned */}
      <TaskChecklist tasks={tasks} />
    </div>
  );
}
