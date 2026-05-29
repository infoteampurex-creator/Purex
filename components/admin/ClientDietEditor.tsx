'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Utensils,
  Save,
  AlertCircle,
  Check,
  ClipboardPaste,
  X,
  ChevronRight,
  Plus,
  Trash2,
  Droplets,
  Activity,
  Moon,
} from 'lucide-react';
import { setClientMealPlan } from '@/lib/actions/meal-plan';
import { previewPastedDietPlan } from '@/lib/actions/meal-plan-import';
import {
  MEAL_TYPE_LABELS,
  type MealPlan,
  type MealPlanMeal,
  type MealPlanItem,
  type PlanMealType,
} from '@/lib/data/meal-plan';
import type { ParsedDietPlan } from '@/lib/data/meal-plan-paste';

const MEAL_TYPE_VALUES: PlanMealType[] = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'pre_workout',
  'post_workout',
  'other',
];

interface Props {
  clientId: string;
  clientName: string;
  initial: MealPlan;
}

/**
 * ClientDietEditor — coach UI for setting a client's recurring daily
 * diet plan. Drops into /admin/clients/[id].
 *
 * Plan structure mirrors how Siva already writes diets on WhatsApp:
 *   - List of meals (Breakfast, Lunch, Pre-Workout, Dinner, …)
 *     Each meal has ordered food items (food name + quantity text).
 *   - Day-level macro targets (calories + protein/carbs/fats range)
 *   - Lifestyle targets (water L, steps, sleep hours)
 *   - Cooking oil note (daily-total, not per-meal)
 *   - Free-form coach notes
 *
 * Paste-to-extract flow at the top: drop the WhatsApp block → parser
 * fills every field → coach reviews + tweaks → Save.
 */
export function ClientDietEditor({
  clientId,
  clientName,
  initial,
}: Props) {
  const router = useRouter();
  const [plan, setPlan] = useState<MealPlan>(initial);
  const [saving, startSave] = useTransition();
  const [result, setResult] = useState<
    | { ok: true; meals: number; items: number }
    | { ok: false; error: string }
    | null
  >(null);
  const [pasteOpen, setPasteOpen] = useState(false);

  // ─── state updaters ──────────────────────────────────────────

  const updateMacro = <K extends keyof MealPlan['macros']>(
    key: K,
    value: MealPlan['macros'][K]
  ) => {
    setPlan((p) => ({ ...p, macros: { ...p.macros, [key]: value } }));
  };

  const updateLifestyle = <K extends keyof MealPlan['lifestyle']>(
    key: K,
    value: MealPlan['lifestyle'][K]
  ) => {
    setPlan((p) => ({ ...p, lifestyle: { ...p.lifestyle, [key]: value } }));
  };

  const addMeal = () => {
    setPlan((p) => ({
      ...p,
      meals: [
        ...p.meals,
        {
          mealName: 'New meal',
          mealOrder: p.meals.length,
          mealType: null,
          notes: null,
          items: [],
        },
      ],
    }));
  };

  const removeMeal = (idx: number) => {
    setPlan((p) => ({
      ...p,
      meals: p.meals
        .filter((_, i) => i !== idx)
        .map((m, i) => ({ ...m, mealOrder: i })),
    }));
  };

  const updateMeal = (idx: number, patch: Partial<MealPlanMeal>) => {
    setPlan((p) => ({
      ...p,
      meals: p.meals.map((m, i) => (i === idx ? { ...m, ...patch } : m)),
    }));
  };

  const addItem = (mealIdx: number) => {
    setPlan((p) => ({
      ...p,
      meals: p.meals.map((m, i) =>
        i === mealIdx
          ? {
              ...m,
              items: [
                ...m.items,
                { foodName: '', quantity: null, itemOrder: m.items.length },
              ],
            }
          : m
      ),
    }));
  };

  const removeItem = (mealIdx: number, itemIdx: number) => {
    setPlan((p) => ({
      ...p,
      meals: p.meals.map((m, i) =>
        i === mealIdx
          ? {
              ...m,
              items: m.items
                .filter((_, j) => j !== itemIdx)
                .map((it, j) => ({ ...it, itemOrder: j })),
            }
          : m
      ),
    }));
  };

  const updateItem = (
    mealIdx: number,
    itemIdx: number,
    patch: Partial<MealPlanItem>
  ) => {
    setPlan((p) => ({
      ...p,
      meals: p.meals.map((m, i) =>
        i === mealIdx
          ? {
              ...m,
              items: m.items.map((it, j) =>
                j === itemIdx ? { ...it, ...patch } : it
              ),
            }
          : m
      ),
    }));
  };

  // ─── save ────────────────────────────────────────────────────

  const handleSave = () => {
    setResult(null);
    startSave(async () => {
      const res = await setClientMealPlan({
        clientId,
        name: plan.name,
        macros: plan.macros,
        lifestyle: plan.lifestyle,
        cookingOilNote: plan.cookingOilNote,
        notes: plan.notes,
        meals: plan.meals.map((m, i) => ({
          mealName: m.mealName.trim() || `Meal ${i + 1}`,
          mealOrder: i,
          mealType: m.mealType,
          notes: m.notes,
          items: m.items
            .filter((it) => it.foodName.trim().length > 0)
            .map((it, j) => ({
              foodName: it.foodName.trim(),
              quantity: it.quantity?.trim() || null,
              itemOrder: j,
              notes: null,
            })),
        })),
      });
      if (!res.ok) {
        setResult({ ok: false, error: res.error });
        return;
      }
      setResult({
        ok: true,
        meals: res.mealsWritten,
        items: res.itemsWritten,
      });
      router.refresh();
    });
  };

  // ─── apply paste preview to editor state ────────────────────

  const applyPreview = (parsed: ParsedDietPlan) => {
    setPlan((p) => ({
      ...p,
      macros: {
        calories: parsed.macros.calories ?? p.macros.calories,
        carbsMin: parsed.macros.carbsMin ?? p.macros.carbsMin,
        carbsMax: parsed.macros.carbsMax ?? p.macros.carbsMax,
        proteinMin: parsed.macros.proteinMin ?? p.macros.proteinMin,
        proteinMax: parsed.macros.proteinMax ?? p.macros.proteinMax,
        fatsMin: parsed.macros.fatsMin ?? p.macros.fatsMin,
        fatsMax: parsed.macros.fatsMax ?? p.macros.fatsMax,
      },
      lifestyle: {
        waterLiters: parsed.lifestyle.waterLiters ?? p.lifestyle.waterLiters,
        stepsTarget: parsed.lifestyle.stepsTarget ?? p.lifestyle.stepsTarget,
        sleepHours: parsed.lifestyle.sleepHours ?? p.lifestyle.sleepHours,
      },
      cookingOilNote: parsed.cookingOilNote ?? p.cookingOilNote,
      notes: parsed.notesFreeText ?? p.notes,
      meals: parsed.meals.map((m, i) => ({
        mealName: m.name,
        mealOrder: i,
        mealType: m.mealType,
        notes: null,
        items: m.items.map((it, j) => ({
          foodName: it.foodName,
          quantity: it.quantity,
          itemOrder: j,
        })),
      })),
    }));
    setPasteOpen(false);
  };

  const totalItems = plan.meals.reduce((n, m) => n + m.items.length, 0);
  const firstName = clientName.split(/\s+/)[0] ?? clientName;

  return (
    <section
      className="rounded-2xl border bg-bg-card p-5 md:p-6"
      style={{ borderColor: 'rgba(125,211,255,0.25)' }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Utensils size={14} style={{ color: '#7dd3ff' }} />
        <h2 className="font-display font-semibold text-lg tracking-tight">
          Diet plan
        </h2>
      </div>
      <p className="text-sm text-text-muted mb-1">
        Set {firstName}&apos;s daily meals once — the plan stays valid
        until you edit it. Client sees today&apos;s meals on their
        Nutrition page and logs actuals against it.
      </p>
      <p
        className="leading-snug mb-5"
        style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)' }}
      >
        Tip: paste your WhatsApp diet block — the parser extracts meals,
        items, day-level macros, and lifestyle targets automatically.
      </p>

      {/* ─── Paste-to-extract shortcut ─── */}
      <div className="mb-5">
        {!pasteOpen ? (
          <button
            type="button"
            onClick={() => setPasteOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono uppercase tracking-[0.14em] font-bold border transition-colors hover:bg-accent/10"
            style={{
              fontSize: 10,
              color: '#7dd3ff',
              borderColor: 'rgba(125,211,255,0.30)',
              background: 'rgba(125,211,255,0.05)',
            }}
          >
            <ClipboardPaste size={11} />
            Paste diet text — extract meals &amp; macros
          </button>
        ) : (
          <PasteDietBox
            onClose={() => setPasteOpen(false)}
            onApply={applyPreview}
          />
        )}
      </div>

      {/* ─── Day-level macro targets ─── */}
      <div
        className="rounded-xl border p-4 mb-4"
        style={{
          borderColor: 'rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        <div
          className="font-mono uppercase tracking-[0.18em] font-bold mb-3"
          style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}
        >
          Daily macro targets
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <NumberField
            label="Calories (kcal)"
            value={plan.macros.calories}
            onChange={(v) => updateMacro('calories', v)}
            min={0}
            max={10000}
          />
          <RangeField
            label="Carbs (g)"
            min={plan.macros.carbsMin}
            max={plan.macros.carbsMax}
            onMinChange={(v) => updateMacro('carbsMin', v)}
            onMaxChange={(v) => updateMacro('carbsMax', v)}
          />
          <RangeField
            label="Protein (g)"
            min={plan.macros.proteinMin}
            max={plan.macros.proteinMax}
            onMinChange={(v) => updateMacro('proteinMin', v)}
            onMaxChange={(v) => updateMacro('proteinMax', v)}
          />
          <RangeField
            label="Fats (g)"
            min={plan.macros.fatsMin}
            max={plan.macros.fatsMax}
            onMinChange={(v) => updateMacro('fatsMin', v)}
            onMaxChange={(v) => updateMacro('fatsMax', v)}
          />
        </div>
      </div>

      {/* ─── Lifestyle targets ─── */}
      <div
        className="rounded-xl border p-4 mb-4"
        style={{
          borderColor: 'rgba(125,211,255,0.15)',
          background: 'rgba(125,211,255,0.03)',
        }}
      >
        <div
          className="font-mono uppercase tracking-[0.18em] font-bold mb-3"
          style={{ fontSize: 10, color: 'rgba(125,211,255,0.70)' }}
        >
          Lifestyle targets
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <NumberField
            icon={<Droplets size={11} />}
            label="Water (L)"
            value={plan.lifestyle.waterLiters}
            step={0.5}
            onChange={(v) => updateLifestyle('waterLiters', v)}
            min={0}
            max={20}
          />
          <NumberField
            icon={<Activity size={11} />}
            label="Steps"
            value={plan.lifestyle.stepsTarget}
            onChange={(v) => updateLifestyle('stepsTarget', v ? Math.round(v) : null)}
            min={0}
            max={60000}
          />
          <NumberField
            icon={<Moon size={11} />}
            label="Sleep (h)"
            value={plan.lifestyle.sleepHours}
            step={0.5}
            onChange={(v) => updateLifestyle('sleepHours', v)}
            min={0}
            max={16}
          />
        </div>
      </div>

      {/* ─── Meal sections ─── */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div
            className="font-mono uppercase tracking-[0.18em] font-bold"
            style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}
          >
            Meals ({plan.meals.length} · {totalItems} items)
          </div>
          <button
            type="button"
            onClick={addMeal}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono uppercase tracking-[0.14em] font-bold border transition-colors hover:bg-accent/10"
            style={{
              fontSize: 9,
              color: '#c6ff3d',
              borderColor: 'rgba(198,255,61,0.30)',
              background: 'rgba(198,255,61,0.05)',
            }}
          >
            <Plus size={10} />
            Add meal
          </button>
        </div>
        <div className="space-y-2">
          {plan.meals.length === 0 ? (
            <div
              className="rounded-lg border border-dashed px-4 py-6 text-center"
              style={{
                borderColor: 'rgba(255,255,255,0.10)',
                fontSize: 12,
                color: 'rgba(255,255,255,0.50)',
              }}
            >
              No meals yet. Paste a diet block or click &quot;Add meal&quot;.
            </div>
          ) : (
            plan.meals.map((meal, i) => (
              <MealRow
                key={i}
                meal={meal}
                onChange={(patch) => updateMeal(i, patch)}
                onRemove={() => removeMeal(i)}
                onAddItem={() => addItem(i)}
                onRemoveItem={(j) => removeItem(i, j)}
                onUpdateItem={(j, patch) => updateItem(i, j, patch)}
              />
            ))
          )}
        </div>
      </div>

      {/* ─── Cooking oil + free notes ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <div>
          <div
            className="font-mono uppercase tracking-[0.18em] font-bold mb-1.5"
            style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}
          >
            Cooking oil (daily total)
          </div>
          <input
            type="text"
            value={plan.cookingOilNote ?? ''}
            onChange={(e) =>
              setPlan((p) => ({
                ...p,
                cookingOilNote: e.target.value.slice(0, 300) || null,
              }))
            }
            placeholder="e.g. Olive Oil – 10ml"
            className="w-full rounded-lg bg-bg-elevated border border-border-soft px-3 py-2 text-sm focus:border-accent/50 focus:outline-none"
          />
        </div>
        <div>
          <div
            className="font-mono uppercase tracking-[0.18em] font-bold mb-1.5"
            style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}
          >
            Coach notes
          </div>
          <input
            type="text"
            value={plan.notes ?? ''}
            onChange={(e) =>
              setPlan((p) => ({ ...p, notes: e.target.value.slice(0, 2000) || null }))
            }
            placeholder="Free-form rules — e.g. no processed sugar on workout days"
            className="w-full rounded-lg bg-bg-elevated border border-border-soft px-3 py-2 text-sm focus:border-accent/50 focus:outline-none"
          />
        </div>
      </div>

      {/* ─── Save row + result ─── */}
      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border-soft">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-mono uppercase tracking-[0.18em] font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{
            fontSize: 11,
            color: '#0a0c09',
            background: 'linear-gradient(135deg, #7dd3ff 0%, #c6ff3d 100%)',
          }}
        >
          <Save size={12} />
          {saving ? 'Saving…' : 'Save diet plan'}
        </button>
        <span
          className="font-mono uppercase tracking-[0.14em] font-bold"
          style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}
        >
          {plan.meals.length} meals · {totalItems} items
        </span>
      </div>

      {result && (
        <div className="mt-3">
          {result.ok ? (
            <div
              className="rounded-lg px-3 py-2 flex items-start gap-2"
              style={{
                background: 'rgba(125,211,255,0.08)',
                border: '1px solid rgba(125,211,255,0.30)',
              }}
            >
              <Check
                size={14}
                strokeWidth={3}
                style={{ color: '#7dd3ff', flexShrink: 0, marginTop: 2 }}
              />
              <div>
                <div
                  className="font-mono uppercase tracking-[0.18em] font-bold"
                  style={{ fontSize: 10, color: '#7dd3ff' }}
                >
                  Saved
                </div>
                <div
                  className="leading-snug mt-0.5"
                  style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}
                >
                  {result.meals} meal{result.meals === 1 ? '' : 's'} ·{' '}
                  {result.items} item{result.items === 1 ? '' : 's'} saved.
                  {firstName} sees the new plan on next page load.
                </div>
              </div>
            </div>
          ) : (
            <div
              className="rounded-lg px-3 py-2 flex items-start gap-2"
              style={{
                background: 'rgba(255,107,107,0.08)',
                border: '1px solid rgba(255,107,107,0.30)',
              }}
            >
              <AlertCircle
                size={14}
                style={{ color: '#ff9999', flexShrink: 0, marginTop: 2 }}
              />
              <span style={{ fontSize: 12, color: '#ff9999' }}>
                {result.error}
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ─── Helpers: NumberField, RangeField ──────────────────────────

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  icon,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  icon?: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span
        className="font-mono uppercase tracking-[0.14em] font-bold inline-flex items-center gap-1"
        style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)' }}
      >
        {icon}
        {label}
      </span>
      <input
        type="number"
        value={value ?? ''}
        min={min}
        max={max}
        step={step}
        onChange={(e) =>
          onChange(e.target.value === '' ? null : Number(e.target.value))
        }
        placeholder="—"
        className="w-full rounded-md bg-bg-elevated border border-border-soft px-2 py-1.5 text-sm focus:border-accent/50 focus:outline-none"
      />
    </label>
  );
}

function RangeField({
  label,
  min,
  max,
  onMinChange,
  onMaxChange,
}: {
  label: string;
  min: number | null;
  max: number | null;
  onMinChange: (v: number | null) => void;
  onMaxChange: (v: number | null) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span
        className="font-mono uppercase tracking-[0.14em] font-bold"
        style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)' }}
      >
        {label}
      </span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={min ?? ''}
          onChange={(e) =>
            onMinChange(e.target.value === '' ? null : Number(e.target.value))
          }
          placeholder="min"
          className="w-full rounded-md bg-bg-elevated border border-border-soft px-2 py-1.5 text-sm focus:border-accent/50 focus:outline-none"
        />
        <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: 11 }}>
          –
        </span>
        <input
          type="number"
          value={max ?? ''}
          onChange={(e) =>
            onMaxChange(e.target.value === '' ? null : Number(e.target.value))
          }
          placeholder="max"
          className="w-full rounded-md bg-bg-elevated border border-border-soft px-2 py-1.5 text-sm focus:border-accent/50 focus:outline-none"
        />
      </div>
    </label>
  );
}

// ─── MealRow ────────────────────────────────────────────────────

function MealRow({
  meal,
  onChange,
  onRemove,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
}: {
  meal: MealPlanMeal;
  onChange: (patch: Partial<MealPlanMeal>) => void;
  onRemove: () => void;
  onAddItem: () => void;
  onRemoveItem: (j: number) => void;
  onUpdateItem: (j: number, patch: Partial<MealPlanItem>) => void;
}) {
  return (
    <div
      className="rounded-xl border px-3 py-3"
      style={{
        borderColor: 'rgba(198,255,61,0.18)',
        background: 'rgba(198,255,61,0.03)',
      }}
    >
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <input
          type="text"
          value={meal.mealName}
          onChange={(e) => onChange({ mealName: e.target.value.slice(0, 60) })}
          placeholder="Meal name"
          className="flex-1 min-w-[140px] rounded bg-bg-elevated border border-border-soft px-2 py-1 text-sm font-display font-semibold focus:border-accent/50 focus:outline-none"
          style={{ color: '#c6ff3d' }}
        />
        <select
          value={meal.mealType ?? ''}
          onChange={(e) =>
            onChange({
              mealType: e.target.value === '' ? null : (e.target.value as PlanMealType),
            })
          }
          className="rounded bg-bg-elevated border border-border-soft px-2 py-1 text-xs font-mono focus:border-accent/50 focus:outline-none"
        >
          <option value="">— Type —</option>
          {MEAL_TYPE_VALUES.map((t) => (
            <option key={t} value={t}>
              {MEAL_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onRemove}
          className="p-1 rounded hover:bg-red-500/10 transition-colors"
          aria-label="Remove meal"
        >
          <Trash2 size={12} style={{ color: '#ff9999' }} />
        </button>
      </div>

      <div className="space-y-1.5 pl-1">
        {meal.items.map((item, j) => (
          <div key={j} className="flex items-center gap-1.5">
            <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: 12 }}>·</span>
            <input
              type="text"
              value={item.foodName}
              onChange={(e) =>
                onUpdateItem(j, { foodName: e.target.value.slice(0, 200) })
              }
              placeholder="Food"
              className="flex-1 min-w-[160px] rounded bg-bg-elevated border border-border-soft px-2 py-1 text-xs focus:border-accent/50 focus:outline-none"
            />
            <input
              type="text"
              value={item.quantity ?? ''}
              onChange={(e) =>
                onUpdateItem(j, { quantity: e.target.value.slice(0, 80) || null })
              }
              placeholder="qty"
              className="w-24 rounded bg-bg-elevated border border-border-soft px-2 py-1 text-xs font-mono focus:border-accent/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => onRemoveItem(j)}
              className="p-1 rounded hover:bg-red-500/10 transition-colors"
              aria-label="Remove item"
            >
              <X size={11} style={{ color: 'rgba(255,153,153,0.70)' }} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={onAddItem}
          className="inline-flex items-center gap-1 mt-1 px-2 py-1 rounded font-mono uppercase tracking-[0.14em] font-bold transition-opacity hover:opacity-80"
          style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)' }}
        >
          <Plus size={10} />
          Add item
        </button>
      </div>
    </div>
  );
}

// ─── PasteDietBox ───────────────────────────────────────────────

function PasteDietBox({
  onClose,
  onApply,
}: {
  onClose: () => void;
  onApply: (parsed: ParsedDietPlan) => void;
}) {
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<'edit' | 'preview'>('edit');
  const [busy, startBusy] = useTransition();
  const [preview, setPreview] = useState<ParsedDietPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = () => {
    setError(null);
    startBusy(async () => {
      const res = await previewPastedDietPlan(text);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setPreview(res.plan);
      setPhase('preview');
    });
  };

  const totalItems = preview
    ? preview.meals.reduce((n, m) => n + m.items.length, 0)
    : 0;

  return (
    <div
      className="rounded-xl border p-4"
      style={{
        borderColor: 'rgba(125,211,255,0.30)',
        background: 'rgba(125,211,255,0.04)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ClipboardPaste size={14} style={{ color: '#7dd3ff' }} />
          <h3
            className="font-mono uppercase tracking-[0.18em] font-bold"
            style={{ fontSize: 11, color: '#7dd3ff' }}
          >
            {phase === 'edit' ? 'Paste diet plan' : 'Preview & confirm'}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-white/5 transition-colors"
          aria-label="Close paste box"
        >
          <X size={14} style={{ color: 'rgba(255,255,255,0.55)' }} />
        </button>
      </div>

      {phase === 'edit' && (
        <>
          <p
            className="leading-snug mb-3"
            style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}
          >
            Drop the WhatsApp diet block. Section headers wrapped in
            *asterisks* (e.g. *Breakfast*), items as &bull; bullets,
            &quot;Food – Quantity&quot; with em-dash. *Daily Macros* and
            the Notes footer (water, steps, sleep) are parsed too.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              '*Breakfast*\n• Oats – 60g\n• Skim Milk – 150ml\n\n*Lunch*\n• White Rice – 275g (cooked)\n…\n\n*Daily Macros*\n• Calories – 2,500 kcal\n…'
            }
            rows={10}
            className="w-full rounded-lg bg-bg-elevated border border-border-soft px-3 py-2 text-sm font-mono leading-relaxed focus:border-accent/50 focus:outline-none"
            style={{ resize: 'vertical' }}
          />
          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={handleExtract}
              disabled={busy || !text.trim()}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-mono uppercase tracking-[0.18em] font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ fontSize: 10, color: '#0a0c09', background: '#7dd3ff' }}
            >
              <ChevronRight size={11} />
              {busy ? 'Extracting…' : 'Extract & preview'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="font-mono uppercase tracking-[0.14em] font-bold transition-opacity hover:opacity-80"
              style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}
            >
              Cancel
            </button>
          </div>
        </>
      )}

      {phase === 'preview' && preview && (
        <>
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span
              className="font-mono uppercase tracking-[0.14em] font-bold"
              style={{ fontSize: 10, color: '#c6ff3d' }}
            >
              ✓ {preview.meals.length} meals · {totalItems} items
            </span>
            {preview.macros.calories && (
              <span
                className="font-mono uppercase tracking-[0.14em] font-bold"
                style={{ fontSize: 10, color: '#7dd3ff' }}
              >
                {preview.macros.calories} kcal target
              </span>
            )}
            {preview.unparsedLines.length > 0 && (
              <span
                className="font-mono uppercase tracking-[0.14em] font-bold"
                style={{ fontSize: 10, color: '#ff9999' }}
              >
                ⚠ {preview.unparsedLines.length} flagged
              </span>
            )}
          </div>

          {preview.unparsedLines.length > 0 && (
            <div
              className="rounded-lg px-3 py-2 mb-3"
              style={{
                background: 'rgba(255,107,107,0.06)',
                border: '1px solid rgba(255,107,107,0.25)',
              }}
            >
              <div className="flex items-start gap-2 mb-1">
                <AlertCircle
                  size={12}
                  style={{ color: '#ff9999', flexShrink: 0, marginTop: 2 }}
                />
                <span style={{ fontSize: 11, color: 'rgba(255,200,200,0.85)' }}>
                  These lines didn&apos;t parse — go back and fix the
                  format, or apply and add them manually.
                </span>
              </div>
              <ul className="pl-5 list-disc" style={{ fontSize: 11, color: '#ff9999' }}>
                {preview.unparsedLines.map((u, i) => (
                  <li key={i}>
                    {u.mealName}: {u.raw}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {preview.meals.map((m, i) => (
              <div
                key={i}
                className="rounded-lg border px-3 py-2"
                style={{
                  borderColor: 'rgba(198,255,61,0.18)',
                  background: 'rgba(198,255,61,0.03)',
                }}
              >
                <div
                  className="font-mono uppercase tracking-[0.18em] font-bold mb-1"
                  style={{ fontSize: 11, color: '#c6ff3d' }}
                >
                  {m.name}
                  {m.mealType && (
                    <span
                      className="ml-2 normal-case tracking-normal"
                      style={{
                        fontSize: 9,
                        color: 'rgba(255,255,255,0.40)',
                      }}
                    >
                      ({MEAL_TYPE_LABELS[m.mealType]})
                    </span>
                  )}
                </div>
                <ul className="space-y-0.5">
                  {m.items.map((it, j) => (
                    <li
                      key={j}
                      className="flex items-center gap-2"
                      style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}
                    >
                      <span style={{ color: 'rgba(255,255,255,0.40)' }}>·</span>
                      <span>{it.foodName}</span>
                      {it.quantity && (
                        <span
                          className="font-mono"
                          style={{ color: 'rgba(125,211,255,0.85)', fontSize: 11 }}
                        >
                          {it.quantity}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Macros + lifestyle summary */}
            <div
              className="rounded-lg border px-3 py-2"
              style={{
                borderColor: 'rgba(125,211,255,0.20)',
                background: 'rgba(125,211,255,0.04)',
              }}
            >
              <div
                className="font-mono uppercase tracking-[0.18em] font-bold mb-1.5"
                style={{ fontSize: 10, color: '#7dd3ff' }}
              >
                Daily targets
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5" style={{ fontSize: 11 }}>
                {preview.macros.calories !== null && (
                  <div>Calories: {preview.macros.calories} kcal</div>
                )}
                {preview.macros.carbsMin !== null && (
                  <div>
                    Carbs: {preview.macros.carbsMin}
                    {preview.macros.carbsMax ? `–${preview.macros.carbsMax}` : ''}g
                  </div>
                )}
                {preview.macros.proteinMin !== null && (
                  <div>
                    Protein: {preview.macros.proteinMin}
                    {preview.macros.proteinMax ? `–${preview.macros.proteinMax}` : ''}g
                  </div>
                )}
                {preview.macros.fatsMin !== null && (
                  <div>
                    Fats: {preview.macros.fatsMin}
                    {preview.macros.fatsMax ? `–${preview.macros.fatsMax}` : ''}g
                  </div>
                )}
                {preview.lifestyle.waterLiters !== null && (
                  <div>Water: {preview.lifestyle.waterLiters} L</div>
                )}
                {preview.lifestyle.stepsTarget !== null && (
                  <div>Steps: {preview.lifestyle.stepsTarget.toLocaleString()}</div>
                )}
                {preview.lifestyle.sleepHours !== null && (
                  <div>Sleep: {preview.lifestyle.sleepHours} h</div>
                )}
                {preview.cookingOilNote && (
                  <div className="col-span-2">Oil: {preview.cookingOilNote}</div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border-soft">
            <button
              type="button"
              onClick={() => onApply(preview)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-mono uppercase tracking-[0.18em] font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ fontSize: 10, color: '#0a0c09', background: '#c6ff3d' }}
            >
              <Check size={11} strokeWidth={3} />
              Apply to editor
            </button>
            <button
              type="button"
              onClick={() => setPhase('edit')}
              disabled={busy}
              className="font-mono uppercase tracking-[0.14em] font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ fontSize: 10, color: '#7dd3ff' }}
            >
              ← Edit text
            </button>
            <span
              className="font-mono uppercase tracking-[0.14em] font-bold ml-auto"
              style={{ fontSize: 9, color: 'rgba(255,255,255,0.40)' }}
            >
              Save happens via main &quot;Save&quot; button
            </span>
          </div>
        </>
      )}

      {error && (
        <div
          className="mt-3 rounded-lg px-3 py-2 flex items-start gap-2"
          style={{
            background: 'rgba(255,107,107,0.08)',
            border: '1px solid rgba(255,107,107,0.30)',
          }}
        >
          <AlertCircle
            size={12}
            style={{ color: '#ff9999', flexShrink: 0, marginTop: 2 }}
          />
          <span style={{ fontSize: 11, color: '#ff9999' }}>{error}</span>
        </div>
      )}
    </div>
  );
}
