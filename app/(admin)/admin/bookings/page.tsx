import { Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import {
  AdminTable,
  AdminTableRow,
  AdminTableCell,
  StatusBadge,
} from '@/components/admin/AdminTable';
import { getAdminBookings } from '@/lib/data/admin-bookings';

export const metadata = { title: 'Admin · Bookings' };

export default async function AdminBookingsPage() {
  const { bookings } = await getAdminBookings();

  const scheduled = bookings.filter((b) => b.status === 'scheduled');
  const completed = bookings.filter((b) => b.status === 'completed');
  const cancelled = bookings.filter((b) => b.status === 'cancelled');
  const noShow = bookings.filter((b) => b.status === 'no_show');

  // All non-lead bookings, sorted by most recent scheduling
  const allBookings = [...scheduled, ...completed, ...cancelled, ...noShow].sort((a, b) => {
    const dateA = a.scheduledDatetime || a.createdAt;
    const dateB = b.scheduledDatetime || b.createdAt;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  return (
    <>
      <AdminPageHeader
        eyebrow="Management"
        title="Bookings"
        subtitle="Confirmed and historical consultation bookings. Track completion, no-shows, and cancellations."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-10">
        <AdminStatCard
          label="Scheduled"
          value={scheduled.length}
          sublabel="Upcoming sessions"
          icon={<Calendar size={18} strokeWidth={2} />}
          accent="sky"
        />
        <AdminStatCard
          label="Completed"
          value={completed.length}
          sublabel="This period"
          icon={<CheckCircle2 size={18} strokeWidth={2} />}
          accent="emerald"
        />
        <AdminStatCard
          label="Cancelled"
          value={cancelled.length}
          sublabel="Client-cancelled"
          icon={<XCircle size={18} strokeWidth={2} />}
          accent="amber"
        />
        <AdminStatCard
          label="No-shows"
          value={noShow.length}
          sublabel="Missed sessions"
          icon={<Clock size={18} strokeWidth={2} />}
          accent="magenta"
        />
      </div>

      <AdminTable
        headers={['Client', 'Expert', 'Service', 'Date & Time', 'Status', 'Reference']}
        isEmpty={allBookings.length === 0}
        empty={
          <>
            <div className="font-display font-semibold text-lg mb-2">No bookings yet</div>
            <p className="text-sm text-text-muted">
              Once leads are scheduled, they'll appear here.
            </p>
          </>
        }
      >
        {allBookings.map((b) => (
          <AdminTableRow key={b.id}>
            <AdminTableCell>
              <div className="font-medium">{b.clientName}</div>
              <div className="text-xs text-text-muted mt-0.5">{b.clientEmail}</div>
            </AdminTableCell>

            <AdminTableCell>
              <div className="text-sm">{b.expertName}</div>
            </AdminTableCell>

            <AdminTableCell>
              <div className="text-xs text-text-muted truncate max-w-[180px]">
                {b.serviceName}
              </div>
            </AdminTableCell>

            <AdminTableCell>
              {b.scheduledDatetime ? (
                <div>
                  <div className="text-xs font-mono">
                    {new Date(b.scheduledDatetime).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="text-[10px] text-accent font-mono mt-0.5 font-bold">
                    {new Date(b.scheduledDatetime).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ) : (
                <span className="text-xs text-text-muted">Not scheduled</span>
              )}
            </AdminTableCell>

            <AdminTableCell>
              <BookingStatusBadge status={b.status} />
            </AdminTableCell>

            <AdminTableCell>
              <div className="font-mono text-[10px] text-text-muted">{b.referenceId}</div>
            </AdminTableCell>
          </AdminTableRow>
        ))}
      </AdminTable>
    </>
  );
}

function BookingStatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
    scheduled: 'info',
    completed: 'success',
    cancelled: 'danger',
    no_show: 'danger',
  };
  const labelMap: Record<string, string> = {
    scheduled: 'Scheduled',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No-show',
  };
  return (
    <StatusBadge
      status={labelMap[status] || status}
      variant={variantMap[status] || 'neutral'}
    />
  );
}
