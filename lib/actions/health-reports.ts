'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { HealthReport } from '@/lib/data/health-reports';
import {
  extractHealthReport,
  extractHealthReportFromBytes,
} from './extract-health-report';

// NOTE on maxDuration: server-action files marked 'use server' can
// only export async functions, so the timeout config must live on
// the pages/routes that USE these actions:
//   - app/(client)/client/health/page.tsx
//   - app/(client)/client/dashboard/page.tsx
// Both set `export const maxDuration = 60` so Gemini has room to run
// (15-30s typical for a multi-page PDF).

// ─── Validation ─────────────────────────────────────────────────

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'image/heif',
  'image/webp',
]);

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB — matches bucket file_size_limit

const uploadInputSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string(),
  /** base64-encoded file body. Client encodes before sending to keep this
   *  a simple JSON action (no multipart parsing). */
  base64: z.string().min(1),
  reportLabel: z.string().max(120).optional().nullable(),
  reportDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
});

export type UploadInput = z.infer<typeof uploadInputSchema>;

export type UploadResult =
  | { ok: true; report: HealthReport }
  | { ok: false; error: string };

// ─── Upload ─────────────────────────────────────────────────────

/**
 * Upload a health report (PDF or image) to the private storage bucket
 * and create a row in client_health_reports.
 *
 * Returns the saved report row so the UI can immediately display it
 * in the list without a refetch.
 *
 * Security:
 *   - Auth required; client_id always derived from session, never trusted
 *     from the client
 *   - File size hard-capped at 10 MB (bucket also enforces, this is a
 *     belt-and-suspenders client-side check)
 *   - MIME type checked against allowlist
 *   - File written to <client_id>/<uuid>.<ext> path so the storage RLS
 *     folder-prefix policy can scope reads to the owner
 */
export async function uploadHealthReport(
  input: UploadInput
): Promise<UploadResult> {
  const parsed = uploadInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const { filename, mimeType, base64, reportLabel, reportDate } = parsed.data;

  if (!ALLOWED_MIME.has(mimeType.toLowerCase())) {
    return {
      ok: false,
      error: 'Unsupported file type. Upload PDF, JPG, or PNG.',
    };
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64, 'base64');
  } catch {
    return { ok: false, error: 'File body could not be decoded.' };
  }

  if (buffer.length === 0) {
    return { ok: false, error: 'File is empty.' };
  }
  if (buffer.length > MAX_BYTES) {
    return {
      ok: false,
      error: `File too large — ${(buffer.length / 1024 / 1024).toFixed(1)} MB. Max is 10 MB.`,
    };
  }

  const startedAt = Date.now();
  // eslint-disable-next-line no-console
  console.log('[upload-health-report] BEGIN', {
    filename,
    mimeType,
    base64Length: base64.length,
    bytes: buffer.length,
  });

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      // eslint-disable-next-line no-console
      console.warn('[upload-health-report] not signed in', { authError });
      return { ok: false, error: 'You are not signed in.' };
    }
    // eslint-disable-next-line no-console
    console.log('[upload-health-report] authed', {
      userId: user.id,
      elapsedMs: Date.now() - startedAt,
    });

    // ─── DATA-MINIMISATION: file stays on the user's device ──────
    // We intentionally do NOT upload the PDF / image to Supabase
    // Storage. The file bytes pass through this server action only
    // long enough to be sent to Gemini for extraction; nothing is
    // persisted in our backend except the structured markers + the
    // 1-line summary. This reduces PHI exposure surface and meets
    // the privacy commitment in the user-signed consent agreement.
    //
    // The client app stores the original file locally (Capacitor
    // Filesystem) for the user's own future viewing — that piece
    // ships in the mobile app, not here.

    // Create the DB row WITHOUT storage_path / mime_type / file_size.
    const { data: row, error: insertError } = await supabase
      .from('client_health_reports')
      .insert({
        client_id: user.id,
        storage_path: null,
        original_filename: filename,
        mime_type: null,
        file_size_bytes: null,
        report_label: reportLabel ?? null,
        report_date: reportDate ?? null,
      })
      .select()
      .single();

    if (insertError || !row) {
      // eslint-disable-next-line no-console
      console.error('[upload-health-report] INSERT FAILED', {
        message: insertError?.message,
        details: (insertError as { details?: string } | null)?.details,
        hint: (insertError as { hint?: string } | null)?.hint,
        code: (insertError as { code?: string } | null)?.code,
      });
      return {
        ok: false,
        error: `Could not save report record: ${insertError?.message ?? 'unknown error'}`,
      };
    }
    // eslint-disable-next-line no-console
    console.log('[upload-health-report] row inserted', {
      reportId: (row as { id: string }).id,
      elapsedMs: Date.now() - startedAt,
    });

    revalidatePath('/client/dashboard');
    revalidatePath('/client/profile');

    // ─── Synchronous AI extraction from in-memory bytes ─────────
    // Skips a round-trip to Storage entirely. Failures are non-
    // fatal: the row exists regardless, and the user is told that
    // re-extracting requires re-uploading (because we no longer
    // keep the file).
    const extractStarted = Date.now();
    // eslint-disable-next-line no-console
    console.log('[upload-health-report] calling extractHealthReportFromBytes', {
      reportId: row.id,
      hasApiKey: !!process.env.GOOGLE_AI_API_KEY,
    });
    try {
      const extractResult = await extractHealthReportFromBytes({
        reportId: row.id,
        base64,
        mimeType,
      });
      // eslint-disable-next-line no-console
      console.log('[upload-health-report] extract returned', {
        reportId: row.id,
        ok: extractResult.ok,
        status: extractResult.status,
        error: extractResult.ok ? null : extractResult.error,
        extractElapsedMs: Date.now() - extractStarted,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[upload-health-report] extract THREW', {
        reportId: row.id,
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        extractElapsedMs: Date.now() - extractStarted,
      });
      // Swallow — DB row is in place; user sees the error pill.
    }

    // Re-fetch so we return the post-extraction state to the client.
    const { data: finalRow } = await supabase
      .from('client_health_reports')
      .select('*')
      .eq('id', row.id)
      .maybeSingle();

    // eslint-disable-next-line no-console
    console.log('[upload-health-report] DONE', {
      reportId: row.id,
      finalStatus: (finalRow as { extraction_status?: string } | null)?.extraction_status,
      totalElapsedMs: Date.now() - startedAt,
    });

    revalidatePath('/client/health');

    return {
      ok: true,
      report: mapRowToReport((finalRow as HealthReportRow) ?? (row as HealthReportRow)),
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[upload-health-report] OUTER CATCH', {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      totalElapsedMs: Date.now() - startedAt,
    });
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Upload failed',
    };
  }
}

// ─── Retry extraction ───────────────────────────────────────────

export type RetryExtractionResult =
  | { ok: true; report: HealthReport }
  | { ok: false; error: string };

/**
 * Re-run Gemini extraction on a report that's currently stuck in
 * 'pending' / 'processing' / 'failed' / 'skipped'. Manual trigger
 * surfaced as a button on the report row in HealthPassportCard.
 *
 * Useful for:
 *   - Reports uploaded before the inline-extraction fix landed
 *   - Failed extractions the user wants to retry (poor scan)
 *   - Re-extracting after the AI key was added
 */
export async function retryHealthReportExtraction(
  reportId: string
): Promise<RetryExtractionResult> {
  if (!reportId || typeof reportId !== 'string') {
    return { ok: false, error: 'Invalid report id' };
  }

  try {
    await extractHealthReport(reportId);
    const supabase = await createClient();
    const { data: row } = await supabase
      .from('client_health_reports')
      .select('*')
      .eq('id', reportId)
      .maybeSingle();
    if (!row) return { ok: false, error: 'Report not found' };

    revalidatePath('/client/health');
    revalidatePath('/client/dashboard');
    revalidatePath(`/admin/clients/${(row as HealthReportRow).client_id}`);

    return { ok: true, report: mapRowToReport(row as HealthReportRow) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Re-extract failed',
    };
  }
}

// ─── List ───────────────────────────────────────────────────────

/**
 * List the current user's uploaded reports, newest first.
 * Returns [] on auth failure or db error (logged server-side).
 */
export async function getMyHealthReports(): Promise<HealthReport[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('client_health_reports')
      .select('*')
      .eq('client_id', user.id)
      .order('uploaded_at', { ascending: false });

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[health-reports] list failed', error);
      return [];
    }

    return (data ?? []).map(mapRowToReport);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[health-reports] list threw', err);
    return [];
  }
}

// ─── Delete ─────────────────────────────────────────────────────

export type DeleteResult = { ok: true } | { ok: false; error: string };

/** Delete a report row + its storage object (auth scoped to owner). */
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

    // Fetch storage_path first (also acts as RLS-gated existence check)
    const { data: row, error: fetchErr } = await supabase
      .from('client_health_reports')
      .select('storage_path')
      .eq('id', reportId)
      .eq('client_id', user.id)
      .maybeSingle();

    if (fetchErr || !row) {
      return { ok: false, error: 'Report not found' };
    }

    // Best-effort delete storage object first if it exists (legacy rows
    // pre-"file stays on device" still have a storage_path). Newer rows
    // have storage_path === null and skip this.
    if (row.storage_path) {
      await supabase.storage.from('health-reports').remove([row.storage_path]);
    }

    const { error: deleteErr } = await supabase
      .from('client_health_reports')
      .delete()
      .eq('id', reportId)
      .eq('client_id', user.id);

    if (deleteErr) {
      return { ok: false, error: deleteErr.message };
    }

    revalidatePath('/client/dashboard');
    revalidatePath('/client/profile');
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Delete failed',
    };
  }
}

// ─── Coach review note (admin-only) ──────────────────────────────

export type CoachReviewResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Admin/coach writes (or updates) the review note on a report. Uses
 * the existing client_health_reports.coach_review_note column. Sets
 * coach_reviewed_at + coach_reviewed_by automatically.
 *
 * Pass `note: ''` to clear an existing review note. (We treat empty
 * string as "no note" — the column itself becomes null.)
 *
 * Auth: requires admin/super_admin role. Non-admins are rejected
 * via RLS but we add a friendly check here too for error UX.
 */
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

    // Role check for friendly error (RLS also enforces)
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

/**
 * Server-side: list a specific client's reports for the admin/coach
 * view. RLS allows admins to read any client's reports.
 */
export async function getReportsForClient(
  clientId: string
): Promise<HealthReport[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('client_health_reports')
      .select('*')
      .eq('client_id', clientId)
      .order('uploaded_at', { ascending: false });
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[getReportsForClient] failed', error);
      return [];
    }
    return (data ?? []).map(mapRowToReport);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[getReportsForClient] threw', err);
    return [];
  }
}

// ─── Signed URL for viewing ─────────────────────────────────────

/**
 * Generate a short-lived signed URL for viewing a report in the
 * browser/native viewer. RLS already scopes the storage object, but
 * we re-check ownership before issuing the URL.
 *
 * Expires in 5 minutes — long enough to open the file, short enough
 * that a leaked URL doesn't become a permanent backdoor.
 */
export async function getReportViewUrl(
  reportId: string
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: 'Not signed in' };

    const { data: row } = await supabase
      .from('client_health_reports')
      .select('storage_path')
      .eq('id', reportId)
      .eq('client_id', user.id)
      .maybeSingle();

    if (!row) return { ok: false, error: 'Report not found' };

    // New rows have storage_path === null because the file stays on
    // the user's device. Nothing to sign — surface a clear message.
    if (!row.storage_path) {
      return {
        ok: false,
        error:
          'This report only lives on the client’s device by design. The extracted markers are still available below.',
      };
    }

    const { data: signed, error } = await supabase.storage
      .from('health-reports')
      .createSignedUrl(row.storage_path, 5 * 60);

    if (error || !signed?.signedUrl) {
      return { ok: false, error: error?.message ?? 'Could not generate URL' };
    }

    return { ok: true, url: signed.signedUrl };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'URL generation failed',
    };
  }
}

// ─── Internal mapper ────────────────────────────────────────────

interface HealthReportRow {
  id: string;
  client_id: string;
  // After 00030 these are nullable — new "file-stays-on-device" rows
  // have all three set to null. Legacy rows still have them populated.
  storage_path: string | null;
  original_filename: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  report_label: string | null;
  report_date: string | null;
  coach_review_note: string | null;
  coach_reviewed_at: string | null;
  coach_reviewed_by: string | null;
  uploaded_at: string;
  extraction_status?: string | null;
  extracted_at?: string | null;
  extracted_data?: unknown;
  extracted_summary?: string | null;
  extraction_error?: string | null;
}

function mapRowToReport(row: HealthReportRow): HealthReport {
  const status = (row.extraction_status as HealthReport['extractionStatus']) ?? 'pending';
  return {
    id: row.id,
    clientId: row.client_id,
    storagePath: row.storage_path,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    fileSizeBytes: row.file_size_bytes,
    reportLabel: row.report_label,
    reportDate: row.report_date,
    coachReviewNote: row.coach_review_note,
    coachReviewedAt: row.coach_reviewed_at,
    coachReviewedBy: row.coach_reviewed_by,
    uploadedAt: row.uploaded_at,
    extractionStatus: status,
    extractedAt: row.extracted_at ?? null,
    extractedData: (row.extracted_data as HealthReport['extractedData']) ?? null,
    extractedSummary: row.extracted_summary ?? null,
    extractionError: row.extraction_error ?? null,
  };
}
