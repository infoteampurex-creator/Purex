'use client';

import { motion } from 'framer-motion';

interface GymSceneProps {
  activated: boolean;
}

/**
 * The left-side gym scene. Dark and dormant until the neon sign activates,
 * then the whole scene gains ambient green wash.
 */
export function GymScene({ activated }: GymSceneProps) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#050705]">
      {/* Brick wall texture via CSS */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(180deg, #0c0e0a 0%, #080a07 50%, #050704 100%),
            repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 24px,
              rgba(255, 255, 255, 0.015) 24px,
              rgba(255, 255, 255, 0.015) 25px
            ),
            repeating-linear-gradient(
              90deg,
              transparent 0px,
              transparent 50px,
              rgba(255, 255, 255, 0.01) 50px,
              rgba(255, 255, 255, 0.01) 51px
            )
          `,
        }}
      />

      {/* Shadow vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 60% 40%, transparent 20%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      {/* Ambient green floodlight from the sign — activated only */}
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: activated ? 1 : 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: `
            radial-gradient(ellipse 90% 50% at 50% 30%, rgba(198, 255, 61, 0.3), transparent 65%),
            radial-gradient(ellipse 80% 80% at 50% 60%, rgba(198, 255, 61, 0.1), transparent 70%),
            linear-gradient(180deg, rgba(198, 255, 61, 0.04) 0%, transparent 60%)
          `,
          mixBlendMode: 'screen',
        }}
      />

      {/* Gym silhouette elements (equipment hints at bottom) */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none">
        <svg viewBox="0 0 400 200" className="w-full h-full opacity-40" preserveAspectRatio="xMidYMax meet">
          <defs>
            <linearGradient id="equipment-fade" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1a1f17" />
              <stop offset="100%" stopColor="#050704" />
            </linearGradient>
          </defs>
          {/* Squat rack silhouette left */}
          <g fill="url(#equipment-fade)">
            <rect x="40" y="60" width="4" height="140" />
            <rect x="110" y="60" width="4" height="140" />
            <rect x="38" y="80" width="78" height="3" />
            <rect x="38" y="110" width="78" height="3" />
            <rect x="30" y="120" width="94" height="5" rx="1" />
            <circle cx="35" cy="122" r="12" />
            <circle cx="119" cy="122" r="12" />
          </g>
          {/* Plates stacked right */}
          <g fill="url(#equipment-fade)">
            <rect x="330" y="180" width="50" height="20" rx="2" />
            <rect x="333" y="165" width="44" height="16" rx="2" />
            <rect x="336" y="152" width="38" height="14" rx="2" />
          </g>
          {/* Floor line */}
          <rect x="0" y="198" width="400" height="2" fill="url(#equipment-fade)" opacity="0.6" />
        </svg>
      </div>

      {/* Dust motes (visible when activated) */}
      <motion.div
        animate={{ opacity: activated ? 0.5 : 0 }}
        transition={{ duration: 2, delay: 0.5 }}
        className="absolute inset-0 pointer-events-none"
      >
        {[
          { top: '25%', left: '20%', delay: 0 },
          { top: '60%', left: '70%', delay: 2 },
          { top: '40%', left: '85%', delay: 4 },
          { top: '75%', left: '30%', delay: 1.5 },
        ].map((m, i) => (
          <motion.span
            key={i}
            className="absolute w-0.5 h-0.5 rounded-full bg-accent/50"
            style={{ top: m.top, left: m.left, filter: 'blur(0.5px)' }}
            animate={{
              y: [0, -30, -10, -20],
              x: [0, 15, -5, 10],
              opacity: [0, 1, 0.3, 0.8],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              delay: m.delay,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}
