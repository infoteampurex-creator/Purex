'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Scale, Plus, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import type { DailyWeight } from '@/lib/data/daily-weight';

// 312-line bottom sheet — lazy-load so it only enters the bundle
// when the user actually taps to log a weight.
const QuickLogSheet = dynamic(
  () =>
    import('./QuickLogSheet').then((m) => ({ default: m.QuickLogSheet })),
  { ssr: false }
);

interface Props {
  weight: DailyWeight;
}

/**
 * Daily weigh-in card on the client dashboard.
 *
 * Sits next to the four AppFitnessTiles. Shows today's weight (or
 * "tap to log"), the delta from the previous weigh-in, and a tap
 * affordance that opens the QuickLogSheet in weight mode.
 *
 * Mobile note: the upstream sheet handles the input — this card is
 * read-only display + trigger so the dashboard initial bundle stays
 * lean. The sheet only loads after the first tap.
 */
export function DailyWeightCard({ weight }: Props) {
  const [open, setOpen] = useState(false);

  const today = weight.todayKg;
  const prev = weight.previousKg;
  const delta =
    today != null && prev != null ? round1(today - prev) : null;

  const deltaDirection: 'up' | 'down' | 'flat' | null =
    delta == null
      ? null
      : delta > 0.05
      ? 'up'
      : delta < -0.05
      ? 'down'
      : 'flat';

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="block w-full text-left rounded-2xl border border-border bg-bg-card overflow-hidden active:scale-[0.99] transition-transform"
      >
        <div className="px-4 pt-3.5 pb-3.5 relative">
          {/* + chip in top-right */}
          <div
            className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(255, 138, 77, 0.10)',
              border: '1px solid rgba(255, 138, 77, 0.25)',
              color: '#ff8a4d',
            }}
          >
            <Plus size={11} />
          </div>

          <div
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] font-bold mb-2"
            style={{ color: '#ff8a4d' }}
          >
            <Scale size={12} />
            Today&apos;s weight
          </div>

          {today != null ? (
            <div className="flex items-baseline gap-3 flex-wrap tabular-nums">
              <span
                className="font-display font-bold leading-none"
                style={{ fontSize: 28, color: '#ff8a4d' }}
              >
                {round1(today)}
                <span
                  className="font-mono uppercase tracking-[0.12em] font-bold ml-1.5"
                  style={{
                    fontSize: 10,
                    color: 'rgba(255,138,77,0.65)',
                  }}
                >
                  kg
                </span>
              </span>

              {delta != null && deltaDirection && (
                <DeltaPill delta={delta} direction={deltaDirection} />
              )}
            </div>
          ) : (
            <div className="flex items-baseline gap-2 flex-wrap">
              <span
                className="font-display font-semibold leading-none"
                style={{ fontSize: 18, color: 'rgba(245,245,240,0.95)' }}
              >
                Tap to log
              </span>
              {prev != null && (
                <span
                  className="font-mono"
                  style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}
                >
                  · last: {round1(prev)} kg
                </span>
              )}
            </div>
          )}
        </div>
      </motion.button>

      {/* Lazy-mounted sheet — only renders after first tap */}
      {open && (
        <QuickLogSheet
          open={true}
          type="weight"
          currentValue={today ?? prev ?? 0}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function DeltaPill({
  delta,
  direction,
}: {
  delta: number;
  direction: 'up' | 'down' | 'flat';
}) {
  const cfg =
    direction === 'down'
      ? {
          color: '#c6ff3d',
          bg: 'rgba(198,255,61,0.10)',
          border: 'rgba(198,255,61,0.25)',
          icon: <TrendingDown size={10} />,
        }
      : direction === 'up'
      ? {
          color: '#ff9999',
          bg: 'rgba(255,107,107,0.10)',
          border: 'rgba(255,107,107,0.25)',
          icon: <TrendingUp size={10} />,
        }
      : {
          color: 'rgba(255,255,255,0.55)',
          bg: 'rgba(255,255,255,0.04)',
          border: 'rgba(255,255,255,0.10)',
          icon: <Minus size={10} />,
        };
  const sign = delta > 0 ? '+' : '';
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono uppercase tracking-[0.12em] font-bold"
      style={{
        fontSize: 10,
        color: cfg.color,
        background: cfg.bg,
        border: '1px solid ' + cfg.border,
      }}
    >
      {cfg.icon}
      {sign}
      {round1(delta)} kg
    </span>
  );
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
