import { redirect } from 'next/navigation';
import { LineChart } from 'lucide-react';
import { ProgressPageView } from '@/components/client/progress/ProgressPageView';
import { getCurrentUserId } from '@/lib/data/client-live';
import { getProgressData } from '@/lib/data/progress-server';

export const metadata = {
  title: 'PureX Progress · 30/60/90-day transformation trends',
};
export const dynamic = 'force-dynamic';

/**
 * Top-level Progress page.
 *
 * Whoop-style transformation hub: single hero score, consistency rings,
 * trend charts, weekly-vs-last-week deltas. Built entirely from data
 * we already collect (client_daily_logs, client_body_measurements,
 * client_workouts, client_meals) — no new tables, no new server actions.
 *
 * IA reminder:
 *   Home    = today
 *   Plan    = training arc
 *   Nutrition = fuel
 *   Progress = THIS PAGE — how am I trending over weeks/months
 *   Health  = body data snapshot
 *   Profile = account
 */
export default async function ProgressPage() {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect('/login');
  }

  const today = new Date().toISOString().slice(0, 10);
  const data = await getProgressData(userId, today);

  return (
    <main className="relative bg-bg text-text min-h-screen">
      {/* Background atmosphere — lime-cyan to read as "improvement / trend" */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 80% 0%, rgba(198, 255, 61, 0.10) 0%, transparent 55%), radial-gradient(ellipse at 20% 60%, rgba(125, 211, 255, 0.08) 0%, transparent 55%)',
        }}
      />

      <div className="relative container-safe pt-6 pb-24 max-w-3xl mx-auto">
        <header className="mb-6 md:mb-8">
          <div
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] font-bold mb-3"
            style={{ color: '#c6ff3d' }}
          >
            <LineChart size={12} />
            PureX Progress
          </div>
          <h1 className="font-display font-bold text-3xl md:text-4xl tracking-tight leading-[1.05] mb-2">
            How you&apos;re trending.
          </h1>
          <p
            className="text-text-muted leading-relaxed max-w-xl"
            style={{ fontSize: 15 }}
          >
            One score for 30-day transformation. Consistency rings. Daily
            score trend. Weight movement. This week vs last. Built from
            what you log — the more you track, the sharper the picture.
          </p>
        </header>

        <ProgressPageView data={data} />
      </div>
    </main>
  );
}
