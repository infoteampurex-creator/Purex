'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus, ArrowRight, Activity } from 'lucide-react';
import type { PureXScore } from '@/lib/data/score';
import { statusColor, statusLabel } from '@/lib/data/score';
import { cn } from '@/lib/cn';

interface ScoreWidgetProps {
  score: PureXScore;
}

/**
 * Compact daily PURE X Score widget.
 * Shows the single 0-100 number, 7-day delta, and 5 pillar mini-bars.
 * Clicks through to the full /client/score page.
 */
export function ScoreWidget({ score }: ScoreWidgetProps) {
  const totalStatus = score.total >= 90
    ? 'peak'
    : score.total >= 80
      ? 'strong'
      : score.total >= 65
        ? 'steady'
        : score.total >= 50
          ? 'watch'
          : 'risk';
  const totalColor = statusColor(totalStatus);

  const TrendIcon =
    score.trend === 'up' ? TrendingUp : score.trend === 'down' ? TrendingDown : Minus;

  return (
    <Link
      href="/client/score"
      className="group relative block rounded-2xl bg-bg-card border border-border p-5 md:p-6 hover:border-accent/40 transition-all duration-500 overflow-hidden"
    >
      {/* Ambient glow matching score status */}
      <div
        aria-hidden
        className="absolute -top-16 -left-16 w-56 h-56 rounded-full pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-700"
        style={{
          background: `radial-gradient(circle, ${totalColor}1f 0%, transparent 70%)`,
        }}
      />

      {/* Header row */}
      <div className="flex items-start justify-between mb-4 relative">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-1.5">
            <Activity size={12} strokeWidth={2.5} />
            PURE X Score
          </div>
          <div className="font-mono text-[10px] text-text-muted">
            Daily · {new Date(score.asOf).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
        </div>

        {/* Big number + status */}
        <div className="flex items-baseline gap-2 flex-shrink-0">
          <div className="text-right">
            <div
              className="font-display font-bold text-5xl md:text-6xl leading-none tabular-nums"
              style={{ color: totalColor }}
            >
              {score.total}
            </div>
            <div className="flex items-center justify-end gap-1.5 mt-1">
              <TrendIcon size={11} style={{ color: totalColor }} strokeWidth={2.5} />
              <span
                className="font-mono text-[10px] uppercase tracking-[0.14em] font-bold"
                style={{ color: totalColor }}
              >
                {score.delta > 0 ? '+' : ''}
                {score.delta.toFixed(1)} · {statusLabel(totalStatus)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Morning insight */}
      <div className="mb-5 rounded-xl bg-bg/40 border border-border-soft p-3.5">
        <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent font-bold mb-1.5">
          Morning Brief
        </div>
        <p className="text-sm text-text-muted leading-relaxed">
          {score.morningInsight}
        </p>
      </div>

      {/* 5 pillar mini-bars */}
      <div className="grid grid-cols-5 gap-2">
        {score.pillars.map((pillar) => (
          <div key={pillar.key} className="min-w-0">
            <div
              className="font-display font-bold text-base leading-none tabular-nums mb-1.5"
              style={{ color: pillar.color }}
            >
              {pillar.score}
            </div>
            <div className="h-1 rounded-full bg-bg-elevated overflow-hidden mb-1.5">
              <div
                className="h-full transition-all duration-1000"
                style={{
                  width: `${pillar.score}%`,
                  background: pillar.color,
                  boxShadow: `0 0 6px ${pillar.color}80`,
                }}
              />
            </div>
            <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-text-muted truncate">
              {pillar.label.split(' ')[0]}
            </div>
          </div>
        ))}
      </div>

      {/* View score CTA */}
      <div className="flex items-center justify-end mt-4 pt-3 border-t border-border-soft">
        <div className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold group-hover:gap-2 transition-all">
          Full Breakdown
          <ArrowRight size={11} strokeWidth={2.5} />
        </div>
      </div>
    </Link>
  );
}
