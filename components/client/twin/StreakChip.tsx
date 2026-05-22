'use client';

import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface Props {
  days: number;
}

/**
 * Streak count with a softly-pulsing flame. Color shifts from gray
 * (no streak) → orange (1-2 days) → lime accent (3+ days, streak
 * achievement unlocked).
 */
export function StreakChip({ days }: Props) {
  const color = days >= 3 ? '#c6ff3d' : days >= 1 ? '#ff8a4d' : '#a0a69a';
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
      <motion.div
        animate={
          days > 0
            ? { scale: [1, 1.15, 1], opacity: [0.85, 1, 0.85] }
            : undefined
        }
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ color, filter: days > 0 ? `drop-shadow(0 0 4px ${color})` : undefined }}
      >
        <Flame size={12} />
      </motion.div>
      <span
        className="font-mono text-[10px] uppercase tracking-[0.18em] font-bold tabular-nums"
        style={{ color }}
      >
        {days}
      </span>
    </div>
  );
}
