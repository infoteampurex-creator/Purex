import 'server-only';
import { getCachedWorkoutTemplates } from './cached-queries';
import { getSheetWorkoutTemplates } from './workout-templates-from-sheet';
import type {
  WorkoutTemplate,
  WorkoutTemplateSummary,
} from './workout-templates-types';

/**
 * Authoritative ids in the DB are UUIDs; Sheet-sourced template ids
 * are admin-typed kebab-case strings. They can't collide in practice,
 * so merging is a straight concat — DB rows first (admin-edited stuff
 * is more recent in the coach's head), then Sheet additions.
 *
 * If we ever DO see a collision (someone names a Sheet template
 * "550e8400-e29b-41d4-a716-446655440000" for fun), the DB row wins
 * because the admin Edit affordance is more useful there.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Heuristic — does this id look like a UUID? Used by apply flow to
 *  route to the right loader. Sheet ids are kebab-case slugs. */
export function isUuidLike(id: string): boolean {
  return UUID_RE.test(id);
}

/** Summary list for picker / admin templates page. */
export async function getMergedWorkoutTemplateSummaries(): Promise<
  WorkoutTemplateSummary[]
> {
  const [dbRows, sheetRows] = await Promise.all([
    getCachedWorkoutTemplates(),
    getSheetWorkoutTemplates(),
  ]);

  const dbIds = new Set(dbRows.map((r) => r.id));
  const sheetSummaries: WorkoutTemplateSummary[] = sheetRows
    .filter((t) => !dbIds.has(t.id))
    .map((t) => ({
      id: t.id,
      name: t.name,
      category: t.category,
      targetMuscleGroup: t.targetMuscleGroup,
      difficulty: t.difficulty,
      exerciseCount: t.exercises.length,
      isShared: t.isShared,
      createdBy: null,
      updatedAt: t.updatedAt,
      source: 'sheet' as const,
    }));

  // DB first (so admin's recent edits stay at the top), Sheet rows
  // appended.
  return [...dbRows, ...sheetSummaries];
}

/**
 * Detail loader — handles both DB and Sheet ids. Returns null when
 * the id matches neither.
 */
export async function getMergedWorkoutTemplateById(
  id: string
): Promise<WorkoutTemplate | null> {
  if (isUuidLike(id)) {
    // Defer to the existing DB loader.
    const { getWorkoutTemplateById } = await import('./workout-templates');
    const dbTemplate = await getWorkoutTemplateById(id);
    if (dbTemplate) {
      return { ...dbTemplate, source: 'db' };
    }
    return null;
  }
  // Sheet path. Pull the full Sheet list and find the match. The
  // Sheet fetch is cached 5 min so the cost is small.
  const sheetTemplates = await getSheetWorkoutTemplates();
  const match = sheetTemplates.find((t) => t.id === id);
  if (!match) return null;
  return { ...match, source: 'sheet' };
}
