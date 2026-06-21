'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Footprints, Loader2, Moon, Scale, X } from 'lucide-react';
import { manualFitnessEntry } from '@/lib/actions/manual-fitness-entry';

export type QuickLogType = 'steps' | 'sleep' | 'water' | 'weight';

interface Props {
  open: boolean;
  type: QuickLogType | null;
  /** Today's existing value for the chosen field (display only). */
  currentValue?: number;
  onClose: () => void;
  /** Fired after a successful save (for parent to refresh display). */
  onSaved?: () => void;
}

interface TypeConfig {
  title: string;
  icon: React.ReactNode;
  color: string;
  mode: 'set' | 'add';
  field: 'steps' | 'sleep_hours' | 'water_glasses' | 'weight_kg';
  unit: string;
  /** Quick-add chips (numeric values appended to current). */
  presets: Array<{ label: string; value: number }>;
  /** Optional helper text under the input. */
  hint?: string;
  /** Convert the user-facing display unit → DB column unit. */
  toDbValue: (input: number) => number;
  /** Convert DB column unit → display unit. */
  fromDbValue: (db: number) => number;
  /** Decimal places to show on the input (default 0). */
  decimals?: number;
}

const TYPE_META: Record<QuickLogType, TypeConfig> = {
  steps: {
    title: 'Log steps',
    icon: <Footprints size={16} />,
    color: '#c6ff3d',
    mode: 'set',
    field: 'steps',
    unit: 'steps',
    presets: [
      { label: '5,000', value: 5000 },
      { label: '7,500', value: 7500 },
      { label: '10,000', value: 10000 },
      { label: '12,500', value: 12500 },
    ],
    hint: 'Sets your total step count for today.',
    toDbValue: (v) => Math.round(v),
    fromDbValue: (v) => Math.round(v),
  },
  sleep: {
    title: 'Log sleep',
    icon: <Moon size={16} />,
    color: '#a78bfa',
    mode: 'set',
    field: 'sleep_hours',
    unit: 'hours',
    presets: [
      { label: '6 h', value: 6 },
      { label: '7 h', value: 7 },
      { label: '8 h', value: 8 },
      { label: '9 h', value: 9 },
    ],
    hint: 'Sets last night’s sleep duration.',
    toDbValue: (v) => Math.round(v * 10) / 10,
    fromDbValue: (v) => v,
  },
  water: {
    title: 'Add water',
    icon: <Droplets size={16} />,
    color: '#7dd3ff',
    mode: 'add',
    field: 'water_glasses',
    unit: 'ml',
    presets: [
      { label: '+ 250 ml', value: 250 },
      { label: '+ 500 ml', value: 500 },
      { label: '+ 750 ml', value: 750 },
      { label: '+ 1 L', value: 1000 },
    ],
    hint: 'Adds to today’s water total (1 glass = 250 ml).',
    toDbValue: (ml) => Math.round(ml / 250),
    fromDbValue: (glasses) => glasses * 250,
  },
  weight: {
    title: 'Log weight',
    icon: <Scale size={16} />,
    color: '#ff8a4d',
    mode: 'set',
    field: 'weight_kg',
    unit: 'kg',
    presets: [],
    hint:
      'Weigh-in routine: same time each morning, after bathroom, before food / water.',
    toDbValue: (kg) => Math.round(kg * 100) / 100,
    fromDbValue: (db) => db,
    decimals: 1,
  },
};

/**
 * Bottom-sheet style quick-log modal for the fitness tiles. Renders
 * a backdrop + sliding sheet from the bottom with preset chips and
 * a custom number input. Submits via manualFitnessEntry server
 * action; parent revalidates on success.
 */
export function QuickLogSheet({
  open,
  type,
  currentValue = 0,
  onClose,
  onSaved,
}: Props) {
  const cfg = type ? TYPE_META[type] : null;
  const [input, setInput] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset input whenever sheet opens for a new type
  useEffect(() => {
    if (open && cfg) {
      setInput(cfg.mode === 'set' ? cfg.fromDbValue(currentValue) : 0);
      setError(null);
    }
  }, [open, type, cfg, currentValue]);

  const submit = async (rawInput?: number) => {
    if (!cfg) return;
    const valueRaw = rawInput ?? input;
    if (valueRaw <= 0 && cfg.mode === 'add') {
      setError('Pick a value greater than zero');
      return;
    }
    setSaving(true);
    setError(null);
    const dbValue = cfg.toDbValue(valueRaw);
    const today = new Date().toISOString().slice(0, 10);
    const res = await manualFitnessEntry({
      logDate: today,
      field: cfg.field,
      value: dbValue,
      mode: cfg.mode,
    });
    setSaving(false);
    if (res.ok) {
      onSaved?.();
      onClose();
    } else {
      setError(res.error ?? 'Save failed');
    }
  };

  return (
    <AnimatePresence>
      {open && cfg && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 24, stiffness: 220 }}
            className="fixed left-0 right-0 bottom-0 z-50 rounded-t-3xl overflow-hidden"
            style={{
              background: `
                linear-gradient(180deg, #15110f 0%, #0a0c09 100%)
              `,
              border: `1px solid ${cfg.color}33`,
              borderBottom: 'none',
              boxShadow: `0 -8px 40px ${cfg.color}1A, 0 -24px 64px rgba(0,0,0,0.6)`,
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3">
              <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
            </div>

            {/* Header */}
            <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: `${cfg.color}1A`,
                    border: `1px solid ${cfg.color}33`,
                    color: cfg.color,
                  }}
                >
                  {cfg.icon}
                </div>
                <div>
                  <div
                    className="font-mono uppercase tracking-[0.22em] font-bold"
                    style={{ fontSize: 10, color: cfg.color }}
                  >
                    {cfg.title}
                  </div>
                  <div className="font-mono uppercase tracking-[0.16em]"
                       style={{ fontSize: 9, color: 'rgba(255,255,255,0.40)' }}>
                    Today
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                aria-label="Close"
              >
                <X size={16} style={{ color: 'rgba(255,255,255,0.6)' }} />
              </button>
            </div>

            {/* Preset chips */}
            <div className="px-5 pb-3 grid grid-cols-4 gap-2">
              {cfg.presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => void submit(p.value)}
                  disabled={saving}
                  className="rounded-xl py-3 font-mono uppercase tracking-[0.14em] font-bold disabled:opacity-50"
                  style={{
                    fontSize: 11,
                    color: cfg.color,
                    background: `linear-gradient(180deg, ${cfg.color}1A 0%, transparent 100%)`,
                    border: `1px solid ${cfg.color}33`,
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom input */}
            <div className="px-5 pb-4">
              <div
                className="font-mono uppercase tracking-[0.14em] font-bold mb-2"
                style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}
              >
                Custom amount
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode={cfg.decimals ? 'decimal' : 'numeric'}
                  step={cfg.decimals ? Math.pow(10, -cfg.decimals) : 1}
                  value={input || ''}
                  onChange={(e) => setInput(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="flex-1 rounded-xl px-4 py-3 font-display font-bold tabular-nums outline-none"
                  style={{
                    fontSize: 22,
                    color: '#f5f5f0',
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid rgba(255,255,255,0.08)`,
                  }}
                />
                <div
                  className="font-mono uppercase tracking-[0.14em] font-bold px-3"
                  style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}
                >
                  {cfg.unit}
                </div>
              </div>
              {cfg.hint && (
                <div
                  className="font-mono mt-2"
                  style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)' }}
                >
                  {cfg.hint}
                </div>
              )}
              {error && (
                <div
                  className="font-mono mt-2"
                  style={{ fontSize: 11, color: '#ff8a4d' }}
                >
                  {error}
                </div>
              )}
            </div>

            {/* Save */}
            <div className="px-5 pb-5">
              <button
                onClick={() => void submit()}
                disabled={saving || input <= 0}
                className="w-full rounded-xl py-3.5 font-mono uppercase tracking-[0.18em] font-bold flex items-center justify-center gap-2 disabled:opacity-40"
                style={{
                  fontSize: 12,
                  color: '#0a0c09',
                  backgroundColor: cfg.color,
                  boxShadow: `0 0 16px ${cfg.color}40`,
                }}
              >
                {saving ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Saving
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
