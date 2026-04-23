import { WelcomeHeader } from '@/components/client/dashboard/WelcomeHeader';
import { AdminSwitcher } from '@/components/client/AdminSwitcher';
import { CommitmentWidget } from '@/components/client/CommitmentWidget';
import { ScoreWidget } from '@/components/client/ScoreWidget';
import { DailyPlanCard } from '@/components/client/dashboard/DailyPlanCard';
import { StatTilesGrid } from '@/components/client/dashboard/StatTilesGrid';
import { TaskChecklist } from '@/components/client/dashboard/TaskChecklist';
import { WorkoutCards } from '@/components/client/dashboard/WorkoutCards';
import { NutritionCard } from '@/components/client/dashboard/NutritionCard';
import { UpcomingBookingCard } from '@/components/client/dashboard/UpcomingBookingCard';
import { ProgressCard } from '@/components/client/dashboard/ProgressCard';
import { getMockClientPact } from '@/lib/data/commitment';
import { getMockClientScore } from '@/lib/data/score';
import { getMockClientTasks } from '@/lib/data/admin-mock';
import { getCurrentUserId, getClientTasksLive } from '@/lib/data/client-live';

export default async function ClientDashboardPage() {
  const pact = getMockClientPact();
  const score = getMockClientScore();

  // Load the logged-in user's tasks for today. If not logged in (dev mode)
  // or no tasks exist yet, fall back to mock.
  const userId = await getCurrentUserId();
  const tasksRes = userId
    ? await getClientTasksLive(userId)
    : { rows: getMockClientTasks('demo'), source: 'mock' as const };

  return (
    <div className="space-y-6 md:space-y-7">
      {/* Admin-only shortcut — shows only if logged-in user has admin role */}
      <AdminSwitcher />

      <WelcomeHeader />

      {/* 100-Day Commitment — the hero of the dashboard */}
      <CommitmentWidget pact={pact} />

      {/* PURE X Score — daily engagement number */}
      <ScoreWidget score={score} />

      {/* Hero plan card — full width */}
      <DailyPlanCard />

      {/* Daily summary stats — 2x2 on mobile, 4x1 on desktop */}
      <StatTilesGrid />

      {/* Main content grid — stacks on mobile, splits on desktop */}
      <div className="grid md:grid-cols-2 gap-5 md:gap-6">
        <TaskChecklist tasks={tasksRes.rows} />
        <NutritionCard />
      </div>

      {/* Upcoming booking — full width highlight */}
      <UpcomingBookingCard />

      {/* Workouts — full width */}
      <WorkoutCards />

      {/* Progress — full width */}
      <ProgressCard />
    </div>
  );
}
