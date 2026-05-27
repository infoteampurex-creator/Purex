'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Pencil } from 'lucide-react';
import { setMood } from '@/lib/actions/mood';
import {
  MOOD_STATES,
  MOOD_META,
  MOOD_RECOMMENDATION,
  type MoodState,
} from '@/lib/data/mood';

interface Props {
  /** Current saved mood (null if not yet logged today). */
  current: MoodState | null;
}

/**
 * MoodCheckInCard — "How is your body today?" dashboard prompt.
 *
 * Two visual states:
 *   1. Empty (no mood logged today) — shows the question + 8 chips
 *      in a 4x2 grid. One tap saves + transitions to filled state.
 *   2. Filled — shows the selected mood + adaptive recommendation
 *      copy + a small edit affordance to re-pick.
 *
 * Adaptive recommendation copy (lifestyle only, no medical advice
 * per docs/product-vision.md §4) appears under the chip selection
 * so the user gets immediate value from logging, not just data
 * collection.
 *
 * Server action upserts into client_daily_logs.mood_state. Optimistic
 * UI flips immediately and reverts on server error.
 */
export function MoodCheckInCard({ current }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<MoodState | null>(current);
  const [editing, setEditing] = useState(false);

  // Show chip picker when nothing's logged yet, or when user taps "edit"
  const showPicker = selected === null || editing;

  const handlePick = (mood: MoodState) => {
    if (pending) return;
    const prev = selected;
    // Optimistic
    setSelected(mood);
    setEditing(false);
    startTransition(async () => {
      const result = await setMood({ mood });
      if (!result.ok) {
        // Revert
        setSelected(prev);
        // eslint-disable-next-line no-console
        console.warn('Mood save failed:', result.error);
        return;
      }
      router.refresh();
    });
  };

  const headerColor = selected ? MOOD_META[selected].color : '#7dd3ff';

  return (
    <div
      className="relative rounded-3xl overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 50% 0%, ${headerColor}1A 0%, transparent 60%),
          linear-gradient(180deg, #10130d 0%, #0a0c09 100%)
        `,
        border: `1px solid ${headerColor}26`,
        boxShadow: `0 0 0 1px ${headerColor}14, 0 24px 48px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      {/* ─── Header strip ─── */}
      <div className="relative px-5 pt-5 pb-3 flex items-center justify-between gap-2 flex-wrap">
        <div
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] font-bold"
          style={{ color: headerColor }}
        >
          <Sparkles size={11} />
          Morning Check-In
        </div>
        {selected && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 font-mono uppercase tracking-[0.16em] font-bold transition-opacity hover:opacity-80"
            style={{ fontSize: 9, color: 'rgba(255,255,255,0.50)' }}
          >
            <Pencil size={9} />
            Edit
          </button>
        )}
      </div>

      {/* ─── Hero copy ─── */}
      <div className="relative px-5 pb-3">
        {showPicker ? (
          <>
            <h3
              className="font-display font-bold tracking-tight leading-tight"
              style={{ fontSize: 22, color: 'rgba(245,245,240,0.95)' }}
            >
              How is your body today?
            </h3>
            <p
              className="mt-1 leading-snug"
              style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}
            >
              One tap. Adapts your day&apos;s recommendation.
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 28 }} aria-hidden>
                {MOOD_META[selected!].emoji}
              </span>
              <div className="min-w-0">
                <div
                  className="font-display font-bold tracking-tight leading-none"
                  style={{ fontSize: 22, color: MOOD_META[selected!].color }}
                >
                  Today: {MOOD_META[selected!].label}
                </div>
                <div
                  className="font-mono uppercase tracking-[0.14em] mt-1"
                  style={{ fontSize: 9, color: 'rgba(255,255,255,0.40)' }}
                >
                  logged just now
                </div>
              </div>
            </div>
            <p
              className="mt-3 leading-relaxed"
              style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}
            >
              {MOOD_RECOMMENDATION[selected!]}
            </p>
          </>
        )}
      </div>

      {/* ─── Chip grid ─── */}
      <AnimatePresence initial={false}>
        {showPicker && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative overflow-hidden"
          >
            <div className="px-5 pb-5 grid grid-cols-4 gap-2">
              {MOOD_STATES.map((mood) => {
                const meta = MOOD_META[mood];
                const isActive = selected === mood;
                return (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => handlePick(mood)}
                    disabled={pending}
                    aria-pressed={isActive}
                    className="flex flex-col items-center gap-1 rounded-xl border py-2.5 px-1 transition-all active:scale-95 disabled:opacity-50"
                    style={{
                      background: isActive
                        ? `${meta.color}22`
                        : 'rgba(255,255,255,0.03)',
                      borderColor: isActive
                        ? `${meta.color}88`
                        : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <span style={{ fontSize: 22 }} aria-hidden>
                      {meta.emoji}
                    </span>
                    <span
                      className="font-mono uppercase tracking-[0.10em] font-bold leading-tight text-center"
                      style={{
                        fontSize: 9,
                        color: isActive
                          ? meta.color
                          : 'rgba(255,255,255,0.65)',
                      }}
                    >
                      {meta.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Cancel button when re-editing ─── */}
      {editing && (
        <div className="relative px-5 pb-4 -mt-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="font-mono uppercase tracking-[0.18em] font-bold transition-opacity hover:opacity-80"
            style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
