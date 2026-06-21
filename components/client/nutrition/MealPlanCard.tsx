'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Utensils,
  ChevronDown,
  ChevronUp,
  Droplets,
  Activity,
  Moon,
  Sparkles,
  Repeat,
} from 'lucide-react';
import {
  isMealPlanEmpty,
  MEAL_TYPE_LABELS,
  type MealPlan,
  type PlanMealType,
} from '@/lib/data/meal-plan';

// Heavy bottom sheet — only loads when the client taps "Swap" on an item.
const MealSwapSheet = dynamic(
  () =>
    import('./MealSwapSheet').then((m) => ({ default: m.MealSwapSheet })),
  { ssr: false }
);

interface Props {
  plan: MealPlan;
  /** First name for friendlier copy. */
  firstName: string;
}

/**
 * MealPlanCard — surfaces the coach-assigned diet plan on the client
 * Nutrition page. Reads `client_meal_plan` indirectly via the parent
 * server fetch.
 *
 * Display layout:
 *   - Header with "Your plan from Coach" + last-updated badge
 *   - Daily macro target row (cal · carbs · protein · fats)
 *   - Lifestyle target row (water · steps · sleep)
 *   - Collapsible meal sections (each meal expands to show items)
 *   - Cooking oil + coach notes at the bottom (when present)
 *
 * Empty state: a friendly nudge ("Your coach hasn't set a diet plan
 * yet. Once they do, your daily meals + targets will appear here.").
 */
export function MealPlanCard({ plan, firstName }: Props) {
  const empty = isMealPlanEmpty(plan);
  const [expanded, setExpanded] = useState<Set<number>>(
    () => new Set(plan.meals.map((_, i) => i))
  );

  /** Currently-open swap context — null when sheet is closed. */
  const [swap, setSwap] = useState<{
    foodName: string;
    kcal: number;
    mealType: PlanMealType | null;
  } | null>(null);

  const toggleMeal = (idx: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <section
      className="rounded-3xl border overflow-hidden mb-5"
      style={{
        borderColor: 'rgba(125,211,255,0.22)',
        background: `
          radial-gradient(ellipse at 50% 0%, rgba(125,211,255,0.08) 0%, transparent 55%),
          linear-gradient(180deg, #0d1218 0%, #0a0c09 100%)
        `,
        boxShadow:
          '0 0 0 1px rgba(125,211,255,0.10), 0 24px 48px -12px rgba(0,0,0,0.55)',
      }}
    >
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] font-bold"
          style={{ color: '#7dd3ff' }}
        >
          <Utensils size={11} />
          Your plan from Coach
        </div>
        {!empty && plan.updatedAt && (
          <span
            className="font-mono uppercase tracking-[0.14em] font-bold"
            style={{ fontSize: 9, color: 'rgba(255,255,255,0.40)' }}
          >
            Updated {formatRelative(plan.updatedAt)}
          </span>
        )}
      </div>

      {empty ? (
        <div className="px-5 pb-5 pt-2">
          <div
            className="rounded-xl border border-dashed px-4 py-6 text-center"
            style={{
              borderColor: 'rgba(255,255,255,0.10)',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <Sparkles
              size={18}
              style={{ color: 'rgba(125,211,255,0.50)', margin: '0 auto 8px' }}
            />
            <div
              className="font-display font-semibold mb-1"
              style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}
            >
              Diet plan coming soon
            </div>
            <div
              style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}
            >
              Once your coach assigns your daily meals + macro targets,
              they&apos;ll show up here. Until then, log meals freely
              below.
            </div>
          </div>
        </div>
      ) : (
        <div className="px-5 pb-5">
          {/* ─── Macro targets row ─── */}
          <div
            className="rounded-xl border p-3 mb-3"
            style={{
              borderColor: 'rgba(255,138,77,0.18)',
              background: 'rgba(255,138,77,0.04)',
            }}
          >
            <div
              className="font-mono uppercase tracking-[0.18em] font-bold mb-2"
              style={{ fontSize: 9, color: 'rgba(255,138,77,0.85)' }}
            >
              Daily macro targets
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MacroPill label="Cal" value={fmtTarget(plan.macros.calories, null)} unit="kcal" />
              <MacroPill
                label="Carbs"
                value={fmtTarget(plan.macros.carbsMin, plan.macros.carbsMax)}
                unit="g"
              />
              <MacroPill
                label="Protein"
                value={fmtTarget(plan.macros.proteinMin, plan.macros.proteinMax)}
                unit="g"
              />
              <MacroPill
                label="Fats"
                value={fmtTarget(plan.macros.fatsMin, plan.macros.fatsMax)}
                unit="g"
              />
            </div>
          </div>

          {/* ─── Lifestyle targets row ─── */}
          {hasLifestyle(plan) && (
            <div
              className="rounded-xl border p-3 mb-3"
              style={{
                borderColor: 'rgba(125,211,255,0.18)',
                background: 'rgba(125,211,255,0.04)',
              }}
            >
              <div
                className="font-mono uppercase tracking-[0.18em] font-bold mb-2"
                style={{ fontSize: 9, color: 'rgba(125,211,255,0.85)' }}
              >
                Lifestyle targets
              </div>
              <div className="grid grid-cols-3 gap-3">
                <LifestylePill
                  icon={<Droplets size={11} />}
                  label="Water"
                  value={plan.lifestyle.waterLiters?.toString() ?? '—'}
                  unit="L"
                />
                <LifestylePill
                  icon={<Activity size={11} />}
                  label="Steps"
                  value={
                    plan.lifestyle.stepsTarget?.toLocaleString() ?? '—'
                  }
                  unit=""
                />
                <LifestylePill
                  icon={<Moon size={11} />}
                  label="Sleep"
                  value={plan.lifestyle.sleepHours?.toString() ?? '—'}
                  unit="h"
                />
              </div>
            </div>
          )}

          {/* ─── Meal sections ─── */}
          <div className="space-y-2">
            {plan.meals.map((meal, idx) => {
              const isOpen = expanded.has(idx);
              return (
                <div
                  key={idx}
                  className="rounded-xl border overflow-hidden"
                  style={{
                    borderColor: 'rgba(198,255,61,0.18)',
                    background: 'rgba(198,255,61,0.03)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleMeal(idx)}
                    className="w-full px-3 py-2.5 flex items-center justify-between gap-2 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-wrap text-left">
                      <span
                        className="font-display font-semibold"
                        style={{ fontSize: 13, color: '#c6ff3d' }}
                      >
                        {meal.mealName}
                      </span>
                      {meal.mealType && (
                        <span
                          className="font-mono uppercase tracking-[0.14em] font-bold"
                          style={{
                            fontSize: 9,
                            color: 'rgba(255,255,255,0.45)',
                          }}
                        >
                          {MEAL_TYPE_LABELS[meal.mealType]}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 11,
                          color: 'rgba(255,255,255,0.45)',
                        }}
                      >
                        · {meal.items.length} item
                        {meal.items.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    {isOpen ? (
                      <ChevronUp
                        size={13}
                        style={{ color: 'rgba(255,255,255,0.50)' }}
                      />
                    ) : (
                      <ChevronDown
                        size={13}
                        style={{ color: 'rgba(255,255,255,0.50)' }}
                      />
                    )}
                  </button>

                  {isOpen && meal.items.length > 0 && (
                    <ul className="px-4 pb-3 space-y-1.5">
                      {meal.items.map((it, j) => {
                        const canSwap =
                          typeof it.calories === 'number' && it.calories > 0;
                        return (
                          <li
                            key={j}
                            className="flex items-center gap-2"
                            style={{ fontSize: 12 }}
                          >
                            <span
                              style={{ color: 'rgba(255,255,255,0.40)' }}
                            >
                              ·
                            </span>
                            <span
                              style={{
                                color: 'rgba(255,255,255,0.85)',
                                flex: 1,
                                minWidth: 0,
                              }}
                              className="truncate"
                            >
                              {it.foodName}
                            </span>
                            {it.quantity && (
                              <span
                                className="font-mono flex-shrink-0"
                                style={{
                                  fontSize: 11,
                                  color: 'rgba(125,211,255,0.85)',
                                }}
                              >
                                {it.quantity}
                              </span>
                            )}
                            {typeof it.calories === 'number' && (
                              <span
                                className="font-mono tabular-nums flex-shrink-0 rounded-md px-1.5 py-0.5"
                                style={{
                                  fontSize: 10.5,
                                  background: 'rgba(198,255,61,0.08)',
                                  color: '#c6ff3d',
                                  border: '1px solid rgba(198,255,61,0.18)',
                                }}
                                aria-label={`${it.calories} kcal`}
                              >
                                {it.calories}
                                <span
                                  className="uppercase tracking-[0.12em] font-bold ml-0.5"
                                  style={{
                                    fontSize: 8.5,
                                    color: 'rgba(198,255,61,0.65)',
                                  }}
                                >
                                  kcal
                                </span>
                              </span>
                            )}
                            {canSwap && (
                              <button
                                type="button"
                                onClick={() =>
                                  setSwap({
                                    foodName: it.foodName,
                                    kcal: it.calories as number,
                                    mealType: meal.mealType,
                                  })
                                }
                                className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-colors"
                                style={{
                                  background: 'rgba(255,255,255,0.04)',
                                  border:
                                    '1px solid rgba(255,255,255,0.08)',
                                  color: 'rgba(255,255,255,0.60)',
                                }}
                                title={`See alternatives at ~${it.calories} kcal`}
                                aria-label={`Show alternatives to ${it.foodName} at similar calories`}
                              >
                                <Repeat size={11} />
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {isOpen && meal.notes && (
                    <div
                      className="px-4 pb-3"
                      style={{
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.55)',
                        fontStyle: 'italic',
                      }}
                    >
                      Coach note: {meal.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ─── Cooking oil + free notes ─── */}
          {(plan.cookingOilNote || plan.notes) && (
            <div
              className="mt-3 rounded-xl border p-3"
              style={{
                borderColor: 'rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              {plan.cookingOilNote && (
                <div className="mb-2">
                  <div
                    className="font-mono uppercase tracking-[0.18em] font-bold"
                    style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)' }}
                  >
                    Cooking oil (daily total)
                  </div>
                  <div
                    style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}
                  >
                    {plan.cookingOilNote}
                  </div>
                </div>
              )}
              {plan.notes && (
                <div>
                  <div
                    className="font-mono uppercase tracking-[0.18em] font-bold"
                    style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)' }}
                  >
                    Coach notes
                  </div>
                  <div
                    className="whitespace-pre-line"
                    style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}
                  >
                    {plan.notes}
                  </div>
                </div>
              )}
            </div>
          )}

          <div
            className="mt-3 text-center"
            style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)' }}
          >
            Hey {firstName} — log what you actually eat below to track
            your day-by-day compliance against this plan.
          </div>
        </div>
      )}

      {/* Lazy-loaded alternatives sheet. Only mounts after the client
          taps a Swap button on an item with kcal set. */}
      {swap && (
        <MealSwapSheet
          open={true}
          onClose={() => setSwap(null)}
          itemName={swap.foodName}
          itemKcal={swap.kcal}
          mealType={swap.mealType}
        />
      )}
    </section>
  );
}

// ─── helper bits ────────────────────────────────────────────────

function MacroPill({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="font-mono uppercase tracking-[0.14em] font-bold"
        style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)' }}
      >
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span
          className="font-display font-bold"
          style={{ fontSize: 16, color: '#ff8a4d' }}
        >
          {value}
        </span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)' }}>
          {unit}
        </span>
      </div>
    </div>
  );
}

function LifestylePill({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="font-mono uppercase tracking-[0.14em] font-bold inline-flex items-center gap-1"
        style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)' }}
      >
        {icon}
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span
          className="font-display font-bold"
          style={{ fontSize: 15, color: '#7dd3ff' }}
        >
          {value}
        </span>
        {unit && (
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)' }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function fmtTarget(min: number | null, max: number | null): string {
  if (min === null && max === null) return '—';
  if (min !== null && max !== null && min !== max) return `${min}–${max}`;
  return String(min ?? max ?? '—');
}

function hasLifestyle(plan: MealPlan): boolean {
  return (
    plan.lifestyle.waterLiters !== null ||
    plan.lifestyle.stepsTarget !== null ||
    plan.lifestyle.sleepHours !== null
  );
}

/** "5 min ago" / "3 h ago" / "2 d ago". Falls back to date string for
 *  anything older than 14 days. */
function formatRelative(iso: string): string {
  const t = new Date(iso).getTime();
  if (isNaN(t)) return '';
  const diffMs = Date.now() - t;
  const min = Math.round(diffMs / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} h ago`;
  const days = Math.round(hr / 24);
  if (days < 14) return `${days} d ago`;
  return new Date(iso).toLocaleDateString();
}
