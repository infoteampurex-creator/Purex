'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Flame,
  Sparkles,
  Snowflake,
} from 'lucide-react';
import type {
  ClientAnalytics,
  RiskTier,
} from '@/lib/data/coach-analytics';

interface Props {
  clients: ClientAnalytics[];
}

type Filter = 'attention' | 'all' | 'peak';

const TIER_META: Record<
  RiskTier,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  peak: {
    label: 'Peak',
    color: '#c6ff3d',
    bg: 'rgba(198,255,61,0.10)',
    icon: <Flame size={11} />,
  },
  active: {
    label: 'Active',
    color: '#7dd3ff',
    bg: 'rgba(125,211,255,0.10)',
    icon: <Sparkles size={11} />,
  },
  cooling: {
    label: 'Cooling',
    color: '#ffd24d',
    bg: 'rgba(255,210,77,0.10)',
    icon: <Snowflake size={11} />,
  },
  slipping: {
    label: 'Slipping',
    color: '#ff8a4d',
    bg: 'rgba(255,138,77,0.12)',
    icon: <AlertTriangle size={11} />,
  },
  'at-risk': {
    label: 'At risk',
    color: '#ff6b6b',
    bg: 'rgba(255,107,107,0.14)',
    icon: <AlertTriangle size={11} />,
  },
  lost: {
    label: 'Lost',
    color: '#7a7a7a',
    bg: 'rgba(122,122,122,0.10)',
    icon: <AlertTriangle size={11} />,
  },
};

/**
 * "Who needs attention today" leaderboard. Renders on the admin
 * dashboard. Default filter is 'attention' (slipping / at-risk /
 * lost) so the coach's first view puts urgent clients at the top.
 *
 * Rows link straight into the client-detail page where the coach
 * can hit Send Nudge without navigating through the roster first.
 */
export function CoachLeaderboard({ clients }: Props) {
  const [filter, setFilter] = useState<Filter>('attention');

  const filtered = useMemo(() => {
    if (filter === 'peak') {
      return clients.filter(
        (c) => c.riskTier === 'peak' || c.riskTier === 'active'
      );
    }
    if (filter === 'attention') {
      return clients.filter(
        (c) =>
          c.riskTier === 'slipping' ||
          c.riskTier === 'at-risk' ||
          c.riskTier === 'lost'
      );
    }
    return clients;
  }, [clients, filter]);

  const counts = useMemo(
    () => ({
      attention: clients.filter(
        (c) =>
          c.riskTier === 'slipping' ||
          c.riskTier === 'at-risk' ||
          c.riskTier === 'lost'
      ).length,
      all: clients.length,
      peak: clients.filter(
        (c) => c.riskTier === 'peak' || c.riskTier === 'active'
      ).length,
    }),
    [clients]
  );

  return (
    <section className="rounded-2xl border border-border bg-bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 md:p-5 border-b border-border">
        <div className="min-w-0">
          <div
            className="font-mono uppercase tracking-[0.22em] font-bold mb-1"
            style={{ fontSize: 10, color: '#c6ff3d' }}
          >
            Coach Analytics
          </div>
          <h2 className="font-display font-semibold text-lg tracking-tight">
            Who needs attention today
          </h2>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-1.5 p-3 border-b border-border overflow-x-auto">
        <FilterChip
          label="Needs attention"
          count={counts.attention}
          active={filter === 'attention'}
          onClick={() => setFilter('attention')}
          color="#ff8a4d"
        />
        <FilterChip
          label="Peak & active"
          count={counts.peak}
          active={filter === 'peak'}
          onClick={() => setFilter('peak')}
          color="#c6ff3d"
        />
        <FilterChip
          label="All clients"
          count={counts.all}
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          color="#7dd3ff"
        />
      </div>

      {/* Rows */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center">
          <div
            className="inline-flex w-11 h-11 items-center justify-center rounded-xl mb-3"
            style={{
              background: 'rgba(198,255,61,0.10)',
              border: '1px solid rgba(198,255,61,0.28)',
              color: '#c6ff3d',
            }}
          >
            <Sparkles size={18} />
          </div>
          <p className="text-sm text-text-muted">
            {filter === 'attention'
              ? 'Everyone is logged in and on track. Great work.'
              : filter === 'peak'
                ? 'No clients in Peak or Active tier yet — as your clients build streaks, they\'ll appear here.'
                : 'No clients yet. Once you onboard your first client, they\'ll show up here.'}
          </p>
        </div>
      ) : (
        <ul>
          {filtered.map((c, i) => (
            <ClientRow key={c.clientId} client={c} index={i} />
          ))}
        </ul>
      )}
    </section>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
  color,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-shrink-0 rounded-full px-3 py-1.5 border transition-colors"
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: active ? '#0a0c09' : 'rgba(245,245,240,0.72)',
        background: active ? color : 'transparent',
        borderColor: active ? color : 'rgba(255,255,255,0.10)',
      }}
    >
      {label}
      <span
        className="ml-1.5 tabular-nums"
        style={{
          fontSize: 10,
          opacity: active ? 0.75 : 0.55,
        }}
      >
        {count}
      </span>
    </button>
  );
}

function ClientRow({
  client,
  index,
}: {
  client: ClientAnalytics;
  index: number;
}) {
  const meta = TIER_META[client.riskTier];
  const initials = client.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: Math.min(0.02 * index, 0.3),
        duration: 0.25,
        ease: 'easeOut',
      }}
      className="border-b border-border last:border-b-0"
    >
      <Link
        href={`/admin/clients/${client.clientId}`}
        className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
      >
        {/* Avatar */}
        <div
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
          style={{
            background: meta.bg,
            border: `1px solid ${meta.color}30`,
            color: meta.color,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {client.avatarUrl ? (
            <img
              src={client.avatarUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            initials || '?'
          )}
        </div>

        {/* Name + last activity */}
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm truncate">
            {client.fullName}
          </div>
          <div
            className="mt-0.5 flex items-center gap-1.5"
            style={{ fontSize: 11, color: 'rgba(245,245,240,0.55)' }}
          >
            <span>{lastActivityLabel(client.daysSinceLastActivity)}</span>
            {client.currentStreakDays > 0 ? (
              <>
                <span style={{ opacity: 0.4 }}>·</span>
                <span
                  className="inline-flex items-center gap-0.5"
                  style={{ color: meta.color }}
                >
                  <Flame size={10} />
                  {client.currentStreakDays}d
                </span>
              </>
            ) : null}
          </div>
        </div>

        {/* Tier badge */}
        <div
          className="flex-shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 border font-mono uppercase tracking-[0.14em] font-bold"
          style={{
            fontSize: 9.5,
            color: meta.color,
            background: meta.bg,
            borderColor: `${meta.color}38`,
          }}
        >
          {meta.icon}
          {meta.label}
        </div>

        <ArrowRight
          size={14}
          className="text-text-muted flex-shrink-0"
        />
      </Link>
    </motion.li>
  );
}

function lastActivityLabel(days: number | null): string {
  if (days == null) return 'Never logged';
  if (days === 0) return 'Active today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return `~${Math.round(days / 7)} week ago`;
  return `${days} days ago`;
}
