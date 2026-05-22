'use client';

import { motion } from 'framer-motion';
import { Sparkles, Moon, Flame, TrendingUp, Zap } from 'lucide-react';
import type { CoachMission } from '@/lib/data/twin-game';

interface Props {
  mission: CoachMission;
}

const TONE_META: Record<
  CoachMission['tone'],
  { color: string; icon: React.ReactNode; ringColor: string }
> = {
  rest: {
    color: '#a78bfa',
    icon: <Moon size={13} />,
    ringColor: 'rgba(167, 139, 250, 0.30)',
  },
  build: {
    color: '#c6ff3d',
    icon: <Zap size={13} />,
    ringColor: 'rgba(198, 255, 61, 0.30)',
  },
  celebrate: {
    color: '#ffd24d',
    icon: <Flame size={13} />,
    ringColor: 'rgba(255, 210, 77, 0.32)',
  },
  calibrate: {
    color: '#7dd3ff',
    icon: <Sparkles size={13} />,
    ringColor: 'rgba(125, 211, 255, 0.30)',
  },
};

/**
 * AI Coach mission notification — sits on the Twin Clone card. Reads
 * like a system notification ("Coach pinged you"), not a passive
 * status line. The colour treatment shifts by mission tone so the
 * card visually warns vs celebrates.
 */
export function AiCoachCard({ mission }: Props) {
  const meta = TONE_META[mission.tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: `
          linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%),
          linear-gradient(180deg, #0e1410 0%, #0a0c09 100%)
        `,
        border: `1px solid ${meta.ringColor}`,
        boxShadow: `0 0 0 1px ${meta.ringColor}, 0 8px 20px rgba(0,0,0,0.4)`,
      }}
    >
      {/* Tone accent strip */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{
          background: `linear-gradient(180deg, ${meta.color} 0%, transparent 100%)`,
          boxShadow: `0 0 12px ${meta.color}`,
        }}
      />

      <div className="pl-4 pr-4 py-3 flex items-start gap-3">
        {/* Coach avatar — small circular hologram */}
        <div
          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center relative"
          style={{
            background: `radial-gradient(circle, ${meta.color}26 0%, transparent 70%)`,
            border: `1px solid ${meta.ringColor}`,
          }}
        >
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ color: meta.color, filter: `drop-shadow(0 0 4px ${meta.color})` }}
          >
            {meta.icon}
          </motion.div>
        </div>

        {/* Message */}
        <div className="min-w-0 flex-1">
          <div
            className="font-mono text-[9px] uppercase tracking-[0.22em] font-bold mb-0.5"
            style={{ color: meta.color }}
          >
            AI Coach
          </div>
          <div
            className="font-display font-semibold leading-tight"
            style={{ fontSize: 14, color: '#f5f5f0' }}
          >
            {mission.headline}
          </div>
          <div
            className="leading-relaxed mt-1"
            style={{ fontSize: 12, color: 'rgba(245,245,240,0.65)' }}
          >
            {mission.body}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
