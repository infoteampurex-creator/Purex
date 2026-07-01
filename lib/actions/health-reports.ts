'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
  HealthReport,
  HealthReportWithReadings,
  MarkerReading,
} from '@/lib/data/health-reports';

// ─── Validation ─────────────────────────────────────────────────

const readingSchema = z.object({
  markerId: z.string().uuid(),
  value: z.number().finite(),
  notes: z.string().max(200).optional().nullable(),
});

const saveReportSchema = z.object({
  /** Optional — admin/coach uses this to enter on behalf of a client.
   *  Client action leaves it null; the caller's own id is used. */
  targetClientId: z.string().uuid().optional().nullable(),
  reportDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  reportLabel: z.string().max(120).optional().nullable(),
  readings: z.array(readingSchema).min(1, 'Add at least one marker value'),
});

export type SaveReportInput = z.infer<typeof saveReportSchema>;

export type SaveReportResult =
  | { ok: true; reportId: string }
  | { ok: false; error: string };

// ─── Save a new report ──────────────────────────────────────────

/**
 * Create a health-report record with all its marker readings in one
 * transactional-ish call. Both client and admin use this — the admin
 * passes `targetClientId` to enter on behalf of a client; the client
 * leaves it empty and the auth'd user id is used.
 *
 * A report is "one lab visit" — all readings share the same date.
 * Duplicate marker entries within the same report are rejected by
 * the UNIQUE (report_id, marker_id) constraint.
 */
export async function saveHealthReport(
  input: SaveReportInput
): Promise<SaveReportResult> {
  const parsed = saveReportSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }
  const { targetClientId, reportDate, reportLabel, readings } = parsed.data;

  // Reject duplicate marker IDs before hitting the DB (nicer error).
  const seen = new Set<string>();
  for (const r of readings) {
    if (seen.has(r.markerId)) {
      return {
        ok: false,
        error: 'The same marker appears twice in this report.',
      };
    }
    seen.add(r.markerId);
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { ok: false, error: 'You are not signed in.' };
    }

    // If targetClientId is set (admin flow), confirm admin role.
    let clientId = user.id;
    if (targetClientId && targetClientId !== user.id) {
      const { data: roleRow } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      const role = roleRow?.role ?? 'user';
      if (role !== 'admin' && role !== 'super_admin') {
        return { ok: false, error: 'Only coaches can enter data for other clients.' };
      }
      clientId = targetClientId;
    }

    // Create the report row.
    const { data: reportRow, error: insertReportErr } = await supabase
      .from('client_health_reports')
      .insert({
        client_id: clientId,
        report_label: reportLabel ?? null,
        report_date: reportDate,
        entered_by: user.id,
      })
      .select('id')
      .single();

    if (insertReportErr || !reportRow) {
      return {
        ok: false,
        error: `Could not save report: ${insertReportErr?.message ?? 'unknown error'}`,
      };
    }

    // Bulk-insert readings.
    const { error: insertReadingsErr } = await supabase
      .from('client_health_marker_readings')
      .insert(
        readings.map((r) => ({
          client_id: clientId,
          report_id: reportRow.id,
          marker_id: r.markerId,
          value: r.value,
          notes: r.notes ?? null,
          entered_by: user.id,
        }))
      );

    if (insertReadingsErr) {
      // Roll back the report row so we don't leave an empty shell.
      await supabase
        .from('client_health_reports')
        .delete()
        .eq('id', reportRow.id);
      return {
        ok: false,
        error: `Could not save readings: ${insertReadingsErr.message}`,
      };
    }

    revalidatePath('/client/health');
    revalidatePath('/client/dashboard');
    revalidatePath(`/admin/clients/${clientId}`);

    return { ok: true, reportId: reportRow.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}

// ─── Delete a report (cascade removes readings) ─────────────────

export type DeleteResult = { ok: true } | { ok: false; error: string };

export async function deleteHealthReport(
  reportId: string
): Promise<DeleteResult> {
  if (!reportId || typeof reportId !== 'string') {
    return { ok: false, error: 'Invalid report id' };
  }
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: 'Not signed in' };

    const { data: row } = await supabase
      .from('client_health_reports')
      .select('client_id')
      .eq('id', reportId)
      .maybeSingle();

    if (!row) return { ok: false, error: 'Report not found' };

    const { error: deleteErr } = await supabase
      .from('client_health_reports')
      .delete()
      .eq('id', reportId);

    if (deleteErr) return { ok: false, error: deleteErr.message };

    revalidatePath('/client/health');
    revalidatePath('/client/dashboard');
    revalidatePath(`/admin/clients/${row.client_id}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Delete failed',
    };
  }
}

// ─── Coach review note (unchanged from prior) ───────────────────

export type CoachReviewResult =
  | { ok: true }
  | { ok: false; error: string };

export async function setCoachReviewNote(input: {
  reportId: string;
  note: string;
}): Promise<CoachReviewResult> {
  if (!input.reportId || typeof input.reportId !== 'string') {
    return { ok: false, error: 'Invalid report id' };
  }
  const note = (input.note ?? '').trim();
  if (note.length > 4000) {
    return { ok: false, error: 'Note is too long (4000 chars max)' };
  }

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
      return { ok: false, error: 'Only coaches can review reports.' };
    }

    const { data: row, error } = await supabase
      .from('client_health_reports')
      .update({
        coach_review_note: note === '' ? null : note,
        coach_reviewed_at: note === '' ? null : new Date().toISOString(),
        coach_reviewed_by: note === '' ? null : user.id,
      })
      .eq('id', input.reportId)
      .select('client_id')
      .single();

    if (error || !row) {
      return { ok: false, error: error?.message ?? 'Report not found' };
    }

    revalidatePath('/client/dashboard');
    revalidatePath('/client/health');
    revalidatePath(`/admin/clients/${row.client_id}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Update failed',
    };
  }
}

// ─── Readers ────────────────────────────────────────────────────

interface ReportRow {
  id: string;
  client_id: string;
  report_label: string | null;
  report_date: string | null;
  coach_review_note: string | null;
  coach_reviewed_at: string | null;
  coach_reviewed_by: string | null;
  entered_by: string | null;
  created_at: string;
}

interface ReadingRow {
  id: string;
  report_id: string;
  marker_id: string;
  value: string | number;
  notes: string | null;
  entered_by: string | null;
  entered_at: string;
  marker: {
    id: string;
    slug: string;
    name: string;
    short_name: string | null;
    unit: string | null;
    ref_low: string | number | null;
    ref_high: string | number | null;
    higher_is_better: boolean;
    panel: { slug: string; name: string } | null;
  } | null;
}

function mapReportRow(row: ReportRow): HealthReport {
  return {
    id: row.id,
    clientId: row.client_id,
    reportLabel: row.report_label,
    reportDate: row.report_date,
    coachReviewNote: row.coach_review_note,
    coachReviewedAt: row.coach_reviewed_at,
    coachReviewedBy: row.coach_reviewed_by,
    enteredBy: row.entered_by,
    createdAt: row.created_at,
  };
}

function toNum(v: string | number): number {
  return typeof v === 'number' ? v : Number(v);
}

function mapReadingRow(row: ReadingRow): MarkerReading {
  const m = row.marker;
  return {
    id: row.id,
    markerId: row.marker_id,
    markerSlug: m?.slug ?? '',
    markerName: m?.name ?? 'Unknown marker',
    markerShortName: m?.short_name ?? null,
    panelSlug: m?.panel?.slug ?? '',
    panelName: m?.panel?.name ?? '',
    unit: m?.unit ?? null,
    refLow:
      m?.ref_low != null ? toNum(m.ref_low) : null,
    refHigh:
      m?.ref_high != null ? toNum(m.ref_high) : null,
    higherIsBetter: m?.higher_is_better ?? false,
    value: toNum(row.value),
    notes: row.notes,
    enteredBy: row.entered_by,
    enteredAt: row.entered_at,
  };
}

async function loadReportsWithReadings(
  clientId: string
): Promise<HealthReportWithReadings[]> {
  const supabase = await createClient();

  const { data: reports, error: repErr } = await supabase
    .from('client_health_reports')
    .select(
      'id, client_id, report_label, report_date, coach_review_note, coach_reviewed_at, coach_reviewed_by, entered_by, created_at'
    )
    .eq('client_id', clientId)
    .order('report_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (repErr || !reports?.length) return [];

  const ids = reports.map((r) => r.id);
  const { data: readings } = await supabase
    .from('client_health_marker_readings')
    .select(
      `id, report_id, marker_id, value, notes, entered_by, entered_at,
       marker:lab_markers (
         id, slug, name, short_name, unit, ref_low, ref_high, higher_is_better,
         panel:lab_panels (slug, name)
       )`
    )
    .in('report_id', ids);

  const readingsByReport = new Map<string, MarkerReading[]>();
  for (const raw of (readings ?? []) as unknown as ReadingRow[]) {
    const m = mapReadingRow(raw);
    const list = readingsByReport.get(raw.report_id) ?? [];
    list.push(m);
    readingsByReport.set(raw.report_id, list);
  }

  return reports.map((r) => ({
    ...mapReportRow(r as ReportRow),
    readings: readingsByReport.get(r.id) ?? [],
  }));
}

/** Current user's own reports (client-facing). */
export async function getMyHealthReports(): Promise<
  HealthReportWithReadings[]
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];
    return await loadReportsWithReadings(user.id);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[getMyHealthReports] threw', err);
    return [];
  }
}

/** A specific client's reports — admin view. RLS gates access. */
export async function getReportsForClient(
  clientId: string
): Promise<HealthReportWithReadings[]> {
  try {
    return await loadReportsWithReadings(clientId);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[getReportsForClient] threw', err);
    return [];
  }
}
