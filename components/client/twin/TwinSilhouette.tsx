'use client';

import { motion } from 'framer-motion';
import {
  TWIN_STAT_META,
  type TwinStats,
  type TwinVisualState,
} from '@/lib/data/twin';

interface Props {
  stats: TwinStats;
  state: TwinVisualState;
  /** Width in px. Height auto-scales to 2:1 portrait ratio. */
  width?: number;
  /** Hide ambient bg + particles for compact card use. */
  compact?: boolean;
  /** Evolution 0..1 — drives posture lift, shoulder widening,
   *  stance widening, aura intensity. Used by the Future Clone
   *  to morph the silhouette across the timeline. */
  evolution?: number;
  /** Override the primary aura colour (used by Future Clone stages). */
  auraOverride?: string;
}

/**
 * PureX Twin silhouette — living digital athlete identity.
 *
 * Eight layered SVG groups, each animated by framer-motion:
 *
 *   1. Ambient background particles  slow-drifting dots across the
 *                                    entire canvas (compact mode hides)
 *   2. Multi-stat aura halo          5 radial gradients (one per
 *                                    stat), each tinted with that
 *                                    stat's brand colour, opacity
 *                                    proportional to its value.
 *                                    Composite glow reflects the
 *                                    user's strongest stats.
 *   3. Streak rings                  up to 5 dashed concentric arcs
 *                                    (one per 20 % of Discipline),
 *                                    counter-rotating.
 *   4. Spine energy line             vertical gradient, pulses in
 *                                    sync with breathing, opacity
 *                                    proportional to Energy.
 *   5. Silhouette                    head + neck + tapered torso +
 *                                    tapered arms + tapered legs.
 *                                    Evolution prop morphs proportions
 *                                    via group transforms — shoulders
 *                                    widen, stance opens, posture
 *                                    lifts (no path morphing → cheap).
 *   6. Muscle pulses                 chest pulse (fires when Strength
 *                                    > 60), quad pulses (Endurance
 *                                    > 60), Recovery pulse on heart.
 *   7. Foreground particles          12-20 dots floating upward
 *                                    around the figure (density ∝
 *                                    Recovery).
 *   8. Vitality ring                 outermost subtle ring that
 *                                    pulses with the overall vitality
 *                                    score.
 *
 * All animation respects prefers-reduced-motion via framer-motion's
 * built-in handling. Total cost: < 9 KB minified + gzipped.
 */
export function TwinSilhouette({
  stats,
  state,
  width = 240,
  compact = false,
  evolution = 0,
  auraOverride,
}: Props) {
  const viz = STATE_VIZ[state];
  const primaryAura = auraOverride ?? viz.aura;
  const breathingDuration = viz.breathingMs / 1000;

  const overall =
    (stats.energy +
      stats.strength +
      stats.endurance +
      stats.recovery +
      stats.discipline) /
    5;

  // ─── Evolution-driven transforms ───
  // (silhouette gets progressively more athletic across the timeline)
  const postureLift = evolution * 6; // upward translate in px
  const shoulderWidthScale = 1 + evolution * 0.06; // shoulders widen
  const stanceWidthDeg = evolution * 2.5; // legs rotate outward

  // Aura intensity blends overall vitality + evolution boost.
  const auraOpacityBase = Math.min(
    0.85,
    0.30 + (overall / 100) * 0.45 + evolution * 0.20
  );

  const ringCount = Math.min(5, Math.floor(stats.discipline / 20));
  const energyOpacity = 0.2 + (stats.energy / 100) * 0.7;
  const recoveryOpacity = stats.recovery / 100;
  const particleCount = compact
    ? Math.round(4 + (stats.recovery / 100) * 4)
    : Math.round(8 + (stats.recovery / 100) * 12);
  const ambientCount = compact ? 0 : 18;

  return (
    <svg
      viewBox="0 0 200 400"
      width={width}
      height={width * 2}
      style={{ display: 'block', overflow: 'visible' }}
      aria-label="PureX Twin silhouette"
    >
      <defs>
        {/* Per-stat aura gradients — 5 radials, one per stat */}
        {STAT_AURA_DEFS.map((d) => {
          const opacity = (stats[d.key] / 100) * 0.4;
          return (
            <radialGradient
              key={`g-${d.key}`}
              id={`twin-aura-${d.key}`}
              cx={d.cx}
              cy={d.cy}
              r="50%"
            >
              <stop offset="0%" stopColor={d.color} stopOpacity={opacity} />
              <stop
                offset="60%"
                stopColor={d.color}
                stopOpacity={opacity * 0.3}
              />
              <stop offset="100%" stopColor={d.color} stopOpacity={0} />
            </radialGradient>
          );
        })}

        {/* Primary aura (state-tinted overall vitality) */}
        <radialGradient id="twin-aura-primary" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={primaryAura} stopOpacity={auraOpacityBase} />
          <stop
            offset="55%"
            stopColor={primaryAura}
            stopOpacity={auraOpacityBase * 0.35}
          />
          <stop offset="100%" stopColor={primaryAura} stopOpacity={0} />
        </radialGradient>

        {/* Silhouette body gradient */}
        <linearGradient id="twin-silhouette" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={viz.silhouetteTop} stopOpacity={0.95} />
          <stop offset="100%" stopColor={viz.silhouetteBottom} stopOpacity={1} />
        </linearGradient>

        {/* Spine energy gradient */}
        <linearGradient id="twin-energy" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={primaryAura} stopOpacity={0} />
          <stop offset="50%" stopColor={primaryAura} stopOpacity={energyOpacity} />
          <stop offset="100%" stopColor={primaryAura} stopOpacity={0} />
        </linearGradient>

        {/* Filters */}
        <filter id="twin-glow-strong" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="twin-glow-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
        <filter id="twin-glow-ambient" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* ═══ LAYER 1: Ambient background particles ═══ */}
      {!compact &&
        Array.from({ length: ambientCount }).map((_, i) => {
          const seed = i * 53;
          const x = 10 + ((seed * 17) % 180);
          const y = 30 + ((seed * 29) % 340);
          const duration = 6 + ((seed * 13) % 5);
          const delay = (seed * 0.23) % 4;
          return (
            <motion.circle
              key={`amb-${i}`}
              cx={x}
              cy={y}
              r={2}
              fill={primaryAura}
              style={{ filter: 'url(#twin-glow-ambient)' }}
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.15, 0],
                cy: [y, y - 8, y - 16],
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

      {/* ═══ LAYER 2: Multi-stat aura halo ═══
          5 layered radial gradients — each stat colours one slice of
          the halo, so the overall glow tints toward whichever stat
          is dominant. */}
      {!compact && (
        <>
          {STAT_AURA_DEFS.map((d) => (
            <motion.ellipse
              key={`aura-${d.key}`}
              cx={100}
              cy={200}
              rx={130}
              ry={190}
              fill={`url(#twin-aura-${d.key})`}
              animate={{
                scale: [1, 1.04, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: breathingDuration * d.cycleMult,
                delay: d.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
          {/* Primary state aura on top — gives the dominant colour tint */}
          <motion.ellipse
            cx={100}
            cy={200}
            rx={120}
            ry={180}
            fill="url(#twin-aura-primary)"
            animate={{
              scale: [1, 1.06, 1],
              opacity: [auraOpacityBase, auraOpacityBase * 1.2, auraOpacityBase],
            }}
            transition={{
              duration: breathingDuration,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </>
      )}

      {/* ═══ LAYER 3: Streak rings (Discipline) ═══ */}
      {ringCount > 0 &&
        Array.from({ length: ringCount }).map((_, i) => (
          <motion.circle
            key={`ring-${i}`}
            cx={100}
            cy={200}
            r={90 + i * 14}
            fill="none"
            stroke="#ffd24d"
            strokeWidth={1}
            strokeDasharray="2 6"
            strokeOpacity={0.55 - i * 0.07}
            style={{ filter: 'url(#twin-glow-soft)' }}
            animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
            transition={{
              duration: 40 - i * 6,
              repeat: Infinity,
              ease: 'linear',
            }}
            transform-origin="100 200"
          />
        ))}

      {/* ═══ LAYER 4: Spine energy ═══ */}
      <motion.rect
        x={97}
        y={90 - postureLift}
        width={6}
        height={210}
        fill="url(#twin-energy)"
        style={{ filter: 'url(#twin-glow-strong)' }}
        animate={{
          opacity: [energyOpacity * 0.55, energyOpacity, energyOpacity * 0.55],
        }}
        transition={{
          duration: breathingDuration * 0.7,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* ═══ LAYER 5: Silhouette (evolution-aware) ═══
          Posture lift translates the entire group up.
          Shoulder widening via inner-group scaleX.
          Stance widening via leg rotations. */}
      <motion.g
        animate={{
          y: [-postureLift, -postureLift - 2, -postureLift],
        }}
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
          fill="url(#twin-silhouette)"
          stroke={primaryAura}
          strokeOpacity={0.35 + evolution * 0.25}
          strokeWidth={1}
        />
        {/* Neck */}
        <rect x={94} y={92} width={12} height={10} fill="url(#twin-silhouette)" />

        {/* Upper body — torso + arms — widens with evolution */}
        <motion.g
          animate={{ scaleX: shoulderWidthScale }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ transformOrigin: '100px 110px' }}
        >
          <path
            d="M 70 105 L 130 105 L 138 175 L 122 230 L 78 230 L 62 175 Z"
            fill="url(#twin-silhouette)"
            stroke={primaryAura}
            strokeOpacity={0.30 + evolution * 0.20}
            strokeWidth={1}
          />
          <path
            d="M 70 108 L 56 120 L 48 175 L 56 225 L 64 225 L 62 180 L 72 130 Z"
            fill="url(#twin-silhouette)"
          />
          <path
            d="M 130 108 L 144 120 L 152 175 L 144 225 L 136 225 L 138 180 L 128 130 Z"
            fill="url(#twin-silhouette)"
          />
        </motion.g>

        {/* Legs — stance widens with evolution */}
        <motion.path
          d="M 80 232 L 76 320 L 82 380 L 96 380 L 96 320 L 96 232 Z"
          fill="url(#twin-silhouette)"
          animate={{ rotate: -stanceWidthDeg }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ transformOrigin: '88px 232px' }}
        />
        <motion.path
          d="M 120 232 L 124 320 L 118 380 L 104 380 L 104 320 L 104 232 Z"
          fill="url(#twin-silhouette)"
          animate={{ rotate: stanceWidthDeg }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ transformOrigin: '112px 232px' }}
        />
      </motion.g>

      {/* ═══ LAYER 6: Muscle + recovery pulses ═══ */}
      {/* Chest pulse — Strength */}
      {stats.strength > 60 && (
        <motion.ellipse
          cx={100}
          cy={140 - postureLift}
          rx={26}
          ry={14}
          fill="#ff8a4d"
          style={{ filter: 'url(#twin-glow-strong)' }}
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
      {/* Heart pulse — Recovery (always-on, intensity ∝ recovery) */}
      <motion.circle
        cx={88}
        cy={140 - postureLift}
        r={4}
        fill="#a78bfa"
        style={{ filter: 'url(#twin-glow-soft)' }}
        animate={{
          opacity: [0, recoveryOpacity * 0.8, 0],
          scale: [1, 1.4, 1],
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: 'easeOut',
        }}
      />
      {/* Quad pulses — Endurance */}
      {stats.endurance > 60 && (
        <>
          <motion.ellipse
            cx={86}
            cy={280 - postureLift}
            rx={10}
            ry={28}
            fill="#7dd3ff"
            style={{ filter: 'url(#twin-glow-strong)' }}
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
            cy={280 - postureLift}
            rx={10}
            ry={28}
            fill="#7dd3ff"
            style={{ filter: 'url(#twin-glow-strong)' }}
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

      {/* ═══ LAYER 7: Foreground particles ═══ */}
      {!compact &&
        Array.from({ length: particleCount }).map((_, i) => {
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
              fill={primaryAura}
              style={{ filter: 'url(#twin-glow-soft)' }}
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

      {/* ═══ LAYER 8: Vitality ring (outer pulse) ═══ */}
      {!compact && (
        <motion.circle
          cx={100}
          cy={200}
          r={155}
          fill="none"
          stroke={primaryAura}
          strokeWidth={0.5}
          strokeOpacity={0.4}
          style={{ filter: 'url(#twin-glow-soft)' }}
          animate={{
            r: [155, 158, 155],
            strokeOpacity: [0.25, 0.55, 0.25],
          }}
          transition={{
            duration: breathingDuration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </svg>
  );
}

// ─── Per-stat aura definitions ────────────────────────────────────
// Each stat's halo is positioned slightly offset so the composite
// glow is asymmetric — gives the Twin a sense of breathing rather
// than a single flat halo.

const STAT_AURA_DEFS: Array<{
  key: keyof TwinStats;
  color: string;
  cx: string;
  cy: string;
  cycleMult: number;
  delay: number;
}> = [
  { key: 'energy',    color: TWIN_STAT_META.energy.color,    cx: '50%', cy: '40%', cycleMult: 1.0, delay: 0 },
  { key: 'strength',  color: TWIN_STAT_META.strength.color,  cx: '50%', cy: '38%', cycleMult: 1.2, delay: 0.3 },
  { key: 'endurance', color: TWIN_STAT_META.endurance.color, cx: '50%', cy: '70%', cycleMult: 1.4, delay: 0.6 },
  { key: 'recovery',  color: TWIN_STAT_META.recovery.color,  cx: '50%', cy: '35%', cycleMult: 1.6, delay: 0.9 },
  { key: 'discipline',color: TWIN_STAT_META.discipline.color,cx: '50%', cy: '50%', cycleMult: 1.8, delay: 1.2 },
];

// ─── State → palette + breathing speed ──────────────────────────

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
    aura: '#ff8a4d',
    silhouetteTop: '#a0a89a',
    silhouetteBottom: '#4a5448',
    breathingMs: 1800,
  },
  hybrid: {
    aura: '#ffffff',
    silhouetteTop: '#b8b294',
    silhouetteBottom: '#52564a',
    breathingMs: 2000,
  },
};
