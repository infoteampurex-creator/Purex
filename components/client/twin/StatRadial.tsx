'use client';

import { motion } from 'framer-motion';

interface Props {
  value: number;        // 0..100
  color: string;
  label: string;
  size?: number;
  /** When true, the central number animates from 0 to value on mount. */
  animateOnMount?: boolean;
  /** Optional icon rendered above the number. */
  icon?: React.ReactNode;
}

/**
 * Circular stat meter — one ring per stat. Stroke fills clockwise
 * from -90° (12 o'clock) proportional to value. Inner number shows
 * the raw value. Soft drop-shadow tinted by the stat colour gives
 * the "ignited" feel.
 */
export function StatRadial({
  value,
  color,
  label,
  size = 64,
  animateOnMount = true,
  icon,
}: Props) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = c - (c * clamped) / 100;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={stroke}
          />
          {/* Progress */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: animateOnMount ? c : offset }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {icon && (
            <div style={{ color, opacity: 0.6, marginBottom: -2 }}>{icon}</div>
          )}
          <span
            className="font-display font-bold tabular-nums leading-none"
            style={{ fontSize: size > 56 ? 16 : 14, color }}
          >
            {Math.round(clamped)}
          </span>
        </div>
      </div>
      <div
        className="font-mono uppercase tracking-[0.16em] font-bold"
        style={{ fontSize: 9, color }}
      >
        {label}
      </div>
    </div>
  );
}
