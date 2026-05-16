'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Search,
  Mail,
  Phone,
  ShieldCheck,
  ShieldX,
  PauseCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { setParticipantStatus } from '@/lib/actions/mother-strong';
import {
  type AdminParticipant,
  type ParticipantStatus,
  GOAL_OPTIONS,
} from '@/lib/data/mother-strong-types';

const GOAL_LABEL: Record<string, string> = Object.fromEntries(
  GOAL_OPTIONS.map((g) => [g.value, g.label])
);

export function ParticipantsTable({
  participants,
}: {
  participants: AdminParticipant[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return participants;
    return participants.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.displayId.toLowerCase().includes(q) ||
        p.whatsapp.includes(q) ||
        p.city.toLowerCase().includes(q)
    );
  }, [participants, search]);

  const onStatus = (id: string, status: ParticipantStatus) => {
    setPendingId(id);
    setErrorMsg(null);
    startTransition(async () => {
      const r = await setParticipantStatus({ participantId: id, status });
      setPendingId(null);
      if (!r.ok) {
        setErrorMsg(r.error);
        return;
      }
      router.refresh();
    });
  };

  if (participants.length === 0) {
    return (
      <div className="rounded-2xl bg-bg-card border border-border p-10 text-center">
        <div className="font-display font-semibold text-lg">
          No participants yet
        </div>
        <p className="text-sm text-text-muted mt-2">
          Share the registration link — they'll start showing up here.
        </p>
        <a
          href="/mother-strong"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-5 h-10 px-4 rounded-full bg-accent text-bg text-sm font-semibold hover:bg-accent-hover transition-colors"
        >
          Open registration page
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, PX-id, WhatsApp, city…"
            className="w-full h-10 pl-9 pr-3 rounded-full bg-bg-elevated border border-border text-sm focus:border-accent focus:outline-none transition-colors"
          />
        </div>
        <div className="text-xs text-text-muted font-mono uppercase tracking-[0.14em]">
          {filtered.length} of {participants.length}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-xs">
          {errorMsg}
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl bg-bg-card border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr
              className="border-b border-border"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              {[
                'ID',
                'Name',
                'Contact',
                'City / State',
                'Goal',
                'Age',
                'Status',
                'Actions',
              ].map((h) => (
                <th
                  key={h}
                  className="text-left py-3 px-4 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.id}
                className={cn(
                  'border-b border-border-soft last:border-0 hover:bg-bg-elevated/50 transition-colors',
                  pendingId === p.id && 'opacity-60'
                )}
              >
                <td className="py-3 px-4 font-mono text-xs font-bold text-accent">
                  {p.displayId}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2 min-w-0">
                    {p.photoUrl ? (
                      <div className="relative w-7 h-7 rounded-full overflow-hidden bg-bg-elevated flex-shrink-0">
                        <Image
                          src={p.photoUrl}
                          alt=""
                          fill
                          sizes="28px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-bg-elevated flex items-center justify-center font-mono text-[10px] font-bold text-text-muted flex-shrink-0">
                        {initials(p.fullName)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">
                        {p.fullName}
                      </div>
                      {p.healthCondition && (
                        <div className="text-[10px] text-amber font-mono mt-0.5 truncate max-w-[180px]">
                          ⚠ {p.healthCondition}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-col gap-0.5 text-[11px] text-text-muted">
                    <a
                      href={`https://wa.me/91${p.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:text-accent transition-colors font-mono"
                    >
                      <Phone size={9} />
                      {p.whatsapp}
                    </a>
                    <span className="inline-flex items-center gap-1 text-text-dim">
                      <Mail size={9} />
                      {p.emergencyContactName} · {p.emergencyContactNumber}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-xs">
                  <div>{p.city}</div>
                  <div className="text-text-muted font-mono text-[10px]">
                    {p.state}
                  </div>
                </td>
                <td className="py-3 px-4 text-xs">{GOAL_LABEL[p.goal] ?? p.goal}</td>
                <td className="py-3 px-4 text-xs font-mono">{p.age}</td>
                <td className="py-3 px-4">
                  <StatusPill status={p.status} />
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    {p.status !== 'active' && (
                      <ActionButton
                        label="Activate"
                        icon={<ShieldCheck size={11} />}
                        tone="accent"
                        onClick={() => onStatus(p.id, 'active')}
                        disabled={isPending}
                      />
                    )}
                    {p.status === 'active' && (
                      <>
                        <ActionButton
                          label="Complete"
                          icon={<ShieldCheck size={11} />}
                          tone="success"
                          onClick={() => onStatus(p.id, 'completed')}
                          disabled={isPending}
                        />
                        <ActionButton
                          label="Drop"
                          icon={<ShieldX size={11} />}
                          tone="muted"
                          onClick={() => onStatus(p.id, 'dropped')}
                          disabled={isPending}
                        />
                      </>
                    )}
                    {pendingId === p.id && (
                      <Loader2
                        size={12}
                        className="animate-spin text-text-muted ml-1"
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function StatusPill({ status }: { status: ParticipantStatus }) {
  const map: Record<
    ParticipantStatus,
    { label: string; bg: string; fg: string; border: string; icon: typeof ShieldCheck }
  > = {
    active: {
      label: 'Active',
      bg: 'rgba(198, 255, 61, 0.10)',
      fg: '#c6ff3d',
      border: 'rgba(198, 255, 61, 0.30)',
      icon: ShieldCheck,
    },
    completed: {
      label: 'Completed',
      bg: 'rgba(125, 211, 255, 0.10)',
      fg: '#7dd3ff',
      border: 'rgba(125, 211, 255, 0.30)',
      icon: ShieldCheck,
    },
    dropped: {
      label: 'Dropped',
      bg: 'rgba(160, 166, 154, 0.08)',
      fg: '#a0a69a',
      border: 'rgba(200, 200, 200, 0.20)',
      icon: PauseCircle,
    },
  };
  const s = map[status];
  const Icon = s.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-[0.12em] font-bold border"
      style={{ background: s.bg, color: s.fg, borderColor: s.border }}
    >
      <Icon size={9} />
      {s.label}
    </span>
  );
}

function ActionButton({
  label,
  icon,
  tone,
  onClick,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  tone: 'accent' | 'success' | 'muted';
  onClick: () => void;
  disabled: boolean;
}) {
  const cls = {
    accent: 'border-accent/40 bg-accent/10 text-accent hover:bg-accent/20',
    success: 'border-sky-400/40 bg-sky-400/10 text-sky-300 hover:bg-sky-400/20',
    muted:
      'border-border text-text-muted hover:border-text-muted hover:text-text',
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-1 h-7 px-2 rounded-full border text-[10px] uppercase tracking-[0.1em] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        cls
      )}
    >
      {icon}
      {label}
    </button>
  );
}
