'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  Trash2,
  X,
  Dumbbell,
  ListOrdered,
  Plus,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  upsertWorkoutTemplate,
  deleteWorkoutTemplate,
} from '@/lib/actions/workout-templates';
import {
  type WorkoutTemplate,
  type WorkoutTemplateExercise,
} from '@/lib/data/workout-templates-types';
import { type LibraryExerciseOption } from '@/lib/data/daily-plan-types';

const WORKOUT_TYPES = [
  'Strength',
  'HYROX',
  'Conditioning',
  'Mobility',
  'Cardio',
  'Sport',
  'Rest',
];

const DIFFICULTIES: Array<'beginner' | 'intermediate' | 'advanced'> = [
  'beginner',
  'intermediate',
  'advanced',
];

interface ExerciseRow {
  exerciseName: string;
  targetMuscle: string;
  sets: string;
  reps: string;
  targetWeightKg: string;
  restSeconds: string;
  tempo: string;
  rpeTarget: string;
  trainerInstruction: string;
}

interface FormState {
  name: string;
  category: string;
  targetMuscleGroup: string;
  description: string;
  trainerNotes: string;
  nextDayInstructions: string;
  estimatedDurationMinutes: string;
  difficulty: '' | 'beginner' | 'intermediate' | 'advanced';
  exercises: ExerciseRow[];
}

const EMPTY_EXERCISE: ExerciseRow = {
  exerciseName: '',
  targetMuscle: '',
  sets: '',
  reps: '',
  targetWeightKg: '',
  restSeconds: '',
  tempo: '',
  rpeTarget: '',
  trainerInstruction: '',
};

const EMPTY_STATE: FormState = {
  name: '',
  category: '',
  targetMuscleGroup: '',
  description: '',
  trainerNotes: '',
  nextDayInstructions: '',
  estimatedDurationMinutes: '',
  difficulty: '',
  exercises: [],
};

function templateExerciseToRow(p: WorkoutTemplateExercise): ExerciseRow {
  const s = (v: string | number | null) => (v == null ? '' : String(v));
  return {
    exerciseName: p.exerciseName,
    targetMuscle: s(p.targetMuscle),
    sets: s(p.sets),
    reps: s(p.reps),
    targetWeightKg: s(p.targetWeightKg),
    restSeconds: s(p.restSeconds),
    tempo: s(p.tempo),
    rpeTarget: s(p.rpeTarget),
    trainerInstruction: s(p.trainerInstruction),
  };
}

function templateToFormState(t: WorkoutTemplate | null): FormState {
  if (!t) return { ...EMPTY_STATE };
  return {
    name: t.name,
    category: t.category ?? '',
    targetMuscleGroup: t.targetMuscleGroup ?? '',
    description: t.description ?? '',
    trainerNotes: t.trainerNotes ?? '',
    nextDayInstructions: t.nextDayInstructions ?? '',
    estimatedDurationMinutes:
      t.estimatedDurationMinutes != null
        ? String(t.estimatedDurationMinutes)
        : '',
    difficulty: t.difficulty ?? '',
    exercises: t.exercises.map(templateExerciseToRow),
  };
}

function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface EditTemplateModalProps {
  open: boolean;
  onClose: () => void;
  template: WorkoutTemplate | null;
  exerciseLibrary: LibraryExerciseOption[];
}

export function EditTemplateModal({
  open,
  onClose,
  template,
  exerciseLibrary,
}: EditTemplateModalProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => templateToFormState(template));
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState<'saved' | 'deleted' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(templateToFormState(template));
      setSubmitting(false);
      setDeleting(false);
      setSuccess(null);
      setErrorMsg(null);
      setFieldErrors({});
      setConfirmDelete(false);
    }
  }, [open, template]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const updateExercise = (index: number, key: keyof ExerciseRow, value: string) =>
    setForm((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) =>
        i === index ? { ...ex, [key]: value } : ex
      ),
    }));

  const addExercise = () => {
    setForm((prev) => ({
      ...prev,
      exercises: [...prev.exercises, { ...EMPTY_EXERCISE }],
    }));
    requestAnimationFrame(() => {
      const cards = document.querySelectorAll<HTMLDivElement>(
        '[data-template-exercise-card]'
      );
      const last = cards[cards.length - 1];
      if (last) {
        last.scrollIntoView({ behavior: 'smooth', block: 'center' });
        last.dataset.flash = '1';
        setTimeout(() => delete last.dataset.flash, 1100);
      }
    });
  };

  const removeExercise = (index: number) =>
    setForm((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index),
    }));

  const moveExercise = (index: number, direction: -1 | 1) =>
    setForm((prev) => {
      const next = [...prev.exercises];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, exercises: next };
    });

  const pickFromLibrary = (idx: number, slug: string) => {
    const lib = exerciseLibrary.find((l) => l.slug === slug);
    if (!lib) return;
    setForm((prev) => ({
      ...prev,
      exercises: prev.exercises.map((row, i) =>
        i === idx
          ? {
              ...row,
              exerciseName: lib.name,
              targetMuscle:
                row.targetMuscle.trim() || titleCase(lib.category),
              sets: row.sets.trim() || (lib.defaultSets ?? ''),
              reps: row.reps.trim() || (lib.defaultReps ?? ''),
              restSeconds:
                row.restSeconds.trim() ||
                (lib.defaultRestSeconds != null
                  ? String(lib.defaultRestSeconds)
                  : ''),
            }
          : row
      ),
    }));
  };

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
  const optText = (v: string): string | null => (v.trim() ? v.trim() : null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setFieldErrors({});

    const exercisePayload = form.exercises
      .filter((ex) => ex.exerciseName.trim().length > 0)
      .map((ex) => ({
        exerciseName: ex.exerciseName.trim(),
        targetMuscle: optText(ex.targetMuscle),
        sets: parseInt10(ex.sets),
        reps: optText(ex.reps),
        targetWeightKg: parseNum(ex.targetWeightKg),
        restSeconds: parseInt10(ex.restSeconds),
        tempo: optText(ex.tempo),
        rpeTarget: parseInt10(ex.rpeTarget),
        trainerInstruction: optText(ex.trainerInstruction),
      }));

    const result = await upsertWorkoutTemplate({
      id: template?.id,
      name: form.name.trim(),
      category: optText(form.category),
      targetMuscleGroup: optText(form.targetMuscleGroup),
      description: optText(form.description),
      trainerNotes: optText(form.trainerNotes),
      nextDayInstructions: optText(form.nextDayInstructions),
      estimatedDurationMinutes: parseInt10(form.estimatedDurationMinutes),
      difficulty: form.difficulty === '' ? null : form.difficulty,
      exercises: exercisePayload,
    });

    setSubmitting(false);

    if (!result.ok) {
      setErrorMsg(result.error);
      setFieldErrors(result.fieldErrors ?? {});
      return;
    }

    setSuccess('saved');
    router.refresh();
    setTimeout(() => {
      setSuccess(null);
      onClose();
    }, 1100);
  };

  const handleDelete = async () => {
    if (!template?.id) return;
    setDeleting(true);
    setErrorMsg(null);
    const result = await deleteWorkoutTemplate({ id: template.id });
    setDeleting(false);
    if (!result.ok) {
      setErrorMsg(result.error ?? 'Failed to delete the template.');
      return;
    }
    setSuccess('deleted');
    router.refresh();
    setTimeout(() => {
      setSuccess(null);
      onClose();
    }, 1100);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6"
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full md:max-w-2xl max-h-[92vh] md:max-h-[88vh] rounded-t-3xl md:rounded-3xl bg-bg-card border border-border flex flex-col overflow-hidden"
            style={{ boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}
          >
            <div className="flex items-start justify-between p-5 md:p-6 border-b border-border">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold mb-1">
                  {template ? 'Edit template' : 'New template'}
                </div>
                <h2 className="font-display font-semibold text-xl tracking-tight">
                  {template?.name || 'Workout template'}
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  Reusable workout that you can apply to any client&apos;s day in
                  one click.
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

            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 md:px-6 py-5">
              {/* Header fields */}
              <Section title="Workout" icon={<Dumbbell size={14} />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Template name *" error={fieldErrors.name}>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      placeholder="Chest Day A"
                      className={cn(
                        'w-full h-11 px-3 rounded-lg bg-bg-elevated border text-sm focus:outline-none transition-colors',
                        fieldErrors.name
                          ? 'border-rose-500 focus:border-rose-500'
                          : 'border-border-soft focus:border-accent/50'
                      )}
                    />
                  </Field>

                  <Field label="Type">
                    <select
                      value={form.category}
                      onChange={(e) => update('category', e.target.value)}
                      className="w-full h-11 px-3 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent/50 focus:outline-none transition-colors"
                    >
                      <option value="">— Select —</option>
                      {WORKOUT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Target muscle group">
                    <input
                      type="text"
                      value={form.targetMuscleGroup}
                      onChange={(e) => update('targetMuscleGroup', e.target.value)}
                      placeholder="Push (Chest · Shoulders · Triceps)"
                      className="w-full h-11 px-3 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent/50 focus:outline-none transition-colors"
                    />
                  </Field>

                  <Field label="Difficulty">
                    <select
                      value={form.difficulty}
                      onChange={(e) =>
                        update(
                          'difficulty',
                          e.target.value as FormState['difficulty']
                        )
                      }
                      className="w-full h-11 px-3 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent/50 focus:outline-none transition-colors"
                    >
                      <option value="">— Select —</option>
                      {DIFFICULTIES.map((d) => (
                        <option key={d} value={d}>
                          {titleCase(d)}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Estimated duration" unit="minutes">
                    <input
                      type="number"
                      min={0}
                      value={form.estimatedDurationMinutes}
                      onChange={(e) =>
                        update('estimatedDurationMinutes', e.target.value)
                      }
                      placeholder="60"
                      className="w-full h-11 px-3 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent/50 focus:outline-none transition-colors"
                    />
                  </Field>
                </div>

                <div className="mt-3 space-y-3">
                  <Field label="Description">
                    <textarea
                      rows={2}
                      value={form.description}
                      onChange={(e) => update('description', e.target.value)}
                      placeholder="Short summary trainers see in the picker."
                      className="w-full px-3 py-2.5 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent/50 focus:outline-none transition-colors resize-none"
                    />
                  </Field>
                  <Field label="Default trainer notes">
                    <textarea
                      rows={2}
                      value={form.trainerNotes}
                      onChange={(e) => update('trainerNotes', e.target.value)}
                      placeholder="Coaching cues, intensity guidance, technique reminders…"
                      className="w-full px-3 py-2.5 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent/50 focus:outline-none transition-colors resize-none"
                    />
                  </Field>
                </div>
              </Section>

              {/* Exercises */}
              <Section title="Exercises" icon={<ListOrdered size={14} />}>
                <div className="space-y-3">
                  {form.exercises.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border-soft p-4 text-center">
                      <div className="text-xs text-text-muted mb-2">
                        No exercises in this template yet.
                      </div>
                      <button
                        type="button"
                        onClick={addExercise}
                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-accent text-bg text-xs font-semibold hover:bg-accent-hover transition-colors"
                      >
                        <Plus size={12} strokeWidth={2.5} />
                        Add first exercise
                      </button>
                    </div>
                  ) : (
                    <>
                      {form.exercises.map((ex, idx) => (
                        <ExerciseCard
                          key={idx}
                          index={idx}
                          total={form.exercises.length}
                          exercise={ex}
                          library={exerciseLibrary}
                          onChange={(key, value) => updateExercise(idx, key, value)}
                          onRemove={() => removeExercise(idx)}
                          onMove={(dir) => moveExercise(idx, dir)}
                          onPickFromLibrary={(slug) => pickFromLibrary(idx, slug)}
                        />
                      ))}
                      <button
                        type="button"
                        onClick={addExercise}
                        className="w-full inline-flex items-center justify-center gap-1.5 h-10 rounded-lg border border-dashed border-border hover:border-accent text-xs font-semibold text-text-muted hover:text-accent transition-colors"
                      >
                        <Plus size={12} strokeWidth={2.5} />
                        Add another exercise
                      </button>
                    </>
                  )}
                </div>
              </Section>

              {errorMsg && (
                <div className="mt-2 mb-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-xs">
                  {errorMsg}
                </div>
              )}
            </form>

            <div className="border-t border-border p-4 md:p-5 flex items-center justify-between gap-2 bg-bg-card">
              {template?.id ? (
                confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">
                      Delete this template?
                    </span>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="h-9 px-3 rounded-full bg-danger text-bg text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {deleting ? 'Deleting…' : 'Confirm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="h-9 px-3 rounded-full border border-border text-xs font-medium hover:border-text-muted transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-danger/50 bg-danger/10 text-danger text-sm font-semibold hover:bg-danger/20 hover:border-danger transition-colors"
                  >
                    <Trash2 size={13} strokeWidth={2.5} />
                    Delete template
                  </button>
                )
              ) : (
                <span />
              )}

              <div className="flex items-center gap-2">
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
                  disabled={submitting || success !== null}
                  className={cn(
                    'inline-flex items-center gap-2 h-10 px-5 rounded-full text-sm font-semibold transition-colors',
                    success === 'saved'
                      ? 'bg-success text-bg'
                      : success === 'deleted'
                        ? 'bg-text-muted text-bg'
                        : 'bg-accent text-bg hover:bg-accent-hover',
                    (submitting || success !== null) && 'cursor-not-allowed'
                  )}
                >
                  {success === 'saved' ? (
                    <>✓ Saved</>
                  ) : success === 'deleted' ? (
                    <>✓ Deleted</>
                  ) : submitting ? (
                    <>Saving…</>
                  ) : (
                    <>
                      <Save size={14} />
                      {template ? 'Save changes' : 'Create template'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Sub-components (kept local; minor visual divergence from EditDailyPlanModal acceptable) ───

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
  error,
  children,
}: {
  label: string;
  unit?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <FieldLabel>{label}</FieldLabel>
        {unit && <span className="text-[9px] text-text-dim font-mono">{unit}</span>}
      </div>
      {children}
      {error && (
        <div className="text-[10px] text-rose-400 font-mono mt-1.5">{error}</div>
      )}
    </div>
  );
}

function ExerciseCard({
  index,
  total,
  exercise,
  library,
  onChange,
  onRemove,
  onMove,
  onPickFromLibrary,
}: {
  index: number;
  total: number;
  exercise: ExerciseRow;
  library: LibraryExerciseOption[];
  onChange: (key: keyof ExerciseRow, value: string) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  onPickFromLibrary: (slug: string) => void;
}) {
  const libraryByCategory: Record<string, LibraryExerciseOption[]> = {};
  for (const lib of library) {
    (libraryByCategory[lib.category] ??= []).push(lib);
  }
  const sortedCategories = Object.keys(libraryByCategory).sort();

  return (
    <div
      data-template-exercise-card
      className="rounded-lg border border-border-soft bg-bg-elevated/40 p-3 md:p-4 space-y-3 transition-all data-[flash='1']:border-accent data-[flash='1']:bg-accent/5 data-[flash='1']:shadow-[0_0_0_3px_rgba(198,255,61,0.15)]"
    >
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 w-7 h-7 rounded-md bg-accent/10 text-accent flex items-center justify-center font-mono text-[11px] font-bold">
          {index + 1}
        </div>
        <input
          type="text"
          value={exercise.exerciseName}
          onChange={(e) => onChange('exerciseName', e.target.value)}
          placeholder="Exercise name (or pick from library below)"
          className="flex-1 min-w-0 h-10 px-3 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent/50 focus:outline-none transition-colors font-medium"
        />
        <div className="flex-shrink-0 flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="w-8 h-8 rounded-md border border-border-soft text-text-muted hover:border-accent hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            aria-label="Move up"
          >
            <ChevronUp size={14} />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            className="w-8 h-8 rounded-md border border-border-soft text-text-muted hover:border-accent hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            aria-label="Move down"
          >
            <ChevronDown size={14} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="w-8 h-8 rounded-md border border-border-soft text-text-muted hover:border-danger/50 hover:text-danger transition-colors flex items-center justify-center"
            aria-label="Remove exercise"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {library.length > 0 && (
        <div>
          <FieldLabel>Pick from library</FieldLabel>
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) onPickFromLibrary(e.target.value);
            }}
            className="w-full h-10 px-3 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent/50 focus:outline-none transition-colors"
          >
            <option value="">— Choose to auto-fill name + defaults —</option>
            {sortedCategories.map((cat) => (
              <optgroup key={cat} label={titleCase(cat)}>
                {libraryByCategory[cat].map((lib) => (
                  <option key={lib.slug} value={lib.slug}>
                    {lib.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      )}

      <div>
        <FieldLabel>Target muscle</FieldLabel>
        <input
          type="text"
          value={exercise.targetMuscle}
          onChange={(e) => onChange('targetMuscle', e.target.value)}
          placeholder="Upper chest"
          className="w-full h-10 px-3 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent/50 focus:outline-none transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <SmallField label="Sets" type="number" value={exercise.sets} onChange={(v) => onChange('sets', v)} placeholder="4" />
        <SmallField label="Reps" value={exercise.reps} onChange={(v) => onChange('reps', v)} placeholder="8-12" />
        <SmallField label="Weight" unit="kg" type="number" step="0.5" value={exercise.targetWeightKg} onChange={(v) => onChange('targetWeightKg', v)} placeholder="20" />
        <SmallField label="Rest" unit="seconds" type="number" value={exercise.restSeconds} onChange={(v) => onChange('restSeconds', v)} placeholder="90" />
        <SmallField label="Tempo" value={exercise.tempo} onChange={(v) => onChange('tempo', v)} placeholder="3-1-1-0" />
        <SmallField label="RPE" unit="1-10" type="number" min="1" max="10" value={exercise.rpeTarget} onChange={(v) => onChange('rpeTarget', v)} placeholder="8" />
      </div>

      <div>
        <FieldLabel>Coaching cue</FieldLabel>
        <textarea
          value={exercise.trainerInstruction}
          onChange={(e) => onChange('trainerInstruction', e.target.value)}
          rows={2}
          placeholder="Pause 1s at bottom · drive through heels · keep elbows tucked…"
          className="w-full px-3 py-2.5 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent/50 focus:outline-none transition-colors resize-none"
        />
      </div>
    </div>
  );
}

function SmallField({
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
