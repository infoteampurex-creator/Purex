import 'server-only';
import { unstable_cache } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ExerciseLibraryEntry } from '@/lib/types/exercise';
import type { WorkoutTemplateSummary } from '@/lib/data/workout-templates-types';

/**
 * Cached, request-shared wrappers around the heavy admin lookups.
 *
 * Both pages that load the EditDailyPlanModal (admin client detail and
 * /admin/templates) fire two non-trivial reads on every navigation —
 * the exercise library (~25 rows × full row payload) and the
 * workout-templates list (with per-template exercise counts). Neither
 * is client-specific, and the data churn is low, so memoising the
 * results across requests is a big saving in practice — it removes
 * those reads from the per-navigation critical path.
 *
 * NOTE: these run inside `unstable_cache`, which forbids accessing
 * cookies (or any dynamic data source). The auth-aware
 * `createClient()` reads cookies, so we use the service-role
 * `createAdminClient()` here instead — both data sets are admin-
 * scoped and protected at the route level, so bypassing RLS for the
 * cache is safe.
 *
 * Cache invalidation:
 *   - Exercise library: time-based only (1 hour). The library has no
 *     admin UI today, so no event-based invalidation is needed.
 *   - Workout templates: tag-based. Mutations call
 *     revalidateTag('workout-templates') so the next read repopulates.
 */

const ONE_HOUR = 60 * 60;
const FIVE_MIN = 5 * 60;

const EXERCISE_LIBRARY_COLS =
  `id, slug, name, alternate_names, category, exercise_type,
   movement_pattern, primary_equipment, secondary_equipment,
   equipment_alternatives, difficulty, technical_demand_1_5,
   cardio_demand_1_5, calories_per_minute_estimate, default_sets,
   default_reps, default_rest_seconds, thumbnail_url, animation_url,
   video_url, diagram_url, description, instructions, setup_cues,
   execution_cues, common_mistakes, trainer_tips, mobility_requirements,
   is_hyrox_event, is_hybrid_signature, is_active`;

/** Pull all active exercises (limit 200) — what the picker needs. */
export const getCachedActiveExerciseLibrary = unstable_cache(
  async (): Promise<ExerciseLibraryEntry[]> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('exercise_library')
      .select(EXERCISE_LIBRARY_COLS)
      .eq('is_active', true)
      .order('name', { ascending: true })
      .limit(200);
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[PURE X] cached exercise library read failed:', error);
      return [];
    }
    return (data ?? []) as unknown as ExerciseLibraryEntry[];
  },
  ['exercise-library:active:200'],
  {
    revalidate: ONE_HOUR,
    tags: ['exercise-library'],
  }
);

/** List of saved workout templates with summary fields. */
export const getCachedWorkoutTemplates = unstable_cache(
  async (): Promise<WorkoutTemplateSummary[]> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('workout_templates')
      .select(
        'id, name, slug, description, category, difficulty, estimated_duration_minutes, exercise_count, is_active, created_at, updated_at'
      )
      .eq('is_active', true)
      .order('updated_at', { ascending: false });
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[PURE X] cached workout templates read failed:', error);
      return [];
    }
    return (data ?? []) as unknown as WorkoutTemplateSummary[];
  },
  ['workout-templates:summary'],
  {
    revalidate: FIVE_MIN,
    tags: ['workout-templates'],
  }
);
