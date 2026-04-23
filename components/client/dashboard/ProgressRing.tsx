'use client';

import { motion } from 'framer-motion';

interface ProgressRingProps {
  /** Progress 0-100 */
  progress: number;
  size?: number;
  strokeWidth?: number;
  /** CSS color for the active arc */
  color?: string;
  /** CSS color for the track */
  trackColor?: string;
  /** Whether to show a glow on the active arc */
  glow?: boolean;
  /** Content to show in the center */
  children?: React.ReactNode;
  className?: string;
}

export function ProgressRing({
  progress,
  size = 140,
  strokeWidth = 10,
  color = '#c6ff3d',
  trackColor = 'rgba(255, 255, 255, 0.06)',
  glow = true,
  children,
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const offset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className ?? ''}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        style={{ filter: glow ? `drop-shadow(0 0 12px ${color}50)` : undefined }}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Active arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          {children}
        </div>
      )}
    </div>
  );
}
