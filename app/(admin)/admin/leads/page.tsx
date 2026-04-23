import { Download, Mail, Phone, MessageCircle, FileText, Clock, Database } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import {
  AdminTable,
  AdminTableRow,
  AdminTableCell,
  StatusBadge,
} from '@/components/admin/AdminTable';
import { relativeTime } from '@/lib/data/admin-mock';
import { getAdminBookings } from '@/lib/data/admin-bookings';

export const metadata = { title: 'Admin · Leads' };

export default async function AdminLeadsPage() {
  const { bookings, source, error } = await getAdminBookings();

  // Filter to new + contacted (the "to action" set)
  const newBookings = bookings.filter((b) => b.status === 'new');
  const contacted = bookings.filter((b) => b.status === 'contacted');
  const allLeads = [...newBookings, ...contacted].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <>
      <AdminPageHeader
        eyebrow="Inbox"
        title="Leads"
        subtitle={`${allLeads.length} bookings awaiting action. Reach out within 24 hours to maintain the PURE X promise.`}
        action={
          <button className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-border text-sm font-medium hover:border-accent/50 transition-colors">
            <Download size={14} />
            Export CSV
          </button>
        }
      />

      {/* Data source banner */}
      <DataSourceBanner source={source} error={error} />

      {/* Filter pills */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <FilterPill label="All" count={allLeads.length} active />
        <FilterPill label="New" count={newBookings.length} />
        <FilterPill label="Contacted" count={contacted.length} />
        <FilterPill label="Has form" count={allLeads.filter((l) => l.hasPreConsultForm).length} />
      </div>

      <AdminTable
        headers={['Client', 'Contact', 'Expert', 'Service', 'Preferred', 'Status', 'Form', 'When']}
        isEmpty={allLeads.length === 0}
        empty={
          <>
            <div className="font-display font-semibold text-lg mb-2">Inbox zero</div>
            <p className="text-sm text-text-muted">
              No new leads at the moment. Good work.
            </p>
          </>
        }
      >
        {allLeads.map((b) => (
          <AdminTableRow key={b.id}>
            <AdminTableCell>
              <div className="font-medium">{b.clientName}</div>
              <div className="text-[10px] text-text-muted font-mono mt-0.5">
                {b.referenceId}
              </div>
            </AdminTableCell>

            <AdminTableCell>
              <div className="flex flex-col gap-1">
                <a
                  href={`mailto:${b.clientEmail}`}
                  className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-accent transition-colors"
                  title={b.clientEmail}
                >
                  <Mail size={10} />
                  <span className="truncate max-w-[140px]">{b.clientEmail}</span>
                </a>
                {b.clientPhone && (
                  <a
                    href={`tel:${b.clientPhone}`}
                    className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-accent transition-colors"
                  >
                    <Phone size={10} />
                    {b.clientPhone}
                  </a>
                )}
              </div>
            </AdminTableCell>

            <AdminTableCell>
              <div className="text-sm">{b.expertName}</div>
            </AdminTableCell>

            <AdminTableCell>
              <div className="text-xs text-text-muted truncate max-w-[160px]">
                {b.serviceName}
              </div>
            </AdminTableCell>

            <AdminTableCell>
              {b.preferredDate ? (
                <div>
                  <div className="text-xs font-mono">{b.preferredDate}</div>
                  {b.preferredTimeSlot && (
                    <div className="text-[10px] text-text-muted uppercase tracking-[0.14em] mt-0.5 font-mono font-bold">
                      {b.preferredTimeSlot}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-xs text-text-muted">—</span>
              )}
            </AdminTableCell>

            <AdminTableCell>
              <LeadStatusBadge status={b.status} />
            </AdminTableCell>

            <AdminTableCell>
              {b.hasPreConsultForm ? (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-mono font-bold uppercase tracking-[0.1em]"
                  title="Pre-consultation form submitted"
                >
                  <FileText size={10} />
                  Form
                </span>
              ) : (
                <span className="text-[10px] text-text-dim font-mono uppercase">—</span>
              )}
            </AdminTableCell>

            <AdminTableCell>
              <div className="inline-flex items-center gap-1 text-xs text-text-muted font-mono">
                <Clock size={10} />
                {relativeTime(b.createdAt)}
              </div>
            </AdminTableCell>
          </AdminTableRow>
        ))}
      </AdminTable>

      {/* Contact workflow reminder */}
      <div className="mt-6 p-4 rounded-xl bg-bg-card border border-border">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
            <MessageCircle size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium mb-1">Follow-up workflow</div>
            <p className="text-xs text-text-muted leading-relaxed">
              Reach out to new leads by WhatsApp within 2 hours. Mark as{' '}
              <span className="text-info font-medium">Contacted</span> once initial outreach is made,
              then <span className="text-info font-medium">Scheduled</span> once a call is booked.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function FilterPill({
  label,
  count,
  active,
}: {
  label: string;
  count: number;
  active?: boolean;
}) {
  return (
    <button
      className={`inline-flex items-center gap-2 h-8 px-3 rounded-full border text-xs font-medium transition-colors whitespace-nowrap ${
        active
          ? 'bg-accent text-bg border-accent'
          : 'bg-transparent text-text-muted border-border hover:border-text-muted'
      }`}
    >
      {label}
      <span
        className={`font-mono text-[10px] font-bold ${
          active ? 'text-bg/80' : 'text-text-dim'
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function LeadStatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, 'warning' | 'info'> = {
    new: 'warning',
    contacted: 'info',
  };
  const labelMap: Record<string, string> = {
    new: 'New',
    contacted: 'Contacted',
  };
  return (
    <StatusBadge
      status={labelMap[status] || status}
      variant={variantMap[status] || 'neutral'}
    />
  );
}

/**
 * Transparency banner: tells the admin whether they're viewing live
 * Supabase data, demo data, or a fallback state.
 */
function DataSourceBanner({
  source,
  error,
}: {
  source: 'supabase' | 'supabase+mock' | 'mock' | 'error-fallback';
  error?: string;
}) {
  if (source === 'supabase') {
    return (
      <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-lg bg-accent/5 border border-accent/20">
        <Database size={12} className="text-accent" strokeWidth={2.5} />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold">
          Live · Supabase
        </span>
        <span className="text-[11px] text-text-muted">
          Showing real leads from your database.
        </span>
      </div>
    );
  }

  if (source === 'mock') {
    return (
      <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-lg bg-sky/5 border border-sky/20">
        <Database size={12} className="text-sky" strokeWidth={2.5} />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-sky font-bold">
          Demo · No Real Leads Yet
        </span>
        <span className="text-[11px] text-text-muted">
          Your database is connected but empty. Showing sample data until real leads
          arrive.
        </span>
      </div>
    );
  }

  // error-fallback
  return (
    <div className="flex items-start gap-2 mb-5 px-3 py-2 rounded-lg bg-warning/5 border border-warning/20">
      <Database size={12} className="text-warning mt-0.5" strokeWidth={2.5} />
      <div className="flex-1">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-warning font-bold">
          Database Unavailable
        </div>
        <div className="text-[11px] text-text-muted mt-0.5">
          Couldn&apos;t reach Supabase. Showing demo data as fallback.
          {error && (
            <span className="block mt-1 font-mono text-[10px] text-text-dim">
              {error}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
