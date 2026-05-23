'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Copy, Loader2, Ruler, X } from 'lucide-react';
import {
  upsertMyMeasurements,
  updateProfileBodySettings,
} from '@/lib/actions/body-measurements';
import type {
  BodyMeasurements,
  ProfileBodySettings,
  UnitPref,
} from '@/lib/data/body-measurements';

interface Props {
  open: boolean;
  onClose: () => void;
  latest: BodyMeasurements | null;
  profileSettings: ProfileBodySettings;
}

// ─── Field config ───────────────────────────────────────────────────

type FieldKey =
  | 'neck' | 'chest' | 'upperAbdomen' | 'lowerAbdomen'
  | 'waist' | 'hips'
  | 'bicepLeft' | 'bicepRight'
  | 'thighLeft' | 'thighRight'
  | 'calfLeft' | 'calfRight';

const FIELDS: { key: FieldKey; label: string; column: keyof BodyMeasurements }[] = [
  { key: 'neck',         label: 'Neck',           column: 'neckCm' },
  { key: 'chest',        label: 'Chest',          column: 'chestCm' },
  { key: 'upperAbdomen', label: 'Upper abdomen',  column: 'upperAbdomenCm' },
  { key: 'lowerAbdomen', label: 'Lower abdomen',  column: 'lowerAbdomenCm' },
  { key: 'waist',        label: 'Waist',          column: 'waistCm' },
  { key: 'hips',         label: 'Hips',           column: 'hipsCm' },
  { key: 'bicepLeft',    label: 'Bicep left',     column: 'bicepLeftCm' },
  { key: 'bicepRight',   label: 'Bicep right',    column: 'bicepRightCm' },
  { key: 'thighLeft',    label: 'Thigh left',     column: 'thighLeftCm' },
  { key: 'thighRight',   label: 'Thigh right',    column: 'thighRightCm' },
  { key: 'calfLeft',     label: 'Calf left',      column: 'calfLeftCm' },
  { key: 'calfRight',    label: 'Calf right',     column: 'calfRightCm' },
];

const ACCENT = '#7dd3ff';

// ─── Unit conversion ────────────────────────────────────────────────

const cmToIn = (cm: number | null): number | null =>
  cm == null ? null : Math.round((cm / 2.54) * 10) / 10;
const inToCm = (inches: number | null): number | null =>
  inches == null ? null : Math.round(inches * 2.54 * 10) / 10;

const kgToLb = (kg: number | null): number | null =>
  kg == null ? null : Math.round(kg * 2.20462 * 10) / 10;
const lbToKg = (lb: number | null): number | null =>
  lb == null ? null : Math.round((lb / 2.20462) * 10) / 10;

// ─── Component ──────────────────────────────────────────────────────

export function BodyMeasurementsSheet({
  open,
  onClose,
  latest,
  profileSettings,
}: Props) {
  const [unit, setUnit] = useState<UnitPref>(profileSettings.unitPref);
  const [weight, setWeight] = useState<number | ''>('');
  const [heightCm, setHeightCm] = useState<number | ''>('');
  const [measurements, setMeasurements] = useState<Record<FieldKey, number | ''>>(
    {} as Record<FieldKey, number | ''>
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hydrate ONLY on open transition (not on every prop change).
  // Earlier this re-fired whenever latest/profileSettings changed,
  // which happened after a successful revalidatePath — and the
  // setError(null) inside silently wiped any "save failed" message
  // before the user could read it. Now we initialise once per open.
  useEffect(() => {
    if (!open) return;
    setUnit(profileSettings.unitPref);
    setError(null);

    // Weight — stored in kg, display per unit
    if (latest?.weightKg != null) {
      setWeight(
        profileSettings.unitPref === 'in'
          ? (kgToLb(latest.weightKg) ?? '')
          : latest.weightKg
      );
    } else {
      setWeight('');
    }

    setHeightCm(profileSettings.heightCm ?? '');

    // Body sites — stored in cm, display per unit
    const init = {} as Record<FieldKey, number | ''>;
    for (const f of FIELDS) {
      const cm = (latest?.[f.column] as number | null) ?? null;
      if (cm == null) {
        init[f.key] = '';
      } else {
        init[f.key] =
          profileSettings.unitPref === 'in' ? (cmToIn(cm) ?? '') : cm;
      }
    }
    setMeasurements(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Re-convert all values when unit toggles (mid-edit)
  useEffect(() => {
    if (!open) return;
    setMeasurements((prev) => {
      const next = { ...prev };
      for (const f of FIELDS) {
        const v = prev[f.key];
        if (typeof v !== 'number') continue;
        next[f.key] =
          unit === 'in'
            ? (cmToIn(inToCm(v)) ?? '')
            : (inToCm(cmToIn(v)) ?? '');
      }
      return next;
    });
    setWeight((prev) => {
      if (typeof prev !== 'number') return prev;
      // If we're switching FROM in TO cm, prev was lb → kg
      // If we're switching FROM cm TO in, prev was kg → lb
      return unit === 'in' ? (kgToLb(lbToKg(prev)) ?? '') : (lbToKg(kgToLb(prev)) ?? '');
    });
    // intentional: only respond to unit changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit]);

  const setField = (k: FieldKey, v: number | '') =>
    setMeasurements((prev) => ({ ...prev, [k]: v }));

  const submit = async () => {
    setSaving(true);
    setError(null);

    // Convert all back to canonical units (cm / kg) before sending
    const toCm = (v: number | ''): number | null => {
      if (typeof v !== 'number') return null;
      return unit === 'in' ? inToCm(v) : v;
    };
    const toKg = (v: number | ''): number | null => {
      if (typeof v !== 'number') return null;
      return unit === 'in' ? lbToKg(v) : v;
    };

    // 1) profile settings (height + unit pref)
    const profilePromise = updateProfileBodySettings({
      heightCm: typeof heightCm === 'number'
        ? (unit === 'in' ? inToCm(heightCm) : heightCm)
        : null,
      unitPref: unit,
    });

    // 2) measurements row (today)
    const today = new Date().toISOString().slice(0, 10);
    const measPromise = upsertMyMeasurements({
      measuredAt: today,
      weightKg: toKg(weight),
      neckCm: toCm(measurements.neck),
      chestCm: toCm(measurements.chest),
      upperAbdomenCm: toCm(measurements.upperAbdomen),
      lowerAbdomenCm: toCm(measurements.lowerAbdomen),
      waistCm: toCm(measurements.waist),
      hipsCm: toCm(measurements.hips),
      bicepLeftCm: toCm(measurements.bicepLeft),
      bicepRightCm: toCm(measurements.bicepRight),
      thighLeftCm: toCm(measurements.thighLeft),
      thighRightCm: toCm(measurements.thighRight),
      calfLeftCm: toCm(measurements.calfLeft),
      calfRightCm: toCm(measurements.calfRight),
    });

    const [profileRes, measRes] = await Promise.all([profilePromise, measPromise]);
    setSaving(false);

    // Helper — translate known Supabase errors into actionable copy
    const friendly = (raw: string): string => {
      if (/does not exist|relation .* does not exist/i.test(raw)) {
        return (
          'Database table missing. Apply Supabase migration ' +
          '00017_body_measurements.sql in the SQL Editor, then try again.'
        );
      }
      if (/permission denied|row level security/i.test(raw)) {
        return 'Permission denied — RLS policy mismatch. Re-apply migration 00017.';
      }
      return raw;
    };

    if (!profileRes.ok || !measRes.ok) {
      const msg =
        (!profileRes.ok && friendly(profileRes.error ?? 'Failed to save profile')) ||
        (!measRes.ok && friendly(measRes.error ?? 'Failed to save measurements')) ||
        'Save failed';
      // eslint-disable-next-line no-console
      console.error('[PURE X] measurements save failed:', { profileRes, measRes });
      setError(msg);
      // Native alert as a belt-and-suspenders fallback — in Capacitor
      // this shows a system dialog that can't be missed or animated
      // away. User taps OK to dismiss; the sticky banner above keeps
      // the message visible afterwards too.
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-alert
        window.alert('Save failed:\n\n' + msg);
      }
      return;
    }
    onClose();
  };

  const unitLabel = unit === 'in' ? 'in' : 'cm';
  const weightUnitLabel = unit === 'in' ? 'lb' : 'kg';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 24, stiffness: 220 }}
            className="fixed left-0 right-0 bottom-0 z-50 rounded-t-3xl overflow-hidden flex flex-col"
            style={{
              maxHeight: '92vh',
              background: 'linear-gradient(180deg, #0e1417 0%, #0a0c09 100%)',
              border: `1px solid ${ACCENT}33`,
              borderBottom: 'none',
              boxShadow: `0 -8px 40px ${ACCENT}1A, 0 -24px 64px rgba(0,0,0,0.6)`,
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 flex-shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
            </div>

            {/* Header */}
            <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: `${ACCENT}1A`,
                    border: `1px solid ${ACCENT}33`,
                    color: ACCENT,
                  }}
                >
                  <Ruler size={16} />
                </div>
                <div>
                  <div
                    className="font-mono uppercase tracking-[0.22em] font-bold"
                    style={{ fontSize: 10, color: ACCENT }}
                  >
                    Log measurements
                  </div>
                  <div
                    className="font-mono uppercase tracking-[0.16em]"
                    style={{ fontSize: 9, color: 'rgba(255,255,255,0.40)' }}
                  >
                    Today · drives your live Twin
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

            {/* Unit toggle */}
            <div className="px-5 pb-3 flex-shrink-0 flex items-center gap-2">
              <span
                className="font-mono uppercase tracking-[0.18em] font-bold"
                style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}
              >
                Units
              </span>
              <div
                className="inline-flex rounded-full p-0.5"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {(['in', 'cm'] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className="px-3 py-1 rounded-full font-mono uppercase tracking-[0.18em] font-bold transition-colors"
                    style={{
                      fontSize: 9,
                      color: unit === u ? '#0a0c09' : 'rgba(255,255,255,0.55)',
                      backgroundColor: unit === u ? ACCENT : 'transparent',
                    }}
                  >
                    {u === 'in' ? 'in / lb' : 'cm / kg'}
                  </button>
                ))}
              </div>
            </div>

            {/* STICKY error banner — outside the scroll area so it
                always stays in view, even if user scrolls or the
                WebView's keyboard shifts focus. Has a Copy button
                so the user can paste the raw message back to us. */}
            {error && (
              <div
                className="mx-5 mb-3 rounded-xl px-3 py-3 flex items-start gap-2 flex-shrink-0"
                style={{
                  background: 'rgba(255,138,77,0.10)',
                  border: '1px solid rgba(255,138,77,0.40)',
                  boxShadow: '0 4px 16px rgba(255,138,77,0.15)',
                }}
              >
                <AlertCircle
                  size={14}
                  style={{ color: '#ff8a4d', flexShrink: 0, marginTop: 1 }}
                />
                <div className="flex-1 min-w-0">
                  <div
                    className="font-mono uppercase tracking-[0.18em] font-bold mb-0.5"
                    style={{ fontSize: 9, color: '#ff8a4d' }}
                  >
                    Save failed
                  </div>
                  <div
                    className="leading-snug break-words"
                    style={{ fontSize: 12, color: 'rgba(255,180,140,1)' }}
                  >
                    {error}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(error)
                      .then(() => {
                        // brief feedback by reusing the error text
                        // window.alert is intrusive but unmissable
                        // for the user to confirm copy worked
                        // eslint-disable-next-line no-alert
                        if (typeof window !== 'undefined') alert('Error copied');
                      })
                      .catch(() => {
                        // eslint-disable-next-line no-alert
                        if (typeof window !== 'undefined') alert(error);
                      });
                  }}
                  className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center"
                  style={{
                    background: 'rgba(255,138,77,0.15)',
                    border: '1px solid rgba(255,138,77,0.40)',
                    color: '#ff8a4d',
                  }}
                  aria-label="Copy error"
                >
                  <Copy size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center"
                  style={{
                    background: 'rgba(255,138,77,0.15)',
                    border: '1px solid rgba(255,138,77,0.40)',
                    color: '#ff8a4d',
                  }}
                  aria-label="Dismiss error"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 pb-3">
              {/* Height + Weight row */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <NumberField
                  label="Height"
                  unit={unitLabel}
                  value={typeof heightCm === 'number' && unit === 'in' ? cmToIn(heightCm) ?? '' : heightCm}
                  onChange={(v) => {
                    if (v === '') {
                      setHeightCm('');
                    } else {
                      setHeightCm(unit === 'in' ? inToCm(v) ?? 0 : v);
                    }
                  }}
                  color={ACCENT}
                />
                <NumberField
                  label="Weight"
                  unit={weightUnitLabel}
                  value={weight}
                  onChange={setWeight}
                  color="#c6ff3d"
                />
              </div>

              {/* Body sites — 2-col grid */}
              <div className="grid grid-cols-2 gap-2">
                {FIELDS.map((f) => (
                  <NumberField
                    key={f.key}
                    label={f.label}
                    unit={unitLabel}
                    value={measurements[f.key] ?? ''}
                    onChange={(v) => setField(f.key, v)}
                    color="#a78bfa"
                  />
                ))}
              </div>

              {/* Error moved to a STICKY banner above this body
                  (see below) so it can't be lost in a scroll shift. */}

              <div
                className="font-mono mt-3 text-center"
                style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}
              >
                Leave fields blank if you don’t track them.
                Values are stored privately to your profile.
              </div>
            </div>

            {/* Save (sticky) */}
            <div
              className="px-5 pt-3 pb-5 flex-shrink-0"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              <button
                onClick={() => void submit()}
                disabled={saving}
                className="w-full rounded-xl py-3.5 font-mono uppercase tracking-[0.18em] font-bold flex items-center justify-center gap-2 disabled:opacity-40"
                style={{
                  fontSize: 12,
                  color: '#0a0c09',
                  backgroundColor: ACCENT,
                  boxShadow: `0 0 16px ${ACCENT}40`,
                }}
              >
                {saving ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Saving
                  </>
                ) : (
                  'Save measurements'
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Local input ────────────────────────────────────────────────────

function NumberField({
  label,
  unit,
  value,
  onChange,
  color,
}: {
  label: string;
  unit: string;
  value: number | '';
  onChange: (v: number | '') => void;
  color: string;
}) {
  return (
    <div
      className="rounded-xl px-3 py-2"
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
      <div className="flex items-baseline gap-1 mt-1">
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          value={value === '' ? '' : value}
          onChange={(e) => {
            const v = e.target.value;
            if (v === '') onChange('');
            else {
              const n = Number(v);
              if (Number.isFinite(n)) onChange(n);
            }
          }}
          placeholder="—"
          className="flex-1 bg-transparent outline-none font-display font-bold tabular-nums"
          style={{ fontSize: 16, color: '#f5f5f0', minWidth: 0, width: '100%' }}
        />
        <span
          className="font-mono uppercase tracking-[0.14em]"
          style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}
        >
          {unit}
        </span>
      </div>
    </div>
  );
}
