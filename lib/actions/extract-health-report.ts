'use server';

import { GoogleGenerativeAI, SchemaType, type Schema } from '@google/generative-ai';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { extractText, getDocumentProxy } from 'unpdf';

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
/**
 * Stored-file extraction path (LEGACY).
 *
 * Used only by the retry button on health reports uploaded BEFORE the
 * "file stays on device" migration shipped — when storage_path was
 * still populated. Downloads the file from Storage, then funnels
 * into runExtractionOnBytes.
 *
 * New uploads do NOT go through this; they call
 * extractHealthReportFromBytes directly so the file never lands in
 * Storage in the first place.
 */
export async function extractHealthReport(
  reportId: string
): Promise<ExtractResult> {
  if (!reportId || typeof reportId !== 'string') {
    return { ok: false, status: 'failed', error: 'Invalid report id' };
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    logMissingKey(reportId);
    await markStatus(
      reportId,
      'skipped',
      'AI extraction not configured. Ask admin to set GOOGLE_AI_API_KEY.'
    );
    return {
      ok: false,
      status: 'skipped',
      error: 'AI extraction not configured',
    };
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

    // No stored file → cannot retry from server. User must re-upload.
    if (!report.storage_path) {
      await markStatus(
        report.id,
        'skipped',
        'File stays on your device — re-upload to re-extract.'
      );
      return {
        ok: false,
        status: 'skipped',
        error: 'File stays on your device — re-upload to re-extract.',
      };
    }

    // Mark processing
    await markStatus(report.id, 'processing', null);

    // Download the file from storage (legacy path)
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

    return await runExtractionOnBytes({
      reportId: report.id,
      base64,
      mimeType: report.mime_type ?? 'application/octet-stream',
      apiKey,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Extraction failed';
    // eslint-disable-next-line no-console
    console.error('[extract-health-report] unhandled exception (storage path)', {
      reportId,
      message: msg,
      stack: err instanceof Error ? err.stack : undefined,
    });
    await markStatus(reportId, 'failed', msg);
    return { ok: false, status: 'failed', error: msg };
  }
}

/**
 * NEW: inline extraction path — file bytes come straight from the
 * client and never touch Supabase Storage. The DB row exists, but
 * only its extracted_data / summary / status columns get populated.
 *
 * This is the primary path for all new health-report uploads.
 */
export async function extractHealthReportFromBytes(input: {
  reportId: string;
  base64: string;
  mimeType: string;
}): Promise<ExtractResult> {
  const fnStartedAt = Date.now();
  const { reportId, base64, mimeType } = input;
  // eslint-disable-next-line no-console
  console.log('[extract-from-bytes] ENTER', {
    reportId,
    mimeType,
    base64Length: base64?.length ?? 0,
  });

  if (!reportId || !base64 || !mimeType) {
    // eslint-disable-next-line no-console
    console.error('[extract-from-bytes] missing input', {
      hasReportId: !!reportId,
      hasBase64: !!base64,
      hasMimeType: !!mimeType,
    });
    return { ok: false, status: 'failed', error: 'Missing required input' };
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    logMissingKey(reportId);
    await markStatus(
      reportId,
      'skipped',
      'AI extraction not configured. Ask admin to set GOOGLE_AI_API_KEY.'
    );
    return {
      ok: false,
      status: 'skipped',
      error: 'AI extraction not configured',
    };
  }

  try {
    // eslint-disable-next-line no-console
    console.log('[extract-from-bytes] marking processing', {
      reportId,
      elapsedMs: Date.now() - fnStartedAt,
    });
    await markStatus(reportId, 'processing', null);
    // eslint-disable-next-line no-console
    console.log('[extract-from-bytes] calling runExtractionOnBytes', {
      reportId,
      elapsedMs: Date.now() - fnStartedAt,
    });
    const result = await runExtractionOnBytes({
      reportId,
      base64,
      mimeType,
      apiKey,
    });
    // eslint-disable-next-line no-console
    console.log('[extract-from-bytes] EXIT', {
      reportId,
      ok: result.ok,
      status: result.status,
      totalElapsedMs: Date.now() - fnStartedAt,
    });
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Extraction failed';
    // eslint-disable-next-line no-console
    console.error('[extract-from-bytes] CAUGHT EXCEPTION', {
      reportId,
      message: msg,
      stack: err instanceof Error ? err.stack : undefined,
      totalElapsedMs: Date.now() - fnStartedAt,
    });
    await markStatus(reportId, 'failed', msg);
    return { ok: false, status: 'failed', error: msg };
  }
}

function logMissingKey(reportId: string) {
  // eslint-disable-next-line no-console
  console.warn(
    '[extract-health-report] GOOGLE_AI_API_KEY missing — report saved without extraction',
    { reportId }
  );
}

/**
 * Shared core that runs the Gemini extraction on already-in-memory
 * bytes + writes the result back to client_health_reports.
 */
async function runExtractionOnBytes(args: {
  reportId: string;
  base64: string;
  mimeType: string;
  apiKey: string;
}): Promise<ExtractResult> {
  const { reportId, base64, mimeType, apiKey } = args;

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
  if (!supportedMimes.has(mimeType.toLowerCase())) {
    await markStatus(
      reportId,
      'skipped',
      `File type ${mimeType} not supported for AI extraction`
    );
    return {
      ok: false,
      status: 'skipped',
      error: `File type ${mimeType} not supported`,
    };
  }

  const supabase = await createClient();

  // ─── Stage 1: text extraction (PDF only) ───────────────────────
  //
  // For text-PDFs we extract the raw text first and send TEXT to
  // Gemini instead of the binary PDF. Why:
  //
  // - Asking an LLM to read a binary PDF means the model has to
  //   render every page into tokens. On Gemini Flash that costs
  //   15–50s on multi-page lab reports — right at the Vercel
  //   ceiling. We've watched it time out repeatedly.
  // - Text-only requests finish in 2–5s. Same accuracy on
  //   text-PDFs, because lab reports are tabular text — there's
  //   no visual signal Gemini needs beyond the marker rows.
  // - For scanned/image PDFs, unpdf returns near-empty text. We
  //   fall back to sending the binary in stage 2.
  let pdfText: string | null = null;
  if (mimeType.toLowerCase() === 'application/pdf') {
    const textStart = Date.now();
    try {
      const pdfBytes = Uint8Array.from(Buffer.from(base64, 'base64'));
      const pdf = await getDocumentProxy(pdfBytes);
      const { text } = await extractText(pdf, { mergePages: true });
      const joined = (Array.isArray(text) ? text.join('\n') : text).trim();
      // Threshold: a typical 1-page lab report is 800–1500 chars.
      // Anything under 200 chars is almost certainly a scanned PDF
      // where pdfjs couldn't pull real text out — fall back to binary.
      if (joined.length >= 200) {
        pdfText = joined;
      }
      // eslint-disable-next-line no-console
      console.log('[extract-health-report] pdf text extracted', {
        reportId,
        chars: joined.length,
        usingTextStage: pdfText !== null,
        elapsedMs: Date.now() - textStart,
      });
    } catch (textErr) {
      // eslint-disable-next-line no-console
      console.warn(
        '[extract-health-report] pdf text extraction failed, falling back to binary',
        {
          reportId,
          msg: textErr instanceof Error ? textErr.message : String(textErr),
        }
      );
    }
  }

  // ─── Stage 2: call Gemini ──────────────────────────────────────
  //
  // Two timeouts: text-only stays small (15s — should finish in
  // ~3s on a 1500-char lab report) and binary gets the full
  // headroom (50s) since that path is only used for scanned PDFs
  // or images where Gemini does the visual heavy-lifting itself.
  //
  // Single model: gemini-2.5-pro is paid-only on the project's
  // free-tier key (429 limit=0), gemini-2.0-flash same, 1.5-flash
  // retired. Cycling them just pollutes UI errors with quota dumps.
  const TEXT_TIMEOUT_MS = 15_000;
  const BINARY_TIMEOUT_MS = 50_000;
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = 'gemini-2.5-flash';

  const normalisedMime =
    mimeType.toLowerCase() === 'image/jpg' ? 'image/jpeg' : mimeType;

  const isTextStage = pdfText !== null;
  const inputPart = isTextStage
    ? { text: `Lab report text extracted from PDF:\n\n${pdfText}` }
    : {
        inlineData: {
          data: base64,
          mimeType: normalisedMime,
        },
      };
  const promptPart = {
    text: 'Extract every visible test marker from this lab report.',
  };
  const timeoutMs = isTextStage ? TEXT_TIMEOUT_MS : BINARY_TIMEOUT_MS;

  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0.1,
      maxOutputTokens: 8192,
    },
  });

  const callGemini = async (
    part: typeof inputPart,
    budgetMs: number,
    stage: 'text' | 'binary'
  ): Promise<string> => {
    const startedAt = Date.now();
    try {
      const result = await Promise.race([
        model.generateContent([part, promptPart]),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Timeout after ${budgetMs}ms`)),
            budgetMs
          )
        ),
      ]);
      // eslint-disable-next-line no-console
      console.log(
        `[extract-health-report] ${modelName} (${stage}) OK in ${
          Date.now() - startedAt
        }ms`,
        { reportId }
      );
      return result.response.text();
    } catch (err) {
      const ms = Date.now() - startedAt;
      const msg = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-console
      console.warn(
        `[extract-health-report] ${modelName} (${stage}) failed in ${ms}ms`,
        { reportId, msg }
      );
      throw err;
    }
  };

  let text: string;
  try {
    text = await callGemini(inputPart, timeoutMs, isTextStage ? 'text' : 'binary');
  } catch (firstErr) {
    // If the text-stage call failed (timeout, transient error, JSON
    // shape issue), fall back to sending the binary PDF — the bytes
    // are still in memory. This recovers the rare case where a
    // text-PDF still confuses Gemini and we'd otherwise abandon it.
    if (isTextStage) {
      // eslint-disable-next-line no-console
      console.warn(
        '[extract-health-report] text stage failed, retrying with binary PDF',
        { reportId }
      );
      try {
        const binaryPart = {
          inlineData: { data: base64, mimeType: normalisedMime },
        };
        text = await callGemini(binaryPart, BINARY_TIMEOUT_MS, 'binary');
      } catch (binaryErr) {
        const msg =
          binaryErr instanceof Error ? binaryErr.message : String(binaryErr);
        // eslint-disable-next-line no-console
        console.error('[extract-health-report] both stages failed', {
          reportId,
          msg,
        });
        await markStatus(reportId, 'failed', msg);
        return { ok: false, status: 'failed', error: msg };
      }
    } else {
      const msg =
        firstErr instanceof Error ? firstErr.message : String(firstErr);
      await markStatus(reportId, 'failed', msg);
      return { ok: false, status: 'failed', error: msg };
    }
  }

  let parsed: ExtractedReportData;
  try {
    // Gemini sometimes wraps JSON in ```json ... ``` fences even when
    // responseMimeType is JSON. Strip any fenced wrapper before parsing.
    const cleaned = text
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    const raw = JSON.parse(cleaned);
    parsed = aiResponseSchema.parse(raw);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unexpected response shape';
    // eslint-disable-next-line no-console
    console.error('[extract-health-report] parse failed', {
      reportId,
      snippet: text.slice(0, 400),
      message: msg,
    });
    await markStatus(reportId, 'failed', `Parse error: ${msg}`);
    return { ok: false, status: 'failed', error: msg };
  }

  const summary = buildSummary(parsed);

  const { data: updatedRow, error: updateErr } = await supabase
    .from('client_health_reports')
    .update({
      extraction_status: 'done',
      extracted_at: new Date().toISOString(),
      extracted_data: parsed,
      extracted_summary: summary,
      extraction_error: null,
      ...(parsed.report_date && /^\d{4}-\d{2}-\d{2}$/.test(parsed.report_date)
        ? { report_date: parsed.report_date }
        : {}),
      ...(parsed.lab_name && !parsed.lab_name.match(/^\s*$/)
        ? { report_label: parsed.lab_name + ' — ' + (parsed.report_type ?? 'report') }
        : {}),
    })
    .eq('id', reportId)
    .select('client_id')
    .maybeSingle();

  if (updateErr) {
    return { ok: false, status: 'failed', error: updateErr.message };
  }

  revalidatePath('/client/health');
  revalidatePath('/client/dashboard');
  if (updatedRow?.client_id) {
    revalidatePath(`/admin/clients/${updatedRow.client_id}`);
  }

  return { ok: true, status: 'done', data: parsed };
}

// ─── helpers ────────────────────────────────────────────────────

async function markStatus(
  reportId: string,
  status: 'processing' | 'failed' | 'skipped',
  errorMessage: string | null
) {
  try {
    const supabase = await createClient();
    const { error: updateErr } = await supabase
      .from('client_health_reports')
      .update({
        extraction_status: status,
        extraction_error: errorMessage,
        ...(status === 'failed' || status === 'skipped'
          ? { extracted_at: new Date().toISOString() }
          : {}),
      })
      .eq('id', reportId);
    if (updateErr) {
      // eslint-disable-next-line no-console
      console.error('[extract-health-report] markStatus failed', {
        reportId,
        status,
        error: updateErr.message,
        code: (updateErr as { code?: string }).code,
      });
    } else {
      // eslint-disable-next-line no-console
      console.log(`[extract-health-report] markStatus(${status}) OK`, {
        reportId,
      });
    }
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
