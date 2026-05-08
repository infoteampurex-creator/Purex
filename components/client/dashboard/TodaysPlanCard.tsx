'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
  Circle,
  Plus,
  StickyNote,
  Activity,
} from 'lucide-react';
import { ProgressRing } from './ProgressRing';
import { LogActualsModal } from './LogActualsModal';
import { setWorkoutCompleted } from '@/lib/actions/daily-plan';
import { type DailyPlan } from '@/lib/data/daily-plan-types';
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

  const handleToggleComplete = () => {
    if (!plan.workoutId) return;
    startCompletionTransition(async () => {
      await setWorkoutCompleted({
        workoutId: plan.workoutId!,
        completed: !plan.actuals.workoutCompleted,
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
            <button
              onClick={handleToggleComplete}
              disabled={completionPending}
              className={cn(
                'inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-semibold transition-all',
                plan.actuals.workoutCompleted
                  ? 'bg-success text-bg hover:opacity-90'
                  : 'bg-accent text-bg hover:bg-accent-hover',
                completionPending && 'opacity-60 cursor-not-allowed'
              )}
            >
              {plan.actuals.workoutCompleted ? (
                <>
                  <CheckCircle2 size={14} />
                  Completed
                </>
              ) : (
                <>
                  <Circle size={14} />
                  Mark complete
                </>
              )}
            </button>
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
  const hasNumbers =
    exercise.sets != null ||
    exercise.reps != null ||
    exercise.targetWeightKg != null ||
    exercise.restSeconds != null ||
    exercise.tempo != null ||
    exercise.rpeTarget != null;

  return (
    <div className="rounded-lg bg-bg-card/60 border border-border-soft p-3 md:p-3.5">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-7 h-7 rounded-md bg-accent/10 text-accent flex items-center justify-center font-mono text-[11px] font-bold">
          {index}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm leading-tight">
            {exercise.exerciseName}
          </div>
          {exercise.targetMuscle && (
            <div className="text-[11px] text-text-muted font-mono uppercase tracking-[0.1em] mt-0.5">
              {exercise.targetMuscle}
            </div>
          )}

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

          {exercise.trainerInstruction && (
            <div className="text-xs text-text-muted italic mt-2 leading-relaxed">
              {exercise.trainerInstruction}
            </div>
          )}
        </div>
      </div>
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
