import 'server-only';
import { fetchSheet, isSheetsConfigured } from '@/lib/google/sheets-client';
import type {
  WorkoutTemplate,
  WorkoutTemplateExercise,
} from './workout-templates-types';

/**
 * Reads admin-curated workout templates + exercises from the Google
 * Sheet at SHEET_WORKOUT_TEMPLATES_ID. Returns [] when unconfigured.
 *
 * The Sheet uses TWO tabs (one row per template + one row per exercise)
 * because templates have a parent → child relationship and forcing it
 * into one tab would duplicate template fields N times per exercise.
 *
 * ─── Tab 1: "Templates" ──────────────────────────────────────────
 *
 *   A: id                          — slug-ish unique identifier
 *   B: name                        — display name
 *   C: category                    — Strength | HYROX | Conditioning | Mobility | Cardio | Sport | Rest
 *   D: target_muscle_group
 *   E: description
 *   F: trainer_notes
 *   G: next_day_instructions
 *   H: estimated_duration_minutes  — integer
 *   I: difficulty                  — beginner | intermediate | advanced
 *   J: is_shared                   — TRUE | FALSE (default TRUE)
 *
 * ─── Tab 2: "Exercises" ──────────────────────────────────────────
 *
 *   A: template_id                 — must match an id from Templates tab
 *   B: exercise_order              — integer (defines display order)
 *   C: exercise_name
 *   D: target_muscle
 *   E: sets                        — integer
 *   F: reps                        — text ("8-12", "AMRAP", etc.)
 *   G: target_weight_kg            — decimal
 *   H: rest_seconds                — integer
 *   I: tempo                       — text ("2-0-1-0")
 *   J: rpe_target                  — number 1-10
 *   K: trainer_instruction
 *
 * Templates with no matching exercise rows are still returned (the
 * Sheet author may add exercises later); UI consumers can show them
 * as "draft" or hide them until they have ≥1 exercise.
 *
 * Wiring this into the admin Templates page is intentionally deferred
 * to a follow-up PR — the existing flow has tight DB coupling that
 * a thoughtful merge step belongs in. This adapter is the foundation
 * so that follow-up is just composition.
 */
export async function getSheetWorkoutTemplates(): Promise<WorkoutTemplate[]> {
  if (!isSheetsConfigured()) return [];
  const spreadsheetId = process.env.SHEET_WORKOUT_TEMPLATES_ID;
  if (!spreadsheetId) return [];

  try {
    const [templateRows, exerciseRows] = await Promise.all([
      fetchSheet({ spreadsheetId, range: 'Templates!A2:J500' }),
      fetchSheet({ spreadsheetId, range: 'Exercises!A2:K5000' }),
    ]);

    const templates = parseTemplateRows(templateRows);
    const exercisesByTemplateId = parseExerciseRows(exerciseRows);

    return templates.map((t) => ({
      ...t,
      exercises: (exercisesByTemplateId.get(t.id) ?? []).sort(
        (a, b) => a.exerciseOrder - b.exerciseOrder
      ),
    }));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      '[workout-templates-from-sheet] fetch failed — returning empty',
      err instanceof Error ? err.message : err
    );
    return [];
  }
}

// ─── Row parsers ────────────────────────────────────────────────

function parseTemplateRows(rows: string[][]): WorkoutTemplate[] {
  const now = new Date().toISOString();
  const out: WorkoutTemplate[] = [];
  rows.forEach((r, i) => {
    const [
      id,
      name,
      category,
      targetMuscleGroup,
      description,
      trainerNotes,
      nextDayInstructions,
      estimatedDurationMinutes,
      difficulty,
      isShared,
    ] = r;
    if (!id?.trim() || !name?.trim()) {
      // eslint-disable-next-line no-console
      console.warn(
        `[workout-templates-from-sheet] skipping Templates row ${i + 2}: missing id/name`
      );
      return;
    }
    out.push({
      id: id.trim(),
      name: name.trim(),
      category: category?.trim() || null,
      targetMuscleGroup: targetMuscleGroup?.trim() || null,
      description: description?.trim() || null,
      trainerNotes: trainerNotes?.trim() || null,
      nextDayInstructions: nextDayInstructions?.trim() || null,
      estimatedDurationMinutes: toIntOrNull(estimatedDurationMinutes),
      difficulty: parseDifficulty(difficulty),
      isShared: parseBool(isShared, true),
      isActive: true,
      createdBy: null,
      createdAt: now,
      updatedAt: now,
      exercises: [],
    });
  });
  return out;
}

function parseExerciseRows(
  rows: string[][]
): Map<string, WorkoutTemplateExercise[]> {
  const out = new Map<string, WorkoutTemplateExercise[]>();
  rows.forEach((r, i) => {
    const [
      templateId,
      exerciseOrder,
      exerciseName,
      targetMuscle,
      sets,
      reps,
      targetWeightKg,
      restSeconds,
      tempo,
      rpeTarget,
      trainerInstruction,
    ] = r;
    if (!templateId?.trim() || !exerciseName?.trim()) {
      // eslint-disable-next-line no-console
      console.warn(
        `[workout-templates-from-sheet] skipping Exercises row ${i + 2}: missing template_id/exercise_name`
      );
      return;
    }
    const list = out.get(templateId.trim()) ?? [];
    list.push({
      id: `sheet:${templateId.trim()}:${i}`,
      exerciseName: exerciseName.trim(),
      targetMuscle: targetMuscle?.trim() || null,
      sets: toIntOrNull(sets),
      reps: reps?.trim() || null,
      targetWeightKg: toFloatOrNull(targetWeightKg),
      restSeconds: toIntOrNull(restSeconds),
      tempo: tempo?.trim() || null,
      rpeTarget: toFloatOrNull(rpeTarget),
      trainerInstruction: trainerInstruction?.trim() || null,
      exerciseOrder: toIntOrNull(exerciseOrder) ?? list.length,
    });
    out.set(templateId.trim(), list);
  });
  return out;
}

function toIntOrNull(v: string | undefined): number | null {
  if (v == null || v.trim() === '') return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

function toFloatOrNull(v: string | undefined): number | null {
  if (v == null || v.trim() === '') return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function parseBool(v: string | undefined, def = false): boolean {
  if (!v || v.trim() === '') return def;
  return /^(true|yes|y|1)$/i.test(v.trim());
}

function parseDifficulty(
  v: string | undefined
): 'beginner' | 'intermediate' | 'advanced' | null {
  const x = (v ?? '').trim().toLowerCase();
  if (x === 'beginner' || x === 'intermediate' || x === 'advanced') return x;
  return null;
}
