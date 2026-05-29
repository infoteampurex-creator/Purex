'use client';

import { motion } from 'framer-motion';

interface Props {
  hit: number;
  total: number;
  /** Display label inside the ring center. */
  label: string;
  size?: number;
  color?: string;
}

/**
 * Whoop-style consistency ring. A single SVG arc filling clockwise
 * from 12 o'clock to indicate "% of days hit the streak threshold".
 * Big number in the middle, small caption below.
 */
export function ConsistencyRing({
  hit,
  total,
  label,
  size = 140,
  color = '#c6ff3d',
}: Props) {
  const pct = total > 0 ? Math.round((hit / total) * 100) : 0;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - pct / 100);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        {/* Arc — starts at 12 o'clock (rotate -90deg) */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ filter: `drop-shadow(0 0 6px ${color}55)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className="font-display font-bold tabular-nums leading-none"
          style={{ fontSize: size * 0.27, color }}
        >
          {pct}
          <span style={{ fontSize: size * 0.13, opacity: 0.75 }}>%</span>
        </div>
        <div
          className="font-mono uppercase tracking-[0.16em] font-bold mt-1"
          style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)' }}
        >
          {label}
        </div>
        <div
          className="font-mono"
          style={{ fontSize: 9, color: 'rgba(255,255,255,0.40)' }}
        >
          {hit} / {total} days
        </div>
      </div>
    </div>
  );
}
