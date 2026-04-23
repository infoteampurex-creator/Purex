'use client';

import { motion } from 'framer-motion';
import {
  Flame,
  Footprints,
  Moon,
  Droplet,
  Dumbbell,
  Heart,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { MOCK_STAT_TILES, type StatTile } from '@/lib/data/client-mock';

const iconMap: Record<StatTile['id'], React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  calories: Flame,
  steps: Footprints,
  sleep: Moon,
  water: Droplet,
  workout: Dumbbell,
  mood: Heart,
};

const accentStyles: Record<StatTile['accent'], { ring: string; glow: string; chipBg: string }> = {
  lime: {
    ring: '#c6ff3d',
    glow: 'rgba(198, 255, 61, 0.15)',
    chipBg: 'rgba(198, 255, 61, 0.12)',
  },
  emerald: {
    ring: '#4dffb8',
    glow: 'rgba(77, 255, 184, 0.15)',
    chipBg: 'rgba(77, 255, 184, 0.12)',
  },
  amber: {
    ring: '#ffb84d',
    glow: 'rgba(255, 184, 77, 0.15)',
    chipBg: 'rgba(255, 184, 77, 0.12)',
  },
  magenta: {
    ring: '#ff6b9d',
    glow: 'rgba(255, 107, 157, 0.15)',
    chipBg: 'rgba(255, 107, 157, 0.12)',
  },
  sky: {
    ring: '#7dd3ff',
    glow: 'rgba(125, 211, 255, 0.15)',
    chipBg: 'rgba(125, 211, 255, 0.12)',
  },
};

export function StatTilesGrid() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-3"
    >
      {MOCK_STAT_TILES.map((tile, i) => (
        <StatTileCard key={tile.id} tile={tile} index={i} />
      ))}
    </motion.div>
  );
}

function StatTileCard({ tile, index }: { tile: StatTile; index: number }) {
  const Icon = iconMap[tile.id];
  const style = accentStyles[tile.accent];
  const TrendIcon = tile.trend === 'up' ? TrendingUp : tile.trend === 'down' ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
        delay: 0.25 + index * 0.06,
      }}
      className="relative overflow-hidden rounded-2xl bg-bg-card border border-border p-4 hover:border-border-soft transition-all"
    >
      {/* Accent glow */}
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${style.glow}, transparent 70%)` }}
      />

      <div className="relative flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: style.chipBg, color: style.ring }}
        >
          <Icon size={16} strokeWidth={2.2} />
        </div>
        {tile.trendValue && (
          <div
            className="inline-flex items-center gap-0.5 text-[9px] font-mono uppercase tracking-[0.14em] font-bold"
            style={{ color: style.ring }}
          >
            <TrendIcon size={10} strokeWidth={2.5} />
            {tile.trendValue}
          </div>
        )}
      </div>

      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-text-muted font-medium mb-1">
        {tile.label}
      </div>
      <div className="flex items-baseline gap-1.5 mb-3">
        <span
          className="font-display font-bold text-xl md:text-2xl tracking-tight leading-none"
          style={{ color: style.ring }}
        >
          {tile.value}
        </span>
        {tile.unit && (
          <span className="text-xs text-text-muted font-medium">{tile.unit}</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${tile.progress}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.4 + index * 0.05 }}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${style.ring}, ${style.ring}cc)`,
            boxShadow: `0 0 8px ${style.glow}`,
          }}
        />
      </div>

      {tile.target && (
        <div className="flex items-center justify-between mt-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted font-medium">
            Target {tile.target}
          </span>
          <span
            className="font-mono text-[9px] uppercase tracking-[0.14em] font-bold"
            style={{ color: style.ring }}
          >
            {tile.progress}%
          </span>
        </div>
      )}
    </motion.div>
  );
}
