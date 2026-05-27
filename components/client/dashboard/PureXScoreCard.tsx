'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronDown } from 'lucide-react';
import {
  PUREX_SCORE_CATEGORIES,
  pureXScoreBand,
  weakestActionableCategory,
  NEXT_ACTION_COPY,
  type PureXScoreBreakdown,
  type PureXScoreCategory,
} from '@/lib/data/purex-score';

interface Props {
  score: PureXScoreBreakdown;
  /**
   * If true, the card shows the calibrating empty-state copy
   * (e.g. brand new account with no data yet) instead of the score.
   */
  showPreview?: boolean;
}

/**
 * PureX Score — dashboard hero card.
 *
 * Big 0-100 number with mood band underneath. Tap to expand a
 * breakdown sheet showing the 5 component categories (Movement,
 * Fuel, Recovery, Hydration, Consistency) with progress bars.
 * Includes a "Save your score" CTA pointing at the weakest
 * actionable category.
 *
 * Design notes:
 *   - Big numeric reads from across the room — a 56px tabular figure
 *     is the focal point of the dashboard above the fold
 *   - Mood band color matches across the number + the underline +
 *     the "Save" CTA pill so the card has visual unity at any score
 *   - Breakdown sheet expands inline (no modal/route push) so the
 *     user stays on the dashboard
 *   - Empty state (showPreview): replaces the number with a
 *     two-line "Log something to start your score" message + CTA
 */
export function PureXScoreCard({ score, showPreview = false }: Props) {
  const [expanded, setExpanded] = useState(false);
  const band = pureXScoreBand(score.total);
  const empty = showPreview || score.isEmpty;
  const weakestKey = weakestActionableCategory(score);

  return (
    <div
      className="relative rounded-3xl overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 50% 0%, ${band.color}1F 0%, transparent 55%),
          linear-gradient(180deg, #10130d 0%, #0a0c09 100%)
        `,
        border: `1px solid ${band.color}26`,
        boxShadow: `0 0 0 1px ${band.color}14, 0 24px 48px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      {/* ─── Header strip ─── */}
      <div className="relative px-5 pt-5 pb-2 flex items-center justify-between gap-2 flex-wrap">
        <div
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] font-bold"
          style={{ color: band.color }}
        >
          <Sparkles size={11} />
          PureX Score
        </div>
        {!empty && (
          <span
            className="font-mono uppercase tracking-[0.18em] font-bold"
            style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)' }}
          >
            Today
          </span>
        )}
      </div>

      {/* ─── Hero: big number + band label ─── */}
      <div className="relative px-5 pb-4">
        {empty ? (
          <EmptyState />
        ) : (
          <>
            <div className="flex items-baseline gap-3">
              <motion.div
                key={score.total}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="font-display font-bold tabular-nums leading-none"
                style={{
                  fontSize: 56,
                  color: band.color,
                  textShadow: `0 0 24px ${band.color}55`,
                }}
              >
                {score.total}
              </motion.div>
              <div className="pb-2">
                <div
                  className="font-display font-bold leading-none"
                  style={{ fontSize: 16, color: 'rgba(245,245,240,0.95)' }}
                >
                  {band.label}
                </div>
                <div
                  className="font-mono uppercase tracking-[0.14em] mt-1"
                  style={{ fontSize: 9, color: 'rgba(255,255,255,0.50)' }}
                >
                  out of 100
                </div>
              </div>
            </div>
            <div
              className="mt-2 leading-snug"
              style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)' }}
            >
              {band.tagline}
            </div>
          </>
        )}
      </div>

      {/* ─── Mini bar chart of 5 categories — always visible ─── */}
      <div className="relative px-5 pb-4 grid grid-cols-5 gap-2">
        {(Object.keys(PUREX_SCORE_CATEGORIES) as PureXScoreCategory[]).map(
          (key) => {
            const meta = PUREX_SCORE_CATEGORIES[key];
            const value = score[key];
            return (
              <div key={key} className="flex flex-col items-center gap-1.5">
                <div
                  className="relative w-full rounded-full overflow-hidden"
                  style={{ height: 4, background: 'rgba(255,255,255,0.06)' }}
                >
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ background: meta.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
                <div
                  className="font-mono uppercase tracking-[0.10em] font-bold text-center"
                  style={{ fontSize: 8, color: 'rgba(255,255,255,0.45)' }}
                >
                  {meta.label}
                </div>
              </div>
            );
          }
        )}
      </div>

      {/* ─── Save-action CTA (only when not empty + score < 85) ─── */}
      {!empty && score.total < 85 && (
        <div className="relative px-5 pb-3">
          <div
            className="flex items-center justify-between rounded-xl px-3 py-2.5"
            style={{
              background: `${band.color}12`,
              border: `1px solid ${band.color}30`,
            }}
          >
            <div className="min-w-0">
              <div
                className="font-mono uppercase tracking-[0.18em] font-bold"
                style={{ fontSize: 9, color: band.color }}
              >
                Save your score
              </div>
              <div
                className="mt-0.5 leading-snug"
                style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}
              >
                {NEXT_ACTION_COPY[weakestKey]}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Expand button ─── */}
      <button
        type="button"
        onClick={() => setExpanded((x) => !x)}
        aria-expanded={expanded}
        className="relative w-full flex items-center justify-between px-5 py-3 border-t font-mono uppercase tracking-[0.20em] font-bold transition-colors hover:bg-white/[0.02]"
        style={{
          fontSize: 10,
          color: 'rgba(255,255,255,0.55)',
          borderColor: 'rgba(255,255,255,0.05)',
        }}
      >
        {expanded ? 'Hide breakdown' : 'See breakdown'}
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.25 }}
        >
          <ChevronDown size={14} />
        </motion.span>
      </button>

      {/* ─── Expanded breakdown ─── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative overflow-hidden"
          >
            <div className="px-5 pt-3 pb-5 space-y-3">
              {(Object.keys(PUREX_SCORE_CATEGORIES) as PureXScoreCategory[]).map(
                (key) => {
                  const meta = PUREX_SCORE_CATEGORIES[key];
                  const value = score[key];
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span
                          className="font-mono uppercase tracking-[0.16em] font-bold"
                          style={{ fontSize: 10, color: meta.color }}
                        >
                          {meta.label}
                        </span>
                        <span
                          className="font-display font-bold tabular-nums"
                          style={{ fontSize: 14, color: 'rgba(245,245,240,0.92)' }}
                        >
                          {value}
                        </span>
                      </div>
                      <div
                        className="relative rounded-full overflow-hidden"
                        style={{ height: 6, background: 'rgba(255,255,255,0.05)' }}
                      >
                        <motion.div
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{
                            background: meta.color,
                            boxShadow: `0 0 8px ${meta.color}66`,
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${value}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                        />
                      </div>
                      <div
                        className="font-mono"
                        style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}
                      >
                        {meta.source}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────

function EmptyState() {
  return (
    <div>
      <div className="flex items-baseline gap-3">
        <div
          className="font-display font-bold tabular-nums leading-none"
          style={{ fontSize: 56, color: 'rgba(255,255,255,0.20)' }}
        >
          —
        </div>
        <div className="pb-2">
          <div
            className="font-display font-bold leading-none"
            style={{ fontSize: 16, color: 'rgba(245,245,240,0.85)' }}
          >
            Calibrating
          </div>
          <div
            className="font-mono uppercase tracking-[0.14em] mt-1"
            style={{ fontSize: 9, color: 'rgba(255,255,255,0.40)' }}
          >
            log something to start
          </div>
        </div>
      </div>
      <div
        className="mt-2 leading-snug"
        style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}
      >
        Your score builds as you log meals, sleep, water, and workouts.
        Even one log today gets you on the board.
      </div>
    </div>
  );
}
