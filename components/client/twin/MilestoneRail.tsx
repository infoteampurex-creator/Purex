'use client';

import { motion } from 'framer-motion';
import { Lock, Check } from 'lucide-react';
import { MILESTONE_RAIL } from '@/lib/data/twin-game';

interface Props {
  /** Streak days. Determines which milestones are unlocked. */
  streakDays: number;
}

/**
 * 4-stop transformation timeline: Rookie → Builder → Warrior → Prime.
 * A milestone unlocks once the user's streak reaches its day-count.
 * Currently a passive display; tap-to-detail is a future iteration.
 */
export function MilestoneRail({ streakDays }: Props) {
  return (
    <div className="space-y-2">
      {MILESTONE_RAIL.map((m, i) => {
        const unlocked = streakDays >= m.day;
        const isNext =
          !unlocked &&
          MILESTONE_RAIL.slice(0, i).every((prev) => streakDays >= prev.day);
        const progress = unlocked
          ? 1
          : isNext
          ? Math.min(1, streakDays / m.day)
          : 0;

        return (
          <motion.div
            key={m.day}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.08 * i, ease: 'easeOut' }}
            className="flex items-center gap-3"
          >
            {/* Day badge */}
            <div
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: unlocked
                  ? `linear-gradient(135deg, ${m.color}33 0%, ${m.color}10 100%)`
                  : 'rgba(255,255,255,0.02)',
                border: `1px solid ${unlocked ? `${m.color}66` : 'rgba(255,255,255,0.06)'}`,
                boxShadow: unlocked ? `0 0 12px ${m.color}33` : undefined,
              }}
            >
              {unlocked ? (
                <Check size={14} style={{ color: m.color }} />
              ) : (
                <Lock size={12} style={{ color: 'rgba(255,255,255,0.25)' }} />
              )}
            </div>

            {/* Label column */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span
                  className="font-mono uppercase tracking-[0.18em] font-bold"
                  style={{
                    fontSize: 11,
                    color: unlocked ? m.color : 'rgba(255,255,255,0.55)',
                  }}
                >
                  Day {m.day} · {m.label}
                </span>
              </div>
              <div
                className="font-mono uppercase tracking-[0.12em]"
                style={{
                  fontSize: 9,
                  color: 'rgba(255,255,255,0.40)',
                  marginTop: 1,
                }}
              >
                {m.subLabel}
              </div>
              {/* Progress bar — only shown for "next" milestone */}
              {isNext && (
                <div
                  className="mt-1.5 h-0.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
                    style={{
                      backgroundColor: m.color,
                      boxShadow: `0 0 6px ${m.color}`,
                    }}
                  />
                </div>
              )}
            </div>

            {/* Right-side status */}
            <div
              className="font-mono uppercase tracking-[0.16em] font-bold"
              style={{
                fontSize: 9,
                color: unlocked
                  ? m.color
                  : isNext
                  ? 'rgba(255,255,255,0.5)'
                  : 'rgba(255,255,255,0.25)',
              }}
            >
              {unlocked ? 'UNLOCKED' : isNext ? 'IN RANGE' : 'LOCKED'}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
