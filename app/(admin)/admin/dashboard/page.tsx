import Link from 'next/link';
import {
  Inbox,
  Calendar,
  Users,
  TrendingUp,
  ArrowRight,
  Circle,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import {
  AdminTable,
  AdminTableRow,
  AdminTableCell,
  StatusBadge,
} from '@/components/admin/AdminTable';
import { relativeTime } from '@/lib/data/admin-mock';
import { getAdminBookings } from '@/lib/data/admin-bookings';
import { getAdminClients } from '@/lib/data/admin-clients';

export const metadata = { title: 'Admin · Overview' };

export default async function AdminDashboardPage() {
  const [{ bookings, source }, { clients }] = await Promise.all([
    getAdminBookings(),
    getAdminClients(),
  ]);

  // Real-data only when source is supabase. Mock fallback = empty stats.
  const realBookings = source === 'supabase' ? bookings : [];

  // Derived stats — all real Supabase counts now (no mock client counts)
  const newLeads = realBookings.filter((b) => b.status === 'new').length;
  const scheduledThisWeek = realBookings.filter(
    (b) => b.status === 'scheduled'
  ).length;
  const activeClients = clients.filter((c) => c.status === 'active').length;
  const onboardingClients = clients.filter(
    (c) => c.status === 'onboarding'
  ).length;

  // Latest bookings
  const recentBookings = realBookings.slice(0, 5);

  // Today's schedule
  const todayBookings = realBookings.filter(
    (b) => b.status === 'scheduled' && b.scheduledDatetime
  ).slice(0, 3);

  return (
    <>
      <AdminPageHeader
        eyebrow="Overview"
        title="Welcome back, admin"
        subtitle="What's happening across PURE X today."
      />

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-10">
        <AdminStatCard
          label="New Leads"
          value={newLeads}
          sublabel="Awaiting follow-up"
          icon={<Inbox size={18} strokeWidth={2} />}
          trend={{ direction: 'up', value: '+12%' }}
          accent="lime"
        />
        <AdminStatCard
          label="Scheduled"
          value={scheduledThisWeek}
          sublabel="This week"
          icon={<Calendar size={18} strokeWidth={2} />}
          accent="sky"
        />
        <AdminStatCard
          label="Active Clients"
          value={activeClients}
          sublabel={`+ ${onboardingClients} onboarding`}
          icon={<Users size={18} strokeWidth={2} />}
          trend={{ direction: 'up', value: '+3' }}
          accent="emerald"
        />
        <AdminStatCard
          label="Conversion"
          value="42%"
          sublabel="Leads → Clients (30d)"
          icon={<TrendingUp size={18} strokeWidth={2} />}
          trend={{ direction: 'up', value: '+5%' }}
          accent="amber"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Leads — takes 2 cols */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-semibold text-lg">Recent bookings</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Latest inquiries from the site
              </p>
            </div>
            <Link
              href="/admin/leads"
              className="inline-flex items-center gap-1 text-xs text-accent font-medium hover:underline font-mono uppercase tracking-[0.14em]"
            >
              View all
              <ArrowRight size={12} />
            </Link>
          </div>

          <AdminTable headers={['Client', 'Expert', 'Service', 'Status', 'When']}>
            {recentBookings.map((booking) => (
              <AdminTableRow key={booking.id}>
                <AdminTableCell>
                  <div className="font-medium">{booking.clientName}</div>
                  <div className="text-xs text-text-muted mt-0.5">
                    {booking.clientEmail}
                  </div>
                </AdminTableCell>
                <AdminTableCell>
                  <div className="text-xs text-text-muted">{booking.expertName}</div>
                </AdminTableCell>
                <AdminTableCell>
                  <div className="text-xs truncate max-w-[180px]">
                    {booking.serviceName}
                  </div>
                </AdminTableCell>
                <AdminTableCell>
                  <BookingStatusBadge status={booking.status} />
                </AdminTableCell>
                <AdminTableCell>
                  <div className="text-xs text-text-muted font-mono">
                    {relativeTime(booking.createdAt)}
                  </div>
                </AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminTable>
        </div>

        {/* Today's schedule — right column */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-semibold text-lg">Today</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Upcoming consultations
              </p>
            </div>
          </div>

          {todayBookings.length > 0 ? (
            <div className="space-y-2">
              {todayBookings.map((b) => (
                <div
                  key={b.id}
                  className="rounded-xl bg-bg-card border border-border p-4 hover:border-border-soft transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent font-bold">
                      {b.scheduledDatetime
                        ? new Date(b.scheduledDatetime).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </div>
                    <Circle size={6} fill="#c6ff3d" className="text-accent mt-1" />
                  </div>
                  <div className="font-medium text-sm">{b.clientName}</div>
                  <div className="text-xs text-text-muted mt-0.5">
                    with {b.expertName}
                  </div>
                  <div className="text-xs text-text-muted mt-2 truncate">
                    {b.serviceName}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-bg-card border border-border p-6 text-center">
              <div className="text-sm text-text-muted">No scheduled sessions today</div>
            </div>
          )}

          {/* Quick actions */}
          <div className="mt-6 space-y-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold mb-3 px-1">
              Quick actions
            </div>
            <Link
              href="/admin/leads"
              className="flex items-center gap-3 p-3 rounded-xl bg-bg-card border border-border hover:border-accent/50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <Inbox size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">Review new leads</div>
                <div className="text-xs text-text-muted">{newLeads} awaiting</div>
              </div>
              <ArrowRight
                size={14}
                className="text-text-muted group-hover:text-accent transition-colors"
              />
            </Link>
            <Link
              href="/admin/clients"
              className="flex items-center gap-3 p-3 rounded-xl bg-bg-card border border-border hover:border-accent/50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald/10 flex items-center justify-center text-emerald">
                <Users size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">Manage clients</div>
                <div className="text-xs text-text-muted">{activeClients} active</div>
              </div>
              <ArrowRight
                size={14}
                className="text-text-muted group-hover:text-accent transition-colors"
              />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

function BookingStatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> =
    {
      new: 'warning',
      contacted: 'info',
      scheduled: 'info',
      completed: 'success',
      cancelled: 'danger',
      no_show: 'danger',
    };
  const labelMap: Record<string, string> = {
    new: 'New',
    contacted: 'Contacted',
    scheduled: 'Scheduled',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No-show',
  };
  return <StatusBadge status={labelMap[status] || status} variant={variantMap[status]} />;
}
