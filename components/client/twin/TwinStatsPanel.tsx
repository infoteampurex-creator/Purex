'use client';

import { motion } from 'framer-motion';
import { type TwinStats, TWIN_STAT_META, type TwinStatKey } from '@/lib/data/twin';

interface Props {
  stats: TwinStats;
  /** Optional projected stats — shown as a ghost overlay on each bar. */
  projected?: TwinStats;
  /** Compact mode strips the source-of-data caption under each bar. */
  compact?: boolean;
}

const ORDER: TwinStatKey[] = [
  'energy',
  'strength',
  'endurance',
  'recovery',
  'discipline',
];

export function TwinStatsPanel({ stats, projected, compact }: Props) {
  return (
    <div className={compact ? 'space-y-2.5' : 'space-y-4'}>
      {ORDER.map((key) => {
        const meta = TWIN_STAT_META[key];
        const value = stats[key];
        const projectedValue = projected?.[key];
        return (
          <div key={key}>
            <div className="flex items-baseline justify-between mb-1.5">
              <div
                className="font-mono uppercase tracking-[0.16em] font-bold"
                style={{ fontSize: compact ? 10 : 11, color: meta.color }}
              >
                {meta.label}
              </div>
              <div className="flex items-baseline gap-1.5 tabular-nums">
                <span
                  className="font-display font-bold"
                  style={{
                    fontSize: compact ? 14 : 16,
                    color: meta.color,
                  }}
                >
                  {Math.round(value)}
                </span>
                {projectedValue != null && projectedValue !== value && (
                  <span
                    className="font-mono text-text-muted"
                    style={{ fontSize: 11 }}
                  >
                    → {Math.round(projectedValue)}
                  </span>
                )}
              </div>
            </div>

            {/* Bar */}
            <div
              className="relative w-full rounded-full overflow-hidden bg-bg-elevated"
              style={{ height: compact ? 5 : 7 }}
            >
              {/* Today */}
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: meta.color, boxShadow: `0 0 8px ${meta.color}` }}
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
              />
              {/* Projected ghost — sits above the today fill */}
              {projectedValue != null && projectedValue > value && (
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full pointer-events-none"
                  style={{
                    background: meta.color,
                    opacity: 0.25,
                    boxShadow: `0 0 12px ${meta.color}`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${projectedValue}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.15 }}
                />
              )}
            </div>

            {!compact && (
              <div
                className="text-text-dim mt-1.5 leading-relaxed"
                style={{ fontSize: 12 }}
              >
                {meta.source}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
