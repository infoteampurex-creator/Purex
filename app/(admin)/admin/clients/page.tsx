import Link from 'next/link';
import { UserPlus, Users, Sparkles, UserCheck, Mail, Phone, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import {
  AdminTable,
  AdminTableRow,
  AdminTableCell,
  StatusBadge,
} from '@/components/admin/AdminTable';
import { Avatar } from '@/components/admin/Avatar';
import { type AdminClient } from '@/lib/data/admin-mock';

// MOCK_CLIENTS removed for production — clients table not yet wired to Supabase.
// Admin panel shows empty state until real client management is implemented.
const MOCK_CLIENTS: AdminClient[] = [];
import { getMockAdminScores, statusColor, scoreStatus } from '@/lib/data/score';

export const metadata = { title: 'Admin · Clients' };

export default function AdminClientsPage() {
  const active = MOCK_CLIENTS.filter((c) => c.status === 'active');
  const onboarding = MOCK_CLIENTS.filter((c) => c.status === 'onboarding');

  // Map client name → PURE X score (for demo; real app would use clientId)
  const scoreByName: Record<string, { score: number; delta: number; trend: 'up' | 'down' | 'flat' }> = {};
  getMockAdminScores().forEach((s) => {
    scoreByName[s.clientName] = { score: s.score, delta: s.delta, trend: s.trend };
  });

  const planCounts = {
    fit_check: MOCK_CLIENTS.filter((c) => c.planTier === 'fit_check').length,
    online_live: MOCK_CLIENTS.filter((c) => c.planTier === 'online_live').length,
    personal_transformation: MOCK_CLIENTS.filter(
      (c) => c.planTier === 'personal_transformation'
    ).length,
    elite_couple: MOCK_CLIENTS.filter((c) => c.planTier === 'elite_couple').length,
  };

  return (
    <>
      <AdminPageHeader
        eyebrow="Roster"
        title="Clients"
        subtitle="Active and onboarding clients across all plans. Assign coaches, update plans, review progress."
        action={
          <button className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-accent text-bg text-sm font-semibold hover:bg-accent-hover transition-colors">
            <UserPlus size={14} />
            Add Client
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-10">
        <AdminStatCard
          label="Active"
          value={active.length}
          sublabel="In current programme"
          icon={<UserCheck size={18} strokeWidth={2} />}
          accent="emerald"
        />
        <AdminStatCard
          label="Onboarding"
          value={onboarding.length}
          sublabel="Getting set up"
          icon={<Sparkles size={18} strokeWidth={2} />}
          accent="lime"
        />
        <AdminStatCard
          label="Elite Clients"
          value={planCounts.elite_couple}
          sublabel="Joint programmes"
          icon={<Users size={18} strokeWidth={2} />}
          accent="magenta"
        />
        <AdminStatCard
          label="Total Active"
          value={MOCK_CLIENTS.length}
          sublabel="All plans combined"
          icon={<Users size={18} strokeWidth={2} />}
          accent="sky"
        />
      </div>

      <AdminTable
        headers={['Name', 'Contact', 'Plan', 'Coach', 'Score', 'Day', 'Last Check-in', 'Status']}
        isEmpty={MOCK_CLIENTS.length === 0}
        empty={
          <>
            <div className="font-display font-semibold text-lg mb-2">No clients yet</div>
            <p className="text-sm text-text-muted">
              Convert leads to clients from the Leads inbox.
            </p>
          </>
        }
      >
        {MOCK_CLIENTS.map((c) => (
          <AdminTableRow key={c.id}>
            <AdminTableCell>
              <Link
                href={`/admin/clients/${c.id}`}
                className="flex items-center gap-3 group"
              >
                <Avatar name={c.fullName} photoUrl={c.avatarUrl} size="sm" />
                <div className="min-w-0">
                  <div className="font-medium group-hover:text-accent transition-colors">
                    {c.fullName}
                  </div>
                  <div className="text-[10px] text-text-muted font-mono mt-0.5">
                    Joined {c.joinedAt}
                  </div>
                </div>
              </Link>
            </AdminTableCell>

            <AdminTableCell>
              <div className="flex flex-col gap-1">
                <a
                  href={`mailto:${c.email}`}
                  className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-accent transition-colors"
                >
                  <Mail size={10} />
                  <span className="truncate max-w-[140px]">{c.email}</span>
                </a>
                {c.phone && (
                  <a
                    href={`tel:${c.phone}`}
                    className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-accent transition-colors"
                  >
                    <Phone size={10} />
                    {c.phone}
                  </a>
                )}
              </div>
            </AdminTableCell>

            <AdminTableCell>
              {c.activePlan ? (
                <div>
                  <div className="text-sm">{c.activePlan}</div>
                  {c.planStartDate && (
                    <div className="text-[10px] text-text-muted font-mono mt-0.5">
                      Since {c.planStartDate}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-xs text-text-muted font-mono uppercase tracking-[0.12em]">
                  No plan yet
                </span>
              )}
            </AdminTableCell>

            <AdminTableCell>
              {c.assignedCoachName ? (
                <span className="text-xs">{c.assignedCoachName}</span>
              ) : (
                <span className="text-xs text-text-muted">—</span>
              )}
            </AdminTableCell>

            <AdminTableCell>
              {scoreByName[c.fullName] ? (
                <ScoreCell
                  score={scoreByName[c.fullName].score}
                  delta={scoreByName[c.fullName].delta}
                  trend={scoreByName[c.fullName].trend}
                />
              ) : (
                <span className="text-xs text-text-muted font-mono">—</span>
              )}
            </AdminTableCell>

            <AdminTableCell>
              {c.dayNumber ? (
                <span className="font-mono text-xs font-bold text-accent">
                  D{c.dayNumber}
                </span>
              ) : (
                <span className="text-xs text-text-muted">—</span>
              )}
            </AdminTableCell>

            <AdminTableCell>
              {c.lastCheckIn ? (
                <div className="text-xs font-mono text-text-muted">{c.lastCheckIn}</div>
              ) : (
                <span className="text-[10px] text-amber font-mono uppercase tracking-[0.12em] font-bold">
                  Never
                </span>
              )}
            </AdminTableCell>

            <AdminTableCell>
              <ClientStatusBadge status={c.status} />
            </AdminTableCell>
          </AdminTableRow>
        ))}
      </AdminTable>
    </>
  );
}

function ClientStatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
    active: 'success',
    onboarding: 'warning',
    paused: 'info',
    completed: 'neutral',
    cancelled: 'danger',
  };
  const labelMap: Record<string, string> = {
    active: 'Active',
    onboarding: 'Onboarding',
    paused: 'Paused',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return (
    <StatusBadge
      status={labelMap[status] || status}
      variant={variantMap[status] || 'neutral'}
    />
  );
}

function ScoreCell({
  score,
  delta,
  trend,
}: {
  score: number;
  delta: number;
  trend: 'up' | 'down' | 'flat';
}) {
  const status = scoreStatus(score);
  const color = statusColor(status);
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className="flex items-center gap-2">
      <div
        className="font-display font-bold text-base tabular-nums leading-none"
        style={{ color }}
      >
        {score}
      </div>
      <div
        className="inline-flex items-center gap-0.5 font-mono text-[9px] font-bold"
        style={{ color }}
      >
        <TrendIcon size={9} strokeWidth={2.5} />
        {delta > 0 ? '+' : ''}
        {delta.toFixed(1)}
      </div>
    </div>
  );
}
