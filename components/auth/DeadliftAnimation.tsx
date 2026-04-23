'use client';

import { motion } from 'framer-motion';

interface DeadliftAnimationProps {
  activated: boolean;
}

/**
 * Small animated deadlift figure — 3/4 top-down angled view.
 *
 * Camera angle: looking down at ~60° (not pure 90° top-down, because
 * the bending motion of a deadlift is invisible from directly above).
 * This angle shows both the top-down feel AND the vertical travel of
 * the bar through the lift.
 *
 * Position: top-right corner of gym scene (160×130px)
 *
 * Loop (3.5s): setup → pull → lockout → descend → setup
 *   - Bar travels up the shins to hips
 *   - Figure straightens from hinge position to upright
 *   - Plates appear to rotate slightly as bar lifts
 */
export function DeadliftAnimation({ activated }: DeadliftAnimationProps) {
  const strokeColor = activated ? '#c6ff3d' : 'rgba(120, 130, 120, 0.45)';
  const thinColor = activated ? 'rgba(198, 255, 61, 0.6)' : 'rgba(120, 130, 120, 0.35)';
  const plateColor = activated ? 'rgba(198, 255, 61, 0.9)' : 'rgba(140, 150, 140, 0.5)';

  return (
    <div
      className="absolute top-8 right-8 select-none pointer-events-none"
      style={{ width: 160, height: 130, zIndex: 5 }}
    >
      {/* Ambient glow when activated */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{ opacity: activated ? 0.4 : 0 }}
        transition={{ duration: 0.8 }}
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(198, 255, 61, 0.25), transparent 65%)',
          filter: 'blur(16px)',
        }}
      />

      {/* Top eyebrow label */}
      <div
        className="absolute -top-3 right-0 font-mono text-[7px] uppercase tracking-[0.22em] font-bold transition-colors duration-500"
        style={{ color: activated ? 'rgba(198, 255, 61, 0.65)' : 'rgba(120, 130, 120, 0.4)' }}
      >
        Station 01
      </div>

      <svg
        viewBox="0 0 160 130"
        className="absolute inset-0 w-full h-full"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <defs>
          {/* Plate gradient for depth (the 3/4 view shows plate faces) */}
          <radialGradient id="plate-outer" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor={plateColor} stopOpacity="0.9" />
            <stop offset="100%" stopColor={plateColor} stopOpacity="0.3" />
          </radialGradient>
        </defs>

        {/* ═══ FLOOR / PLATFORM (static ground plane in perspective) ═══ */}
        <g opacity={activated ? 0.5 : 0.3}>
          {/* Platform outline — wider at bottom (closer to camera), narrower at top (farther away) */}
          <path
            d="M 30 110 L 130 110 L 115 80 L 45 80 Z"
            stroke={thinColor}
            strokeWidth="1"
            fill="none"
          />
          {/* Platform center guide lines */}
          <line x1="50" y1="85" x2="110" y2="85" stroke={thinColor} strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="45" y1="95" x2="115" y2="95" stroke={thinColor} strokeWidth="0.5" strokeDasharray="2 2" />
        </g>

        {/* ═══ ANIMATED LIFTER + BARBELL GROUP ═══ */}
        {/*
          Whole group animates:
            - Starting pose: figure bent over, bar at floor level (~y=98)
            - Pull pose: figure straight, bar at hip level (~y=70)
            - Returns down for next rep
        */}

        {/* Feet (always visible, planted on platform) */}
        <g stroke={strokeColor} strokeWidth="1.8" fill={strokeColor}>
          {/* Left foot */}
          <ellipse cx="70" cy="102" rx="5" ry="2.5" opacity="0.9" />
          {/* Right foot */}
          <ellipse cx="90" cy="102" rx="5" ry="2.5" opacity="0.9" />
        </g>

        {/* Animated torso + head + arms + barbell — lifted as one unit */}
        <motion.g
          animate={{
            y: [0, 0, -18, -18, 0, 0],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: [0.33, 0, 0.67, 1],
            times: [0, 0.15, 0.45, 0.6, 0.9, 1],
          }}
        >
          {/* HEAD — from 3/4 top view it's an oval wider than tall */}
          <motion.ellipse
            animate={{
              cy: [52, 52, 42, 42, 52, 52],
              rx: [6, 6, 5, 5, 6, 6], // head appears smaller when upright (farther from camera)
              ry: [4, 4, 3.5, 3.5, 4, 4],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: [0.33, 0, 0.67, 1],
              times: [0, 0.15, 0.45, 0.6, 0.9, 1],
            }}
            cx="80"
            stroke={strokeColor}
            strokeWidth="1.6"
            fill={activated ? 'rgba(198, 255, 61, 0.08)' : 'transparent'}
          />

          {/* SHOULDERS — horizontal line, position changes with lift */}
          <motion.line
            animate={{
              y1: [60, 60, 50, 50, 60, 60],
              y2: [60, 60, 50, 50, 60, 60],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: [0.33, 0, 0.67, 1],
              times: [0, 0.15, 0.45, 0.6, 0.9, 1],
            }}
            x1="68"
            x2="92"
            stroke={strokeColor}
            strokeWidth="2.5"
          />

          {/* TORSO — vertical line from shoulders down to hips, length changes with lift posture */}
          {/* When bent over: torso is long+foreshortened. When upright: visible as short line */}
          <motion.line
            animate={{
              y1: [62, 62, 52, 52, 62, 62], // starts from shoulders
              y2: [78, 78, 62, 62, 78, 78], // ends at hips
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: [0.33, 0, 0.67, 1],
              times: [0, 0.15, 0.45, 0.6, 0.9, 1],
            }}
            x1="80"
            x2="80"
            stroke={strokeColor}
            strokeWidth="2.2"
          />

          {/* ARMS — from shoulders down to barbell, straight at all times (deadlift form) */}
          {/* Left arm */}
          <motion.line
            animate={{
              y1: [60, 60, 50, 50, 60, 60],
              y2: [94, 94, 72, 72, 94, 94],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: [0.33, 0, 0.67, 1],
              times: [0, 0.15, 0.45, 0.6, 0.9, 1],
            }}
            x1="68"
            x2="62"
            stroke={strokeColor}
            strokeWidth="1.7"
          />
          {/* Right arm */}
          <motion.line
            animate={{
              y1: [60, 60, 50, 50, 60, 60],
              y2: [94, 94, 72, 72, 94, 94],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: [0.33, 0, 0.67, 1],
              times: [0, 0.15, 0.45, 0.6, 0.9, 1],
            }}
            x1="92"
            x2="98"
            stroke={strokeColor}
            strokeWidth="1.7"
          />

          {/* BARBELL — the bar itself */}
          <motion.line
            animate={{
              y1: [94, 94, 72, 72, 94, 94],
              y2: [94, 94, 72, 72, 94, 94],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: [0.33, 0, 0.67, 1],
              times: [0, 0.15, 0.45, 0.6, 0.9, 1],
            }}
            x1="30"
            x2="130"
            stroke={strokeColor}
            strokeWidth="2.2"
          />

          {/* LEFT plates — two stacked */}
          <motion.g
            animate={{
              y: [0, 0, -22, -22, 0, 0],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: [0.33, 0, 0.67, 1],
              times: [0, 0.15, 0.45, 0.6, 0.9, 1],
            }}
          >
            {/* Outer plate (big) */}
            <ellipse
              cx="35"
              cy="94"
              rx="8"
              ry="11"
              fill="url(#plate-outer)"
              stroke={strokeColor}
              strokeWidth="1.4"
            />
            <ellipse
              cx="35"
              cy="94"
              rx="3"
              ry="4.5"
              fill="none"
              stroke={thinColor}
              strokeWidth="0.8"
            />
            {/* Inner plate (smaller) */}
            <ellipse
              cx="46"
              cy="94"
              rx="5"
              ry="7"
              fill="url(#plate-outer)"
              stroke={strokeColor}
              strokeWidth="1.2"
              opacity="0.85"
            />
          </motion.g>

          {/* RIGHT plates — two stacked, mirrored */}
          <motion.g
            animate={{
              y: [0, 0, -22, -22, 0, 0],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: [0.33, 0, 0.67, 1],
              times: [0, 0.15, 0.45, 0.6, 0.9, 1],
            }}
          >
            {/* Inner plate (smaller) */}
            <ellipse
              cx="114"
              cy="94"
              rx="5"
              ry="7"
              fill="url(#plate-outer)"
              stroke={strokeColor}
              strokeWidth="1.2"
              opacity="0.85"
            />
            {/* Outer plate (big) */}
            <ellipse
              cx="125"
              cy="94"
              rx="8"
              ry="11"
              fill="url(#plate-outer)"
              stroke={strokeColor}
              strokeWidth="1.4"
            />
            <ellipse
              cx="125"
              cy="94"
              rx="3"
              ry="4.5"
              fill="none"
              stroke={thinColor}
              strokeWidth="0.8"
            />
          </motion.g>

          {/* Motion arrows (subtle direction cues, only when activated) */}
          {activated && (
            <>
              <motion.path
                d="M 20 82 L 20 74 M 17 77 L 20 74 L 23 77"
                stroke={strokeColor}
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                animate={{
                  opacity: [0, 0, 0.7, 0.7, 0, 0],
                  y: [0, 0, -4, -4, 0, 0],
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  times: [0, 0.15, 0.45, 0.6, 0.9, 1],
                }}
              />
              <motion.path
                d="M 140 82 L 140 74 M 137 77 L 140 74 L 143 77"
                stroke={strokeColor}
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                animate={{
                  opacity: [0, 0, 0.7, 0.7, 0, 0],
                  y: [0, 0, -4, -4, 0, 0],
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  times: [0, 0.15, 0.45, 0.6, 0.9, 1],
                }}
              />
            </>
          )}
        </motion.g>

        {/* Rep counter dot (syncs with top of lift) */}
        {activated && (
          <motion.circle
            cx="148"
            cy="22"
            r="2"
            fill="#c6ff3d"
            animate={{
              opacity: [0.3, 0.3, 1, 1, 0.3, 0.3],
              scale: [1, 1, 1.4, 1, 1, 1],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: 'easeInOut',
              times: [0, 0.15, 0.45, 0.6, 0.9, 1],
            }}
            style={{ filter: 'drop-shadow(0 0 4px rgba(198, 255, 61, 0.8))' }}
          />
        )}
      </svg>

      {/* Bottom label */}
      <div
        className="absolute -bottom-4 right-0 font-mono text-[8px] uppercase tracking-[0.2em] font-bold transition-colors duration-500"
        style={{
          color: activated ? 'rgba(198, 255, 61, 0.65)' : 'rgba(120, 130, 120, 0.4)',
        }}
      >
        Deadlift · 120kg
      </div>
    </div>
  );
}
