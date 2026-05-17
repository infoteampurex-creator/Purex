'use client';

import { motion } from 'framer-motion';
import {
  Zap,
  Moon,
  Sparkles,
  Crown,
  Flame,
  Compass,
} from 'lucide-react';
import {
  TWIN_STATUS_LABEL,
  TWIN_STATUS_TAGLINE,
  type TwinVisualState,
} from '@/lib/data/twin';

interface Props {
  state: TwinVisualState;
  /** Compact mode strips the tagline + reduces padding. */
  compact?: boolean;
}

/**
 * Status pill for the Twin. Communicates the *current mood* of the
 * digital athlete identity in 2 lines — a colour-coded short label
 * and a present-tense tagline. Replaces the previous raw state
 * name ("focused", "charged") with brand-aligned labels.
 */
export function TwinStatusBadge({ state, compact }: Props) {
  const viz = STATE_STYLE[state];
  const Icon = viz.icon;
  const label = TWIN_STATUS_LABEL[state];
  const tagline = TWIN_STATUS_TAGLINE[state];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="inline-flex flex-col items-start gap-1"
    >
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono uppercase tracking-[0.18em] font-bold border backdrop-blur-sm"
        style={{
          background: viz.bg,
          color: viz.fg,
          borderColor: viz.border,
          fontSize: compact ? 10 : 11,
          boxShadow: `0 0 14px ${viz.glow}`,
        }}
      >
        <motion.span
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: viz.pulseMs / 1000, repeat: Infinity, ease: 'easeInOut' }}
          style={{ display: 'inline-flex' }}
        >
          <Icon size={compact ? 10 : 11} />
        </motion.span>
        {label}
      </span>
      {!compact && (
        <span
          className="text-text-muted leading-relaxed pl-3"
          style={{ fontSize: 12 }}
        >
          {tagline}
        </span>
      )}
    </motion.div>
  );
}

const STATE_STYLE: Record<
  TwinVisualState,
  {
    icon: typeof Sparkles;
    bg: string;
    fg: string;
    border: string;
    glow: string;
    pulseMs: number;
  }
> = {
  depleted: {
    icon: Moon,
    bg: 'rgba(90, 107, 80, 0.10)',
    fg: '#a0a69a',
    border: 'rgba(160, 166, 154, 0.30)',
    glow: 'rgba(160, 166, 154, 0.15)',
    pulseMs: 3600,
  },
  recovering: {
    icon: Moon,
    bg: 'rgba(125, 211, 255, 0.10)',
    fg: '#7dd3ff',
    border: 'rgba(125, 211, 255, 0.30)',
    glow: 'rgba(125, 211, 255, 0.20)',
    pulseMs: 3200,
  },
  focused: {
    icon: Compass,
    bg: 'rgba(198, 255, 61, 0.08)',
    fg: '#c6ff3d',
    border: 'rgba(198, 255, 61, 0.30)',
    glow: 'rgba(198, 255, 61, 0.25)',
    pulseMs: 2600,
  },
  charged: {
    icon: Zap,
    bg: 'rgba(255, 210, 77, 0.10)',
    fg: '#ffd24d',
    border: 'rgba(255, 210, 77, 0.40)',
    glow: 'rgba(255, 210, 77, 0.30)',
    pulseMs: 2200,
  },
  peak: {
    icon: Flame,
    bg: 'rgba(255, 138, 77, 0.10)',
    fg: '#ff8a4d',
    border: 'rgba(255, 138, 77, 0.40)',
    glow: 'rgba(255, 138, 77, 0.35)',
    pulseMs: 1800,
  },
  hybrid: {
    icon: Crown,
    bg: 'rgba(255, 255, 255, 0.06)',
    fg: '#ffffff',
    border: 'rgba(255, 230, 150, 0.50)',
    glow: 'rgba(255, 230, 150, 0.40)',
    pulseMs: 2000,
  },
};
