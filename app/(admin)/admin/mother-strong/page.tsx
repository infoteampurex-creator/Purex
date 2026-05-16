import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { MotherStrongAdmin } from '@/components/admin/mother-strong/MotherStrongAdmin';
import {
  getAdminParticipants,
  getMotherStrongConfig,
  getAdminDailyEntryGrid,
  getJourneyPosts,
  getCurrentChallengeDay,
  getMotherStrongActiveCount,
} from '@/lib/data/mother-strong';

export const metadata = { title: 'Admin · Mother Strong' };

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function MotherStrongAdminPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tab =
    typeof params.tab === 'string' &&
    ['participants', 'daily', 'journey', 'config', 'cards'].includes(params.tab)
      ? params.tab
      : 'participants';

  const [participants, config, gridRows, journey, day, activeCount] =
    await Promise.all([
      getAdminParticipants(),
      getMotherStrongConfig(),
      getAdminDailyEntryGrid(),
      getJourneyPosts(60),
      getCurrentChallengeDay(),
      getMotherStrongActiveCount(),
    ]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Cohort"
        title="Mother Strong"
        subtitle={
          day > 0
            ? `Day ${day} of 60 — ${activeCount} mothers walking strong.`
            : 'Manage registrations, daily step counts, and the public photo feed.'
        }
      />

      <MotherStrongAdmin
        initialTab={tab as 'participants' | 'daily' | 'journey' | 'config' | 'cards'}
        participants={participants}
        gridRows={gridRows}
        journey={journey}
        config={config}
      />
    </>
  );
}
