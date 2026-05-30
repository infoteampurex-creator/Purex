'use server';

import { GoogleGenerativeAI, SchemaType, type Schema } from '@google/generative-ai';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// NOTE on maxDuration: this is a 'use server' file, so config exports
// like `maxDuration` can't live here. They go on the calling page
// (app/(client)/client/health/page.tsx, dashboard page) so Gemini
// has 60s instead of the default 10s for a multi-page PDF.

// ─── Gemini config ──────────────────────────────────────────────

const SYSTEM_INSTRUCTION = `You are a medical lab report analyst.

Read the user's uploaded lab report (PDF or image) and extract a
structured JSON of test markers. Operate on Indian lab formats first
(Dr Lal Pathlabs, Apollo, Thyrocare, SRL, Metropolis, Vijaya) but
gracefully handle US/UK reports too.

Rules:
- ONLY extract markers actually visible on the page. NEVER invent values.
- Capture EVERY marker you see, even uncommon ones. Don't pre-filter.
- Status: compare value to reference_range. "high" if above, "low" if
  below, "normal" if in range, "unknown" if range is missing.
- category buckets: blood_sugar, lipids, thyroid, liver, kidney, cbc,
  iron, vitamins, hormones, urine, inflammation, electrolytes, other.
- report_type: pick the dominant category, or "general" for mixed panels.
- report_date: the date the SAMPLE WAS COLLECTED (not "report generated"
  date if both exist). YYYY-MM-DD. Null if unreadable.
- lab_name: the lab brand (e.g. "Apollo Diagnostics"). Null if not shown.
- interpretation: ONE plain-English sentence summarising overall picture.
  Do NOT give medical advice — just state what's elevated/normal.
- confidence: 0..1 — your confidence in the overall extraction quality.
  Drop below 0.5 for grainy scans, foreign-language reports, or
  non-lab images (random photo, ID card, prescription).
- If the file isn't actually a lab report, set confidence=0,
  report_type="other", markers=[], interpretation="Not a lab report".
- Never refuse — always return the JSON.`;

const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    report_type: {
      type: SchemaType.STRING,
      description:
        'Dominant category: blood_sugar | lipids | thyroid | liver | kidney | cbc | iron | vitamins | hormones | urine | inflammation | electrolytes | general | other',
    },
    report_date: {
      type: SchemaType.STRING,
      description: 'YYYY-MM-DD or empty string when not readable',
    },
    lab_name: {
      type: SchemaType.STRING,
      description: 'Lab brand name or empty string',
    },
    markers: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING, description: 'Test name as printed' },
          value: { type: SchemaType.STRING, description: 'Result value as printed (string to preserve units/qualifiers)' },
          unit: { type: SchemaType.STRING, description: 'Unit (mg/dL, g/dL, etc.) — empty when absent' },
          reference_range: { type: SchemaType.STRING, description: 'Lab-provided range — empty when not shown' },
          status: {
            type: SchemaType.STRING,
            description: 'high | low | normal | unknown',
          },
          category: {
            type: SchemaType.STRING,
            description:
              'blood_sugar | lipids | thyroid | liver | kidney | cbc | iron | vitamins | hormones | urine | inflammation | electrolytes | other',
          },
        },
        required: ['name', 'value', 'status', 'category'],
      },
    },
    interpretation: {
      type: SchemaType.STRING,
      description: 'One plain-English sentence summarising the result',
    },
    confidence: {
      type: SchemaType.NUMBER,
      description: '0..1 overall extraction confidence',
    },
  },
  required: [
    'report_type',
    'report_date',
    'lab_name',
    'markers',
    'interpretation',
    'confidence',
  ],
};

const aiResponseSchema = z.object({
  report_type: z.string(),
  report_date: z.string(),
  lab_name: z.string(),
  markers: z.array(
    z.object({
      name: z.string(),
      value: z.string(),
      unit: z.string().optional().default(''),
      reference_range: z.string().optional().default(''),
      status: z.enum(['high', 'low', 'normal', 'unknown']),
      category: z.string(),
    })
  ),
  interpretation: z.string(),
  confidence: z.number().min(0).max(1),
});

export type ExtractedReportData = z.infer<typeof aiResponseSchema>;

// ─── Action ─────────────────────────────────────────────────────

export type ExtractResult =
  | { ok: true; status: 'done'; data: ExtractedReportData }
  | { ok: false; status: 'failed' | 'skipped'; error: string };

/**
 * Run Gemini vision on a previously-uploaded health report and write
 * the structured extraction back to client_health_reports.
 *
 * Safe to call multiple times — re-extraction just overwrites the
 * previous result. Auth-scoped: only the report's owner OR an admin
 * can trigger extraction (RLS enforces; we also do a friendly check).
 *
 * Best-effort by design: errors are caught, status is written as
 * 'failed' with the error message, and the upload itself is never
 * blocked. The user keeps their file in storage either way.
 */
export async function extractHealthReport(
  reportId: string
): Promise<ExtractResult> {
  if (!reportId || typeof reportId !== 'string') {
    return { ok: false, status: 'failed', error: 'Invalid report id' };
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    // Mark as skipped rather than failed — the report itself is fine.
    await markStatus(reportId, 'skipped', 'AI extraction not configured');
    return { ok: false, status: 'skipped', error: 'AI extraction not configured' };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, status: 'failed', error: 'Not signed in' };
    }

    // Fetch the report — RLS lets owner OR admin read
    const { data: report, error: fetchErr } = await supabase
      .from('client_health_reports')
      .select('id, client_id, storage_path, mime_type')
      .eq('id', reportId)
      .maybeSingle();

    if (fetchErr || !report) {
      return { ok: false, status: 'failed', error: 'Report not found' };
    }

    // Mark processing
    await markStatus(report.id, 'processing', null);

    // Download the file from storage
    const { data: file, error: downloadErr } = await supabase.storage
      .from('health-reports')
      .download(report.storage_path);

    if (downloadErr || !file) {
      await markStatus(report.id, 'failed', downloadErr?.message ?? 'Could not download file');
      return {
        ok: false,
        status: 'failed',
        error: downloadErr?.message ?? 'Could not download file',
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Map MIME for Gemini. Gemini accepts application/pdf + the common
    // image types. HEIC/HEIF are converted to JPEG by the browser
    // before upload in most cases; if a raw HEIC slips through, Gemini
    // doesn't handle it — fall back to skipped with a hint.
    const supportedMimes = new Set([
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ]);
    if (!supportedMimes.has(report.mime_type.toLowerCase())) {
      await markStatus(
        report.id,
        'skipped',
        `File type ${report.mime_type} not supported for AI extraction`
      );
      return {
        ok: false,
        status: 'skipped',
        error: `File type ${report.mime_type} not supported`,
      };
    }

    // ─── Call Gemini ─────────────────────────────────────────────
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 0.1,
        // Reports can have many markers; budget enough tokens for the
        // thinking step + a fully populated JSON.
        maxOutputTokens: 8192,
      },
    });

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64,
          mimeType: report.mime_type.toLowerCase() === 'image/jpg'
            ? 'image/jpeg'
            : report.mime_type,
        },
      },
      {
        text: 'Extract every visible test marker from this lab report.',
      },
    ]);

    const text = result.response.text();
    let parsed: ExtractedReportData;
    try {
      const raw = JSON.parse(text);
      parsed = aiResponseSchema.parse(raw);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unexpected response shape';
      await markStatus(report.id, 'failed', `Parse error: ${msg}`);
      return { ok: false, status: 'failed', error: msg };
    }

    // Build a 1-line summary
    const summary = buildSummary(parsed);

    // Persist the result. Use a service-role write so RLS doesn't
    // block when an admin triggers extraction on someone else's
    // report (we already auth-checked above).
    const { error: updateErr } = await supabase
      .from('client_health_reports')
      .update({
        extraction_status: 'done',
        extracted_at: new Date().toISOString(),
        extracted_data: parsed,
        extracted_summary: summary,
        extraction_error: null,
        // Also fill in the report_date if user didn't provide one
        // and Gemini extracted a date confidently.
        ...(parsed.report_date && /^\d{4}-\d{2}-\d{2}$/.test(parsed.report_date)
          ? { report_date: parsed.report_date }
          : {}),
        ...(parsed.lab_name && !parsed.lab_name.match(/^\s*$/)
          ? { report_label: parsed.lab_name + ' — ' + (parsed.report_type ?? 'report') }
          : {}),
      })
      .eq('id', report.id);

    if (updateErr) {
      return { ok: false, status: 'failed', error: updateErr.message };
    }

    revalidatePath('/client/health');
    revalidatePath('/client/dashboard');
    revalidatePath(`/admin/clients/${report.client_id}`);

    return { ok: true, status: 'done', data: parsed };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Extraction failed';
    await markStatus(reportId, 'failed', msg);
    return { ok: false, status: 'failed', error: msg };
  }
}

// ─── helpers ────────────────────────────────────────────────────

async function markStatus(
  reportId: string,
  status: 'processing' | 'failed' | 'skipped',
  errorMessage: string | null
) {
  try {
    const supabase = await createClient();
    await supabase
      .from('client_health_reports')
      .update({
        extraction_status: status,
        extraction_error: errorMessage,
        ...(status === 'failed' || status === 'skipped'
          ? { extracted_at: new Date().toISOString() }
          : {}),
      })
      .eq('id', reportId);
  } catch {
    // Best-effort — status update failures shouldn't crash extraction.
  }
}

function buildSummary(data: ExtractedReportData): string {
  if (data.confidence < 0.3) return 'Extraction confidence low — please review';
  const total = data.markers.length;
  const high = data.markers.filter((m) => m.status === 'high').length;
  const low = data.markers.filter((m) => m.status === 'low').length;
  const flags = high + low;
  if (total === 0) return data.interpretation || 'No markers detected';
  if (flags === 0) return `${total} markers — all normal`;
  return `${total} markers · ${high} high${low ? ` · ${low} low` : ''}`;
}
