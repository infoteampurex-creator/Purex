'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Sparkles, Trash2, Camera, Edit3, BookOpen } from 'lucide-react';
import { MealLogSheet } from '@/components/client/dashboard/MealLogSheet';
import { FoodSourcesSheet } from '@/components/client/dashboard/FoodSourcesSheet';
import { MealPlanCard } from '@/components/client/nutrition/MealPlanCard';
import { deleteMeal } from '@/lib/actions/meals';
import { useRouter } from 'next/navigation';
import type { MealRow } from '@/lib/data/meals';
import type { NutritionSnapshot } from '@/lib/data/twin';
import type { MealPlan } from '@/lib/data/meal-plan';
import type { FoodSource } from '@/lib/data/food-sources';

interface Props {
  nutrition: NutritionSnapshot;
  meals: MealRow[];
  mealPlan: MealPlan;
  firstName: string;
  /**
   * In-code FOOD_SOURCES merged with admin-curated rows from the
   * Google Sheets sync. Passed down to MealPlanCard → MealSwapSheet
   * so swap suggestions include admin additions without the swap
   * sheet needing a server round-trip on open.
   */
  foodSources: FoodSource[];
}

/**
 * NutritionPageView — orchestrator for the top-level Nutrition page.
 *
 * Owns the two sheets (meal log + food sources browser) and presents:
 *   • Today's macro totals with progress vs targets
 *   • Today's meals list
 *   • Big "Log meal" CTA
 *   • Big "Browse food ideas" CTA
 *
 * Both sheets are reused from the dashboard — no duplicate code.
 * The dashboard's quick-log entry point (AppFitnessTiles) still
 * opens the same MealLogSheet, so users have two entry points
 * (Home tile or Nutrition page) into the same flow.
 */
export function NutritionPageView({
  nutrition,
  meals,
  mealPlan,
  firstName,
  foodSources,
}: Props) {
  const router = useRouter();
  const [logSheetOpen, setLogSheetOpen] = useState(false);
  const [foodSheetOpen, setFoodSheetOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const todayTotals = {
    caloriesConsumed: nutrition.caloriesConsumed,
    caloriesTarget: nutrition.caloriesTarget || 2000,
    proteinG: nutrition.proteinG,
    proteinTargetG: nutrition.proteinTargetG || 120,
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    const res = await deleteMeal(id);
    setDeletingId(null);
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.warn('Delete failed:', res.error);
      return;
    }
    router.refresh();
  };

  return (
    <>
      {/* ─── Coach-assigned diet plan ─── */}
      <MealPlanCard
        plan={mealPlan}
        firstName={firstName}
        foodSources={foodSources}
      />

      {/* ─── Today's totals hero ─── */}
      <section className="rounded-3xl overflow-hidden border mb-5"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, rgba(255, 138, 77, 0.10) 0%, transparent 55%),
            linear-gradient(180deg, #14110d 0%, #0a0c09 100%)
          `,
          borderColor: 'rgba(255,138,77,0.22)',
          boxShadow: '0 0 0 1px rgba(255,138,77,0.10), 0 24px 48px -12px rgba(0,0,0,0.55)',
        }}
      >
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] font-bold"
            style={{ color: '#ff8a4d' }}
          >
            <Sparkles size={11} />
            Today
          </div>
          <span
            className="font-mono uppercase tracking-[0.16em] font-bold"
            style={{ fontSize: 9, color: 'rgba(255,255,255,0.50)' }}
          >
            {meals.length} {meals.length === 1 ? 'meal' : 'meals'} logged
          </span>
        </div>

        <div className="px-5 pb-5 grid grid-cols-2 gap-4">
          <MacroDial
            label="Calories"
            value={nutrition.caloriesConsumed}
            target={todayTotals.caloriesTarget}
            unit="kcal"
            color="#ff8a4d"
          />
          <MacroDial
            label="Protein"
            value={nutrition.proteinG}
            target={todayTotals.proteinTargetG}
            unit="g"
            color="#c6ff3d"
          />
        </div>

        {/* Carbs / fats / fiber compact row */}
        <div className="px-5 pb-5 grid grid-cols-3 gap-2">
          <SmallMacro label="Carbs" value={nutrition.carbsG} unit="g" color="#ffd24d" />
          <SmallMacro label="Fats" value={nutrition.fatsG} unit="g" color="#a78bfa" />
          <SmallMacro label="Fiber" value={nutrition.fiberG} unit="g" color="#7dd3ff" />
        </div>
      </section>

      {/* ─── Action CTAs ─── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => setLogSheetOpen(true)}
          className="flex items-start gap-3 rounded-2xl px-4 py-4 text-left transition-colors hover:bg-white/[0.02]"
          style={{
            background: 'rgba(255,138,77,0.08)',
            border: '1px solid rgba(255,138,77,0.30)',
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'rgba(255,138,77,0.18)',
              color: '#ff8a4d',
            }}
          >
            <Camera size={18} />
          </div>
          <div className="min-w-0">
            <div
              className="font-mono uppercase tracking-[0.18em] font-bold"
              style={{ fontSize: 10, color: '#ff8a4d' }}
            >
              Log a meal
            </div>
            <div
              className="mt-0.5 leading-snug"
              style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}
            >
              Take a photo (AI estimates macros) or enter manually
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFoodSheetOpen(true)}
          className="flex items-start gap-3 rounded-2xl px-4 py-4 text-left transition-colors hover:bg-white/[0.02]"
          style={{
            background: 'rgba(198,255,61,0.06)',
            border: '1px solid rgba(198,255,61,0.28)',
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'rgba(198,255,61,0.18)',
              color: '#c6ff3d',
            }}
          >
            <BookOpen size={18} />
          </div>
          <div className="min-w-0">
            <div
              className="font-mono uppercase tracking-[0.18em] font-bold"
              style={{ fontSize: 10, color: '#c6ff3d' }}
            >
              Browse food ideas
            </div>
            <div
              className="mt-0.5 leading-snug"
              style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}
            >
              Carbs · protein · fat · fiber by meal type
            </div>
          </div>
        </button>
      </section>

      {/* ─── Today's meals list ─── */}
      <section className="rounded-3xl border p-5 mb-6"
        style={{
          background: 'rgba(255,255,255,0.02)',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display font-bold tracking-tight" style={{ fontSize: 18 }}>
            Today&apos;s meals
          </h2>
          <span
            className="font-mono uppercase tracking-[0.16em] font-bold"
            style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}
          >
            {meals.length} {meals.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {meals.length === 0 ? (
          <EmptyMeals onLog={() => setLogSheetOpen(true)} />
        ) : (
          <ul className="space-y-2">
            {meals.map((meal) => (
              <li key={meal.id}>
                <MealRowCard
                  meal={meal}
                  onDelete={() => handleDelete(meal.id)}
                  deleting={deletingId === meal.id}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ─── Sheets (rendered always; controlled by open state) ─── */}
      <MealLogSheet
        open={logSheetOpen}
        onClose={() => setLogSheetOpen(false)}
        today={{
          caloriesConsumed: nutrition.caloriesConsumed,
          caloriesTarget: todayTotals.caloriesTarget,
          proteinG: nutrition.proteinG,
          proteinTargetG: todayTotals.proteinTargetG,
        }}
        todaysMeals={meals}
      />

      <FoodSourcesSheet
        open={foodSheetOpen}
        onClose={() => setFoodSheetOpen(false)}
      />
    </>
  );
}

// ─── Sub-components ─────────────────────────────────────────────

function MacroDial({
  label,
  value,
  target,
  unit,
  color,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  color: string;
}) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div>
      <div
        className="font-mono uppercase tracking-[0.18em] font-bold"
        style={{ fontSize: 10, color }}
      >
        {label}
      </div>
      <div className="flex items-baseline gap-2 mt-1">
        <span
          className="font-display font-bold tabular-nums leading-none"
          style={{ fontSize: 32, color }}
        >
          {Math.round(value)}
        </span>
        <span
          className="font-mono"
          style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)' }}
        >
          / {target} {unit}
        </span>
      </div>
      <div
        className="mt-2 rounded-full overflow-hidden"
        style={{ height: 5, background: 'rgba(255,255,255,0.06)' }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 8px ${color}55` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function SmallMacro({
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
    <div
      className="rounded-xl px-3 py-2 text-center"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        className="font-mono uppercase tracking-[0.14em] font-bold"
        style={{ fontSize: 9, color }}
      >
        {label}
      </div>
      <div
        className="font-display font-bold tabular-nums leading-none mt-1"
        style={{ fontSize: 16, color: 'rgba(245,245,240,0.92)' }}
      >
        {Math.round(value)}
        <span
          className="font-mono"
          style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', marginLeft: 2 }}
        >
          {unit}
        </span>
      </div>
    </div>
  );
}

function MealRowCard({
  meal,
  onDelete,
  deleting,
}: {
  meal: MealRow;
  onDelete: () => void;
  deleting: boolean;
}) {
  const mealEmoji = (() => {
    switch (meal.meal_type) {
      case 'breakfast': return '🥚';
      case 'lunch':     return '🍱';
      case 'dinner':    return '🍽️';
      case 'snack':     return '🥨';
      default:          return '🍴';
    }
  })();

  return (
    <div
      className="rounded-xl border px-3 py-2.5 flex items-start gap-3"
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      <div
        className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(255,138,77,0.10)', fontSize: 18 }}
      >
        {mealEmoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <span
            className="font-semibold text-sm leading-tight"
            style={{ color: 'rgba(245,245,240,0.92)' }}
          >
            {meal.name || meal.meal_type}
          </span>
          <span
            className="font-display font-bold tabular-nums"
            style={{ fontSize: 14, color: '#ff8a4d' }}
          >
            {meal.calories}
            <span
              className="font-mono"
              style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', marginLeft: 2 }}
            >
              kcal
            </span>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
          <MealMacroChip label="P" value={meal.protein_g} color="#c6ff3d" />
          <MealMacroChip label="C" value={meal.carbs_g} color="#ffd24d" />
          <MealMacroChip label="F" value={meal.fats_g} color="#a78bfa" />
          <MealMacroChip label="Fb" value={meal.fiber_g} color="#7dd3ff" />
          {meal.source === 'ai_photo' && (
            <span
              className="font-mono uppercase tracking-[0.10em] font-bold px-1 py-0.5 rounded"
              style={{
                fontSize: 8,
                color: '#7dd3ff',
                background: 'rgba(125,211,255,0.10)',
              }}
            >
              AI
            </span>
          )}
          {meal.source === 'manual' && (
            <span
              className="font-mono uppercase tracking-[0.10em] font-bold"
              style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)' }}
            >
              <Edit3 size={8} className="inline" /> manual
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        aria-label="Delete meal"
        className="w-7 h-7 rounded-md border flex items-center justify-center transition-colors hover:border-danger/50 hover:text-danger flex-shrink-0 disabled:opacity-50"
        style={{ borderColor: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.50)' }}
      >
        <Trash2 size={11} />
      </button>
    </div>
  );
}

function MealMacroChip({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <span className="inline-flex items-baseline gap-0.5 font-mono" style={{ fontSize: 10 }}>
      <span style={{ color: 'rgba(255,255,255,0.40)' }}>{label}</span>
      <span style={{ color, fontWeight: 600 }}>
        {Math.round(value)}
        <span style={{ color: 'rgba(255,255,255,0.35)' }}>g</span>
      </span>
    </span>
  );
}

function EmptyMeals({ onLog }: { onLog: () => void }) {
  return (
    <div className="text-center py-6">
      <p
        className="leading-relaxed"
        style={{ fontSize: 14, color: 'rgba(255,255,255,0.70)' }}
      >
        No meals logged yet today.
      </p>
      <p
        className="mt-1 leading-relaxed"
        style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}
      >
        Log your first meal to start your score and feed your trainer the data.
      </p>
      <button
        type="button"
        onClick={onLog}
        className="inline-flex items-center gap-1.5 mt-4 rounded-full px-4 py-2 font-mono uppercase tracking-[0.18em] font-bold transition-opacity hover:opacity-90"
        style={{
          fontSize: 11,
          color: '#0a0c09',
          background: 'linear-gradient(135deg, #ff8a4d 0%, #ffd24d 100%)',
        }}
      >
        <Plus size={12} />
        Log first meal
      </button>
    </div>
  );
}
