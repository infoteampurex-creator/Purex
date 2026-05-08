'use server';

import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type {
  ExerciseLibraryEntry,
  ExerciseWithDetails,
  ExerciseMuscle,
  ExerciseAlternative,
  ExerciseSearchParams,
} from '@/lib/types/exercise';

/**
 * Search the exercise library.
 *
 * Used by the trainer Daily Entry Form (Phase 3B) for autocomplete.
 * Combines free-text search with optional category/equipment filters.
 *
 * Returns lightweight entries by default. To get full details (muscles +
 * alternatives), use getExerciseBySlug() instead.
 */
export async function searchExercises(
  params: ExerciseSearchParams = {}
): Promise<ExerciseLibraryEntry[]> {
  const { q, category, exerciseType, difficulty, equipment, isHyroxEvent, isHybridSignature } = params;
  const limit = Math.min(params.limit ?? 25, 100);

  try {
    const supabase = await createClient();

    let query = supabase
      .from('exercise_library')
      .select(
        `id, slug, name, alternate_names, category, exercise_type,
         movement_pattern, primary_equipment, secondary_equipment,
         equipment_alternatives, difficulty, technical_demand_1_5,
         cardio_demand_1_5, calories_per_minute_estimate, default_sets,
         default_reps, default_rest_seconds, thumbnail_url, animation_url,
         video_url, diagram_url, description, instructions, setup_cues,
         execution_cues, common_mistakes, trainer_tips, mobility_requirements,
         contraindications, is_hyrox_event, is_hybrid_signature, is_active,
         created_at, updated_at`
      )
      .eq('is_active', true);

    // Free-text search across name + alternate names + description
    if (q && q.trim().length > 0) {
      const term = q.trim();
      // Use ilike for prefix matching, broader than full-text for short queries
      query = query.or(
        `name.ilike.%${term}%,description.ilike.%${term}%,alternate_names.cs.{${term}}`
      );
    }

    if (category) query = query.eq('category', category);
    if (exerciseType) query = query.eq('exercise_type', exerciseType);
    if (difficulty) query = query.eq('difficulty', difficulty);
    if (equipment) query = query.eq('primary_equipment', equipment);
    if (typeof isHyroxEvent === 'boolean') {
      query = query.eq('is_hyrox_event', isHyroxEvent);
    }
    if (typeof isHybridSignature === 'boolean') {
      query = query.eq('is_hybrid_signature', isHybridSignature);
    }

    const { data: rows, error } = await query
      .order('name', { ascending: true })
      .limit(limit);

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[PURE X] searchExercises failed:', error);
      return [];
    }

    return (rows ?? []).map(rowToEntry);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[PURE X] searchExercises threw:', err);
    return [];
  }
}

/**
 * Fetch a single exercise by slug, with all muscle mappings + alternatives.
 * Used by the exercise detail modal.
 */
export async function getExerciseBySlug(
  slug: string
): Promise<ExerciseWithDetails | null> {
  if (!slug) return null;

  try {
    const supabase = await createClient();

    const { data: row, error } = await supabase
      .from('exercise_library')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !row) return null;

    const exercise = rowToEntry(row);

    // Pull muscles + alternatives in parallel
    const [musclesRes, altsRes] = await Promise.all([
      supabase
        .from('exercise_muscles')
        .select('*')
        .eq('exercise_id', exercise.id),
      supabase
        .from('exercise_alternatives')
        .select('*')
        .eq('exercise_id', exercise.id),
    ]);

    const muscles: ExerciseMuscle[] = (musclesRes.data ?? []).map((m) => ({
      id: m.id,
      exerciseId: m.exercise_id,
      muscle: m.muscle,
      role: m.role,
      intensity: m.intensity_1_5,
    }));

    const alternatives: ExerciseAlternative[] = (altsRes.data ?? []).map((a) => ({
      id: a.id,
      exerciseId: a.exercise_id,
      alternativeExerciseId: a.alternative_exercise_id,
      reason: a.reason ?? null,
      notes: a.notes ?? null,
    }));

    return { ...exercise, muscles, alternatives };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[PURE X] getExerciseBySlug threw:', err);
    return null;
  }
}

/**
 * Get all exercises in a specific category — useful for category browsing
 * panels in the trainer entry form.
 */
export async function getExercisesByCategory(
  category: string,
  limit = 50
): Promise<ExerciseLibraryEntry[]> {
  return searchExercises({
    category: category as ExerciseSearchParams['category'],
    limit,
  });
}

// ════════════════════════════════════════════════════════════════════
// Mapping helpers
// ════════════════════════════════════════════════════════════════════

interface RawExerciseRow {
  id: string;
  slug: string;
  name: string;
  alternate_names: string[] | null;
  category: string;
  exercise_type: string;
  movement_pattern: string | null;
  primary_equipment: string | null;
  secondary_equipment: string[] | null;
  equipment_alternatives: string[] | null;
  difficulty: string;
  technical_demand_1_5: number;
  cardio_demand_1_5: number;
  calories_per_minute_estimate: number | null;
  default_sets: string;
  default_reps: string;
  default_rest_seconds: number;
  thumbnail_url: string | null;
  animation_url: string | null;
  video_url: string | null;
  diagram_url: string | null;
  description: string | null;
  instructions: string[] | null;
  setup_cues: string[] | null;
  execution_cues: string[] | null;
  common_mistakes: string[] | null;
  trainer_tips: string[] | null;
  mobility_requirements: string[] | null;
  contraindications: string[] | null;
  is_hyrox_event: boolean;
  is_hybrid_signature: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function rowToEntry(r: RawExerciseRow): ExerciseLibraryEntry {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    alternateNames: r.alternate_names ?? [],
    category: r.category as ExerciseLibraryEntry['category'],
    exerciseType: r.exercise_type as ExerciseLibraryEntry['exerciseType'],
    movementPattern: (r.movement_pattern as ExerciseLibraryEntry['movementPattern']) ?? null,
    primaryEquipment: r.primary_equipment ?? null,
    secondaryEquipment: r.secondary_equipment ?? [],
    equipmentAlternatives: r.equipment_alternatives ?? [],
    difficulty: r.difficulty as ExerciseLibraryEntry['difficulty'],
    technicalDemand: r.technical_demand_1_5,
    cardioDemand: r.cardio_demand_1_5,
    caloriesPerMinuteEstimate: r.calories_per_minute_estimate ?? null,
    defaultSets: r.default_sets,
    defaultReps: r.default_reps,
    defaultRestSeconds: r.default_rest_seconds,
    thumbnailUrl: r.thumbnail_url ?? null,
    animationUrl: r.animation_url ?? null,
    videoUrl: r.video_url ?? null,
    diagramUrl: r.diagram_url ?? null,
    description: r.description ?? null,
    instructions: r.instructions ?? [],
    setupCues: r.setup_cues ?? [],
    executionCues: r.execution_cues ?? [],
    commonMistakes: r.common_mistakes ?? [],
    trainerTips: r.trainer_tips ?? [],
    mobilityRequirements: r.mobility_requirements ?? [],
    contraindications: r.contraindications ?? [],
    isHyroxEvent: r.is_hyrox_event,
    isHybridSignature: r.is_hybrid_signature,
    isActive: r.is_active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
