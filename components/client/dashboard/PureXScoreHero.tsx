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

/**
 * Whoop-inspired hero gauge for the dashboard.
 *
 * Single colossal number at the centre, a stroked circular ring
 * showing progress 0..100, status word underneath, and an optional
 * 7-day delta chip in the corner. Everything else on the dashboard
 * lives in service of THIS number — Recovery / Strain / Sleep are
 * sub-pages a tap away.
 *
 * Design notes:
 *   - SVG ring with stroke-dashoffset animation (framer-motion)
 *   - Gradient stroke colour shifts band → band (lime / warm / amber)
 *   - Soft glow under the number reads as "important"
 *   - Generous padding — the whole card is mostly negative space
 *   - Mobile-first: ring scales with the card width; legible on
 *     320 → 600px containers without media-query gymnastics
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
      className="relative overflow-hidden rounded-3xl border border-border"
      style={{
        background: `
          radial-gradient(ellipse at 50% 0%, ${color}1A 0%, transparent 60%),
          linear-gradient(180deg, #10160e 0%, #0a0c09 100%)
        `,
      }}
    >
      {/* Top header strip */}
      <div className="flex items-baseline justify-between px-5 pt-5 pb-1">
        <div
          className="font-mono uppercase tracking-[0.22em] font-bold"
          style={{ fontSize: 11, color }}
        >
          PureX Score · Today
        </div>
        {trend && weeklyDelta != null && (
          <TrendChip trend={trend} delta={weeklyDelta} />
        )}
      </div>

      {/* Gauge */}
      <div className="relative flex items-center justify-center pt-2 pb-7">
        <svg
          viewBox="0 0 200 200"
          className="w-[220px] h-[220px] -rotate-90 drop-shadow-[0_0_24px_rgba(198,255,61,0.08)]"
        >
          {/* Track */}
          <circle
            cx={100}
            cy={100}
            r={RADIUS}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={STROKE}
            fill="none"
          />
          {/* Progress */}
          <motion.circle
            cx={100}
            cy={100}
            r={RADIUS}
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={CIRC}
            initial={{ strokeDashoffset: CIRC }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            style={{
              filter: `drop-shadow(0 0 8px ${color}80)`,
            }}
          />
        </svg>

        {/* Centre stack */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showPreview ? (
            <div
              className="font-display font-extrabold leading-none tabular-nums"
              style={{
                fontSize: 60,
                color: 'rgba(255,255,255,0.20)',
              }}
            >
              —
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="font-display font-extrabold leading-none tabular-nums"
              style={{
                fontSize: 72,
                color,
                letterSpacing: '-0.04em',
                textShadow: `0 0 32px ${color}40`,
              }}
            >
              {total}
            </motion.div>
          )}
          <div
            className="font-mono uppercase tracking-[0.18em] font-bold mt-2"
            style={{ fontSize: 10, color: 'rgba(255,255,255,0.50)' }}
          >
            {showPreview ? 'Calibrating' : band.label}
          </div>
        </div>
      </div>

      {/* Tagline */}
      <div
        className="text-center px-6 pb-5 leading-relaxed"
        style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}
      >
        {showPreview
          ? 'Log a meal, your steps, or last night\'s sleep — your score builds itself.'
          : band.tagline}
      </div>
    </section>
  );
}

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
          border: 'rgba(198,255,61,0.25)',
          icon: <TrendingUp size={10} />,
        }
      : trend === 'down'
      ? {
          color: '#ff9999',
          bg: 'rgba(255,107,107,0.10)',
          border: 'rgba(255,107,107,0.25)',
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
