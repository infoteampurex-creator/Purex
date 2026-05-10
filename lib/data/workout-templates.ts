import 'server-only';
import { createClient } from '@/lib/supabase/server';
import {
  type WorkoutTemplate,
  type WorkoutTemplateExercise,
  type WorkoutTemplateSummary,
} from '@/lib/data/workout-templates-types';

interface TemplateRow {
  id: string;
  name: string;
  category: string | null;
  target_muscle_group: string | null;
  description: string | null;
  trainer_notes: string | null;
  next_day_instructions: string | null;
  estimated_duration_minutes: number | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
  is_shared: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface TemplateExerciseRow {
  id: string;
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

function rowToExercise(r: TemplateExerciseRow): WorkoutTemplateExercise {
  return {
    id: r.id,
    exerciseName: r.exercise_name,
    targetMuscle: r.target_muscle,
    sets: r.sets,
    reps: r.reps,
    targetWeightKg: r.target_weight_kg,
    restSeconds: r.rest_seconds,
    tempo: r.tempo,
    rpeTarget: r.rpe_target,
    trainerInstruction: r.trainer_instruction,
    exerciseOrder: r.exercise_order,
  };
}

/**
 * List templates with a quick exercise count for the management page
 * and the apply-template dropdown. Excludes inactive templates by
 * default.
 */
export async function getWorkoutTemplates(): Promise<WorkoutTemplateSummary[]> {
  try {
    const supabase = await createClient();

    const { data: templates, error } = await supabase
      .from('workout_templates')
      .select(
        'id, name, category, target_muscle_group, difficulty, is_shared, created_by, updated_at'
      )
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (error || !templates) return [];

    const ids = (templates as { id: string }[]).map((t) => t.id);
    const counts = new Map<string, number>();

    if (ids.length > 0) {
      const { data: exerciseRows } = await supabase
        .from('workout_template_exercises')
        .select('template_id')
        .in('template_id', ids);

      (exerciseRows ?? []).forEach((row) => {
        const r = row as { template_id: string };
        counts.set(r.template_id, (counts.get(r.template_id) ?? 0) + 1);
      });
    }

    return (templates as Array<Omit<TemplateRow, 'description' | 'trainer_notes' | 'next_day_instructions' | 'estimated_duration_minutes' | 'is_active' | 'created_at'>>).map(
      (t) => ({
        id: t.id,
        name: t.name,
        category: t.category,
        targetMuscleGroup: t.target_muscle_group,
        difficulty: t.difficulty,
        exerciseCount: counts.get(t.id) ?? 0,
        isShared: t.is_shared,
        createdBy: t.created_by,
        updatedAt: t.updated_at,
      })
    );
  } catch {
    return [];
  }
}

/** Full template by id, including child exercises in order. */
export async function getWorkoutTemplateById(
  id: string
): Promise<WorkoutTemplate | null> {
  try {
    const supabase = await createClient();

    const [{ data: header }, { data: exercises }] = await Promise.all([
      supabase
        .from('workout_templates')
        .select(
          'id, name, category, target_muscle_group, description, trainer_notes, next_day_instructions, estimated_duration_minutes, difficulty, is_shared, is_active, created_by, created_at, updated_at'
        )
        .eq('id', id)
        .maybeSingle(),
      supabase
        .from('workout_template_exercises')
        .select(
          'id, exercise_name, target_muscle, sets, reps, target_weight_kg, rest_seconds, tempo, rpe_target, trainer_instruction, exercise_order'
        )
        .eq('template_id', id)
        .order('exercise_order', { ascending: true }),
    ]);

    if (!header) return null;
    const h = header as TemplateRow;

    return {
      id: h.id,
      name: h.name,
      category: h.category,
      targetMuscleGroup: h.target_muscle_group,
      description: h.description,
      trainerNotes: h.trainer_notes,
      nextDayInstructions: h.next_day_instructions,
      estimatedDurationMinutes: h.estimated_duration_minutes,
      difficulty: h.difficulty,
      isShared: h.is_shared,
      isActive: h.is_active,
      createdBy: h.created_by,
      createdAt: h.created_at,
      updatedAt: h.updated_at,
      exercises: ((exercises ?? []) as TemplateExerciseRow[]).map(rowToExercise),
    };
  } catch {
    return null;
  }
}
