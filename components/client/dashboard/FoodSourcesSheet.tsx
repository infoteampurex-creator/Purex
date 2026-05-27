'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, Leaf } from 'lucide-react';
import {
  FOOD_SOURCES,
  MEAL_TYPES_ORDERED,
  MACRO_CATEGORIES_ORDERED,
  MEAL_TYPE_META,
  MACRO_CATEGORY_META,
  foodsFor,
  type FoodSource,
  type MacroCategory,
  type MealTypeExtended,
} from '@/lib/data/food-sources';

interface Props {
  open: boolean;
  onClose: () => void;
  /**
   * Initial meal type the sheet opens with. Defaults to the meal type
   * inferred from the time of day when not provided.
   */
  initialMealType?: MealTypeExtended;
  /**
   * Called when the user taps a food. Parent (typically MealLogSheet)
   * decides what to do — usually add the food's macros to the meal
   * currently being logged. Returning here closes the sheet so the
   * user can review the filled values.
   */
  onPickFood?: (food: FoodSource) => void;
}

/**
 * Food Sources browser — meal-type × macro grid picker.
 *
 * Layout:
 *   • Sheet header with title + close
 *   • Search bar (filters across all categories of the active meal type)
 *   • Tab strip for meal type (pre-workout / breakfast / lunch / snack / dinner)
 *   • 4 collapsible sections (Carbs / Protein / Fat / Fiber) with
 *     foods filtered for the selected meal type
 *   • Each food: name, portion, macro chips, [+] action button
 *
 * Indian staples are prioritised to the top of each section so users
 * see culturally-familiar options first.
 *
 * No DB writes here — the picker is a pure presentation layer over
 * the static FOOD_SOURCES library. Save flow stays in MealLogSheet.
 */
export function FoodSourcesSheet({
  open,
  onClose,
  initialMealType,
  onPickFood,
}: Props) {
  const [meal, setMeal] = useState<MealTypeExtended>(
    initialMealType ?? guessMealType()
  );
  const [query, setQuery] = useState('');

  // Reset meal-type when the sheet re-opens with a different initial.
  // Cheap effect via key — we don't actually need useEffect for this
  // since initialMealType is only meaningful at open time.

  const groupedFoods = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MACRO_CATEGORIES_ORDERED.map((cat) => {
      const all = foodsFor(meal, cat);
      const filtered = q
        ? all.filter((f) => f.name.toLowerCase().includes(q))
        : all;
      return { category: cat, foods: filtered };
    });
  }, [meal, query]);

  const totalCount = groupedFoods.reduce((n, g) => n + g.foods.length, 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.55)' }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] rounded-t-3xl overflow-hidden flex flex-col"
            style={{
              background: `
                radial-gradient(ellipse at 50% 0%, rgba(198,255,61,0.08) 0%, transparent 60%),
                #0a0c09
              `,
              borderTop: '1px solid rgba(255,255,255,0.08)',
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Food sources"
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
            <div className="px-5 pt-2 pb-3 flex items-center justify-between gap-3">
              <div>
                <div
                  className="font-mono uppercase tracking-[0.22em] font-bold"
                  style={{ fontSize: 10, color: '#c6ff3d' }}
                >
                  Food Sources
                </div>
                <h2
                  className="font-display font-bold tracking-tight leading-tight mt-0.5"
                  style={{ fontSize: 18, color: 'rgba(245,245,240,0.95)' }}
                >
                  Pick by meal type
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="w-9 h-9 rounded-full border flex items-center justify-center transition-colors hover:bg-white/[0.04]"
                style={{ borderColor: 'rgba(255,255,255,0.10)' }}
              >
                <X size={16} style={{ color: 'rgba(255,255,255,0.65)' }} />
              </button>
            </div>

            {/* Meal-type tabs */}
            <div className="px-5 pb-2 overflow-x-auto">
              <div className="flex gap-1.5 min-w-max">
                {MEAL_TYPES_ORDERED.map((mt) => {
                  const meta = MEAL_TYPE_META[mt];
                  const active = mt === meal;
                  return (
                    <button
                      key={mt}
                      type="button"
                      onClick={() => setMeal(mt)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono uppercase tracking-[0.14em] font-bold transition-colors border"
                      style={{
                        fontSize: 10,
                        color: active ? '#0a0c09' : meta.color,
                        backgroundColor: active
                          ? meta.color
                          : `${meta.color}14`,
                        borderColor: active ? meta.color : `${meta.color}33`,
                      }}
                    >
                      <span aria-hidden>{meta.emoji}</span>
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Meal-type subtitle */}
            <div className="px-5 pb-3">
              <p
                className="leading-snug"
                style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}
              >
                {MEAL_TYPE_META[meal].description}
              </p>
            </div>

            {/* Search */}
            <div className="px-5 pb-3">
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <Search size={14} style={{ color: 'rgba(255,255,255,0.50)' }} />
                <input
                  type="text"
                  placeholder="Search foods…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-dim"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label="Clear search"
                    className="text-text-muted hover:text-text"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Sections */}
            <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4">
              {groupedFoods.every((g) => g.foods.length === 0) && (
                <EmptyResults query={query} mealType={meal} />
              )}
              {groupedFoods.map(({ category, foods }) => {
                if (foods.length === 0) return null;
                const meta = MACRO_CATEGORY_META[category];
                return (
                  <section key={category}>
                    <div className="flex items-baseline justify-between mb-2">
                      <div className="flex items-baseline gap-2">
                        <span style={{ fontSize: 14 }} aria-hidden>
                          {meta.emoji}
                        </span>
                        <span
                          className="font-mono uppercase tracking-[0.20em] font-bold"
                          style={{ fontSize: 11, color: meta.color }}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <span
                        className="font-mono"
                        style={{
                          fontSize: 10,
                          color: 'rgba(255,255,255,0.40)',
                        }}
                      >
                        {foods.length}{' '}
                        {foods.length === 1 ? 'source' : 'sources'}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {foods.map((food) => (
                        <FoodRow
                          key={food.id}
                          food={food}
                          accent={meta.color}
                          onPick={onPickFood}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>

            {/* Footer count */}
            <div
              className="px-5 py-3 border-t flex items-center justify-between"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <span
                className="font-mono uppercase tracking-[0.16em]"
                style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}
              >
                {totalCount} for {MEAL_TYPE_META[meal].label}
              </span>
              <span
                className="font-mono"
                style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}
              >
                {FOOD_SOURCES.length} total
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Sub-components ─────────────────────────────────────────────

function FoodRow({
  food,
  accent,
  onPick,
}: {
  food: FoodSource;
  accent: string;
  onPick?: (food: FoodSource) => void;
}) {
  const canPick = !!onPick;
  return (
    <div
      className="rounded-xl border px-3 py-2.5 flex items-center gap-3"
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span
            className="font-semibold text-sm leading-tight"
            style={{ color: 'rgba(245,245,240,0.92)' }}
          >
            {food.name}
          </span>
          {food.veg && (
            <span
              aria-label="Vegetarian"
              title="Vegetarian"
              className="inline-flex items-center"
            >
              <Leaf size={10} style={{ color: '#c6ff3d' }} />
            </span>
          )}
          {food.indianStaple && (
            <span
              className="font-mono uppercase tracking-[0.10em] font-bold px-1 py-0.5 rounded"
              style={{
                fontSize: 8,
                color: '#ffd24d',
                background: 'rgba(255,210,77,0.10)',
              }}
            >
              Staple
            </span>
          )}
        </div>
        <div
          className="font-mono mt-0.5"
          style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}
        >
          {food.portion} · {food.kcal} kcal
        </div>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-1.5">
          <MacroChip label="P" value={food.protein} unit="g" color="#ff8a4d" />
          <MacroChip label="C" value={food.carbs} unit="g" color="#c6ff3d" />
          <MacroChip label="F" value={food.fats} unit="g" color="#ffd24d" />
          <MacroChip label="Fb" value={food.fiber} unit="g" color="#7dd3ff" />
        </div>
      </div>
      {canPick && (
        <button
          type="button"
          onClick={() => onPick?.(food)}
          aria-label={`Add ${food.name}`}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-80 flex-shrink-0"
          style={{
            background: `${accent}22`,
            color: accent,
            border: `1px solid ${accent}55`,
          }}
        >
          <Plus size={15} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

function MacroChip({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  return (
    <span
      className="inline-flex items-baseline gap-0.5 font-mono"
      style={{ fontSize: 10 }}
    >
      <span style={{ color: 'rgba(255,255,255,0.40)' }}>{label}</span>
      <span style={{ color, fontWeight: 600 }}>
        {value}
        <span style={{ color: 'rgba(255,255,255,0.35)' }}>{unit}</span>
      </span>
    </span>
  );
}

function EmptyResults({
  query,
  mealType,
}: {
  query: string;
  mealType: MealTypeExtended;
}) {
  if (query.trim().length > 0) {
    return (
      <div className="text-center py-8">
        <p
          className="leading-relaxed"
          style={{ fontSize: 14, color: 'rgba(255,255,255,0.70)' }}
        >
          No foods match &quot;{query}&quot; for{' '}
          {MEAL_TYPE_META[mealType].label.toLowerCase()}.
        </p>
        <p
          className="mt-2"
          style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}
        >
          Try a different meal type or clear the search.
        </p>
      </div>
    );
  }
  return (
    <div className="text-center py-8">
      <p
        className="leading-relaxed"
        style={{ fontSize: 14, color: 'rgba(255,255,255,0.70)' }}
      >
        No foods tagged for {MEAL_TYPE_META[mealType].label.toLowerCase()} yet.
      </p>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Guess the most likely meal type based on local hour. Same approach
 * as MealLogSheet.guessMealType() — keeping them aligned saves the
 * user a tap when the food browser opens from the meal log.
 */
function guessMealType(): MealTypeExtended {
  const h = new Date().getHours();
  if (h < 6) return 'snack';
  if (h < 9) return 'breakfast';
  if (h < 11) return 'pre_workout';
  if (h < 15) return 'lunch';
  if (h < 18) return 'snack';
  if (h < 22) return 'dinner';
  return 'snack';
}
