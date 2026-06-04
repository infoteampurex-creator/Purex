import Link from 'next/link';
import { MessageCircle, Mail } from 'lucide-react';
import {
  AdminTable,
  AdminTableRow,
  AdminTableCell,
} from '@/components/admin/AdminTable';
import {
  PRIMARY_GOAL_OPTIONS,
  START_TIMING_OPTIONS,
  ENQUIRY_STATUS_LABEL,
  ENQUIRY_STATUS_COLOR,
  type AdminEnquiry,
} from '@/lib/data/enquiries-types';

interface Props {
  enquiries: AdminEnquiry[];
}

const GOAL_LABEL: Record<string, string> = Object.fromEntries(
  PRIMARY_GOAL_OPTIONS.map((o) => [o.value, o.label])
);
const TIMING_LABEL: Record<string, string> = Object.fromEntries(
  START_TIMING_OPTIONS.map((o) => [o.value, o.label])
);

export function ApplicationsList({ enquiries }: Props) {
  return (
    <AdminTable
      headers={['Applicant', 'Contact', 'Goal', 'Can start', 'Status', 'Coach', 'Received']}
      isEmpty={enquiries.length === 0}
      empty={
        <>
          <div className="font-display font-semibold text-lg mb-2">
            No applications yet
          </div>
          <p className="text-sm text-text-muted">
            When visitors submit the enquiry form at <code className="font-mono text-xs text-accent">/apply</code>, they show up here.
          </p>
        </>
      }
    >
      {enquiries.map((e) => (
        <AdminTableRow key={e.id}>
          <AdminTableCell>
            <Link
              href={`/admin/applications/${e.id}`}
              className="flex flex-col gap-0.5 group"
            >
              <span className="font-medium group-hover:text-accent transition-colors">
                {e.fullName}
              </span>
              <span className="text-[10px] text-text-dim font-mono">
                Ref · {e.id.slice(0, 8).toUpperCase()}
              </span>
            </Link>
          </AdminTableCell>

          <AdminTableCell>
            <div className="flex flex-col gap-1">
              <a
                href={`https://wa.me/91${e.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-[#25D366] transition-colors font-mono"
              >
                <MessageCircle size={10} />
                {e.whatsapp}
              </a>
              <a
                href={`mailto:${e.email}`}
                className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-accent transition-colors"
              >
                <Mail size={10} />
                <span className="truncate max-w-[180px]">{e.email}</span>
              </a>
            </div>
          </AdminTableCell>

          <AdminTableCell>
            <span className="text-xs">{GOAL_LABEL[e.primaryGoal] ?? e.primaryGoal}</span>
          </AdminTableCell>

          <AdminTableCell>
            <span className="text-xs text-text-muted">
              {TIMING_LABEL[e.startTiming] ?? e.startTiming}
            </span>
          </AdminTableCell>

          <AdminTableCell>
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-[0.12em] font-bold border"
              style={{
                color: ENQUIRY_STATUS_COLOR[e.status],
                borderColor: ENQUIRY_STATUS_COLOR[e.status] + '50',
                background: ENQUIRY_STATUS_COLOR[e.status] + '15',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: ENQUIRY_STATUS_COLOR[e.status],
                  boxShadow: `0 0 4px ${ENQUIRY_STATUS_COLOR[e.status]}`,
                }}
              />
              {ENQUIRY_STATUS_LABEL[e.status]}
            </span>
          </AdminTableCell>

          <AdminTableCell>
            {e.assignedSpecialistName ? (
              <span className="text-xs">{e.assignedSpecialistName}</span>
            ) : (
              <span className="text-xs text-text-dim font-mono">Unassigned</span>
            )}
          </AdminTableCell>

          <AdminTableCell>
            <span className="text-[11px] text-text-muted font-mono">
              {formatRelative(e.createdAt)}
            </span>
          </AdminTableCell>
        </AdminTableRow>
      ))}
    </AdminTable>
  );
}

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
