import 'server-only';
import { unstable_cache } from 'next/cache';
import { searchExercises } from '@/lib/data/exercise-library';
import { getWorkoutTemplates } from '@/lib/data/workout-templates';

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
 * Cache invalidation:
 *   - Exercise library: time-based only (1 hour). The library has no
 *     admin UI today, so no event-based invalidation is needed.
 *   - Workout templates: tag-based. Mutations call
 *     revalidateTag('workout-templates') so the next read repopulates.
 */

const ONE_HOUR = 60 * 60;
const FIVE_MIN = 5 * 60;

/** Pull all active exercises (limit 200) — what the picker needs. */
export const getCachedActiveExerciseLibrary = unstable_cache(
  async () => searchExercises({ limit: 200 }),
  ['exercise-library:active:200'],
  {
    revalidate: ONE_HOUR,
    tags: ['exercise-library'],
  }
);

/** List of saved workout templates with summary fields. */
export const getCachedWorkoutTemplates = unstable_cache(
  async () => getWorkoutTemplates(),
  ['workout-templates:summary'],
  {
    revalidate: FIVE_MIN,
    tags: ['workout-templates'],
  }
);
