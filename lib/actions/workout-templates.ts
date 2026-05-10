'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient, requireAuth } from '@/lib/supabase/server';
import { getWorkoutTemplateById } from '@/lib/data/workout-templates';
import { type WorkoutTemplate } from '@/lib/data/workout-templates-types';

// ─── Read action (callable from client components) ─────────────────────

/**
 * Server-action wrapper around getWorkoutTemplateById so the
 * TemplatesList client component can lazy-load the full template
 * (header + exercises) only when the user clicks Edit.
 */
export async function loadWorkoutTemplate(
  id: string
): Promise<WorkoutTemplate | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  return getWorkoutTemplateById(id);
}

// ─── Shared schemas ────────────────────────────────────────────────────

const optionalText = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (typeof v === 'string' ? v.trim() || null : v ?? null));

const optionalInt = z
  .union([z.number().int(), z.literal('').transform(() => null), z.null()])
  .optional();

const optionalNumber = z
  .union([z.number(), z.literal('').transform(() => null), z.null()])
  .optional();

const exerciseSchema = z.object({
  exerciseName: z.string().min(1).max(200),
  targetMuscle: optionalText,
  sets: optionalInt,
  reps: optionalText,
  targetWeightKg: optionalNumber,
  restSeconds: optionalInt,
  tempo: optionalText,
  rpeTarget: z
    .union([
      z.number().int().min(1).max(10),
      z.literal('').transform(() => null),
      z.null(),
    ])
    .optional(),
  trainerInstruction: optionalText,
});

export type WorkoutTemplateExerciseInput = z.input<typeof exerciseSchema>;

// ─── Action types ──────────────────────────────────────────────────────

export type WorkoutTemplateActionState =
  | { ok: true; templateId?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function fieldErrorsFromZod(err: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  err.issues.forEach((issue) => {
    const key = issue.path.join('.');
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  });
  return fieldErrors;
}

// ─── Create / Update ───────────────────────────────────────────────────

const upsertTemplateSchema = z.object({
  // Provide id to update an existing template; omit to create new.
  id: z.string().uuid().optional(),

  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  category: optionalText,
  targetMuscleGroup: optionalText,
  description: optionalText,
  trainerNotes: optionalText,
  nextDayInstructions: optionalText,
  estimatedDurationMinutes: optionalInt,
  difficulty: z
    .enum(['beginner', 'intermediate', 'advanced'])
    .nullable()
    .optional(),
  isShared: z.boolean().optional(),
  exercises: z.array(exerciseSchema),
});

export type UpsertWorkoutTemplateInput = z.input<typeof upsertTemplateSchema>;

/**
 * Create or update a workout template plus its child exercises.
 * Children are replaced wholesale (delete all by template_id then
 * bulk-insert new list). Same delete-then-insert strategy as
 * client_workout_exercises in upsertDailyPlan — keeps it simple.
 */
export async function upsertWorkoutTemplate(
  input: UpsertWorkoutTemplateInput
): Promise<WorkoutTemplateActionState> {
  const adminUser = await requireAuth({ adminOnly: true });
  if (!adminUser) {
    return { ok: false, error: 'Not authorised. Admin access required.' };
  }

  const parsed = upsertTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Please fix the highlighted fields.',
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const headerPayload = {
    name: data.name,
    category: data.category,
    target_muscle_group: data.targetMuscleGroup,
    description: data.description,
    trainer_notes: data.trainerNotes,
    next_day_instructions: data.nextDayInstructions,
    estimated_duration_minutes: data.estimatedDurationMinutes ?? null,
    difficulty: data.difficulty ?? null,
    is_shared: data.isShared ?? true,
    created_by: adminUser.id,
  };

  let templateId = data.id;

  if (templateId) {
    const { error: updateError } = await supabase
      .from('workout_templates')
      .update(headerPayload)
      .eq('id', templateId);
    if (updateError) {
      console.error('[upsertWorkoutTemplate] update failed:', updateError);
      return { ok: false, error: updateError.message };
    }
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from('workout_templates')
      .insert(headerPayload)
      .select('id')
      .single();
    if (insertError || !inserted) {
      console.error('[upsertWorkoutTemplate] insert failed:', insertError);
      return {
        ok: false,
        error: insertError?.message ?? 'Could not create the template.',
      };
    }
    templateId = inserted.id;
  }

  // Replace exercises wholesale.
  const { error: deleteErr } = await supabase
    .from('workout_template_exercises')
    .delete()
    .eq('template_id', templateId);
  if (deleteErr) {
    console.error('[upsertWorkoutTemplate] exercise delete failed:', deleteErr);
    return { ok: false, error: deleteErr.message };
  }

  if (data.exercises.length > 0) {
    const rows = data.exercises.map((ex, idx) => ({
      template_id: templateId,
      exercise_name: ex.exerciseName,
      target_muscle: ex.targetMuscle ?? null,
      sets: ex.sets ?? null,
      reps: ex.reps ?? null,
      target_weight_kg: ex.targetWeightKg ?? null,
      rest_seconds: ex.restSeconds ?? null,
      tempo: ex.tempo ?? null,
      rpe_target: ex.rpeTarget ?? null,
      trainer_instruction: ex.trainerInstruction ?? null,
      exercise_order: idx,
    }));
    const { error: insertErr } = await supabase
      .from('workout_template_exercises')
      .insert(rows);
    if (insertErr) {
      console.error('[upsertWorkoutTemplate] exercise insert failed:', insertErr);
      return { ok: false, error: insertErr.message };
    }
  }

  revalidatePath('/admin/templates');
  revalidatePath('/admin/clients');

  return { ok: true, templateId };
}

// ─── Delete ────────────────────────────────────────────────────────────

const deleteTemplateSchema = z.object({
  id: z.string().uuid(),
});

export async function deleteWorkoutTemplate(
  input: z.infer<typeof deleteTemplateSchema>
): Promise<WorkoutTemplateActionState> {
  const adminUser = await requireAuth({ adminOnly: true });
  if (!adminUser) {
    return { ok: false, error: 'Not authorised. Admin access required.' };
  }

  const parsed = deleteTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('workout_templates')
    .delete()
    .eq('id', parsed.data.id);

  if (error) {
    console.error('[deleteWorkoutTemplate] failed:', error);
    return { ok: false, error: error.message };
  }

  revalidatePath('/admin/templates');
  return { ok: true };
}

// ─── Apply template to a client's day ──────────────────────────────────

const applyTemplateSchema = z.object({
  templateId: z.string().uuid(),
  clientId: z.string().uuid(),
  planDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * Copy a template into client_workouts + client_workout_exercises for a
 * given (client_id, plan_date). If a workout already exists for that
 * day, it's replaced. The template itself is untouched.
 *
 * Daily-log targets are NOT touched here — the trainer can set those
 * separately in the daily plan modal.
 */
export async function applyTemplateToClient(
  input: z.infer<typeof applyTemplateSchema>
): Promise<WorkoutTemplateActionState> {
  const adminUser = await requireAuth({ adminOnly: true });
  if (!adminUser) {
    return { ok: false, error: 'Not authorised. Admin access required.' };
  }

  const parsed = applyTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }

  const { templateId, clientId, planDate } = parsed.data;
  const supabase = await createClient();

  // 1. Load template header + exercises.
  const { data: template, error: templateErr } = await supabase
    .from('workout_templates')
    .select(
      'id, name, category, target_muscle_group, trainer_notes, next_day_instructions'
    )
    .eq('id', templateId)
    .maybeSingle();

  if (templateErr || !template) {
    return {
      ok: false,
      error: templateErr?.message ?? 'Template not found.',
    };
  }

  const { data: templateExercises, error: exercisesErr } = await supabase
    .from('workout_template_exercises')
    .select(
      'exercise_name, target_muscle, sets, reps, target_weight_kg, rest_seconds, tempo, rpe_target, trainer_instruction, exercise_order'
    )
    .eq('template_id', templateId)
    .order('exercise_order', { ascending: true });

  if (exercisesErr) {
    return { ok: false, error: exercisesErr.message };
  }

  // 2. Upsert workout row for (client_id, plan_date). Same logic as
  //    upsertDailyPlan: lookup, then update or insert.
  const { data: existingRows, error: lookupError } = await supabase
    .from('client_workouts')
    .select('id')
    .eq('client_id', clientId)
    .eq('workout_date', planDate)
    .order('created_at', { ascending: true })
    .limit(1);

  if (lookupError) {
    return { ok: false, error: lookupError.message };
  }

  const existingId = existingRows?.[0]?.id as string | undefined;
  const t = template as {
    name: string | null;
    category: string | null;
    target_muscle_group: string | null;
    trainer_notes: string | null;
    next_day_instructions: string | null;
  };
  const workoutPayload = {
    client_id: clientId,
    trainer_id: adminUser.id,
    workout_date: planDate,
    name: t.name ?? 'Daily plan',
    category: t.category,
    target_muscle_group: t.target_muscle_group,
    trainer_notes: t.trainer_notes,
    next_day_instructions: t.next_day_instructions,
  };

  let workoutId: string;
  if (existingId) {
    const { error: updateErr } = await supabase
      .from('client_workouts')
      .update(workoutPayload)
      .eq('id', existingId);
    if (updateErr) return { ok: false, error: updateErr.message };
    workoutId = existingId;
  } else {
    const { data: inserted, error: insertErr } = await supabase
      .from('client_workouts')
      .insert(workoutPayload)
      .select('id')
      .single();
    if (insertErr || !inserted) {
      return {
        ok: false,
        error: insertErr?.message ?? 'Could not create the workout.',
      };
    }
    workoutId = inserted.id;
  }

  // 3. Replace planned exercises for this workout.
  const { error: deleteExistingExercisesErr } = await supabase
    .from('client_workout_exercises')
    .delete()
    .eq('workout_id', workoutId);
  if (deleteExistingExercisesErr) {
    return { ok: false, error: deleteExistingExercisesErr.message };
  }

  if ((templateExercises ?? []).length > 0) {
    interface TplExerciseRow {
      exercise_name: string;
      target_muscle: string | null;
      sets: number | null;
      reps: string | null;
      target_weight_kg: number | null;
      rest_seconds: number | null;
      tempo: string | null;
      rpe_target: number | null;
      trainer_instruction: string | null;
      exercise_order: number;
    }
    const rows = (templateExercises as TplExerciseRow[]).map((ex) => ({
      workout_id: workoutId,
      exercise_name: ex.exercise_name,
      target_muscle: ex.target_muscle,
      sets: ex.sets,
      reps: ex.reps,
      target_weight_kg: ex.target_weight_kg,
      rest_seconds: ex.rest_seconds,
      tempo: ex.tempo,
      rpe_target: ex.rpe_target,
      trainer_instruction: ex.trainer_instruction,
      exercise_order: ex.exercise_order,
    }));
    const { error: insertExercisesErr } = await supabase
      .from('client_workout_exercises')
      .insert(rows);
    if (insertExercisesErr) {
      return { ok: false, error: insertExercisesErr.message };
    }
  }

  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath('/client/dashboard');

  return { ok: true };
}
