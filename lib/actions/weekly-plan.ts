'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// ─── Validation ─────────────────────────────────────────────────

const daySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  workoutTemplateId: z.string().uuid().nullable(),
  overrideNotes: z.string().max(500).nullable(),
});

const setPlanSchema = z.object({
  clientId: z.string().uuid(),
  name: z.string().max(120).nullable().optional(),
  materializeWeeks: z.number().int().min(1).max(12).default(4),
  days: z.array(daySchema).length(7),
});

export type SetWeeklyPlanInput = z.infer<typeof setPlanSchema>;

export type SetWeeklyPlanResult =
  | { ok: true; rowsWritten: number; rowsSkipped: number }
  | { ok: false; error: string };

// ─── setClientWeeklyPlan ────────────────────────────────────────

/**
 * Save a client's weekly plan AND materialize the next N weeks of
 * client_workouts from it.
 *
 * Edit semantics:
 *   - PAST dates and TODAY are NEVER overwritten — the client may
 *     already be mid-session today, and history must stay locked.
 *   - For dates strictly in the future:
 *       * If a client_workouts row already exists for that date AND
 *         the row has `completion_status` set OR has any
 *         client_workout_exercise_logs (i.e. the client has logged
 *         actuals), we SKIP it — protect logged data.
 *       * Otherwise, we delete the existing row and insert the new
 *         one materialized from the template.
 *
 * Returns rowsWritten + rowsSkipped so the UI can show "12 days
 * scheduled · 2 days kept (already logged)".
 *
 * Admin-only. RLS also enforces.
 */
export async function setClientWeeklyPlan(
  input: SetWeeklyPlanInput
): Promise<SetWeeklyPlanResult> {
  const parsed = setPlanSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const data = parsed.data;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: 'Not signed in' };

    // Role check (RLS also enforces)
    const { data: roleRow } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    const role = roleRow?.role ?? 'user';
    if (role !== 'admin' && role !== 'super_admin') {
      return { ok: false, error: 'Only coaches can edit weekly plans.' };
    }

    // ─── 1. Upsert the plan header ─────────────────────────────
    const { error: headErr } = await supabase
      .from('client_weekly_plan')
      .upsert(
        {
          client_id: data.clientId,
          name: data.name ?? null,
          materialize_weeks: data.materializeWeeks,
          updated_by: user.id,
        },
        { onConflict: 'client_id' }
      );
    if (headErr) {
      return { ok: false, error: `Header save failed: ${headErr.message}` };
    }

    // ─── 2. Replace the 7 day-slot rows ────────────────────────
    // Delete-then-insert is fine — small data, no FK reverse refs
    const { error: delDaysErr } = await supabase
      .from('client_weekly_plan_days')
      .delete()
      .eq('client_id', data.clientId);
    if (delDaysErr) {
      return { ok: false, error: `Day reset failed: ${delDaysErr.message}` };
    }

    const dayRows = data.days.map((d) => ({
      client_id: data.clientId,
      day_of_week: d.dayOfWeek,
      workout_template_id: d.workoutTemplateId,
      override_notes: d.overrideNotes,
    }));
    if (dayRows.length > 0) {
      const { error: insDaysErr } = await supabase
        .from('client_weekly_plan_days')
        .insert(dayRows);
      if (insDaysErr) {
        return { ok: false, error: `Day insert failed: ${insDaysErr.message}` };
      }
    }

    // ─── 3. Materialize the next N weeks of client_workouts ────
    const m = await materializeForwardWeeks({
      clientId: data.clientId,
      plan: data.days,
      weeks: data.materializeWeeks,
    });
    if (!m.ok) return { ok: false, error: m.error };

    revalidatePath(`/admin/clients/${data.clientId}`);
    revalidatePath('/client/dashboard');
    revalidatePath('/client/plan');

    return { ok: true, rowsWritten: m.rowsWritten, rowsSkipped: m.rowsSkipped };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Plan save failed',
    };
  }
}

// ─── Materialization helper ─────────────────────────────────────

/**
 * Generate (or rewrite) future client_workouts rows from a weekly
 * plan. Protects logged data; only future-dated rows are touched.
 *
 * For each future date in the window, if the plan has a workout
 * template for that day-of-week:
 *   - Read the template (name, category, focus, target_muscle_group,
 *     trainer_notes, next_day_instructions) and the template's
 *     exercises.
 *   - If an existing client_workouts row for the date has actuals
 *     logged, SKIP.
 *   - Else, delete the existing row + its planned exercises (cascade)
 *     and insert a new workout + its planned exercises from the
 *     template.
 *
 * If the plan day has no template (rest day), we leave the date alone
 * — no row is created. Coach can still add a one-off workout for
 * that date via the existing daily-plan editor.
 */
async function materializeForwardWeeks(args: {
  clientId: string;
  plan: Array<{
    dayOfWeek: number;
    workoutTemplateId: string | null;
    overrideNotes: string | null;
  }>;
  weeks: number;
}): Promise<
  | { ok: true; rowsWritten: number; rowsSkipped: number }
  | { ok: false; error: string }
> {
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build set of future dates in the window grouped by their day-of-week
  type DateBucket = {
    dateIso: string;
    dayOfWeek: number;
    templateId: string;
    overrideNotes: string | null;
  };
  const buckets: DateBucket[] = [];

  // Tomorrow → today + 7 * weeks - 1 days
  for (let dayOffset = 1; dayOffset <= 7 * args.weeks; dayOffset++) {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + dayOffset);
    const dow = (dt.getDay() + 6) % 7; // JS Sun=0; convert to Mon=0
    const planDay = args.plan.find((d) => d.dayOfWeek === dow);
    if (!planDay || !planDay.workoutTemplateId) continue;
    buckets.push({
      dateIso: dt.toISOString().slice(0, 10),
      dayOfWeek: dow,
      templateId: planDay.workoutTemplateId,
      overrideNotes: planDay.overrideNotes,
    });
  }

  if (buckets.length === 0) {
    return { ok: true, rowsWritten: 0, rowsSkipped: 0 };
  }

  // Pre-fetch unique templates + their exercises
  const uniqueTemplateIds = Array.from(new Set(buckets.map((b) => b.templateId)));
  const { data: templateRows, error: tplErr } = await supabase
    .from('workout_templates')
    .select(
      'id, name, category, target_muscle_group, description, trainer_notes, estimated_duration_minutes'
    )
    .in('id', uniqueTemplateIds);
  if (tplErr) return { ok: false, error: `Template fetch failed: ${tplErr.message}` };

  const { data: tmplExRows, error: exErr } = await supabase
    .from('workout_template_exercises')
    .select(
      'template_id, exercise_name, target_muscle, exercise_library_id, sets, reps, target_weight_kg, rest_seconds, tempo, rpe_target, trainer_instruction, exercise_order'
    )
    .in('template_id', uniqueTemplateIds)
    .order('exercise_order', { ascending: true });
  if (exErr) return { ok: false, error: `Template exercises fetch failed: ${exErr.message}` };

  type TemplateRow = {
    id: string;
    name: string;
    category: string | null;
    target_muscle_group: string | null;
    description: string | null;
    trainer_notes: string | null;
    estimated_duration_minutes: number | null;
  };
  type TmplExRow = {
    template_id: string;
    exercise_name: string;
    target_muscle: string | null;
    exercise_library_id: string | null;
    sets: number | null;
    reps: string | null;
    target_weight_kg: number | null;
    rest_seconds: number | null;
    tempo: string | null;
    rpe_target: number | null;
    trainer_instruction: string | null;
    exercise_order: number | null;
  };
  const tplById = new Map<string, TemplateRow>(
    (templateRows ?? []).map((r) => [r.id, r as TemplateRow])
  );
  const exByTpl = new Map<string, TmplExRow[]>();
  for (const ex of (tmplExRows ?? []) as TmplExRow[]) {
    if (!exByTpl.has(ex.template_id)) exByTpl.set(ex.template_id, []);
    exByTpl.get(ex.template_id)!.push(ex);
  }

  // Pull existing future client_workouts in the date window + their
  // completion + actuals (to decide skip vs replace)
  const minIso = buckets[0]?.dateIso ?? '';
  const maxIso = buckets[buckets.length - 1]?.dateIso ?? '';
  const { data: existingRows, error: existErr } = await supabase
    .from('client_workouts')
    .select('id, workout_date, completion_status, completed')
    .eq('client_id', args.clientId)
    .gte('workout_date', minIso)
    .lte('workout_date', maxIso);
  if (existErr)
    return { ok: false, error: `Existing fetch failed: ${existErr.message}` };

  type ExistingRow = {
    id: string;
    workout_date: string;
    completion_status: string | null;
    completed: boolean | null;
  };
  const existing = (existingRows ?? []) as ExistingRow[];

  // Check which existing workouts have logged actuals (set_breakdown rows)
  const existingIds = existing.map((r) => r.id);
  let actualsByWorkoutDate = new Set<string>();
  if (existingIds.length > 0) {
    // Get planned exercise IDs for these workouts so we can check logs
    const { data: plannedEx } = await supabase
      .from('client_workout_exercises')
      .select('id, workout_id')
      .in('workout_id', existingIds);
    if (plannedEx && plannedEx.length > 0) {
      const plannedIds = plannedEx.map((p) => p.id);
      const workoutByEx = new Map(
        plannedEx.map((p) => [p.id, p.workout_id as string])
      );
      const { data: logs } = await supabase
        .from('client_workout_exercise_logs')
        .select('planned_exercise_id')
        .in('planned_exercise_id', plannedIds);
      for (const l of logs ?? []) {
        const wid = workoutByEx.get(l.planned_exercise_id as string);
        if (!wid) continue;
        const row = existing.find((e) => e.id === wid);
        if (row) actualsByWorkoutDate.add(row.workout_date);
      }
    }
  }

  // Walk buckets and decide skip / replace / insert
  let rowsWritten = 0;
  let rowsSkipped = 0;
  for (const b of buckets) {
    const prev = existing.find((r) => r.workout_date === b.dateIso);
    const isLocked =
      prev &&
      ((prev.completion_status && prev.completion_status !== null) ||
        prev.completed === true ||
        actualsByWorkoutDate.has(b.dateIso));
    if (isLocked) {
      rowsSkipped++;
      continue;
    }

    const tpl = tplById.get(b.templateId);
    if (!tpl) continue;

    // Delete previous row if any (planned exercises cascade)
    if (prev) {
      const { error: delErr } = await supabase
        .from('client_workouts')
        .delete()
        .eq('id', prev.id);
      if (delErr) {
        // eslint-disable-next-line no-console
        console.error('[weekly-plan] delete prev row failed', delErr);
        continue;
      }
    }

    // Insert new workout row
    const { data: inserted, error: insErr } = await supabase
      .from('client_workouts')
      .insert({
        client_id: args.clientId,
        workout_date: b.dateIso,
        name: tpl.name,
        category: tpl.category,
        target_muscle_group: tpl.target_muscle_group,
        description: tpl.description,
        trainer_notes: b.overrideNotes ?? tpl.trainer_notes,
        duration_minutes: tpl.estimated_duration_minutes,
      })
      .select('id')
      .single();
    if (insErr || !inserted) {
      // eslint-disable-next-line no-console
      console.error('[weekly-plan] insert workout failed', insErr);
      continue;
    }

    // Insert planned exercises from template
    const tplExercises = exByTpl.get(b.templateId) ?? [];
    if (tplExercises.length > 0) {
      const { error: exInsErr } = await supabase
        .from('client_workout_exercises')
        .insert(
          tplExercises.map((ex) => ({
            workout_id: inserted.id,
            exercise_name: ex.exercise_name,
            target_muscle: ex.target_muscle,
            exercise_library_id: ex.exercise_library_id,
            sets: ex.sets,
            reps: ex.reps,
            target_weight_kg: ex.target_weight_kg,
            rest_seconds: ex.rest_seconds,
            tempo: ex.tempo,
            rpe_target: ex.rpe_target,
            trainer_instruction: ex.trainer_instruction,
            exercise_order: ex.exercise_order ?? 0,
          }))
        );
      if (exInsErr) {
        // eslint-disable-next-line no-console
        console.error('[weekly-plan] insert exercises failed', exInsErr);
      }
    }

    rowsWritten++;
  }

  return { ok: true, rowsWritten, rowsSkipped };
}
