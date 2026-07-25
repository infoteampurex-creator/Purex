'use client';

import { useState } from 'react';
import { LineChart, Calendar } from 'lucide-react';
import { ProgressPageView } from './ProgressPageView';
import { YearlyView } from './YearlyView';
import type {
  ProgressData,
  StrengthPR,
  YearlyProgress,
} from '@/lib/data/progress';
import { cn } from '@/lib/cn';

/**
 * Tab wrapper for the Progress page. Two views:
 *   - "Trend" — the existing 30/60/90-day Whoop-style hub
 *   - "Year"  — 12 monthly tiles + drill-down, added 2026-07-16
 *
 * State is local — the two datasets are both hydrated on the server
 * and passed in as props, so switching tabs is instant (no fetch).
 */
export function ProgressTabs({
  data,
  strengthPRs,
  yearly,
}: {
  data: ProgressData;
  strengthPRs: StrengthPR[];
  yearly: YearlyProgress;
}) {
  const [tab, setTab] = useState<'trend' | 'year'>('trend');

  return (
    <>
      {/* Segmented control */}
      <div
        className="rounded-full p-1 flex gap-1 mb-5"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
        role="tablist"
      >
        <TabButton
          active={tab === 'trend'}
          onClick={() => setTab('trend')}
          icon={<LineChart size={13} />}
          label="Trend"
        />
        <TabButton
          active={tab === 'year'}
          onClick={() => setTab('year')}
          icon={<Calendar size={13} />}
          label="Year"
        />
      </div>

      {tab === 'trend' ? (
        <ProgressPageView data={data} strengthPRs={strengthPRs} />
      ) : (
        <YearlyView data={yearly} />
      )}
    </>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="tab"
      aria-selected={active}
      className={cn(
        'flex-1 h-10 rounded-full font-mono uppercase tracking-[0.18em] font-bold inline-flex items-center justify-center gap-2 transition-all',
        active
          ? 'text-bg'
          : 'text-text-muted hover:text-text'
      )}
      style={{
        fontSize: 11,
        background: active
          ? 'linear-gradient(135deg, #c6ff3d 0%, #a8e60a 100%)'
          : 'transparent',
      }}
    >
      {icon}
      {label}
    </button>
  );
}
