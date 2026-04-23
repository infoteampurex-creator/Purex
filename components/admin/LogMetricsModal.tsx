'use client';

import { useEffect, useState } from 'react';
import {
  X,
  Flame,
  Droplets,
  Footprints,
  Moon,
  Heart,
  Activity,
  Smile,
  Save,
  StickyNote,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { upsertDailyLog } from '@/lib/actions/client-tracking';

interface LogMetricsModalProps {
  open: boolean;
  onClose: () => void;
  clientName: string;
  clientId: string;
  // Optional prefill if metrics already logged today
  initialValues?: Partial<MetricsFormState>;
}

interface MetricsFormState {
  logDate: string;
  weightKg: string;
  caloriesConsumed: string;
  caloriesTarget: string;
  proteinG: string;
  carbsG: string;
  fatsG: string;
  waterGlasses: string;
  steps: string;
  sleepHours: string;
  sleepQuality: string;
  mood: string;
  recoveryScore: string;
  dailyNote: string;
}

const defaultState: MetricsFormState = {
  logDate: new Date().toISOString().slice(0, 10),
  weightKg: '',
  caloriesConsumed: '',
  caloriesTarget: '',
  proteinG: '',
  carbsG: '',
  fatsG: '',
  waterGlasses: '',
  steps: '',
  sleepHours: '',
  sleepQuality: '',
  mood: '',
  recoveryScore: '',
  dailyNote: '',
};

export function LogMetricsModal({
  open,
  onClose,
  clientName,
  clientId,
  initialValues,
}: LogMetricsModalProps) {
  const [form, setForm] = useState<MetricsFormState>({
    ...defaultState,
    ...initialValues,
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Lock body scroll + escape handler
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [open, onClose]);

  const update = (key: keyof MetricsFormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const parseNum = (v: string): number | null => {
      if (!v) return null;
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : null;
    };
    const parseInt10 = (v: string): number | null => {
      if (!v) return null;
      const n = parseInt(v, 10);
      return Number.isFinite(n) ? n : null;
    };

    const result = await upsertDailyLog({
      clientId,
      logDate: form.logDate,
      weightKg: parseNum(form.weightKg),
      caloriesConsumed: parseInt10(form.caloriesConsumed),
      caloriesTarget: parseInt10(form.caloriesTarget),
      proteinG: parseInt10(form.proteinG),
      carbsG: parseInt10(form.carbsG),
      fatsG: parseInt10(form.fatsG),
      waterGlasses: parseInt10(form.waterGlasses),
      steps: parseInt10(form.steps),
      sleepHours: parseNum(form.sleepHours),
      sleepQuality: parseInt10(form.sleepQuality),
      mood: parseInt10(form.mood),
      recoveryScore: parseInt10(form.recoveryScore),
      dailyNote: form.dailyNote || null,
    });

    setSubmitting(false);

    if (!result.ok) {
      setErrorMsg(result.error ?? 'Failed to save. Try again.');
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1200);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full md:max-w-2xl max-h-[92vh] md:max-h-[88vh] rounded-t-3xl md:rounded-3xl bg-bg-card border border-border flex flex-col overflow-hidden"
        style={{ boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 md:p-6 border-b border-border">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold mb-1">
              Log metrics
            </div>
            <h2 className="font-display font-semibold text-xl tracking-tight">
              {clientName}
            </h2>
            <p className="text-xs text-text-muted mt-1">
              Enter today's data on the client's behalf. Leave any field blank if unknown.
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

        {/* Form body — scrollable */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 md:px-6 py-5">
          {/* Date */}
          <div className="mb-5">
            <FieldLabel>Date</FieldLabel>
            <input
              type="date"
              value={form.logDate}
              onChange={(e) => update('logDate', e.target.value)}
              className="w-full md:w-auto h-11 px-3 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent/50 focus:outline-none transition-colors font-mono"
            />
          </div>

          {/* Body composition */}
          <Section title="Body Composition" icon={<Heart size={14} />}>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Weight"
                unit="kg"
                type="number"
                step="0.1"
                value={form.weightKg}
                onChange={(v) => update('weightKg', v)}
                placeholder="78.4"
              />
            </div>
          </Section>

          {/* Nutrition */}
          <Section title="Nutrition" icon={<Flame size={14} />}>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Calories consumed"
                unit="kcal"
                type="number"
                value={form.caloriesConsumed}
                onChange={(v) => update('caloriesConsumed', v)}
                placeholder="2100"
              />
              <Field
                label="Target calories"
                unit="kcal"
                type="number"
                value={form.caloriesTarget}
                onChange={(v) => update('caloriesTarget', v)}
                placeholder="2200"
              />
              <Field
                label="Protein"
                unit="g"
                type="number"
                value={form.proteinG}
                onChange={(v) => update('proteinG', v)}
                placeholder="165"
              />
              <Field
                label="Carbs"
                unit="g"
                type="number"
                value={form.carbsG}
                onChange={(v) => update('carbsG', v)}
                placeholder="180"
              />
              <Field
                label="Fats"
                unit="g"
                type="number"
                value={form.fatsG}
                onChange={(v) => update('fatsG', v)}
                placeholder="68"
              />
              <Field
                label="Water"
                unit="glasses"
                type="number"
                value={form.waterGlasses}
                onChange={(v) => update('waterGlasses', v)}
                placeholder="8"
              />
            </div>
          </Section>

          {/* Activity */}
          <Section title="Activity" icon={<Footprints size={14} />}>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Steps"
                unit="steps"
                type="number"
                value={form.steps}
                onChange={(v) => update('steps', v)}
                placeholder="10000"
              />
            </div>
          </Section>

          {/* Recovery */}
          <Section title="Recovery & Wellbeing" icon={<Moon size={14} />}>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Sleep duration"
                unit="hours"
                type="number"
                step="0.1"
                value={form.sleepHours}
                onChange={(v) => update('sleepHours', v)}
                placeholder="7.5"
              />
              <RatingField
                label="Sleep quality"
                icon={<Moon size={12} />}
                value={form.sleepQuality}
                onChange={(v) => update('sleepQuality', v)}
              />
              <RatingField
                label="Mood"
                icon={<Smile size={12} />}
                value={form.mood}
                onChange={(v) => update('mood', v)}
              />
              <Field
                label="Recovery score"
                unit="0-100"
                type="number"
                min="0"
                max="100"
                value={form.recoveryScore}
                onChange={(v) => update('recoveryScore', v)}
                placeholder="78"
              />
            </div>
          </Section>

          {/* Daily note */}
          <Section title="Note" icon={<StickyNote size={14} />}>
            <textarea
              value={form.dailyNote}
              onChange={(e) => update('dailyNote', e.target.value)}
              rows={3}
              placeholder="e.g. Reported sore left shoulder from yesterday's pull-ups. Adjusted Thursday's programming."
              className="w-full px-3 py-2.5 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent/50 focus:outline-none transition-colors resize-none"
            />
          </Section>

          {errorMsg ? (
            <div className="mt-2 mb-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-xs">
              {errorMsg}
            </div>
          ) : (
            <div className="text-[10px] text-text-muted font-mono uppercase tracking-[0.14em] mt-2 mb-4">
              Saves to Supabase · upserts by (client, date)
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
              success
                ? 'bg-success text-bg'
                : 'bg-accent text-bg hover:bg-accent-hover',
              (submitting || success) && 'cursor-not-allowed'
            )}
          >
            {success ? (
              <>✓ Saved</>
            ) : submitting ? (
              <>
                <Spinner />
                Saving…
              </>
            ) : (
              <>
                <Save size={14} />
                Save metrics
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-md bg-accent/10 text-accent flex items-center justify-center">
          {icon}
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold">
          {title}
        </div>
      </div>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold mb-1.5">
      {children}
    </label>
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
  min,
  max,
}: {
  label: string;
  unit?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  step?: string;
  min?: string;
  max?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <FieldLabel>{label}</FieldLabel>
        {unit && <span className="text-[9px] text-text-dim font-mono">{unit}</span>}
      </div>
      <input
        type={type}
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 px-3 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent/50 focus:outline-none transition-colors"
      />
    </div>
  );
}

function RatingField({
  label,
  icon,
  value,
  onChange,
}: {
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="grid grid-cols-5 gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const selected = value === String(n);
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(selected ? '' : String(n))}
              className={cn(
                'h-11 rounded-lg border font-mono font-bold text-sm transition-all',
                selected
                  ? 'bg-accent text-bg border-accent'
                  : 'bg-bg-elevated border-border-soft text-text-muted hover:border-accent/50 hover:text-accent'
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeDasharray="45 20"
        opacity="0.6"
      />
    </svg>
  );
}
