import Link from 'next/link';
import { Inbox, Filter } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { ApplicationsList } from '@/components/admin/ApplicationsList';
import {
  getAdminEnquiries,
  getEnquiryCountByStatus,
} from '@/lib/data/enquiries';

export const metadata = { title: 'Admin · Applications' };
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminApplicationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = params.status ?? 'all';

  const [allEnquiries, counts] = await Promise.all([
    getAdminEnquiries(),
    getEnquiryCountByStatus(),
  ]);

  const filtered =
    statusFilter === 'all'
      ? allEnquiries
      : allEnquiries.filter((e) => e.status === statusFilter);

  const totalNew = counts.new;
  const totalAll = allEnquiries.length;

  return (
    <>
      <AdminPageHeader
        eyebrow="Inbox"
        title="Applications"
        subtitle="Public enquiries from /apply. Reach out within 24 hours, qualify, then route to the right specialist."
      />

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <AdminStatCard
          label="New"
          value={String(counts.new)}
          icon={<Inbox size={18} strokeWidth={2} />}
          accent="lime"
        />
        <AdminStatCard
          label="Contacted"
          value={String(counts.contacted)}
          icon={<Inbox size={18} strokeWidth={2} />}
          accent="sky"
        />
        <AdminStatCard
          label="Qualified"
          value={String(counts.qualified)}
          icon={<Inbox size={18} strokeWidth={2} />}
          accent="amber"
        />
        <AdminStatCard
          label="Converted"
          value={String(counts.converted)}
          icon={<Inbox size={18} strokeWidth={2} />}
          accent="sky"
        />
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold flex items-center gap-1.5 mr-1">
          <Filter size={11} />
          Filter
        </div>
        <FilterPill href="/admin/applications" label={`All (${totalAll})`} active={statusFilter === 'all'} />
        <FilterPill href="/admin/applications?status=new" label={`New (${counts.new})`} active={statusFilter === 'new'} />
        <FilterPill href="/admin/applications?status=contacted" label={`Contacted (${counts.contacted})`} active={statusFilter === 'contacted'} />
        <FilterPill href="/admin/applications?status=qualified" label={`Qualified (${counts.qualified})`} active={statusFilter === 'qualified'} />
        <FilterPill href="/admin/applications?status=converted" label={`Converted (${counts.converted})`} active={statusFilter === 'converted'} />
        <FilterPill href="/admin/applications?status=rejected" label={`Rejected (${counts.rejected})`} active={statusFilter === 'rejected'} />
      </div>

      {totalNew > 0 && statusFilter !== 'new' && (
        <div className="mb-5 rounded-xl bg-accent/10 border border-accent/30 px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-sm text-text">
            <span className="font-bold text-accent">{totalNew}</span> new
            {totalNew === 1 ? ' application is' : ' applications are'} waiting
            for a response.
          </span>
          <Link
            href="/admin/applications?status=new"
            className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent font-bold hover:underline flex-shrink-0"
          >
            View new →
          </Link>
        </div>
      )}

      <ApplicationsList enquiries={filtered} />
    </>
  );
}

function FilterPill({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? 'inline-flex items-center px-3 py-1.5 rounded-full bg-accent text-bg font-mono text-[10px] uppercase tracking-[0.14em] font-bold'
          : 'inline-flex items-center px-3 py-1.5 rounded-full bg-bg-elevated border border-border-soft text-text-muted hover:text-text hover:border-text-muted font-mono text-[10px] uppercase tracking-[0.14em] font-bold transition-colors'
      }
    >
      {label}
    </Link>
  );
}
