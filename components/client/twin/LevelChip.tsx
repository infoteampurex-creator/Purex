'use client';

import { motion } from 'framer-motion';
import type { LevelInfo } from '@/lib/data/twin-game';

interface Props {
  info: LevelInfo;
  /** Optional accent for the XP fill — defaults to brand lime. */
  color?: string;
}

/**
 * Compact "LV X · 420 / 500 XP" pill with an animated XP fill bar.
 * Drops into the top-left of the Twin Clone hero card.
 */
export function LevelChip({ info, color = '#c6ff3d' }: Props) {
  return (
    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
      <span
        className="font-mono text-[10px] uppercase tracking-[0.18em] font-bold"
        style={{ color }}
      >
        LV {info.level}
      </span>
      <span className="w-px h-3 bg-white/10" />
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted tabular-nums">
        {info.currentLevelXp}/{info.nextLevelXp} XP
      </span>
      <div className="ml-0.5 w-12 h-1 rounded-full bg-white/[0.05] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${info.progress * 100}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
        />
      </div>
    </div>
  );
}
