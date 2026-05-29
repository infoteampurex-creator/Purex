'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { HealthReport } from '@/lib/data/health-reports';

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

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { ok: false, error: 'You are not signed in.' };
    }

    // Derive extension from MIME (safer than trusting filename suffix)
    const ext = (() => {
      switch (mimeType.toLowerCase()) {
        case 'application/pdf': return 'pdf';
        case 'image/jpeg':
        case 'image/jpg':       return 'jpg';
        case 'image/png':       return 'png';
        case 'image/webp':      return 'webp';
        case 'image/heic':      return 'heic';
        case 'image/heif':      return 'heif';
        default:                return 'bin';
      }
    })();

    // Path convention: <client_id>/<uuid>.<ext> — matches storage RLS
    const fileId = crypto.randomUUID();
    const storagePath = `${user.id}/${fileId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('health-reports')
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      return { ok: false, error: `Upload failed: ${uploadError.message}` };
    }

    // Create the DB row
    const { data: row, error: insertError } = await supabase
      .from('client_health_reports')
      .insert({
        client_id: user.id,
        storage_path: storagePath,
        original_filename: filename,
        mime_type: mimeType,
        file_size_bytes: buffer.length,
        report_label: reportLabel ?? null,
        report_date: reportDate ?? null,
      })
      .select()
      .single();

    if (insertError || !row) {
      // Best-effort cleanup — orphan in storage otherwise
      await supabase.storage.from('health-reports').remove([storagePath]);
      return {
        ok: false,
        error: `Could not save report record: ${insertError?.message ?? 'unknown error'}`,
      };
    }

    revalidatePath('/client/dashboard');
    revalidatePath('/client/profile');

    return {
      ok: true,
      report: mapRowToReport(row),
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Upload failed',
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

    // Best-effort delete storage object first; if that fails we still
    // proceed so the user can clean up the row
    await supabase.storage.from('health-reports').remove([row.storage_path]);

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
    return (data ?? []).map((row) => ({
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
    }));
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
  storage_path: string;
  original_filename: string | null;
  mime_type: string;
  file_size_bytes: number;
  report_label: string | null;
  report_date: string | null;
  coach_review_note: string | null;
  coach_reviewed_at: string | null;
  coach_reviewed_by: string | null;
  uploaded_at: string;
}

function mapRowToReport(row: HealthReportRow): HealthReport {
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
  };
}
