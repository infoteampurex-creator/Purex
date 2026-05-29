import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { CoachRadarView } from '@/components/admin/CoachRadarView';
import { getCoachRadar } from '@/lib/data/coach-radar-server';

export const metadata = { title: 'Admin · Coach Radar' };
export const dynamic = 'force-dynamic';

/**
 * Coach Radar — attention queue for all clients.
 *
 * Shows every client this coach/admin can see (RLS-gated), sorted by
 * an attention score derived from missing logs, missed workouts, low
 * recent scores, unreviewed lab reports, and broken streaks. The
 * coach scans top-down: the noisiest client is at the top.
 *
 * This page replaces nothing — it's a NEW admin route. Add a "Radar"
 * link to the AdminSidebar nav to make it discoverable.
 */
export default async function CoachRadarPage() {
  const today = new Date().toISOString().slice(0, 10);
  const payload = await getCoachRadar(today);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Coach"
        title="Radar"
        subtitle="All clients, sorted by attention needed today"
      />
      <CoachRadarView payload={payload} />
    </div>
  );
}
