'use client';

import { motion } from 'framer-motion';

interface NeonPureXSignProps {
  activated: boolean;
}

/**
 * The neon PURE X sign that hangs on the gym wall.
 * Two states:
 *   - dormant: thin gray outline, no glow
 *   - activated: bright neon green, heavy glow, subtle flicker
 */
export function NeonPureXSign({ activated }: NeonPureXSignProps) {
  return (
    <motion.div
      className="relative select-none"
      animate={activated ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 0.6, times: [0, 0.3, 1] }}
    >
      <svg
        viewBox="0 0 360 100"
        className="w-full h-auto"
        style={{
          filter: activated
            ? 'drop-shadow(0 0 20px rgba(198, 255, 61, 0.8)) drop-shadow(0 0 40px rgba(198, 255, 61, 0.5)) drop-shadow(0 0 80px rgba(198, 255, 61, 0.3))'
            : 'none',
          transition: 'filter 0.8s ease-out',
        }}
      >
        <defs>
          <linearGradient id="neon-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e5ff7d" />
            <stop offset="50%" stopColor="#c6ff3d" />
            <stop offset="100%" stopColor="#a3d82a" />
          </linearGradient>
        </defs>

        {/* Dormant outline layer — always visible */}
        <g
          fill="none"
          stroke={activated ? 'url(#neon-gradient)' : 'rgba(120, 130, 120, 0.25)'}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: 'stroke 0.6s ease-out' }}
        >
          {/* P */}
          <path d="M 20 20 L 20 80 M 20 20 L 45 20 Q 60 20 60 35 Q 60 50 45 50 L 20 50" />
          {/* U */}
          <path d="M 75 20 L 75 65 Q 75 80 92 80 Q 110 80 110 65 L 110 20" />
          {/* R */}
          <path d="M 125 80 L 125 20 L 150 20 Q 165 20 165 35 Q 165 50 150 50 L 125 50 M 150 50 L 165 80" />
          {/* E */}
          <path d="M 180 20 L 180 80 L 210 80 M 180 20 L 210 20 M 180 50 L 205 50" />
          {/* X (accent) */}
          <path d="M 240 20 L 280 80 M 280 20 L 240 80" strokeWidth="4.5" />
        </g>

        {/* Inner bright glow line (activated only) */}
        {activated && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.9, 0.6, 1] }}
            transition={{ duration: 1.2, times: [0, 0.1, 0.2, 1] }}
            fill="none"
            stroke="#f5ffdc"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M 20 20 L 20 80 M 20 20 L 45 20 Q 60 20 60 35 Q 60 50 45 50 L 20 50" />
            <path d="M 75 20 L 75 65 Q 75 80 92 80 Q 110 80 110 65 L 110 20" />
            <path d="M 125 80 L 125 20 L 150 20 Q 165 20 165 35 Q 165 50 150 50 L 125 50 M 150 50 L 165 80" />
            <path d="M 180 20 L 180 80 L 210 80 M 180 20 L 210 20 M 180 50 L 205 50" />
            <path d="M 240 20 L 280 80 M 280 20 L 240 80" />
          </motion.g>
        )}
      </svg>
    </motion.div>
  );
}
