'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Apple, Camera, Edit3, Loader2, RotateCcw, Sparkles, X } from 'lucide-react';
import { addMeal } from '@/lib/actions/meals';
import { analyzeMealPhoto } from '@/lib/actions/analyze-meal-photo';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Today's running totals — shown at the top so user sees their progress. */
  today: {
    caloriesConsumed: number;
    caloriesTarget: number;
    proteinG: number;
    proteinTargetG: number;
  };
}

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';

interface MealPreset {
  label: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  fiberG: number;
}

// Calibrated for typical Indian portions. Tweak after dogfooding.
const PRESETS: MealPreset[] = [
  { label: 'Light',   calories: 300, proteinG: 15, carbsG: 35, fatsG: 10, fiberG: 5 },
  { label: 'Regular', calories: 600, proteinG: 30, carbsG: 70, fatsG: 20, fiberG: 8 },
  { label: 'Heavy',   calories: 900, proteinG: 45, carbsG: 100, fatsG: 30, fiberG: 10 },
];

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch',     label: 'Lunch' },
  { value: 'dinner',    label: 'Dinner' },
  { value: 'snack',     label: 'Snack' },
];

const ACCENT = '#ff8a4d'; // orange — matches Nutrition tile palette

/**
 * Meal logging bottom sheet. Phase 1 = manual macros entry with
 * common-portion presets. Phase 2 (later) will replace the inputs
 * with a camera capture → AI vision → editable result flow; the
 * data shape that lands in client_meals is identical so the daily
 * roll-up trigger and Twin scoring don't change.
 */
type Mode = 'choose' | 'analyzing' | 'review';

export function MealLogSheet({ open, onClose, today }: Props) {
  const [mode, setMode] = useState<Mode>('choose');
  const [mealType, setMealType] = useState<MealType>(() => guessMealType());
  const [name, setName] = useState('');
  const [calories, setCalories] = useState(0);
  const [proteinG, setProteinG] = useState(0);
  const [carbsG, setCarbsG] = useState(0);
  const [fatsG, setFatsG] = useState(0);
  const [fiberG, setFiberG] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI photo flow state
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [aiRaw, setAiRaw] = useState<unknown>(null);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [aiDescription, setAiDescription] = useState<string>('');

  useEffect(() => {
    if (open) {
      // Reset on each open
      setMode('choose');
      setMealType(guessMealType());
      setName('');
      setCalories(0);
      setProteinG(0);
      setCarbsG(0);
      setFatsG(0);
      setFiberG(0);
      setError(null);
      setPhotoUrl(null);
      setAiRaw(null);
      setAiConfidence(null);
      setAiDescription('');
    }
  }, [open]);

  // ─── Photo capture + AI analysis ───
  // Camera ONLY — gallery is intentionally disabled so users can't
  // upload old/stale food photos and game the food log. Every meal
  // photo must be captured in the moment.
  const capturePhoto = async () => {
    setError(null);
    try {
      // Dynamic import keeps the Capacitor camera plugin out of the
      // initial bundle. Only loads when the user taps "Take photo".
      const { Camera, CameraSource, CameraResultType } = await import(
        '@capacitor/camera'
      );
      const photo = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        width: 1024,
        correctOrientation: true,
      });
      if (!photo.base64String || !photo.format) {
        setError('Could not read photo data');
        return;
      }
      const mediaType: 'image/jpeg' | 'image/png' | 'image/webp' =
        photo.format === 'png'
          ? 'image/png'
          : photo.format === 'webp'
          ? 'image/webp'
          : 'image/jpeg';

      setMode('analyzing');
      const today = new Date().toISOString().slice(0, 10);
      const res = await analyzeMealPhoto({
        photoBase64: photo.base64String,
        mediaType,
        logDate: today,
      });
      if (!res.ok) {
        setError(res.error);
        setMode('choose');
        return;
      }
      // Populate state from AI response — user can still edit before saving
      setPhotoUrl(res.photoUrl);
      setAiRaw(res.analysis);
      setAiConfidence(res.analysis.confidence);
      setAiDescription(res.analysis.description);
      setName(res.analysis.name);
      setCalories(res.analysis.calories);
      setProteinG(res.analysis.protein_g);
      setCarbsG(res.analysis.carbs_g);
      setFatsG(res.analysis.fats_g);
      setFiberG(res.analysis.fiber_g);
      setMode('review');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // User cancelling the camera throws a "User cancelled photos app" —
      // don't treat as a real error.
      if (/cancel/i.test(msg)) {
        setMode('choose');
        return;
      }
      setError(msg);
      setMode('choose');
    }
  };

  const clearPhoto = () => {
    setPhotoUrl(null);
    setAiRaw(null);
    setAiConfidence(null);
    setAiDescription('');
    setName('');
    setCalories(0);
    setProteinG(0);
    setCarbsG(0);
    setFatsG(0);
    setFiberG(0);
    setMode('choose');
  };

  const applyPreset = (p: MealPreset) => {
    setCalories(p.calories);
    setProteinG(p.proteinG);
    setCarbsG(p.carbsG);
    setFatsG(p.fatsG);
    setFiberG(p.fiberG);
  };

  const submit = async () => {
    if (calories <= 0) {
      setError('Enter calories or pick a preset');
      return;
    }
    setSaving(true);
    setError(null);
    const today = new Date().toISOString().slice(0, 10);
    const res = await addMeal({
      logDate: today,
      mealType,
      name: name.trim() || null,
      calories,
      proteinG,
      carbsG,
      fatsG,
      fiberG,
      source: photoUrl ? 'ai_photo' : 'manual',
      photoUrl: photoUrl ?? null,
      aiRaw: aiRaw ?? null,
      aiConfidence: aiConfidence ?? null,
    });
    setSaving(false);
    if (res.ok) {
      onClose();
    } else {
      setError(res.error ?? 'Save failed');
    }
  };

  const caloriesPct = today.caloriesTarget
    ? Math.min(100, (today.caloriesConsumed / today.caloriesTarget) * 100)
    : 0;
  const proteinPct = today.proteinTargetG
    ? Math.min(100, (today.proteinG / today.proteinTargetG) * 100)
    : 0;

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
            className="fixed left-0 right-0 bottom-0 z-50 rounded-t-3xl overflow-hidden flex flex-col"
            style={{
              maxHeight: '90vh',
              background: 'linear-gradient(180deg, #15110f 0%, #0a0c09 100%)',
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
                  <Apple size={16} />
                </div>
                <div>
                  <div
                    className="font-mono uppercase tracking-[0.22em] font-bold"
                    style={{ fontSize: 10, color: ACCENT }}
                  >
                    Log a meal
                  </div>
                  <div
                    className="font-mono uppercase tracking-[0.16em]"
                    style={{ fontSize: 9, color: 'rgba(255,255,255,0.40)' }}
                  >
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

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 pb-3">
              {/* ─── Photo / AI flow ─── */}
              {mode === 'choose' && !photoUrl && (
                <div
                  className="rounded-2xl p-4 mb-4"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(125,211,255,0.10) 0%, rgba(198,255,61,0.06) 100%)',
                    border: '1px solid rgba(125,211,255,0.20)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={14} style={{ color: '#7dd3ff' }} />
                    <span
                      className="font-mono uppercase tracking-[0.22em] font-bold"
                      style={{ fontSize: 10, color: '#7dd3ff' }}
                    >
                      AI Meal Scan
                    </span>
                  </div>
                  <p
                    className="leading-relaxed mb-3"
                    style={{ fontSize: 12, color: 'rgba(245,245,240,0.75)' }}
                  >
                    Snap a photo of your plate <b>right now</b> — AI will
                    estimate the calories and macros. You can edit before saving.
                  </p>
                  <button
                    type="button"
                    onClick={() => void capturePhoto()}
                    className="w-full rounded-xl py-3.5 font-mono uppercase tracking-[0.18em] font-bold flex items-center justify-center gap-2"
                    style={{
                      fontSize: 12,
                      color: '#0a0c09',
                      backgroundColor: '#7dd3ff',
                      boxShadow: '0 0 16px rgba(125,211,255,0.30)',
                    }}
                  >
                    <Camera size={14} />
                    Open Camera
                  </button>
                  <p
                    className="font-mono mt-2 text-center"
                    style={{ fontSize: 10, color: 'rgba(245,245,240,0.35)' }}
                  >
                    Live capture only — gallery uploads disabled
                  </p>
                </div>
              )}

              {mode === 'analyzing' && (
                <div
                  className="rounded-2xl p-5 mb-4 flex flex-col items-center text-center"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(125,211,255,0.10) 0%, transparent 100%)',
                    border: '1px solid rgba(125,211,255,0.20)',
                  }}
                >
                  <Loader2 size={28} className="animate-spin mb-3" style={{ color: '#7dd3ff' }} />
                  <div
                    className="font-display font-semibold"
                    style={{ fontSize: 14, color: '#f5f5f0' }}
                  >
                    Analyzing your meal…
                  </div>
                  <div
                    className="font-mono mt-1"
                    style={{ fontSize: 11, color: 'rgba(245,245,240,0.55)' }}
                  >
                    Usually 3–6 seconds
                  </div>
                </div>
              )}

              {mode === 'review' && photoUrl && (
                <div
                  className="rounded-2xl overflow-hidden mb-4"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)',
                    border: '1px solid rgba(125,211,255,0.20)',
                  }}
                >
                  <div className="relative w-full" style={{ height: 160 }}>
                    {/* next/image handles signed URLs fine; unoptimized
                        because the URL is dynamic per upload. */}
                    <Image
                      src={photoUrl}
                      alt="Meal"
                      fill
                      sizes="100vw"
                      unoptimized
                      style={{ objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={clearPhoto}
                      className="absolute top-2 right-2 px-2.5 py-1.5 rounded-full flex items-center gap-1.5 font-mono uppercase tracking-[0.16em] font-bold"
                      style={{
                        fontSize: 9,
                        color: '#f5f5f0',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <RotateCcw size={10} />
                      Retake
                    </button>
                  </div>
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles size={11} style={{ color: '#7dd3ff' }} />
                      <span
                        className="font-mono uppercase tracking-[0.22em] font-bold"
                        style={{ fontSize: 9, color: '#7dd3ff' }}
                      >
                        AI Estimate
                      </span>
                      {aiConfidence !== null && (
                        <span
                          className="font-mono uppercase tracking-[0.16em] font-bold ml-auto px-1.5 py-0.5 rounded"
                          style={{
                            fontSize: 9,
                            color: confidenceColor(aiConfidence),
                            backgroundColor: confidenceColor(aiConfidence) + '1A',
                          }}
                        >
                          {Math.round(aiConfidence * 100)}% confident
                        </span>
                      )}
                    </div>
                    {aiDescription && (
                      <p
                        className="leading-snug mt-1 flex items-start gap-1.5"
                        style={{ fontSize: 12, color: 'rgba(245,245,240,0.75)' }}
                      >
                        <Edit3 size={11} style={{ color: 'rgba(245,245,240,0.4)', marginTop: 2, flexShrink: 0 }} />
                        <span>
                          {aiDescription}
                          {aiConfidence !== null && aiConfidence < 0.6 && (
                            <span style={{ color: '#ff8a4d' }}>
                              {' '}— please double-check below.
                            </span>
                          )}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Today's progress */}
              <div
                className="rounded-xl px-4 py-3 mb-4"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="font-mono uppercase tracking-[0.16em] font-bold mb-2"
                  style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}
                >
                  Today’s progress
                </div>
                <ProgressLine
                  label="Calories"
                  value={today.caloriesConsumed}
                  target={today.caloriesTarget}
                  pct={caloriesPct}
                  unit="kcal"
                  color={ACCENT}
                />
                <ProgressLine
                  label="Protein"
                  value={today.proteinG}
                  target={today.proteinTargetG}
                  pct={proteinPct}
                  unit="g"
                  color="#c6ff3d"
                />
              </div>

              {/* Meal type chips */}
              <div
                className="font-mono uppercase tracking-[0.14em] font-bold mb-2"
                style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}
              >
                Meal
              </div>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {MEAL_TYPES.map((m) => {
                  const active = mealType === m.value;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMealType(m.value)}
                      className="rounded-xl py-2 font-mono uppercase tracking-[0.14em] font-bold"
                      style={{
                        fontSize: 10,
                        color: active ? '#0a0c09' : 'rgba(255,255,255,0.6)',
                        background: active
                          ? ACCENT
                          : 'rgba(255,255,255,0.04)',
                        border: active
                          ? `1px solid ${ACCENT}`
                          : '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>

              {/* Quick presets */}
              <div
                className="font-mono uppercase tracking-[0.14em] font-bold mb-2"
                style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}
              >
                Quick presets
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="rounded-xl py-3 text-left px-3"
                    style={{
                      background: `linear-gradient(180deg, ${ACCENT}14 0%, transparent 100%)`,
                      border: `1px solid ${ACCENT}33`,
                    }}
                  >
                    <div
                      className="font-mono uppercase tracking-[0.14em] font-bold"
                      style={{ fontSize: 10, color: ACCENT }}
                    >
                      {p.label}
                    </div>
                    <div
                      className="font-display font-bold tabular-nums leading-none mt-1"
                      style={{ fontSize: 16, color: '#f5f5f0' }}
                    >
                      {p.calories}
                    </div>
                    <div
                      className="font-mono tabular-nums mt-0.5"
                      style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}
                    >
                      {p.proteinG}p · {p.carbsG}c · {p.fatsG}f
                    </div>
                  </button>
                ))}
              </div>

              {/* Optional name */}
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What did you eat? (optional)"
                className="w-full rounded-xl px-4 py-3 font-display outline-none mb-3"
                style={{
                  fontSize: 14,
                  color: '#f5f5f0',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              />

              {/* Macros */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <MacroInput label="Calories" unit="kcal" value={calories} onChange={setCalories} color={ACCENT} />
                <MacroInput label="Protein" unit="g" value={proteinG} onChange={setProteinG} color="#c6ff3d" />
                <MacroInput label="Carbs" unit="g" value={carbsG} onChange={setCarbsG} color="#7dd3ff" />
                <MacroInput label="Fats" unit="g" value={fatsG} onChange={setFatsG} color="#ffd24d" />
                <div className="col-span-2">
                  <MacroInput label="Fiber" unit="g" value={fiberG} onChange={setFiberG} color="#a78bfa" />
                </div>
              </div>

              {error && (
                <div
                  className="font-mono mb-2"
                  style={{ fontSize: 11, color: '#ff8a4d' }}
                >
                  {error}
                </div>
              )}
            </div>

            {/* Save (sticky bottom) */}
            <div
              className="px-5 pt-3 pb-5 flex-shrink-0"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              <button
                onClick={() => void submit()}
                disabled={saving || calories <= 0}
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
                  'Save meal'
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Local helpers ──────────────────────────────────────────────────

function MacroInput({
  label,
  unit,
  value,
  onChange,
  color,
}: {
  label: string;
  unit: string;
  value: number;
  onChange: (v: number) => void;
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
          inputMode="numeric"
          value={value || ''}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          placeholder="0"
          className="flex-1 bg-transparent outline-none font-display font-bold tabular-nums"
          style={{ fontSize: 18, color: '#f5f5f0', minWidth: 0, width: '100%' }}
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

function ProgressLine({
  label,
  value,
  target,
  pct,
  unit,
  color,
}: {
  label: string;
  value: number;
  target: number;
  pct: number;
  unit: string;
  color: string;
}) {
  return (
    <div className="mb-2 last:mb-0">
      <div className="flex items-baseline justify-between mb-1">
        <span
          className="font-mono uppercase tracking-[0.14em] font-bold"
          style={{ fontSize: 9, color }}
        >
          {label}
        </span>
        <span
          className="font-mono tabular-nums"
          style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}
        >
          {value.toLocaleString()}
          <span style={{ color: 'rgba(255,255,255,0.35)' }}>
            {' / '}
            {target.toLocaleString()} {unit}
          </span>
        </span>
      </div>
      <div className="h-1 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function guessMealType(): MealType {
  const h = new Date().getHours();
  if (h < 11) return 'breakfast';
  if (h < 16) return 'lunch';
  if (h < 19) return 'snack';
  return 'dinner';
}

function confidenceColor(c: number): string {
  if (c >= 0.7) return '#c6ff3d';   // strong → brand green
  if (c >= 0.4) return '#ffd24d';   // medium → amber
  return '#ff8a4d';                 // low → warm warning
}
