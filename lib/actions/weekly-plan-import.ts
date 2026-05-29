'use server';

import { z } from 'zod';
import { revalidatePath, updateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  parsePastedWeeklyPlan,
  pickBestMatch,
  MATCH_THRESHOLD,
  suggestTemplateName,
  type MatchedWeek,
  type MatchedDay,
  type MatchedExercise,
} from '@/lib/data/weekly-plan-paste';

// ─── previewPastedWeeklyPlan ────────────────────────────────────

/**
 * Parse a free-text weekly plan and fuzzy-match each exercise line
 * against the active exercise library. No DB writes — this is the
 * "show me what you understood" preview step. The coach reviews
 * matched/unmatched lines, optionally tweaks the textarea, and only
 * commits via `importPastedWeeklyPlan` when satisfied.
 *
 * Returns matched defaults pulled from library (sets/reps/rest) so the
 * eventual templates are immediately usable. Unmatched lines surface
 * with libraryId=null + confidence score so the UI can flag them in
 * red ("you typed X — no library match found").
 */
export async function previewPastedWeeklyPlan(text: string): Promise<
  | { ok: true; week: MatchedWeek }
  | { ok: false; error: string }
> {
  if (!text || text.trim().length === 0) {
    return { ok: false, error: 'Paste some text first.' };
  }

  const parsed = parsePastedWeeklyPlan(text);

  try {
    const supabase = await createClient();
    const { data: libRows, error: libErr } = await supabase
      .from('exercise_library')
      .select(
        'id, name, alternate_names, category, default_sets, default_reps, default_rest_seconds'
      )
      .eq('is_active', true)
      .limit(500);

    if (libErr) {
      return { ok: false, error: `Library load failed: ${libErr.message}` };
    }

    type LibRow = {
      id: string;
      name: string;
      alternate_names: string[] | null;
      category: string;
      default_sets: string | null;
      default_reps: string | null;
      default_rest_seconds: number | null;
    };
    const lib = (libRows ?? []) as LibRow[];
    const candidates = lib.map((r) => ({
      name: r.name,
      aliases: r.alternate_names ?? [],
    }));

    let totalMatched = 0;
    let totalUnmatched = 0;

    const matchedDays: MatchedDay[] = parsed.days.map((day) => {
      const exercises: MatchedExercise[] = day.exerciseLines.map((line) => {
        const best = pickBestMatch(line, candidates);
        if (best && best.confidence >= MATCH_THRESHOLD) {
          const hit = lib[best.index];
          totalMatched++;
          return {
            rawText: line,
            libraryId: hit.id,
            exerciseName: hit.name,
            targetMuscle: hit.category,
            defaultSets: hit.default_sets,
            defaultReps: hit.default_reps,
            defaultRestSeconds: hit.default_rest_seconds,
            confidence: best.confidence,
          };
        }
        totalUnmatched++;
        return {
          rawText: line,
          libraryId: null,
          exerciseName: line,
          targetMuscle: null,
          defaultSets: null,
          defaultReps: null,
          defaultRestSeconds: null,
          confidence: best?.confidence ?? 0,
        };
      });
      return {
        dayOfWeek: day.dayOfWeek,
        isRest: day.isRest,
        restNote: day.restNote,
        suggestedTemplateName: suggestTemplateName(
          day.dayOfWeek,
          exercises.map((e) => e.targetMuscle)
        ),
        exercises,
      };
    });

    return {
      ok: true,
      week: { days: matchedDays, totalMatched, totalUnmatched },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Preview failed',
    };
  }
}

// ─── importPastedWeeklyPlan ─────────────────────────────────────

const importSchema = z.object({
  clientId: z.string().uuid(),
  days: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        isRest: z.boolean(),
        templateName: z.string().min(1).max(120),
        exercises: z.array(
          z.object({
            libraryId: z.string().uuid().nullable(),
            exerciseName: z.string().min(1).max(200),
            targetMuscle: z.string().max(80).nullable(),
            defaultSets: z.string().max(20).nullable(),
            defaultReps: z.string().max(40).nullable(),
            defaultRestSeconds: z.number().int().min(0).max(600).nullable(),
          })
        ),
      })
    )
    .length(7),
});

export type ImportPastedWeeklyPlanInput = z.infer<typeof importSchema>;

/** Minimal template shape the editor needs to render dropdowns after
 *  the import — so the new templates show up in the day selectors
 *  before the route refresh propagates the cache invalidation. */
export interface CreatedTemplateOption {
  id: string;
  name: string;
  category: string | null;
  targetMuscleGroup: string | null;
}

export type ImportPastedWeeklyPlanResult =
  | {
      ok: true;
      /** day-of-week (0..6) → newly-created template id (or null for rest) */
      dayToTemplateId: Record<number, string | null>;
      /** Same templates as objects, for client-side dropdown enrichment. */
      newTemplates: CreatedTemplateOption[];
    }
  | { ok: false; error: string };

/**
 * Create one workout_template per non-rest day from a previewed
 * (and coach-approved) paste. Returns a day-of-week → template id
 * map so the caller can update its weekly-plan state in place.
 *
 * Templates created here are NOT shared (is_shared=false) — they're
 * effectively per-client workouts authored by paste. Coach can promote
 * them to shared from the templates page if they want to reuse.
 *
 * Does NOT touch the client_weekly_plan rows or materialize
 * client_workouts. The editor still calls `setClientWeeklyPlan` after
 * the coach reviews the now-pre-filled days. Two-step on purpose:
 * "extract" and "apply" are different actions in the coach's head.
 */
export async function importPastedWeeklyPlan(
  input: ImportPastedWeeklyPlanInput
): Promise<ImportPastedWeeklyPlanResult> {
  const parsed = importSchema.safeParse(input);
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

    const { data: roleRow } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    const role = roleRow?.role ?? 'user';
    if (role !== 'admin' && role !== 'super_admin') {
      return { ok: false, error: 'Only coaches can import weekly plans.' };
    }

    const dayToTemplateId: Record<number, string | null> = {
      0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null,
    };
    const newTemplates: CreatedTemplateOption[] = [];

    for (const day of data.days) {
      if (day.isRest || day.exercises.length === 0) {
        dayToTemplateId[day.dayOfWeek] = null;
        continue;
      }

      // Derive category from the most common target muscle of matched
      // exercises (keeps the template page filter useful).
      const muscleCounts = new Map<string, number>();
      for (const ex of day.exercises) {
        if (ex.targetMuscle) {
          muscleCounts.set(
            ex.targetMuscle,
            (muscleCounts.get(ex.targetMuscle) ?? 0) + 1
          );
        }
      }
      const topMuscle =
        muscleCounts.size > 0
          ? [...muscleCounts.entries()].sort((a, b) => b[1] - a[1])[0][0]
          : null;

      const { data: tpl, error: tplErr } = await supabase
        .from('workout_templates')
        .insert({
          name: day.templateName.trim(),
          category: topMuscle, // category column in workout_templates
          target_muscle_group: topMuscle,
          created_by: user.id,
          is_shared: false,
          is_active: true,
        })
        .select('id, name, category, target_muscle_group')
        .single();

      if (tplErr || !tpl) {
        return {
          ok: false,
          error: `Template create failed: ${tplErr?.message ?? 'unknown'}`,
        };
      }

      // Insert template exercises in order
      const exRows = day.exercises.map((ex, idx) => ({
        template_id: tpl.id,
        exercise_name: ex.exerciseName,
        target_muscle: ex.targetMuscle,
        exercise_library_id: ex.libraryId,
        sets: ex.defaultSets ? parseSetsString(ex.defaultSets) : null,
        reps: ex.defaultReps,
        rest_seconds: ex.defaultRestSeconds,
        exercise_order: idx,
      }));

      if (exRows.length > 0) {
        const { error: exErr } = await supabase
          .from('workout_template_exercises')
          .insert(exRows);
        if (exErr) {
          // Best-effort cleanup: drop the template row so we don't
          // leave an empty husk hanging around.
          await supabase.from('workout_templates').delete().eq('id', tpl.id);
          return {
            ok: false,
            error: `Exercise insert failed: ${exErr.message}`,
          };
        }
      }

      dayToTemplateId[day.dayOfWeek] = tpl.id;
      newTemplates.push({
        id: tpl.id,
        name: tpl.name,
        category: tpl.category as string | null,
        targetMuscleGroup: tpl.target_muscle_group as string | null,
      });
    }

    updateTag('workout-templates');
    revalidatePath(`/admin/clients/${data.clientId}`);

    return { ok: true, dayToTemplateId, newTemplates };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Import failed',
    };
  }
}

// ─── helpers ────────────────────────────────────────────────────

/** "3" → 3, "3-4" → 3, "3 sets" → 3, junk → null. Library stores
 *  default_sets as text but the template column is int — pick the
 *  first integer so we don't lose the value. */
function parseSetsString(s: string): number | null {
  const m = s.match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}
