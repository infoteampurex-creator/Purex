import { MapPin, Calendar, ExternalLink } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { SpecialistActions } from '@/components/admin/SpecialistActions';
import {
  getAdminSpecialists,
  getSpecialistClients,
} from '@/lib/data/admin-specialists';

export const metadata = { title: 'Admin · Specialists' };

export default async function AdminSpecialistsPage() {
  const { specialists, source } = await getAdminSpecialists();

  // Pull assigned clients per specialist in parallel — small list, low cost.
  // Only on supabase source: mock specialists have no real expert IDs.
  const clientsByExpertId = new Map<string, Awaited<ReturnType<typeof getSpecialistClients>>>();
  if (source === 'supabase') {
    const results = await Promise.all(
      specialists.map((s) =>
        getSpecialistClients(s.id).then((rows) => [s.id, rows] as const)
      )
    );
    results.forEach(([id, rows]) => clientsByExpertId.set(id, rows));
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Team"
        title="Specialists"
        subtitle="The PURE X experts. Manage profiles, Calendly URLs, active status, and client loads."
      />

      <div className="grid md:grid-cols-2 gap-4">
        {specialists.map((s) => {
          const isReal = source === 'supabase';
          return (
            <div
              key={s.id}
              className="relative overflow-hidden rounded-2xl bg-bg-card border border-border p-5 hover:border-border-soft transition-all group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-sm flex-shrink-0"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(198, 255, 61, 0.15), rgba(77, 255, 184, 0.08))',
                      color: '#c6ff3d',
                      border: '1px solid rgba(198, 255, 61, 0.25)',
                    }}
                  >
                    {s.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display font-semibold text-base truncate">
                      {s.name}
                    </div>
                    <div className="text-xs text-text-muted mt-0.5">{s.title}</div>
                    <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-text-muted font-mono uppercase tracking-[0.14em] font-bold">
                      <MapPin size={10} />
                      {s.location || '—'}
                    </div>
                  </div>
                </div>
                {s.isActive ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-mono font-bold uppercase tracking-[0.12em] border border-accent/30 flex-shrink-0">
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-accent"
                      style={{ boxShadow: '0 0 4px rgba(198, 255, 61, 0.8)' }}
                    />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-bg-elevated text-text-muted text-[10px] font-mono font-bold uppercase tracking-[0.12em] border border-border flex-shrink-0">
                    Paused
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-border-soft">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold mb-1">
                    Active
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display font-bold text-xl text-accent">
                      {s.activeClients}
                    </span>
                    <span className="text-xs text-text-muted">clients</span>
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold mb-1">
                    Lifetime
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display font-bold text-xl">
                      {s.clientsTrained}
                    </span>
                    <span className="text-xs text-text-muted">trained</span>
                  </div>
                </div>
              </div>

              {/* Calendly URL */}
              {s.calendlyUrl && (
                <div className="mb-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold mb-1.5">
                    Calendly
                  </div>
                  <a
                    href={s.calendlyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-accent transition-colors truncate max-w-full"
                    title={s.calendlyUrl}
                  >
                    <Calendar size={11} />
                    <span className="truncate font-mono">
                      {s.calendlyUrl.replace('https://', '')}
                    </span>
                    <ExternalLink size={10} className="flex-shrink-0" />
                  </a>
                </div>
              )}

              {/* Actions — wired only when this is a real Supabase row */}
              {isReal ? (
                <SpecialistActions
                  expertId={s.id}
                  initial={{
                    name: s.name,
                    title: s.title,
                    shortRole: s.shortRole,
                    location: s.location ?? '',
                    calendlyUrl: s.calendlyUrl ?? '',
                    photoUrl: '',
                    bioShort: '',
                    clientsTrained: s.clientsTrained,
                    isActive: s.isActive,
                  }}
                  clients={clientsByExpertId.get(s.id) ?? []}
                />
              ) : (
                <div className="rounded-lg border border-border-soft bg-bg-elevated/40 px-3 py-2 text-[10px] text-text-muted font-mono">
                  Edit and View clients are disabled for mock specialists.
                  Seed the experts table in Supabase to enable them.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {source !== 'supabase' && (
        <div className="mt-8 p-4 rounded-xl bg-bg-card border border-border">
          <p className="text-xs text-text-muted leading-relaxed">
            <span className="font-mono text-accent font-bold uppercase tracking-[0.14em]">
              Note
            </span>{' '}
            — Showing fallback data because the experts table is empty (or
            unreachable). Insert rows into <code>public.experts</code> in
            Supabase to enable Edit profile and View clients.
          </p>
        </div>
      )}
    </>
  );
}
