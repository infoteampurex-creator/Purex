'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Repeat, X, Leaf, MapPin } from 'lucide-react';
import {
  findAlternativesAtSimilarKcal,
  type MealTypeExtended,
  type FoodSource,
} from '@/lib/data/food-sources';
import type { PlanMealType } from '@/lib/data/meal-plan';

interface Props {
  open: boolean;
  onClose: () => void;
  /** The food being swapped — e.g. "Oats". */
  itemName: string;
  /** Per-portion kcal of the source item — drives the ±tolerance window. */
  itemKcal: number;
  /** Meal type from the parent meal — narrows initial suggestions. */
  mealType: PlanMealType | null;
}

/**
 * Bottom-sheet that surfaces alternative foods at a similar kcal to
 * an item on the client's coach-assigned diet plan. Read-only — the
 * client picks what they want to eat instead, no DB write happens.
 *
 * Closes the gap "I'm bored of oats every morning, what else hits the
 * same kcal?" without requiring the coach to spell out alternatives.
 */
export function MealSwapSheet({
  open,
  onClose,
  itemName,
  itemKcal,
  mealType,
}: Props) {
  const mealTypeForLib = planToLibMealType(mealType);
  const alternatives = useMemo<FoodSource[]>(
    () =>
      findAlternativesAtSimilarKcal(itemKcal, {
        mealType: mealTypeForLib,
        excludeName: itemName,
        tolerance: 0.15,
        maxResults: 10,
      }),
    [itemKcal, itemName, mealTypeForLib]
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl overflow-hidden"
            style={{
              background: '#0a0c09',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              maxHeight: '88vh',
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2.5 pb-1">
              <div
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.18)',
                }}
              />
            </div>

            {/* Header */}
            <div className="px-5 pt-2 pb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div
                  className="font-mono uppercase tracking-[0.22em] font-bold mb-1.5 inline-flex items-center gap-1.5"
                  style={{ fontSize: 11, color: '#c6ff3d' }}
                >
                  <Repeat size={11} />
                  Similar kcal · swap idea
                </div>
                <h2 className="font-display font-bold text-lg tracking-tight">
                  Alternatives to {itemName}
                </h2>
                <p
                  className="text-text-muted mt-1"
                  style={{ fontSize: 12.5 }}
                >
                  Around{' '}
                  <span className="font-mono font-bold text-accent">
                    {itemKcal} kcal
                  </span>{' '}
                  per portion · ±15%
                  {mealType && (
                    <>
                      {' '}
                      · {labelForMealType(mealType)}
                    </>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <X size={15} style={{ color: 'rgba(255,255,255,0.65)' }} />
              </button>
            </div>

            {/* Body */}
            <div
              className="px-5 pb-6 overflow-y-auto"
              style={{ maxHeight: 'calc(88vh - 110px)' }}
            >
              {alternatives.length === 0 ? (
                <EmptyState itemKcal={itemKcal} />
              ) : (
                <ul className="space-y-2">
                  {alternatives.map((f) => (
                    <SwapRow key={f.id} food={f} sourceKcal={itemKcal} />
                  ))}
                </ul>
              )}

              <p
                className="text-text-muted mt-5 leading-relaxed"
                style={{ fontSize: 11.5 }}
              >
                Suggestions come from PURE X&apos;s curated food library.
                Macros are reasonable averages — not lab-grade. If you
                swap regularly, message your coach so they can update
                your plan.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function SwapRow({
  food,
  sourceKcal,
}: {
  food: FoodSource;
  sourceKcal: number;
}) {
  const diff = food.kcal - sourceKcal;
  const diffLabel =
    diff === 0
      ? '±0'
      : diff > 0
      ? `+${diff}`
      : `${diff}`;
  const diffColor =
    Math.abs(diff) <= sourceKcal * 0.05
      ? '#c6ff3d'
      : 'rgba(255,255,255,0.55)';

  return (
    <li
      className="rounded-xl border px-3.5 py-3"
      style={{
        borderColor: 'rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.02)',
      }}
    >
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="font-semibold text-text leading-snug">
            {food.name}
          </div>
          <div
            className="font-mono text-text-muted mt-0.5 inline-flex items-center gap-2"
            style={{ fontSize: 11 }}
          >
            <span>{food.portion}</span>
            {food.veg && (
              <span
                className="inline-flex items-center gap-0.5"
                style={{ color: '#7dd3ff' }}
              >
                <Leaf size={9} /> veg
              </span>
            )}
            {food.indianStaple && (
              <span
                className="inline-flex items-center gap-0.5"
                style={{ color: 'rgba(255,184,77,0.85)' }}
              >
                <MapPin size={9} /> indian
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div
            className="font-display font-bold tabular-nums leading-none"
            style={{ fontSize: 17, color: '#c6ff3d' }}
          >
            {food.kcal}
            <span
              className="font-mono uppercase tracking-[0.12em] font-bold ml-1"
              style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}
            >
              kcal
            </span>
          </div>
          <div
            className="font-mono tabular-nums mt-0.5"
            style={{ fontSize: 10, color: diffColor }}
          >
            {diffLabel} vs original
          </div>
        </div>
      </div>

      {/* Macro mini-row */}
      <div
        className="grid grid-cols-3 gap-2 mt-2.5 pt-2.5 border-t"
        style={{ borderColor: 'rgba(255,255,255,0.05)' }}
      >
        <Macro label="Protein" value={`${food.protein}g`} color="#a78bfa" />
        <Macro label="Carbs" value={`${food.carbs}g`} color="#7dd3ff" />
        <Macro label="Fat" value={`${food.fats}g`} color="#ff8a4d" />
      </div>
    </li>
  );
}

function Macro({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div>
      <div
        className="font-mono uppercase tracking-[0.14em] font-bold"
        style={{ fontSize: 9, color: 'rgba(255,255,255,0.40)' }}
      >
        {label}
      </div>
      <div
        className="font-mono tabular-nums mt-0.5 font-semibold"
        style={{ fontSize: 12, color }}
      >
        {value}
      </div>
    </div>
  );
}

function EmptyState({ itemKcal }: { itemKcal: number }) {
  return (
    <div className="rounded-xl border border-border-soft px-4 py-8 text-center">
      <Repeat
        size={20}
        className="mx-auto mb-2"
        style={{ color: 'rgba(255,255,255,0.30)' }}
      />
      <p
        className="text-text-muted leading-relaxed"
        style={{ fontSize: 13 }}
      >
        No close matches in the food library around{' '}
        <span className="font-mono font-bold text-text">{itemKcal} kcal</span>{' '}
        yet. Try messaging your coach for alternatives.
      </p>
    </div>
  );
}

function planToLibMealType(
  m: PlanMealType | null
): MealTypeExtended | null {
  if (!m) return null;
  if (m === 'breakfast' || m === 'lunch' || m === 'dinner' || m === 'snack')
    return m;
  if (m === 'pre_workout') return 'pre_workout';
  // post_workout / other: drop to 'snack' bucket so we still surface ideas.
  if (m === 'post_workout') return 'snack';
  return null;
}

function labelForMealType(m: PlanMealType): string {
  switch (m) {
    case 'breakfast':
      return 'Breakfast';
    case 'lunch':
      return 'Lunch';
    case 'dinner':
      return 'Dinner';
    case 'snack':
      return 'Snack';
    case 'pre_workout':
      return 'Pre-workout';
    case 'post_workout':
      return 'Post-workout';
    default:
      return 'Other';
  }
}
