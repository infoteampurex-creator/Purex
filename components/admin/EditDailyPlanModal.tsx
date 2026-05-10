'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Save,
  Trash2,
  Dumbbell,
  Target,
  Moon,
  StickyNote,
  CalendarRange,
  Plus,
  ChevronUp,
  ChevronDown,
  ListOrdered,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  upsertDailyPlan,
  deleteDailyPlan,
  loadDailyPlan,
} from '@/lib/actions/daily-plan';
import {
  applyTemplateToClient,
  loadWorkoutTemplate,
} from '@/lib/actions/workout-templates';
import { type WorkoutTemplateSummary } from '@/lib/data/workout-templates-types';
import {
  type DailyPlan,
  type LibraryExerciseOption,
  type PlannedExercise,
  EMPTY_DAILY_PLAN,
} from '@/lib/data/daily-plan-types';

interface EditDailyPlanModalProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  /** Initial date (YYYY-MM-DD). Defaults to today. */
  initialDate?: string;
  /** Pre-fetched plan for `initialDate`. Modal still re-fetches on date change via router refresh. */
  initialPlan?: DailyPlan | null;
  /** All active exercises from `exercise_library` for the dropdown. Empty array hides the picker and falls back to free-text only. */
  exerciseLibrary: LibraryExerciseOption[];
  /** Saved workout templates for the "Apply template" picker at the top of the modal. Empty array hides the picker. */
  workoutTemplates?: WorkoutTemplateSummary[];
}

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
  planDate: string;

  workoutName: string;
  workoutType: string;
  targetMuscleGroup: string;
  trainerNotes: string;
  nextDayInstructions: string;

  stepsTarget: string;
  sleepTargetHours: string;
  waterTarget: string;
  caloriesTarget: string;
  proteinTargetG: string;
  cardioTargetMinutes: string;
  targetWeightKg: string;

  recoveryGoal: string;
  mobilityGoal: string;

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

function plannedExerciseToRow(p: PlannedExercise): ExerciseRow {
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

const todayStr = () => new Date().toISOString().slice(0, 10);

function planToFormState(plan: DailyPlan | null | undefined, date: string): FormState {
  const p = plan ?? EMPTY_DAILY_PLAN;
  const s = (v: string | number | null) => (v == null ? '' : String(v));
  return {
    planDate: date,
    workoutName: s(p.workoutName),
    workoutType: s(p.workoutType),
    targetMuscleGroup: s(p.targetMuscleGroup),
    trainerNotes: s(p.trainerNotes),
    nextDayInstructions: s(p.nextDayInstructions),
    stepsTarget: s(p.stepsTarget),
    sleepTargetHours: s(p.sleepTargetHours),
    waterTarget: s(p.waterTarget),
    caloriesTarget: s(p.caloriesTarget),
    proteinTargetG: s(p.proteinTargetG),
    cardioTargetMinutes: s(p.cardioTargetMinutes),
    targetWeightKg: s(p.targetWeightKg),
    recoveryGoal: s(p.recoveryGoal),
    mobilityGoal: s(p.mobilityGoal),
    exercises: p.exercises.map(plannedExerciseToRow),
  };
}

const WORKOUT_TYPES = [
  'Strength',
  'HYROX',
  'Conditioning',
  'Mobility',
  'Cardio',
  'Sport',
  'Rest',
];

export function EditDailyPlanModal({
  open,
  onClose,
  clientId,
  clientName,
  initialDate,
  initialPlan,
  exerciseLibrary,
  workoutTemplates,
}: EditDailyPlanModalProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() =>
    planToFormState(initialPlan ?? null, initialDate ?? todayStr())
  );
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState<'saved' | 'deleted' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [applyingTemplateId, setApplyingTemplateId] = useState<string | null>(null);

  // Reset on open. If parent didn't supply an initialPlan (e.g. opened
  // for an older date from the Workouts tab), fetch the plan for that
  // date so the form shows what's saved instead of an empty shell.
  useEffect(() => {
    if (!open) return;
    const date = initialDate ?? todayStr();
    setForm(planToFormState(initialPlan ?? null, date));
    setSubmitting(false);
    setDeleting(false);
    setSuccess(null);
    setErrorMsg(null);
    setConfirmDelete(false);

    if (!initialPlan) {
      let cancelled = false;
      setPlanLoading(true);
      loadDailyPlan(clientId, date)
        .then((fresh) => {
          if (cancelled) return;
          setForm(planToFormState(fresh, date));
        })
        .finally(() => {
          if (!cancelled) setPlanLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }
  }, [open, initialPlan, initialDate, clientId]);

  // When the user changes the date inside the modal, refetch that date's
  // plan so we don't accidentally save under a different day with stale
  // form values.
  const handleDateChange = async (newDate: string) => {
    setForm((prev) => ({ ...prev, planDate: newDate }));
    // Wait for a complete YYYY-MM-DD before fetching.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) return;
    setPlanLoading(true);
    try {
      const fresh = await loadDailyPlan(clientId, newDate);
      setForm(planToFormState(fresh, newDate));
    } finally {
      setPlanLoading(false);
    }
  };

  // Apply a saved workout template:
  //   1. Persist on the server (writes client_workouts + replaces
  //      planned exercises for this client + date).
  //   2. Refetch the plan so the form reflects what's now saved.
  // The user can then tweak fields and Save again to override.
  const handleApplyTemplate = async (templateId: string) => {
    if (!templateId) return;
    setApplyingTemplateId(templateId);
    setErrorMsg(null);
    try {
      // First, load the template details into the form locally so the
      // user sees the change instantly even if the apply is slow.
      const tpl = await loadWorkoutTemplate(templateId);
      if (tpl) {
        setForm((prev) => ({
          ...prev,
          workoutName: prev.workoutName.trim() || tpl.name,
          workoutType: prev.workoutType.trim() || tpl.category || '',
          targetMuscleGroup:
            prev.targetMuscleGroup.trim() || tpl.targetMuscleGroup || '',
          trainerNotes:
            prev.trainerNotes.trim() || tpl.trainerNotes || '',
          nextDayInstructions:
            prev.nextDayInstructions.trim() ||
            tpl.nextDayInstructions ||
            '',
          exercises: tpl.exercises.map((ex) => ({
            exerciseName: ex.exerciseName,
            targetMuscle: ex.targetMuscle ?? '',
            sets: ex.sets != null ? String(ex.sets) : '',
            reps: ex.reps ?? '',
            targetWeightKg:
              ex.targetWeightKg != null ? String(ex.targetWeightKg) : '',
            restSeconds:
              ex.restSeconds != null ? String(ex.restSeconds) : '',
            tempo: ex.tempo ?? '',
            rpeTarget: ex.rpeTarget != null ? String(ex.rpeTarget) : '',
            trainerInstruction: ex.trainerInstruction ?? '',
          })),
        }));
      }

      // Then persist via the server action (idempotent — the user can
      // still hit Save afterwards to add daily targets).
      const result = await applyTemplateToClient({
        templateId,
        clientId,
        planDate: form.planDate,
      });
      if (!result.ok) {
        setErrorMsg(result.error ?? 'Could not apply template.');
      }
    } finally {
      setApplyingTemplateId(null);
    }
  };

  // Esc + body scroll lock
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
    // After the new row mounts, scroll it into view + briefly highlight so
    // the trainer sees the addition (otherwise on a long form the row lands
    // below the fold and looks like nothing happened).
    requestAnimationFrame(() => {
      const cards = document.querySelectorAll<HTMLDivElement>(
        '[data-exercise-card]'
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

    // Drop blank rows (no name) before sending. Sending an empty array
    // tells the server to clear all planned exercises for the day.
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

    const result = await upsertDailyPlan({
      clientId,
      planDate: form.planDate,
      workout: {
        name: optText(form.workoutName),
        type: optText(form.workoutType),
        targetMuscleGroup: optText(form.targetMuscleGroup),
        trainerNotes: optText(form.trainerNotes),
        nextDayInstructions: optText(form.nextDayInstructions),
      },
      targets: {
        stepsTarget: parseInt10(form.stepsTarget),
        sleepTargetHours: parseNum(form.sleepTargetHours),
        waterTarget: parseInt10(form.waterTarget),
        caloriesTarget: parseInt10(form.caloriesTarget),
        proteinTargetG: parseInt10(form.proteinTargetG),
        cardioTargetMinutes: parseInt10(form.cardioTargetMinutes),
        targetWeightKg: parseNum(form.targetWeightKg),
      },
      recovery: {
        recoveryGoal: optText(form.recoveryGoal),
        mobilityGoal: optText(form.mobilityGoal),
      },
      exercises: exercisePayload,
    });

    setSubmitting(false);

    if (!result.ok) {
      setErrorMsg(result.error ?? 'Failed to save. Try again.');
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
    setDeleting(true);
    setErrorMsg(null);
    const result = await deleteDailyPlan({
      clientId,
      planDate: form.planDate,
    });
    setDeleting(false);

    if (!result.ok) {
      setErrorMsg(result.error ?? 'Failed to delete. Try again.');
      return;
    }

    setSuccess('deleted');
    router.refresh();
    setTimeout(() => {
      setSuccess(null);
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
        className="relative w-full md:max-w-2xl max-h-[92vh] md:max-h-[88vh] rounded-t-3xl md:rounded-3xl bg-bg-card border border-border flex flex-col overflow-hidden"
        style={{ boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 md:p-6 border-b border-border">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold mb-1">
              Edit today&apos;s plan
            </div>
            <h2 className="font-display font-semibold text-xl tracking-tight">
              {clientName}
            </h2>
            <p className="text-xs text-text-muted mt-1">
              Set the workout, daily targets, and recovery goals. Leave blank to
              skip a field.
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

        {/* Form body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 md:px-6 py-5">
          {/* Date */}
          <div className="mb-5">
            <FieldLabel>
              Plan date{planLoading && ' · loading…'}
            </FieldLabel>
            <input
              type="date"
              value={form.planDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full md:w-auto h-11 px-3 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent/50 focus:outline-none transition-colors font-mono"
            />
          </div>

          {/* Apply from a saved template */}
          {workoutTemplates && workoutTemplates.length > 0 && (
            <div className="mb-5 rounded-lg border border-accent/30 bg-accent/[0.04] p-3">
              <FieldLabel>
                Apply from template{applyingTemplateId && ' · applying…'}
              </FieldLabel>
              <select
                value=""
                disabled={applyingTemplateId !== null || planLoading}
                onChange={(e) => {
                  if (e.target.value) handleApplyTemplate(e.target.value);
                }}
                className="w-full h-11 px-3 rounded-lg bg-bg-elevated border border-accent/40 text-sm focus:border-accent focus:outline-none transition-colors disabled:opacity-50"
              >
                <option value="">— Pick a template to load 7-8 exercises at once —</option>
                {workoutTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.category ? ` · ${t.category}` : ''}
                    {` · ${t.exerciseCount} exercise${t.exerciseCount === 1 ? '' : 's'}`}
                  </option>
                ))}
              </select>
              <div className="text-[10px] text-text-dim font-mono mt-1.5">
                Loads the template into the form below, then writes it to this
                client&apos;s {form.planDate}. You can still tweak any field
                before/after.
              </div>
            </div>
          )}

          {/* Workout */}
          <Section title="Workout" icon={<Dumbbell size={14} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field
                label="Workout title"
                value={form.workoutName}
                onChange={(v) => update('workoutName', v)}
                placeholder="Upper Body Strength"
              />
              <SelectField
                label="Workout type"
                value={form.workoutType}
                onChange={(v) => update('workoutType', v)}
                options={WORKOUT_TYPES}
                placeholder="Select type…"
              />
              <Field
                label="Target muscle group"
                value={form.targetMuscleGroup}
                onChange={(v) => update('targetMuscleGroup', v)}
                placeholder="Push (Chest · Shoulders · Triceps)"
              />
            </div>
          </Section>

          {/* Exercises */}
          <Section title="Exercises" icon={<ListOrdered size={14} />}>
            <div className="space-y-3">
              {form.exercises.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border-soft p-4 text-center">
                  <div className="text-xs text-text-muted mb-2">
                    No exercises planned yet.
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
                      onPickFromLibrary={(slug) => {
                        const lib = exerciseLibrary.find((l) => l.slug === slug);
                        if (!lib) return;
                        // Apply library defaults to this row.
                        setForm((prev) => ({
                          ...prev,
                          exercises: prev.exercises.map((row, i) =>
                            i === idx
                              ? {
                                  ...row,
                                  exerciseName: lib.name,
                                  targetMuscle:
                                    row.targetMuscle.trim() ||
                                    titleCase(lib.category),
                                  sets:
                                    row.sets.trim() ||
                                    (lib.defaultSets ?? ''),
                                  reps:
                                    row.reps.trim() ||
                                    (lib.defaultReps ?? ''),
                                  restSeconds:
                                    row.restSeconds.trim() ||
                                    (lib.defaultRestSeconds != null
                                      ? String(lib.defaultRestSeconds)
                                      : ''),
                                }
                              : row
                          ),
                        }));
                      }}
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

          {/* Daily Targets */}
          <Section title="Daily Targets" icon={<Target size={14} />}>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Steps"
                unit="steps"
                type="number"
                value={form.stepsTarget}
                onChange={(v) => update('stepsTarget', v)}
                placeholder="10000"
              />
              <Field
                label="Sleep"
                unit="hours"
                type="number"
                step="0.1"
                value={form.sleepTargetHours}
                onChange={(v) => update('sleepTargetHours', v)}
                placeholder="8"
              />
              <Field
                label="Water"
                unit="glasses"
                type="number"
                value={form.waterTarget}
                onChange={(v) => update('waterTarget', v)}
                placeholder="8"
              />
              <Field
                label="Calories"
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
                value={form.proteinTargetG}
                onChange={(v) => update('proteinTargetG', v)}
                placeholder="165"
              />
              <Field
                label="Cardio"
                unit="minutes"
                type="number"
                value={form.cardioTargetMinutes}
                onChange={(v) => update('cardioTargetMinutes', v)}
                placeholder="30"
              />
              <Field
                label="Target body weight"
                unit="kg"
                type="number"
                step="0.1"
                value={form.targetWeightKg}
                onChange={(v) => update('targetWeightKg', v)}
                placeholder="78"
              />
            </div>
          </Section>

          {/* Recovery & Mobility */}
          <Section title="Recovery & Mobility" icon={<Moon size={14} />}>
            <div className="space-y-3">
              <TextareaField
                label="Recovery goal"
                value={form.recoveryGoal}
                onChange={(v) => update('recoveryGoal', v)}
                placeholder="e.g. 10-min foam rolling + cold shower after workout."
              />
              <TextareaField
                label="Mobility goal"
                value={form.mobilityGoal}
                onChange={(v) => update('mobilityGoal', v)}
                placeholder="e.g. Hip openers — 90/90, pigeon, couch stretch."
              />
            </div>
          </Section>

          {/* Trainer Notes + Next-day */}
          <Section title="Notes" icon={<StickyNote size={14} />}>
            <div className="space-y-3">
              <TextareaField
                label="Trainer notes"
                value={form.trainerNotes}
                onChange={(v) => update('trainerNotes', v)}
                placeholder="Coaching cues, intensity guidance, technique reminders…"
              />
              <TextareaField
                label="Next-day instructions"
                value={form.nextDayInstructions}
                onChange={(v) => update('nextDayInstructions', v)}
                placeholder="Pre-workout meal timing, sleep priority, recovery focus…"
                icon={<CalendarRange size={11} />}
              />
            </div>
          </Section>

          {errorMsg ? (
            <div className="mt-2 mb-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-xs">
              {errorMsg}
            </div>
          ) : (
            <div className="text-[10px] text-text-muted font-mono uppercase tracking-[0.14em] mt-2 mb-4">
              Saves planned targets · keeps client&apos;s logged actuals untouched
            </div>
          )}
        </form>

        {/* Sticky footer */}
        <div className="border-t border-border p-4 md:p-5 flex items-center justify-between gap-2 bg-bg-card">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Delete this plan?</span>
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
              Delete plan
            </button>
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
                'inline-flex items-center gap-2 h-10 px-5 rounded-full font-semibold text-sm transition-all',
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
                <>
                  <Spinner />
                  Saving…
                </>
              ) : (
                <>
                  <Save size={14} />
                  Save plan
                </>
              )}
            </button>
          </div>
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

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 px-3 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent/50 focus:outline-none transition-colors"
      >
        <option value="">{placeholder ?? 'Select…'}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon && <span className="text-text-muted">{icon}</span>}
        <FieldLabel>{label}</FieldLabel>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent/50 focus:outline-none transition-colors resize-none"
      />
    </div>
  );
}

function titleCase(s: string): string {
  return s
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
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
  // Group library entries by category for the optgroups.
  const libraryByCategory: Record<string, LibraryExerciseOption[]> = {};
  for (const lib of library) {
    (libraryByCategory[lib.category] ??= []).push(lib);
  }
  const sortedCategories = Object.keys(libraryByCategory).sort();

  return (
    <div
      data-exercise-card
      className="rounded-lg border border-border-soft bg-bg-elevated/40 p-3 md:p-4 space-y-3 transition-all data-[flash='1']:border-accent data-[flash='1']:bg-accent/5 data-[flash='1']:shadow-[0_0_0_3px_rgba(198,255,61,0.15)]"
    >
      {/* Header — name + reorder + remove */}
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

      {/* Library picker — fills name + target muscle + default sets/reps/rest */}
      {library.length > 0 && (
        <div>
          <FieldLabel>Pick from library</FieldLabel>
          <select
            // Always show the placeholder so re-selecting the same exercise re-fills.
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
          <div className="text-[10px] text-text-dim font-mono mt-1.5">
            Picking only fills empty fields, so your custom sets/reps stay put.
          </div>
        </div>
      )}

      {/* Target muscle */}
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

      {/* Numeric grid — sets/reps/weight/rest/tempo/rpe */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <Field
          label="Sets"
          type="number"
          value={exercise.sets}
          onChange={(v) => onChange('sets', v)}
          placeholder="4"
        />
        <Field
          label="Reps"
          value={exercise.reps}
          onChange={(v) => onChange('reps', v)}
          placeholder="8-12"
        />
        <Field
          label="Weight"
          unit="kg"
          type="number"
          step="0.5"
          value={exercise.targetWeightKg}
          onChange={(v) => onChange('targetWeightKg', v)}
          placeholder="20"
        />
        <Field
          label="Rest"
          unit="seconds"
          type="number"
          value={exercise.restSeconds}
          onChange={(v) => onChange('restSeconds', v)}
          placeholder="90"
        />
        <Field
          label="Tempo"
          value={exercise.tempo}
          onChange={(v) => onChange('tempo', v)}
          placeholder="3-1-1-0"
        />
        <Field
          label="RPE"
          unit="1-10"
          type="number"
          min="1"
          max="10"
          value={exercise.rpeTarget}
          onChange={(v) => onChange('rpeTarget', v)}
          placeholder="8"
        />
      </div>

      {/* Trainer instruction */}
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
