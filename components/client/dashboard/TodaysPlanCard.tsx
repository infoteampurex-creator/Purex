'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dumbbell,
  Footprints,
  Moon,
  Droplets,
  Flame,
  Target,
  Sparkles,
  CalendarRange,
  CheckCircle2,
  CircleDashed,
  CircleSlash,
  Plus,
  StickyNote,
  Activity,
  PencilLine,
  Save,
  Check,
} from 'lucide-react';
import { ProgressRing } from './ProgressRing';
import { LogActualsModal } from './LogActualsModal';
import {
  setWorkoutCompletion,
  logExerciseActuals,
} from '@/lib/actions/daily-plan';
import {
  type DailyPlan,
  type WorkoutCompletionStatus,
  type ExerciseActuals,
} from '@/lib/data/daily-plan-types';
import { cn } from '@/lib/cn';

interface TodaysPlanCardProps {
  clientId: string;
  plan: DailyPlan;
}

export function TodaysPlanCard({ clientId, plan }: TodaysPlanCardProps) {
  const router = useRouter();
  const [logOpen, setLogOpen] = useState(false);
  const [completionPending, startCompletionTransition] = useTransition();

  const hasAnyPlan =
    plan.workoutId !== null ||
    plan.exercises.length > 0 ||
    plan.stepsTarget !== null ||
    plan.sleepTargetHours !== null ||
    plan.waterTarget !== null ||
    plan.caloriesTarget !== null ||
    plan.recoveryGoal !== null ||
    plan.mobilityGoal !== null ||
    plan.trainerNotes !== null;

  if (!hasAnyPlan) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-3xl border border-border bg-bg-card p-6 md:p-8 text-center"
      >
        <div className="inline-flex w-12 h-12 items-center justify-center rounded-2xl bg-accent/10 text-accent mb-4">
          <Dumbbell size={20} />
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold mb-2">
          Today&apos;s plan
        </div>
        <h3 className="font-display font-semibold text-xl tracking-tight">
          No plan set for today
        </h3>
        <p className="text-sm text-text-muted mt-2 max-w-md mx-auto">
          Your coach hasn&apos;t shared today&apos;s plan yet. You can still log your
          metrics so they have context for tomorrow.
        </p>
        <button
          onClick={() => setLogOpen(true)}
          className="inline-flex items-center gap-2 mt-5 h-10 px-5 rounded-full border border-border text-sm font-medium hover:border-accent transition-colors"
        >
          <Plus size={14} />
          Log my metrics
        </button>

        <LogActualsModal
          open={logOpen}
          onClose={() => setLogOpen(false)}
          clientId={clientId}
          initialActuals={plan.actuals}
        />
      </motion.div>
    );
  }

  const handleSetCompletion = (next: WorkoutCompletionStatus) => {
    if (!plan.workoutId) return;
    startCompletionTransition(async () => {
      // Tap the same status again → clear it (treat as un-marked).
      const target = plan.actuals.workoutCompletionStatus === next ? null : next;
      await setWorkoutCompletion({
        workoutId: plan.workoutId!,
        status: target,
      });
      router.refresh();
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl"
      style={{
        background: `
          radial-gradient(ellipse 80% 120% at 20% 0%, rgba(198, 255, 61, 0.18), transparent 60%),
          radial-gradient(ellipse 60% 80% at 90% 100%, rgba(178, 108, 255, 0.12), transparent 55%),
          linear-gradient(135deg, #1a2014 0%, #161a16 50%, #141412 100%)
        `,
        border: '1px solid rgba(198, 255, 61, 0.25)',
        boxShadow:
          '0 20px 60px -20px rgba(0,0,0,0.6), 0 0 80px rgba(198, 255, 61, 0.05) inset',
      }}
    >
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #c6ff3d 1px, transparent 1px), linear-gradient(to bottom, #c6ff3d 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Corner glow */}
      <div
        className="absolute -top-24 -left-24 w-64 h-64 rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(198, 255, 61, 0.22), transparent 70%)',
        }}
      />

      <div className="relative p-5 md:p-7 space-y-6">
        {/* Header — workout title + complete toggle */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold mb-1.5">
              My plan today
            </div>
            <h2 className="font-display font-bold text-2xl md:text-3xl tracking-tight leading-tight">
              {plan.workoutName ?? 'Daily plan'}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              {plan.workoutType && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10 text-accent text-[11px] font-mono font-bold uppercase tracking-[0.12em] border border-accent/30">
                  {plan.workoutType}
                </span>
              )}
              {plan.targetMuscleGroup && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-bg-elevated text-text-muted text-[11px] font-medium">
                  {plan.targetMuscleGroup}
                </span>
              )}
            </div>
          </div>

          {plan.workoutId && (
            <CompletionPills
              current={plan.actuals.workoutCompletionStatus}
              pending={completionPending}
              onSet={handleSetCompletion}
            />
          )}
        </div>

        {/* Exercises */}
        {plan.exercises.length > 0 && (
          <Section title="Workout" icon={<Dumbbell size={13} />}>
            <div className="space-y-2.5">
              {plan.exercises.map((ex, idx) => (
                <ExerciseRow key={ex.id} index={idx + 1} exercise={ex} />
              ))}
            </div>
          </Section>
        )}

        {/* Daily targets — progress rings for the visual ones */}
        {(plan.stepsTarget || plan.sleepTargetHours || plan.waterTarget) && (
          <Section title="Daily targets" icon={<Target size={13} />}>
            <div className="grid grid-cols-3 gap-3">
              <RingTile
                icon={<Footprints size={12} />}
                label="Steps"
                actual={plan.actuals.steps}
                target={plan.stepsTarget}
                format={(n) => n.toLocaleString()}
              />
              <RingTile
                icon={<Moon size={12} />}
                label="Sleep"
                actual={plan.actuals.sleepHours}
                target={plan.sleepTargetHours}
                format={(n) => `${n}h`}
              />
              <RingTile
                icon={<Droplets size={12} />}
                label="Water"
                actual={plan.actuals.waterGlasses}
                target={plan.waterTarget}
                format={(n) => `${n}`}
              />
            </div>

            {/* Secondary targets — small stats */}
            {(plan.caloriesTarget ||
              plan.proteinTargetG ||
              plan.cardioTargetMinutes ||
              plan.targetWeightKg) && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                {plan.caloriesTarget != null && (
                  <SmallTile
                    icon={<Flame size={11} />}
                    label="Calories"
                    actual={plan.actuals.caloriesConsumed}
                    target={plan.caloriesTarget}
                    unit="kcal"
                  />
                )}
                {plan.proteinTargetG != null && (
                  <SmallTile
                    label="Protein"
                    actual={plan.actuals.proteinG}
                    target={plan.proteinTargetG}
                    unit="g"
                  />
                )}
                {plan.cardioTargetMinutes != null && (
                  <SmallTile
                    icon={<Activity size={11} />}
                    label="Cardio"
                    target={plan.cardioTargetMinutes}
                    unit="min"
                  />
                )}
                {plan.targetWeightKg != null && (
                  <SmallTile
                    label="Goal weight"
                    actual={plan.actuals.weightKg}
                    target={plan.targetWeightKg}
                    unit="kg"
                  />
                )}
              </div>
            )}
          </Section>
        )}

        {/* Trainer notes */}
        {plan.trainerNotes && (
          <Section title="Trainer notes" icon={<StickyNote size={13} />}>
            <div className="rounded-lg bg-bg-elevated/40 border border-border-soft p-3.5 text-sm leading-relaxed whitespace-pre-wrap">
              {plan.trainerNotes}
            </div>
          </Section>
        )}

        {/* Recovery + Mobility */}
        {(plan.recoveryGoal || plan.mobilityGoal) && (
          <Section title="Recovery" icon={<Sparkles size={13} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {plan.recoveryGoal && (
                <CueCard label="Recovery" body={plan.recoveryGoal} />
              )}
              {plan.mobilityGoal && (
                <CueCard label="Mobility" body={plan.mobilityGoal} />
              )}
            </div>
          </Section>
        )}

        {/* Next-day instructions */}
        {plan.nextDayInstructions && (
          <Section title="Tomorrow's prep" icon={<CalendarRange size={13} />}>
            <div className="rounded-lg bg-bg-elevated/40 border border-border-soft p-3.5 text-sm leading-relaxed whitespace-pre-wrap text-text-muted">
              {plan.nextDayInstructions}
            </div>
          </Section>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={() => setLogOpen(true)}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-accent text-bg text-sm font-semibold hover:bg-accent-hover transition-colors"
          >
            <Plus size={14} strokeWidth={2.5} />
            Log my metrics
          </button>
        </div>
      </div>

      <LogActualsModal
        open={logOpen}
        onClose={() => setLogOpen(false)}
        clientId={clientId}
        initialActuals={plan.actuals}
      />
    </motion.div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

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
    <div>
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

function ExerciseRow({
  index,
  exercise,
}: {
  index: number;
  exercise: DailyPlan['exercises'][number];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const hasNumbers =
    exercise.sets != null ||
    exercise.reps != null ||
    exercise.targetWeightKg != null ||
    exercise.restSeconds != null ||
    exercise.tempo != null ||
    exercise.rpeTarget != null;

  const hasActuals =
    exercise.actuals !== null &&
    (exercise.actuals.actualSets != null ||
      exercise.actuals.actualReps != null ||
      exercise.actuals.actualWeightKg != null ||
      exercise.actuals.rpe != null ||
      (exercise.actuals.notes ?? '').trim().length > 0);

  const handleSave = (input: {
    actualSets: number | null;
    actualReps: string | null;
    actualWeightKg: number | null;
    rpe: number | null;
    notes: string | null;
  }) => {
    setErrorMsg(null);
    startTransition(async () => {
      const result = await logExerciseActuals({
        plannedExerciseId: exercise.id,
        ...input,
      });
      if (!result.ok) {
        setErrorMsg(result.error ?? 'Could not save.');
        return;
      }
      setEditing(false);
      router.refresh();
    });
  };

  return (
    <div
      className={cn(
        'rounded-lg border p-3 md:p-3.5 transition-colors',
        hasActuals
          ? 'bg-success/5 border-success/30'
          : 'bg-bg-card/60 border-border-soft'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center font-mono text-[11px] font-bold',
            hasActuals ? 'bg-success/15 text-success' : 'bg-accent/10 text-accent'
          )}
        >
          {hasActuals ? <Check size={13} strokeWidth={2.5} /> : index}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-medium text-sm leading-tight">
                {exercise.exerciseName}
              </div>
              {exercise.targetMuscle && (
                <div className="text-[11px] text-text-muted font-mono uppercase tracking-[0.1em] mt-0.5">
                  {exercise.targetMuscle}
                </div>
              )}
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex-shrink-0 inline-flex items-center gap-1 h-7 px-2.5 rounded-full border border-border-soft text-[10px] font-mono uppercase tracking-[0.12em] text-text-muted hover:border-accent hover:text-accent transition-colors"
              >
                <PencilLine size={10} />
                {hasActuals ? 'Edit log' : 'Log'}
              </button>
            )}
          </div>

          {hasNumbers && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs font-mono">
              {exercise.sets != null && (
                <SpecChip label="sets" value={String(exercise.sets)} />
              )}
              {exercise.reps && (
                <SpecChip label="reps" value={exercise.reps} />
              )}
              {exercise.targetWeightKg != null && (
                <SpecChip
                  label="weight"
                  value={`${exercise.targetWeightKg}kg`}
                />
              )}
              {exercise.restSeconds != null && (
                <SpecChip label="rest" value={`${exercise.restSeconds}s`} />
              )}
              {exercise.tempo && (
                <SpecChip label="tempo" value={exercise.tempo} />
              )}
              {exercise.rpeTarget != null && (
                <SpecChip label="rpe" value={String(exercise.rpeTarget)} />
              )}
            </div>
          )}

          {hasActuals && exercise.actuals && (
            <ActualsSummary actuals={exercise.actuals} />
          )}

          {exercise.trainerInstruction && !editing && (
            <div className="text-xs text-text-muted italic mt-2 leading-relaxed">
              {exercise.trainerInstruction}
            </div>
          )}

          <AnimatePresence>
            {editing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <ExerciseLogForm
                  initial={exercise.actuals}
                  pending={pending}
                  errorMsg={errorMsg}
                  onCancel={() => {
                    setEditing(false);
                    setErrorMsg(null);
                  }}
                  onSave={handleSave}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ActualsSummary({ actuals }: { actuals: ExerciseActuals }) {
  return (
    <div className="mt-2 rounded-md bg-bg-elevated/40 border border-success/20 px-2.5 py-1.5">
      <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-success font-bold mb-1">
        You did
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs font-mono">
        {actuals.actualSets != null && (
          <SpecChip label="sets" value={String(actuals.actualSets)} />
        )}
        {actuals.actualReps && (
          <SpecChip label="reps" value={actuals.actualReps} />
        )}
        {actuals.actualWeightKg != null && (
          <SpecChip
            label="weight"
            value={`${actuals.actualWeightKg}kg`}
          />
        )}
        {actuals.rpe != null && (
          <SpecChip label="rpe" value={String(actuals.rpe)} />
        )}
      </div>
      {actuals.notes && (
        <div className="text-xs text-text italic mt-1 leading-relaxed">
          “{actuals.notes}”
        </div>
      )}
    </div>
  );
}

function ExerciseLogForm({
  initial,
  pending,
  errorMsg,
  onCancel,
  onSave,
}: {
  initial: ExerciseActuals | null;
  pending: boolean;
  errorMsg: string | null;
  onCancel: () => void;
  onSave: (input: {
    actualSets: number | null;
    actualReps: string | null;
    actualWeightKg: number | null;
    rpe: number | null;
    notes: string | null;
  }) => void;
}) {
  const s = (v: number | string | null | undefined) =>
    v == null ? '' : String(v);
  const [sets, setSets] = useState(s(initial?.actualSets));
  const [reps, setReps] = useState(s(initial?.actualReps));
  const [weight, setWeight] = useState(s(initial?.actualWeightKg));
  const [rpe, setRpe] = useState(s(initial?.rpe));
  const [notes, setNotes] = useState(initial?.notes ?? '');

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

  return (
    <div className="mt-3 space-y-2.5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <SmallInput
          label="Sets"
          type="number"
          value={sets}
          onChange={setSets}
          placeholder="4"
        />
        <SmallInput
          label="Reps"
          value={reps}
          onChange={setReps}
          placeholder="10"
        />
        <SmallInput
          label="Weight kg"
          type="number"
          step="0.5"
          value={weight}
          onChange={setWeight}
          placeholder="20"
        />
        <SmallInput
          label="RPE"
          type="number"
          min="1"
          max="10"
          value={rpe}
          onChange={setRpe}
          placeholder="8"
        />
      </div>
      <div>
        <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted font-bold mb-1">
          Notes
        </div>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Felt heavy on set 4…"
          className="w-full px-2 py-1.5 rounded-md bg-bg-elevated border border-border-soft text-xs focus:border-accent/50 focus:outline-none transition-colors resize-none"
        />
      </div>
      {errorMsg && (
        <div className="text-[11px] text-rose-400 font-mono">{errorMsg}</div>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() =>
            onSave({
              actualSets: parseInt10(sets),
              actualReps: reps.trim() || null,
              actualWeightKg: parseNum(weight),
              rpe: parseInt10(rpe),
              notes: notes.trim() || null,
            })
          }
          disabled={pending}
          className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-accent text-bg text-xs font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          <Save size={11} strokeWidth={2.5} />
          {pending ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="text-xs text-text-muted hover:text-text transition-colors px-1"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function SmallInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  step,
  min,
  max,
}: {
  label: string;
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
      <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted font-bold mb-1">
        {label}
      </div>
      <input
        type={type}
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 px-2 rounded-md bg-bg-elevated border border-border-soft text-xs focus:border-accent/50 focus:outline-none transition-colors"
      />
    </div>
  );
}

function CompletionPills({
  current,
  pending,
  onSet,
}: {
  current: WorkoutCompletionStatus;
  pending: boolean;
  onSet: (status: NonNullable<WorkoutCompletionStatus>) => void;
}) {
  const opts: Array<{
    value: NonNullable<WorkoutCompletionStatus>;
    label: string;
    icon: React.ReactNode;
    activeClasses: string;
  }> = [
    {
      value: 'completed',
      label: 'Completed',
      icon: <CheckCircle2 size={12} />,
      activeClasses: 'bg-success text-bg border-success',
    },
    {
      value: 'partial',
      label: 'Partial',
      icon: <CircleDashed size={12} />,
      activeClasses: 'bg-amber text-bg border-amber',
    },
    {
      value: 'skipped',
      label: 'Skipped',
      icon: <CircleSlash size={12} />,
      activeClasses: 'bg-text-muted text-bg border-text-muted',
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {opts.map((o) => {
        const active = current === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onSet(o.value)}
            disabled={pending}
            className={cn(
              'inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-semibold border transition-colors',
              active
                ? o.activeClasses
                : 'bg-bg-elevated border-border text-text-muted hover:border-accent/40 hover:text-accent',
              pending && 'opacity-60 cursor-not-allowed'
            )}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function SpecChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="text-[9px] uppercase tracking-[0.12em] text-text-dim">
        {label}
      </span>
      <span className="text-text font-bold">{value}</span>
    </span>
  );
}

function RingTile({
  icon,
  label,
  actual,
  target,
  format,
}: {
  icon: React.ReactNode;
  label: string;
  actual: number | null;
  target: number | null;
  format: (n: number) => string;
}) {
  const pct =
    actual != null && target != null && target > 0
      ? Math.min(100, (actual / target) * 100)
      : 0;
  const display = actual != null ? format(actual) : '—';
  const targetDisplay = target != null ? format(target) : '—';

  return (
    <div className="rounded-2xl bg-bg-card/50 border border-border-soft p-3 md:p-4 flex flex-col items-center text-center">
      <ProgressRing progress={pct} size={88} strokeWidth={6} glow={false}>
        <div className="text-accent">{icon}</div>
        <div className="font-display font-bold text-base text-text mt-1 tabular-nums leading-none">
          {display}
        </div>
      </ProgressRing>
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold mt-2">
        {label}
      </div>
      <div className="text-[10px] text-text-dim font-mono mt-0.5">
        of {targetDisplay}
      </div>
    </div>
  );
}

function SmallTile({
  icon,
  label,
  actual,
  target,
  unit,
}: {
  icon?: React.ReactNode;
  label: string;
  actual?: number | null;
  target: number;
  unit: string;
}) {
  return (
    <div className="rounded-lg bg-bg-card/40 border border-border-soft px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-text-muted font-mono font-bold">
        {icon && <span className="text-accent">{icon}</span>}
        {label}
      </div>
      <div className="mt-1 text-sm tabular-nums">
        {actual != null ? (
          <>
            <span className="font-bold text-text">{actual}</span>
            <span className="text-text-muted font-mono"> / {target} {unit}</span>
          </>
        ) : (
          <span className="text-text-muted font-mono">target {target} {unit}</span>
        )}
      </div>
    </div>
  );
}

function CueCard({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-lg bg-bg-elevated/40 border border-border-soft p-3.5">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent font-bold mb-1.5">
        {label}
      </div>
      <div className="text-sm leading-relaxed whitespace-pre-wrap">{body}</div>
    </div>
  );
}
