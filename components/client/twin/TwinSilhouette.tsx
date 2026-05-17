'use client';

import { motion } from 'framer-motion';
import { type TwinStats, type TwinVisualState } from '@/lib/data/twin';

interface Props {
  stats: TwinStats;
  state: TwinVisualState;
  /** Width in px. Height auto-scales to 2:1 portrait ratio. */
  width?: number;
  /** Hide background aura/particles for compact card use. */
  compact?: boolean;
  /** When true the silhouette gets a future-projection treatment
   *  (brighter aura, sharper posture, denser particles). */
  futureBoost?: number; // 0..1
  /** Override the aura colour (used by Future Clone stages). */
  auraOverride?: string;
}

/**
 * PureX Twin — six-layer animated SVG silhouette.
 *
 * Layer stack (back → front):
 *   1. Aura halo          (radial gradient, breathing pulse)
 *   2. Streak rings        (concentric arcs, count = floor(discipline/20))
 *   3. Energy lines        (vertical glow along spine, intensity ∝ energy)
 *   4. Silhouette          (head + torso + arms + legs, fill = state-tinted)
 *   5. Muscle pulses       (chest + leg flashes, fire on workout-done)
 *   6. Particles           (12 floating dots, density ∝ recovery)
 *
 * All animation handled by framer-motion. No external 3D, no canvas,
 * no images — pure SVG so it renders identically on web and inside
 * the Capacitor WebView. Under 8 KB of JSX.
 */
export function TwinSilhouette({
  stats,
  state,
  width = 240,
  compact = false,
  futureBoost = 0,
  auraOverride,
}: Props) {
  // ─── State-driven visual params ───
  const viz = STATE_VIZ[state];
  const auraColor = auraOverride ?? viz.aura;
  const breathingDuration = viz.breathingMs / 1000;

  // Aura intensity scales with overall vitality + future boost.
  const overall =
    (stats.energy +
      stats.strength +
      stats.endurance +
      stats.recovery +
      stats.discipline) /
    5;
  const auraOpacity = Math.min(
    0.85,
    0.35 + (overall / 100) * 0.5 + futureBoost * 0.15
  );

  // Streak rings — one per 20 % of discipline, max 5.
  const ringCount = Math.min(5, Math.floor(stats.discipline / 20));
  // Energy line intensity — driven by energy stat.
  const energyOpacity = 0.2 + (stats.energy / 100) * 0.7;
  // Particle count — driven by recovery (rest = potential energy stored).
  const particleCount = compact
    ? Math.round(4 + (stats.recovery / 100) * 4)
    : Math.round(8 + (stats.recovery / 100) * 12);

  // Posture lift — future stages stand straighter.
  const torsoLift = futureBoost * 4; // px upward

  return (
    <svg
      viewBox="0 0 200 400"
      width={width}
      height={width * 2}
      style={{ display: 'block', overflow: 'visible' }}
      aria-label="PureX Twin silhouette"
    >
      <defs>
        <radialGradient id="aura-gradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={auraColor} stopOpacity={auraOpacity} />
          <stop offset="60%" stopColor={auraColor} stopOpacity={auraOpacity * 0.3} />
          <stop offset="100%" stopColor={auraColor} stopOpacity={0} />
        </radialGradient>
        <linearGradient id="silhouette-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={viz.silhouetteTop} stopOpacity={0.95} />
          <stop offset="100%" stopColor={viz.silhouetteBottom} stopOpacity={1} />
        </linearGradient>
        <linearGradient id="energy-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={auraColor} stopOpacity={0} />
          <stop offset="50%" stopColor={auraColor} stopOpacity={energyOpacity} />
          <stop offset="100%" stopColor={auraColor} stopOpacity={0} />
        </linearGradient>
        <filter id="glow-strong" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>

      {/* ─── Layer 1: Aura halo ─── */}
      {!compact && (
        <motion.ellipse
          cx={100}
          cy={200}
          rx={120}
          ry={180}
          fill="url(#aura-gradient)"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [auraOpacity, auraOpacity * 1.15, auraOpacity],
          }}
          transition={{
            duration: breathingDuration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* ─── Layer 2: Streak rings ─── */}
      {ringCount > 0 &&
        Array.from({ length: ringCount }).map((_, i) => (
          <motion.circle
            key={`ring-${i}`}
            cx={100}
            cy={200}
            r={90 + i * 14}
            fill="none"
            stroke={'#ffd24d'}
            strokeWidth={1}
            strokeDasharray="2 6"
            strokeOpacity={0.6 - i * 0.08}
            style={{ filter: 'url(#glow-soft)' }}
            animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
            transition={{
              duration: 40 - i * 6,
              repeat: Infinity,
              ease: 'linear',
            }}
            transform-origin="100 200"
          />
        ))}

      {/* ─── Layer 3: Energy lines (spine glow) ─── */}
      <motion.rect
        x={97}
        y={90}
        width={6}
        height={210}
        fill="url(#energy-gradient)"
        style={{ filter: 'url(#glow-strong)' }}
        animate={{ opacity: [energyOpacity * 0.6, energyOpacity, energyOpacity * 0.6] }}
        transition={{
          duration: breathingDuration * 0.7,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* ─── Layer 4: Silhouette (athletic figure) ─── */}
      <motion.g
        animate={{ y: [0, -2 - torsoLift, 0] }}
        transition={{
          duration: breathingDuration,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Head */}
        <circle
          cx={100}
          cy={75}
          r={22}
          fill="url(#silhouette-gradient)"
          stroke={auraColor}
          strokeOpacity={0.4}
          strokeWidth={1}
        />
        {/* Neck */}
        <rect x={94} y={92} width={12} height={10} fill="url(#silhouette-gradient)" />
        {/* Torso — tapered V shape */}
        <path
          d="M 70 105 L 130 105 L 138 175 L 122 230 L 78 230 L 62 175 Z"
          fill="url(#silhouette-gradient)"
          stroke={auraColor}
          strokeOpacity={0.35}
          strokeWidth={1}
        />
        {/* Arms */}
        <path
          d="M 70 108 L 56 120 L 48 175 L 56 225 L 64 225 L 62 180 L 72 130 Z"
          fill="url(#silhouette-gradient)"
        />
        <path
          d="M 130 108 L 144 120 L 152 175 L 144 225 L 136 225 L 138 180 L 128 130 Z"
          fill="url(#silhouette-gradient)"
        />
        {/* Legs */}
        <path
          d="M 80 232 L 76 320 L 82 380 L 96 380 L 96 320 L 96 232 Z"
          fill="url(#silhouette-gradient)"
        />
        <path
          d="M 120 232 L 124 320 L 118 380 L 104 380 L 104 320 L 104 232 Z"
          fill="url(#silhouette-gradient)"
        />
      </motion.g>

      {/* ─── Layer 5: Muscle pulses (chest + quads) ─── */}
      {/* Chest pulse — fires when strength is high */}
      {stats.strength > 60 && (
        <motion.ellipse
          cx={100}
          cy={140}
          rx={26}
          ry={14}
          fill={'#ff8a4d'}
          style={{ filter: 'url(#glow-strong)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            repeatDelay: 3,
            ease: 'easeOut',
          }}
        />
      )}
      {/* Quad pulse — fires when endurance is high */}
      {stats.endurance > 60 && (
        <>
          <motion.ellipse
            cx={86}
            cy={280}
            rx={10}
            ry={28}
            fill={'#7dd3ff'}
            style={{ filter: 'url(#glow-strong)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.45, 0] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              repeatDelay: 2,
              ease: 'easeInOut',
            }}
          />
          <motion.ellipse
            cx={114}
            cy={280}
            rx={10}
            ry={28}
            fill={'#7dd3ff'}
            style={{ filter: 'url(#glow-strong)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.45, 0] }}
            transition={{
              duration: 1.2,
              delay: 0.6,
              repeat: Infinity,
              repeatDelay: 2,
              ease: 'easeInOut',
            }}
          />
        </>
      )}

      {/* ─── Layer 6: Particles (floating dots) ─── */}
      {!compact &&
        Array.from({ length: particleCount }).map((_, i) => {
          // Deterministic per-index placement so SSR matches client.
          const seed = i * 47;
          const x = 30 + ((seed * 13) % 140);
          const y = 60 + ((seed * 23) % 280);
          const duration = 3 + ((seed * 11) % 4);
          const delay = (seed * 0.17) % 2;
          const size = 1 + (seed % 2);
          return (
            <motion.circle
              key={`p-${i}`}
              cx={x}
              cy={y}
              r={size}
              fill={auraColor}
              style={{ filter: 'url(#glow-soft)' }}
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.8, 0],
                cy: [y, y - 25, y - 50],
              }}
              transition={{
                duration,
                delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          );
        })}
    </svg>
  );
}

// ─── Visual state → colour palette + breathing speed ───

const STATE_VIZ: Record<
  TwinVisualState,
  {
    aura: string;
    silhouetteTop: string;
    silhouetteBottom: string;
    breathingMs: number;
  }
> = {
  depleted: {
    aura: '#5a6b50',
    silhouetteTop: '#3a4438',
    silhouetteBottom: '#222a20',
    breathingMs: 4200,
  },
  recovering: {
    aura: '#7dd3ff',
    silhouetteTop: '#4a5a72',
    silhouetteBottom: '#2a3242',
    breathingMs: 3600,
  },
  focused: {
    aura: '#c6ff3d',
    silhouetteTop: '#52684a',
    silhouetteBottom: '#2a3624',
    breathingMs: 2800,
  },
  charged: {
    aura: '#ffd24d',
    silhouetteTop: '#766a3a',
    silhouetteBottom: '#3a3420',
    breathingMs: 2200,
  },
  peak: {
    aura: '#ffffff',
    silhouetteTop: '#a0a89a',
    silhouetteBottom: '#4a5448',
    breathingMs: 1800,
  },
};
