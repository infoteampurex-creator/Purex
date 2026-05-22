'use client';

import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import type { ProjectedDelta } from '@/lib/data/twin-game';

interface Props {
  deltas: ProjectedDelta[];
}

/**
 * 3-column row of projected stat lifts (Strength / Endurance /
 * Recovery). Each pill shows today → future with a delta badge.
 */
export function ProjectedMetrics({ deltas }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {deltas.map((d, i) => (
        <motion.div
          key={d.label}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 + i * 0.08, ease: 'easeOut' }}
          className="rounded-xl p-2.5"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            className="font-mono uppercase tracking-[0.14em] font-bold"
            style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)' }}
          >
            {d.label}
          </div>
          <div className="flex items-baseline gap-1 mt-1.5 tabular-nums">
            <span
              className="font-display"
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.40)',
              }}
            >
              {d.todayValue}
            </span>
            <span
              className="font-mono"
              style={{ fontSize: 10, color: 'rgba(255,255,255,0.30)' }}
            >
              →
            </span>
            <span
              className="font-display font-bold"
              style={{ fontSize: 14, color: '#ffd24d' }}
            >
              {d.futureValue}
            </span>
          </div>
          {d.positive && (
            <div
              className="inline-flex items-center gap-0.5 mt-1.5 px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: 'rgba(198, 255, 61, 0.10)',
                color: '#c6ff3d',
              }}
            >
              <TrendingUp size={9} />
              <span
                className="font-mono font-bold tabular-nums"
                style={{ fontSize: 9 }}
              >
                {d.delta}
              </span>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
