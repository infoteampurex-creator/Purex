'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { TwinSilhouette } from './TwinSilhouette';
import { TwinStatsPanel } from './TwinStatsPanel';
import { TwinStatusBadge } from './TwinStatusBadge';
import { AnimatedNumber } from './AnimatedNumber';
import {
  type TwinStats,
  type TwinVisualState,
  twinOverallScore,
} from '@/lib/data/twin';

interface Props {
  stats: TwinStats;
  state: TwinVisualState;
  message: string;
}

export function TwinDashboardCard({ stats, state, message }: Props) {
  const overall = twinOverallScore(stats);
  return (
    <div className="rounded-2xl border border-border bg-bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-2">
          <Sparkles size={11} />
          PureX Twin
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-lg tracking-tight">
              Your live fitness clone
            </h3>
            <div className="mt-2">
              <TwinStatusBadge state={state} compact />
            </div>
          </div>
          <div className="text-right tabular-nums flex-shrink-0">
            <AnimatedNumber value={overall} fontSize={28} />
            <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted font-bold mt-0.5">
              Vitality
            </div>
          </div>
        </div>
      </div>

      {/* Silhouette + compact stats */}
      <div className="px-5 grid grid-cols-[120px_1fr] gap-4 items-center">
        <div className="flex justify-center -my-3">
          <TwinSilhouette stats={stats} state={state} width={120} compact />
        </div>
        <TwinStatsPanel stats={stats} compact />
      </div>

      {/* Message */}
      <div className="mx-5 mt-4 mb-4 px-3 py-2.5 rounded-lg bg-bg-elevated/60 border border-border-soft">
        <p className="text-text leading-relaxed" style={{ fontSize: 13 }}>
          {message}
        </p>
      </div>

      {/* CTA */}
      <Link
        href="/client/twin"
        className="flex items-center justify-between px-5 py-3 border-t border-border-soft text-accent hover:bg-accent/5 transition-colors font-mono text-[11px] uppercase tracking-[0.18em] font-bold"
      >
        Open full Twin view
        <ArrowRight size={13} />
      </Link>
    </div>
  );
}
