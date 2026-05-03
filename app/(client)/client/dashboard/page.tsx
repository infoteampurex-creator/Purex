import { WelcomeHeader } from '@/components/client/dashboard/WelcomeHeader';
import { AdminSwitcher } from '@/components/client/AdminSwitcher';
import { CommitmentWidget } from '@/components/client/CommitmentWidget';
import { ScoreWidget } from '@/components/client/ScoreWidget';
import { TaskChecklist } from '@/components/client/dashboard/TaskChecklist';
import { getMockClientPact } from '@/lib/data/commitment';
import { getMockClientScore } from '@/lib/data/score';
import { getCurrentUserId, getClientTasksLive } from '@/lib/data/client-live';

export default async function ClientDashboardPage() {
  // These now return null when no real data exists (production mode).
  const pact = getMockClientPact();
  const score = getMockClientScore();

  // Load the logged-in user's tasks. Empty array if no tasks assigned yet.
  const userId = await getCurrentUserId();
  let tasks: Awaited<ReturnType<typeof getClientTasksLive>>['rows'] = [];

  if (userId) {
    const res = await getClientTasksLive(userId);
    // Only show real tasks (source='supabase'). Mock fallback shows nothing.
    tasks = res.source === 'supabase' ? res.rows : [];
  }

  return (
    <div className="space-y-6 md:space-y-7">
      {/* Admin-only shortcut — shows only if logged-in user has admin role */}
      <AdminSwitcher />

      <WelcomeHeader />

      {/* 100-Day Commitment — empty state if no pact signed */}
      <CommitmentWidget pact={pact} />

      {/* PURE X Score — empty state until score data exists */}
      <ScoreWidget score={score} />

      {/* Today's tasks — empty state when none assigned */}
      <TaskChecklist tasks={tasks} />
    </div>
  );
}
