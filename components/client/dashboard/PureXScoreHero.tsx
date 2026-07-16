'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { PureXScoreBreakdown } from '@/lib/data/purex-score';
import { pureXScoreBand } from '@/lib/data/purex-score';

interface Props {
  score: PureXScoreBreakdown;
  /** Delta vs 7-day average. Optional — shown as a trend chip. */
  weeklyDelta?: number | null;
  /** Empty-state mode — shows the gauge in a calibrating style instead
   *  of "0 / 100 you're doing terrible". */
  showPreview?: boolean;
}

// ─── Signature gold palette ──────────────────────────────────────────
// Champagne → warm gold → deep gold. Sits BEHIND the band colour so
// the score still reads peak/strong/steady at a glance, but every
// card frame gets the premium feel of a signature gold card.
const GOLD_LIGHT = '#fbe6a3';
const GOLD = '#ffd24d';
const GOLD_DEEP = '#b88d2c';

/**
 * Team Purex Signature Gold Score Card.
 *
 * Composition (back to front):
 *   1. Card surface — deep gradient with radial gold + band tints
 *   2. Animated shine sweep — diagonal champagne-light pass every 7s
 *   3. Subtle dotted-wave SVG glued to the bottom edge (Google-Fit
 *      flavour, low opacity so it never competes with the number)
 *   4. Score ring — band-coloured stroke shadowed against a
 *      champagne-gold soft halo
 *   5. Centre: colossal score number with soft glow
 *   6. Status word + tagline
 *   7. 7-day delta chip in the corner
 *
 * Performance: shine + wave are pure CSS / SVG keyframe animations,
 * no JS tick. Ring stroke uses framer-motion ONCE on first render.
 */
export function PureXScoreHero({ score, weeklyDelta, showPreview }: Props) {
  const total = showPreview ? 0 : score.total;
  const band = pureXScoreBand(total);
  const color = band.color;

  // Ring geometry — keep RADIUS in sync with the SVG below.
  const RADIUS = 84;
  const STROKE = 12;
  const CIRC = 2 * Math.PI * RADIUS;
  const dashOffset = CIRC * (1 - total / 100);

  const trend: 'up' | 'down' | 'flat' | null =
    weeklyDelta == null
      ? null
      : weeklyDelta > 0.5
      ? 'up'
      : weeklyDelta < -0.5
      ? 'down'
      : 'flat';

  return (
    <section
      className="relative overflow-hidden rounded-3xl"
      style={{
        // Gold gradient border via padding-trick: outer element gets a
        // gradient, inner card sits on top with a darker fill so the
        // border reads as a 1px champagne edge that never goes flat.
        padding: 1,
        background: `linear-gradient(140deg, ${GOLD_LIGHT}66 0%, ${GOLD}33 30%, transparent 50%, ${GOLD_DEEP}44 100%)`,
        boxShadow:
          '0 18px 64px rgba(255,210,77,0.10), 0 2px 12px rgba(0,0,0,0.45)',
      }}
    >
      <div
        className="relative overflow-hidden rounded-3xl"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, ${color}1F 0%, transparent 55%),
            radial-gradient(ellipse at 100% 100%, ${GOLD}10 0%, transparent 60%),
            linear-gradient(180deg, #14110a 0%, #0a0c09 78%)
          `,
        }}
      >
        {/* ─── 1. Animated diagonal shine sweep ──────────────────── */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div
            className="absolute -inset-[20%] purex-shine"
            style={{
              background:
                `linear-gradient(110deg, transparent 38%, ${GOLD_LIGHT}22 47%, ${GOLD}33 50%, ${GOLD_LIGHT}22 53%, transparent 62%)`,
              filter: 'blur(8px)',
            }}
          />
        </div>

        {/* ─── 2. Top strip: label + delta chip ──────────────────── */}
        <div className="relative flex items-baseline justify-between px-5 pt-5 pb-1">
          <div
            className="font-mono uppercase tracking-[0.24em] font-bold"
            style={{
              fontSize: 11,
              background: `linear-gradient(90deg, ${color} 0%, ${GOLD} 100%)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
            }}
          >
            PureX Score · Today
          </div>
          {showPreview ? (
            <span
              className="font-mono uppercase tracking-[0.16em] font-bold px-2 py-0.5 rounded-full"
              style={{
                fontSize: 9,
                color: GOLD,
                background: `${GOLD}18`,
                border: `1px solid ${GOLD}45`,
              }}
            >
              Preview
            </span>
          ) : (
            trend && weeklyDelta != null && (
              <TrendChip trend={trend} delta={weeklyDelta} />
            )
          )}
        </div>

        {/* ─── 3. Gauge ──────────────────────────────────────────── */}
        <div className="relative flex items-center justify-center pt-2 pb-6">
          <svg
            viewBox="0 0 200 200"
            className="w-[224px] h-[224px] -rotate-90 drop-shadow-[0_0_28px_rgba(255,210,77,0.10)]"
          >
            <defs>
              {/* Champagne halo behind the progress arc — adds the
                  "signature gold" wrap regardless of band colour. */}
              <radialGradient id="goldHalo" cx="50%" cy="50%" r="50%">
                <stop offset="60%" stopColor={GOLD} stopOpacity="0.05" />
                <stop offset="85%" stopColor={GOLD} stopOpacity="0.18" />
                <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
              </radialGradient>
              {/* Sweep gradient on the progress arc — light → band
                  → light so the stroke "breathes" gold without
                  losing the band-coded status read. */}
              <linearGradient
                id="ringSweep"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={GOLD_LIGHT} />
                <stop offset="50%" stopColor={color} />
                <stop offset="100%" stopColor={GOLD} />
              </linearGradient>
            </defs>

            {/* Champagne halo */}
            <circle cx={100} cy={100} r={RADIUS + 8} fill="url(#goldHalo)" />

            {/* Track */}
            <circle
              cx={100}
              cy={100}
              r={RADIUS}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={STROKE}
              fill="none"
            />

            {/* Progress with sweep gradient */}
            <motion.circle
              cx={100}
              cy={100}
              r={RADIUS}
              stroke="url(#ringSweep)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={CIRC}
              initial={{ strokeDashoffset: CIRC }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                filter: `drop-shadow(0 0 10px ${color}90)`,
              }}
            />
          </svg>

          {/* Centre stack */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="font-display font-extrabold leading-none tabular-nums"
              style={{
                fontSize: showPreview ? 68 : 76,
                background: showPreview
                  ? `linear-gradient(170deg, rgba(255,255,255,0.32) 0%, rgba(255,210,77,0.42) 100%)`
                  : `linear-gradient(170deg, ${GOLD_LIGHT} 0%, ${color} 55%, ${GOLD} 100%)`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
                letterSpacing: '-0.04em',
                textShadow: showPreview
                  ? '0 0 24px rgba(255,210,77,0.15)'
                  : `0 0 32px ${color}30`,
              }}
            >
              {showPreview ? 74 : total}
            </motion.div>
            <div
              className="font-mono uppercase tracking-[0.22em] font-bold mt-2"
              style={{ fontSize: 10, color: GOLD }}
            >
              {showPreview ? 'Sample · start logging' : band.label}
            </div>
          </div>
        </div>

        {/* ─── 4. Tagline ────────────────────────────────────────── */}
        <div
          className="relative text-center px-6 leading-relaxed"
          style={{ fontSize: 13, color: 'rgba(255,255,255,0.62)' }}
        >
          {showPreview
            ? "Log a meal, your steps, or last night's sleep — your score builds itself."
            : band.tagline}
        </div>

        {/* ─── 5. Dotted-wave bottom edge (Google Fit feel) ──────── */}
        <DottedWave color={GOLD} />
      </div>

      {/* Keyframes — local style for the shine + wave drift. */}
      <style>{`
        @keyframes purex-shine {
          0%   { transform: translateX(-30%); opacity: 0; }
          12%  { opacity: 0.55; }
          50%  { transform: translateX(30%); opacity: 0.55; }
          88%  { opacity: 0; }
          100% { transform: translateX(30%); opacity: 0; }
        }
        .purex-shine {
          animation: purex-shine 7s ease-in-out infinite;
          will-change: transform, opacity;
        }
        @keyframes purex-wave {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-120px); }
        }
        .purex-wave {
          animation: purex-wave 14s linear infinite;
          will-change: transform;
        }
      `}</style>
    </section>
  );
}

// ─── Sub-components ────────────────────────────────────────────────

function TrendChip({
  trend,
  delta,
}: {
  trend: 'up' | 'down' | 'flat';
  delta: number;
}) {
  const cfg =
    trend === 'up'
      ? {
          color: '#c6ff3d',
          bg: 'rgba(198,255,61,0.10)',
          border: 'rgba(198,255,61,0.30)',
          icon: <TrendingUp size={10} />,
        }
      : trend === 'down'
      ? {
          color: '#ff9999',
          bg: 'rgba(255,107,107,0.10)',
          border: 'rgba(255,107,107,0.30)',
          icon: <TrendingDown size={10} />,
        }
      : {
          color: 'rgba(255,255,255,0.55)',
          bg: 'rgba(255,255,255,0.04)',
          border: 'rgba(255,255,255,0.10)',
          icon: <Minus size={10} />,
        };
  const sign = delta > 0 ? '+' : '';
  const display = Math.round(delta * 10) / 10;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono uppercase tracking-[0.12em] font-bold"
      style={{
        fontSize: 10,
        color: cfg.color,
        background: cfg.bg,
        border: '1px solid ' + cfg.border,
      }}
      title="Change vs your 7-day average"
    >
      {cfg.icon}
      {sign}
      {display}
      <span style={{ opacity: 0.6, marginLeft: 2 }}>vs 7d</span>
    </span>
  );
}

/**
 * Looping dotted-wave strip glued to the bottom of the card. Inspired
 * by Google Fit's wavy progress edge but rendered as SVG dots so we
 * keep brand control. Pattern repeats horizontally and drifts left
 * at a slow tempo — animation is GPU-cheap (translate only).
 */
function DottedWave({ color }: { color: string }) {
  // Two seamless tiles side-by-side so we can translate -1 tile and
  // re-enter cleanly. Each tile is 240×40.
  const Tile = (
    <g>
      {Array.from({ length: 48 }).map((_, i) => {
        const x = i * 5 + 2;
        // Sin wave — amplitude 10px, period 240px (full tile).
        const y = 20 + Math.sin((x / 240) * Math.PI * 2) * 10;
        // Fade in toward the middle of the tile so the join is invisible.
        const fade =
          x < 20 || x > 220
            ? 0.25
            : 0.6;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={1.2}
            fill={color}
            opacity={fade}
          />
        );
      })}
    </g>
  );

  return (
    <div
      aria-hidden
      className="relative w-full overflow-hidden mt-4"
      style={{ height: 40 }}
    >
      <svg
        viewBox="0 0 480 40"
        className="purex-wave absolute left-0 top-0"
        style={{ width: 480, height: 40 }}
        preserveAspectRatio="none"
      >
        <g transform="translate(0,0)">{Tile}</g>
        <g transform="translate(240,0)">{Tile}</g>
      </svg>
      {/* Right-edge fade so the loop doesn't show a hard cut. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, rgba(10,12,9,0) 0%, transparent 8%, transparent 92%, rgba(10,12,9,0.85) 100%)',
        }}
      />
    </div>
  );
}
