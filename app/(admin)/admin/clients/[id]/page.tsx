import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  User,
  MessageCircle,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ClientDetailTabs } from '@/components/admin/ClientDetailTabs';
import { EditClientButton } from '@/components/admin/EditClientButton';
import { PhotoUpload } from '@/components/admin/PhotoUpload';
import {
  getClientBookings,
  getMockClientPhotos,
  SUGGESTED_APPS,
  INTERNAL_ACTIONS,
} from '@/lib/data/admin-mock';
import { getAdminClientById } from '@/lib/data/admin-clients';
import { getDailyPlan } from '@/lib/data/daily-plan';
import {
  getClientTasksLive,
  getClientLogsLive,
  getClientWorkoutsLive,
} from '@/lib/data/client-live';
import { searchExercises } from '@/lib/data/exercise-library';
import { getWorkoutTemplates } from '@/lib/data/workout-templates';
import { type LibraryExerciseOption } from '@/lib/data/daily-plan-types';
import { FALLBACK_PROGRAMS } from '@/lib/constants';

export const metadata = { title: 'Admin · Client Detail' };

function planSlugFromName(name: string | undefined): string | null {
  if (!name) return null;
  return FALLBACK_PROGRAMS.find((p) => p.name === name)?.slug ?? null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminClientDetailPage({ params }: PageProps) {
  const { id } = await params;
  const client = await getAdminClientById(id);
  if (!client) notFound();

  const today = new Date().toISOString().slice(0, 10);

  const [tasksRes, logsRes, workoutsRes, dailyPlan, libraryRows, workoutTemplates] =
    await Promise.all([
      getClientTasksLive(client.id),
      getClientLogsLive(client.id),
      getClientWorkoutsLive(client.id),
      getDailyPlan(client.id, today),
      searchExercises({ limit: 200 }),
      getWorkoutTemplates(),
    ]);

  // Slim down library entries to what the EditDailyPlanModal actually
  // reads — keeps the client bundle small.
  const exerciseLibrary: LibraryExerciseOption[] = libraryRows.map((e) => ({
    slug: e.slug,
    name: e.name,
    category: e.category,
    defaultSets: e.defaultSets ?? null,
    defaultReps: e.defaultReps ?? null,
    defaultRestSeconds: e.defaultRestSeconds ?? null,
  }));

  // Real Supabase rows only — never show mock fallback data on the admin
  // detail page, otherwise trainers see fabricated metrics for clients
  // who haven't logged anything yet.
  const tasks = tasksRes.source === 'supabase' ? tasksRes.rows : [];
  const logs = logsRes.source === 'supabase' ? logsRes.rows : [];
  const workouts = workoutsRes.source === 'supabase' ? workoutsRes.rows : [];
  const bookings = getClientBookings(client.email);
  const photos = getMockClientPhotos(client.id);

  return (
    <>
      {/* Back link */}
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-2 text-xs text-text-muted hover:text-accent transition-colors mb-5 font-mono uppercase tracking-[0.14em] font-bold"
      >
        <ArrowLeft size={12} />
        Back to clients
      </Link>

      {/* Header with avatar + info + quick actions */}
      <div className="rounded-2xl bg-bg-card border border-border p-5 md:p-7 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <PhotoUpload
              clientId={client.id}
              mode="avatar"
              currentUrl={client.avatarUrl}
            />

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-semibold text-2xl tracking-tight">
                  {client.fullName}
                </h1>
                <ClientStatusPill status={client.status} />
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-text-muted">
                <a
                  href={`mailto:${client.email}`}
                  className="inline-flex items-center gap-1 hover:text-accent transition-colors"
                >
                  <Mail size={11} />
                  {client.email}
                </a>
                {client.phone && (
                  <a
                    href={`tel:${client.phone}`}
                    className="inline-flex items-center gap-1 hover:text-accent transition-colors"
                  >
                    <Phone size={11} />
                    {client.phone}
                  </a>
                )}
                <span className="inline-flex items-center gap-1 font-mono">
                  <Calendar size={11} />
                  Joined {client.joinedAt}
                </span>
              </div>

              {/* Meta pills */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {client.activePlan && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 text-accent text-[11px] font-mono font-bold uppercase tracking-[0.12em] border border-accent/30">
                    {client.activePlan}
                  </span>
                )}
                {client.assignedCoachName && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-elevated text-text-muted text-[11px] font-medium">
                    <User size={10} />
                    Coach: {client.assignedCoachName}
                  </span>
                )}
                {client.dayNumber && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-elevated text-text-muted text-[11px] font-mono font-bold uppercase tracking-[0.12em]">
                    Day {client.dayNumber}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap items-center gap-2">
            {client.phone && (
              <a
                href={`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-[#25D366]/10 text-[#25D366] text-xs font-medium border border-[#25D366]/30 hover:bg-[#25D366]/20 transition-colors"
              >
                <MessageCircle size={12} />
                WhatsApp
              </a>
            )}
            <EditClientButton
              clientId={client.id}
              initial={{
                fullName: client.fullName,
                phone: client.phone,
                planSlug: planSlugFromName(client.activePlan),
                coachSlug: client.assignedCoachSlug,
                status: client.status,
              }}
            />
          </div>
        </div>
      </div>

      {/* Tabbed content */}
      <ClientDetailTabs
        client={client}
        tasks={tasks}
        logs={logs}
        workouts={workouts}
        bookings={bookings}
        photos={photos}
        suggestedApps={SUGGESTED_APPS}
        internalActions={INTERNAL_ACTIONS}
        initialDailyPlan={dailyPlan}
        exerciseLibrary={exerciseLibrary}
        workoutTemplates={workoutTemplates}
      />
    </>
  );
}

function ClientStatusPill({ status }: { status: string }) {
  const styles: Record<string, { bg: string; fg: string; border: string; label: string }> = {
    active: {
      bg: 'rgba(198, 255, 61, 0.1)',
      fg: '#c6ff3d',
      border: 'rgba(198, 255, 61, 0.3)',
      label: 'Active',
    },
    onboarding: {
      bg: 'rgba(255, 184, 77, 0.1)',
      fg: '#ffb84d',
      border: 'rgba(255, 184, 77, 0.3)',
      label: 'Onboarding',
    },
    paused: {
      bg: 'rgba(125, 211, 255, 0.1)',
      fg: '#7dd3ff',
      border: 'rgba(125, 211, 255, 0.3)',
      label: 'Paused',
    },
    completed: {
      bg: 'rgba(200, 200, 200, 0.06)',
      fg: '#a0a69a',
      border: 'rgba(200, 200, 200, 0.2)',
      label: 'Completed',
    },
    cancelled: {
      bg: 'rgba(255, 107, 107, 0.1)',
      fg: '#ff6b6b',
      border: 'rgba(255, 107, 107, 0.3)',
      label: 'Cancelled',
    },
  };
  const s = styles[status] || styles.active;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-[0.12em] font-bold"
      style={{ background: s.bg, color: s.fg, border: `1px solid ${s.border}` }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: s.fg, boxShadow: `0 0 4px ${s.fg}` }}
      />
      {s.label}
    </span>
  );
}
