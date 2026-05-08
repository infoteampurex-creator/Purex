'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Save,
  Heart,
  Footprints,
  Droplets,
  Moon,
  Flame,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { upsertDailyLog } from '@/lib/actions/client-tracking';
import { type DailyActuals } from '@/lib/data/daily-plan-types';

interface LogActualsModalProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  /** YYYY-MM-DD — defaults to today inside the modal if omitted. */
  logDate?: string;
  /** Pre-fill the form with the client's existing actuals for this date. */
  initialActuals?: DailyActuals | null;
}

interface FormState {
  weightKg: string;
  steps: string;
  sleepHours: string;
  waterGlasses: string;
  caloriesConsumed: string;
  proteinG: string;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

function actualsToForm(a: DailyActuals | null | undefined): FormState {
  const s = (v: number | null | undefined) => (v == null ? '' : String(v));
  return {
    weightKg: s(a?.weightKg),
    steps: s(a?.steps),
    sleepHours: s(a?.sleepHours),
    waterGlasses: s(a?.waterGlasses),
    caloriesConsumed: s(a?.caloriesConsumed),
    proteinG: s(a?.proteinG),
  };
}

export function LogActualsModal({
  open,
  onClose,
  clientId,
  logDate,
  initialActuals,
}: LogActualsModalProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => actualsToForm(initialActuals));
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(actualsToForm(initialActuals));
      setSubmitting(false);
      setSuccess(false);
      setErrorMsg(null);
    }
  }, [open, initialActuals]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onEsc);
    };
  }, [open, onClose]);

  const update = <K extends keyof FormState>(key: K, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const parseInt10 = (v: string): number | null => {
    if (!v.trim()) return null;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  };
  const parseNum = (v: string): number | null => {
    if (!v.trim()) return null;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const result = await upsertDailyLog({
      clientId,
      logDate: logDate ?? todayStr(),
      weightKg: parseNum(form.weightKg),
      caloriesConsumed: parseInt10(form.caloriesConsumed),
      proteinG: parseInt10(form.proteinG),
      waterGlasses: parseInt10(form.waterGlasses),
      steps: parseInt10(form.steps),
      sleepHours: parseNum(form.sleepHours),
      // The other fields (caloriesTarget, carbs, fats, sleepQuality, mood,
      // recoveryScore, dailyNote) are intentionally omitted — they're either
      // trainer-set or live in a fuller log flow.
    });

    setSubmitting(false);

    if (!result.ok) {
      setErrorMsg(result.error ?? 'Failed to save. Try again.');
      return;
    }

    setSuccess(true);
    router.refresh();
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1100);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm" aria-hidden="true" />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full md:max-w-md max-h-[92vh] md:max-h-[88vh] rounded-t-3xl md:rounded-3xl bg-bg-card border border-border flex flex-col overflow-hidden"
        style={{ boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 md:p-6 border-b border-border">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold mb-1">
              Log my metrics
            </div>
            <h2 className="font-display font-semibold text-xl tracking-tight">
              Today
            </h2>
            <p className="text-xs text-text-muted mt-1">
              Update what you&apos;ve done so far. Leave blank to skip.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-border hover:border-accent/50 flex items-center justify-center text-text-muted hover:text-accent transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 md:px-6 py-5 space-y-4">
          <Field
            icon={<Footprints size={13} />}
            label="Steps"
            unit="steps"
            type="number"
            value={form.steps}
            onChange={(v) => update('steps', v)}
            placeholder="8400"
          />
          <Field
            icon={<Moon size={13} />}
            label="Sleep"
            unit="hours"
            type="number"
            step="0.1"
            value={form.sleepHours}
            onChange={(v) => update('sleepHours', v)}
            placeholder="7.5"
          />
          <Field
            icon={<Droplets size={13} />}
            label="Water"
            unit="glasses"
            type="number"
            value={form.waterGlasses}
            onChange={(v) => update('waterGlasses', v)}
            placeholder="6"
          />
          <Field
            icon={<Heart size={13} />}
            label="Weight"
            unit="kg"
            type="number"
            step="0.1"
            value={form.weightKg}
            onChange={(v) => update('weightKg', v)}
            placeholder="78.4"
          />
          <Field
            icon={<Flame size={13} />}
            label="Calories"
            unit="kcal"
            type="number"
            value={form.caloriesConsumed}
            onChange={(v) => update('caloriesConsumed', v)}
            placeholder="2100"
          />
          <Field
            label="Protein"
            unit="g"
            type="number"
            value={form.proteinG}
            onChange={(v) => update('proteinG', v)}
            placeholder="160"
          />

          {errorMsg && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-xs">
              {errorMsg}
            </div>
          )}
        </form>

        {/* Sticky footer */}
        <div className="border-t border-border p-4 md:p-5 flex items-center justify-end gap-2 bg-bg-card">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-full border border-border text-sm font-medium hover:border-text-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting || success}
            className={cn(
              'inline-flex items-center gap-2 h-10 px-5 rounded-full font-semibold text-sm transition-all',
              success ? 'bg-success text-bg' : 'bg-accent text-bg hover:bg-accent-hover',
              (submitting || success) && 'cursor-not-allowed'
            )}
          >
            {success ? (
              <>✓ Saved</>
            ) : submitting ? (
              <>Saving…</>
            ) : (
              <>
                <Save size={14} />
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  unit,
  value,
  onChange,
  placeholder,
  type = 'text',
  step,
  icon,
}: {
  label: string;
  unit?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  step?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold">
          {icon && <span className="text-accent">{icon}</span>}
          {label}
        </label>
        {unit && <span className="text-[9px] text-text-dim font-mono">{unit}</span>}
      </div>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 px-3 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent/50 focus:outline-none transition-colors"
      />
    </div>
  );
}
