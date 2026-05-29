'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Activity,
  ChevronRight,
  Search,
  CheckCircle2,
} from 'lucide-react';
import {
  FLAG_META,
  type RadarClient,
  type RadarPayload,
  type AttentionFlag,
} from '@/lib/data/coach-radar';

interface Props {
  payload: RadarPayload;
}

type FilterKey = 'attention' | 'quiet' | 'all';

/**
 * CoachRadarView — admin client-attention queue.
 *
 * Layout:
 *   • Totals strip (Needs attention / Quiet / Total)
 *   • Filter tabs (Needs attention / Quiet / All) + search
 *   • Client cards, sorted by attentionScore desc
 *     - Avatar / initial
 *     - Name + email
 *     - Stats row: streak, last log, last workout, 7d avg
 *     - Flag chips (red/yellow/grey by severity)
 *     - Tap row → /admin/clients/{id} for full detail
 */
export function CoachRadarView({ payload }: Props) {
  const [filter, setFilter] = useState<FilterKey>('attention');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return payload.clients.filter((c) => {
      if (filter === 'attention' && c.attentionScore < 3) return false;
      if (filter === 'quiet' && c.attentionScore >= 1) return false;
      if (q && !c.fullName.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [payload.clients, filter, query]);

  return (
    <div className="space-y-5">
      {/* ─── Totals strip ─── */}
      <section className="grid grid-cols-3 gap-3">
        <TotalCard
          label="Needs attention"
          value={payload.totals.needsAttention}
          color="#ff8a4d"
          icon={AlertTriangle}
        />
        <TotalCard
          label="Quiet"
          value={payload.totals.quiet}
          color="#c6ff3d"
          icon={CheckCircle2}
        />
        <TotalCard
          label="Total clients"
          value={payload.totals.total}
          color="#7dd3ff"
          icon={Activity}
        />
      </section>

      {/* ─── Filter tabs + search ─── */}
      <section className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1.5">
          <FilterChip
            label={`Attention (${payload.totals.needsAttention})`}
            active={filter === 'attention'}
            color="#ff8a4d"
            onClick={() => setFilter('attention')}
          />
          <FilterChip
            label={`Quiet (${payload.totals.quiet})`}
            active={filter === 'quiet'}
            color="#c6ff3d"
            onClick={() => setFilter('quiet')}
          />
          <FilterChip
            label={`All (${payload.totals.total})`}
            active={filter === 'all'}
            color="#7dd3ff"
            onClick={() => setFilter('all')}
          />
        </div>
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2 flex-1"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Search size={14} style={{ color: 'rgba(255,255,255,0.50)' }} />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-dim"
          />
        </div>
      </section>

      {/* ─── Client list ─── */}
      {filtered.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <ul className="space-y-2">
          {filtered.map((c) => (
            <li key={c.id}>
              <ClientRow client={c} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────

function TotalCard({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ComponentType<{ size?: number }>;
}) {
  return (
    <div
      className="rounded-2xl border px-4 py-3.5"
      style={{
        background: `${color}0E`,
        borderColor: `${color}33`,
      }}
    >
      <div
        className="inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.14em] font-bold"
        style={{ fontSize: 9, color }}
      >
        <Icon size={11} />
        {label}
      </div>
      <div
        className="font-display font-bold tabular-nums leading-none mt-2"
        style={{ fontSize: 28, color: 'rgba(245,245,240,0.95)' }}
      >
        {value}
      </div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono uppercase tracking-[0.14em] font-bold transition-colors border"
      style={{
        fontSize: 10,
        color: active ? '#0a0c09' : color,
        backgroundColor: active ? color : `${color}14`,
        borderColor: active ? color : `${color}33`,
      }}
    >
      {label}
    </button>
  );
}

function ClientRow({ client }: { client: RadarClient }) {
  const initials =
    (client.fullName ?? client.email)
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join('') || '?';

  return (
    <Link
      href={`/admin/clients/${client.id}`}
      className="block rounded-2xl border px-4 py-3 transition-colors hover:bg-white/[0.02]"
      style={{
        background:
          client.attentionScore >= 5
            ? 'rgba(255,107,107,0.04)'
            : client.attentionScore >= 3
              ? 'rgba(255,138,77,0.04)'
              : 'rgba(255,255,255,0.02)',
        borderColor:
          client.attentionScore >= 5
            ? 'rgba(255,107,107,0.30)'
            : client.attentionScore >= 3
              ? 'rgba(255,138,77,0.28)'
              : 'rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center font-display font-bold flex-shrink-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(198,255,61,0.18) 0%, rgba(255,138,77,0.10) 100%)',
            border: '1px solid rgba(255,255,255,0.10)',
            color: '#c6ff3d',
            fontSize: 14,
          }}
        >
          {client.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={client.avatarUrl}
              alt={client.fullName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>

        {/* Main */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <div
              className="font-semibold leading-tight truncate"
              style={{ fontSize: 14, color: 'rgba(245,245,240,0.95)' }}
            >
              {client.fullName}
            </div>
            {client.attentionScore > 0 && (
              <span
                className="font-mono uppercase tracking-[0.14em] font-bold px-1.5 py-0.5 rounded"
                style={{
                  fontSize: 9,
                  color:
                    client.attentionScore >= 5
                      ? '#ff6b6b'
                      : client.attentionScore >= 3
                        ? '#ff8a4d'
                        : '#ffd24d',
                  background:
                    client.attentionScore >= 5
                      ? 'rgba(255,107,107,0.12)'
                      : client.attentionScore >= 3
                        ? 'rgba(255,138,77,0.10)'
                        : 'rgba(255,210,77,0.10)',
                }}
              >
                Score {client.attentionScore}
              </span>
            )}
          </div>
          <div
            className="font-mono mt-0.5 truncate"
            style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}
          >
            {client.email}
          </div>

          {/* Stats row */}
          <div
            className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 font-mono"
            style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}
          >
            <span>
              <span style={{ color: 'rgba(255,255,255,0.40)' }}>streak</span>{' '}
              <span style={{ color: '#c6ff3d', fontWeight: 600 }}>
                {client.currentStreakDays}d
              </span>
            </span>
            {client.avgScore7d !== null && (
              <span>
                <span style={{ color: 'rgba(255,255,255,0.40)' }}>7d avg</span>{' '}
                <span
                  style={{
                    color:
                      client.avgScore7d >= 70
                        ? '#c6ff3d'
                        : client.avgScore7d >= 50
                          ? '#ffd24d'
                          : '#ff8a4d',
                    fontWeight: 600,
                  }}
                >
                  {client.avgScore7d}
                </span>
              </span>
            )}
            <span>
              <span style={{ color: 'rgba(255,255,255,0.40)' }}>last log</span>{' '}
              <span style={{ fontWeight: 600 }}>
                {client.daysSinceLastLog === null
                  ? '—'
                  : client.daysSinceLastLog === 0
                    ? 'today'
                    : `${client.daysSinceLastLog}d`}
              </span>
            </span>
            <span>
              <span style={{ color: 'rgba(255,255,255,0.40)' }}>last workout</span>{' '}
              <span style={{ fontWeight: 600 }}>
                {client.daysSinceLastWorkout === null
                  ? '—'
                  : client.daysSinceLastWorkout === 0
                    ? 'today'
                    : `${client.daysSinceLastWorkout}d`}
              </span>
            </span>
          </div>

          {/* Flag chips */}
          {client.flags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {client.flags.map((f) => {
                const meta = FLAG_META[f];
                return (
                  <span
                    key={f}
                    className="font-mono uppercase tracking-[0.10em] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      fontSize: 8,
                      color: meta.color,
                      background: `${meta.color}14`,
                    }}
                  >
                    {meta.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <ChevronRight
          size={16}
          style={{ color: 'rgba(255,255,255,0.40)', flexShrink: 0 }}
        />
      </div>
    </Link>
  );
}

function EmptyState({ filter }: { filter: FilterKey }) {
  const copy = (() => {
    switch (filter) {
      case 'attention':
        return {
          title: 'No clients need attention',
          sub: 'Everyone is logging and training. Take a breath — you can browse All clients with the chip above.',
          icon: CheckCircle2,
          color: '#c6ff3d',
        };
      case 'quiet':
        return {
          title: 'No quiet clients',
          sub: 'All clients have at least one attention flag today.',
          icon: AlertTriangle,
          color: '#ff8a4d',
        };
      default:
        return {
          title: 'No clients matched',
          sub: 'Adjust the search term or filter.',
          icon: Search,
          color: '#7dd3ff',
        };
    }
  })();

  const Icon = copy.icon;

  return (
    <div
      className="rounded-3xl border p-8 text-center"
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      <div
        className="inline-flex w-14 h-14 items-center justify-center rounded-2xl mb-4"
        style={{
          background: `${copy.color}0E`,
          border: `1px solid ${copy.color}33`,
          color: copy.color,
        }}
      >
        <Icon size={20} />
      </div>
      <h3 className="font-display font-semibold text-lg tracking-tight mb-1">
        {copy.title}
      </h3>
      <p
        className="max-w-md mx-auto leading-relaxed"
        style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}
      >
        {copy.sub}
      </p>
    </div>
  );
}

// Silence unused-import lint for AttentionFlag (used as type in props chain)
void ({} as AttentionFlag);
