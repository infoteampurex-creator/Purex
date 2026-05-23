'use client';

import { motion } from 'framer-motion';
import {
  TWIN_STAT_META,
  type TwinStats,
  type TwinStatKey,
} from '@/lib/data/twin';

interface Props {
  stats: TwinStats;
  /** Compact mode shrinks padding and font sizes — for tight spaces. */
  compact?: boolean;
}

const STAT_ORDER: TwinStatKey[] = [
  'energy',
  'strength',
  'endurance',
  'recovery',
  'discipline',
];

// Per-stat emoji + label override so the bars feel game-y vs clinical.
const STAT_PRESENTATION: Record<TwinStatKey, { emoji: string; label: string }> = {
  energy:     { emoji: '🔋', label: 'Energy' },
  strength:   { emoji: '🏋️',  label: 'Strength' },
  endurance:  { emoji: '👟', label: 'Endurance' },
  recovery:   { emoji: '💤', label: 'Recovery' },
  discipline: { emoji: '⚖️',  label: 'Discipline' },
};

/**
 * Reference-matching stat bars — emoji icon, label in coloured caps,
 * filled neon bar, big stat number on the right. One row per stat,
 * 5 rows total.
 */
export function EmojiStatBars({ stats, compact = false }: Props) {
  return (
    <div className={compact ? 'space-y-2' : 'space-y-2.5'}>
      {STAT_ORDER.map((key, i) => {
        const meta = TWIN_STAT_META[key];
        const present = STAT_PRESENTATION[key];
        const value = Math.round(stats[key]);
        return (
          <div key={key}>
            <div className="flex items-center justify-between mb-0.5">
              <div
                className="font-mono uppercase tracking-[0.18em] font-bold flex items-center gap-1.5"
                style={{ fontSize: compact ? 9 : 10, color: meta.color }}
              >
                <span>{present.label}</span>
                <span
                  className="inline-block"
                  style={{ fontSize: compact ? 11 : 12, lineHeight: 1 }}
                >
                  {present.emoji}
                </span>
              </div>
              <div
                className="font-display font-bold tabular-nums leading-none"
                style={{ fontSize: compact ? 16 : 18, color: meta.color }}
              >
                {value}
              </div>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: `${meta.color}14` }}
            >
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{
                  duration: 1,
                  delay: 0.15 + i * 0.08,
                  ease: 'easeOut',
                }}
                style={{
                  backgroundColor: meta.color,
                  boxShadow: `0 0 8px ${meta.color}, 0 0 16px ${meta.color}55`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
