import { redirect } from 'next/navigation';
import { Dumbbell } from 'lucide-react';
import { PlanPageView } from '@/components/client/plan/PlanPageView';
import { getCurrentUserId } from '@/lib/data/client-live';
import { getPlanData } from '@/lib/data/plan-server';

export const metadata = {
  title: 'PureX Plan · This week + training history',
};
export const dynamic = 'force-dynamic';

/**
 * Top-level Plan page.
 *
 * Whoop-style training view: hero load score for the week, Mon-Sun
 * day strip with assigned workouts, 30-day stats + by-category split,
 * 30-day completion heat-grid. Built from existing client_workouts —
 * no new tables.
 *
 * IA reminder:
 *   Home    = today's mission
 *   Plan    = THIS PAGE — training arc + history
 *   Nutrition = fuel
 *   Progress = long-term trends
 *   Health  = body data
 *   Profile = account
 */
export default async function PlanPage() {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect('/login');
  }

  const today = new Date().toISOString().slice(0, 10);
  const data = await getPlanData(userId, today);

  return (
    <main className="relative bg-bg text-text min-h-screen">
      {/* Background atmosphere — orange-lime, training intensity vibe */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 80% 0%, rgba(255, 138, 77, 0.10) 0%, transparent 55%), radial-gradient(ellipse at 20% 60%, rgba(198, 255, 61, 0.08) 0%, transparent 55%)',
        }}
      />

      <div className="relative container-safe pt-6 pb-24 max-w-3xl mx-auto">
        <header className="mb-6 md:mb-8">
          <div
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] font-bold mb-3"
            style={{ color: '#ff8a4d' }}
          >
            <Dumbbell size={12} />
            PureX Plan
          </div>
          <h1 className="font-display font-bold text-3xl md:text-4xl tracking-tight leading-[1.05] mb-2">
            Your training arc.
          </h1>
          <p
            className="text-text-muted leading-relaxed max-w-xl"
            style={{ fontSize: 15 }}
          >
            This week&apos;s sessions, your 30-day completion calendar,
            stats by category, and current training streak. Built from
            workouts your coach has assigned.
          </p>
        </header>

        <PlanPageView data={data} />
      </div>
    </main>
  );
}
