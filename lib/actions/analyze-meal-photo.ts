'use server';

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// ─── AI prompt ──────────────────────────────────────────────────────

/**
 * System prompt tuned for Indian food + portion sizes. Asks Claude
 * to return a strict JSON shape we can parse without further regex.
 * Crucially: includes a confidence field so we can surface "I'm not
 * sure" UI to the user and let them edit.
 */
const SYSTEM_PROMPT = `You are a nutrition analyst specialised in Indian cuisine.

Identify the food visible in the user's photo and estimate the
macros for the visible portion. Use Indian serving conventions
(katori, cup, roti pieces, idli count, etc.) and assume typical
Indian home-cooking preparations unless visual cues suggest otherwise.

Output STRICT JSON only, no prose, no markdown, this exact shape:

{
  "name": "<short human label of the dish(es) — max 80 chars>",
  "description": "<one sentence describing what you see and the portion>",
  "calories": <int kcal>,
  "protein_g": <int>,
  "carbs_g": <int>,
  "fats_g": <int>,
  "fiber_g": <int>,
  "confidence": <float 0..1, your confidence in the macro estimate>,
  "items": [
    { "name": "<food item>", "portion": "<e.g. '1 cup'>", "calories": <int> }
  ]
}

Rules:
- If the photo is NOT food (random object, screen, person, blank),
  set confidence to 0 and calories/macros to 0; name = "Not food".
- If multiple dishes are visible, return totals; itemise in the items array.
- If you can see the food but the portion size is ambiguous, estimate
  conservatively and set confidence between 0.3 and 0.6.
- If you are confident in both the dish and the portion, confidence
  should be 0.7 or higher.
- Never refuse — always return the JSON. Use 0s + name "Unknown" if
  you genuinely can't tell.`;

// ─── Schemas ────────────────────────────────────────────────────────

const inputSchema = z.object({
  /** base64-encoded JPEG/PNG/WebP — no data: prefix. */
  photoBase64: z.string().min(100).max(10_000_000),
  /** "image/jpeg" | "image/png" | "image/webp" */
  mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type AnalyzeMealPhotoInput = z.infer<typeof inputSchema>;

const aiResponseSchema = z.object({
  name: z.string(),
  description: z.string().optional().default(''),
  calories: z.number().int().min(0).max(10000),
  protein_g: z.number().int().min(0).max(500),
  carbs_g: z.number().int().min(0).max(1000),
  fats_g: z.number().int().min(0).max(500),
  fiber_g: z.number().int().min(0).max(200),
  confidence: z.number().min(0).max(1),
  items: z
    .array(
      z.object({
        name: z.string(),
        portion: z.string().optional(),
        calories: z.number().int().min(0).max(10000),
      })
    )
    .optional()
    .default([]),
});

export type AnalyzeMealPhotoResult =
  | {
      ok: true;
      photoUrl: string;
      analysis: z.infer<typeof aiResponseSchema>;
    }
  | { ok: false; error: string };

// ─── Action ─────────────────────────────────────────────────────────

/**
 * End-to-end: takes a base64 photo from the camera, uploads it to
 * the meal-photos bucket, sends it to Claude Sonnet vision, parses
 * the structured JSON response, and returns both the photo URL +
 * AI analysis. The meal is NOT saved yet — the client can edit the
 * AI's macros first and then call addMeal() to persist.
 */
export async function analyzeMealPhoto(
  input: AnalyzeMealPhotoInput
): Promise<AnalyzeMealPhotoResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const { photoBase64, mediaType, logDate } = parsed.data;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: 'AI vision is not configured (ANTHROPIC_API_KEY missing on server).',
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: 'Not signed in' };

    // ─── 1. Upload to Supabase Storage ──────────────────────────
    const ext = mediaType === 'image/png' ? 'png' : mediaType === 'image/webp' ? 'webp' : 'jpg';
    const path = `${user.id}/${logDate}/${crypto.randomUUID()}.${ext}`;
    const fileBuffer = Buffer.from(photoBase64, 'base64');

    const { error: uploadError } = await supabase.storage
      .from('meal-photos')
      .upload(path, fileBuffer, {
        contentType: mediaType,
        upsert: false,
      });
    if (uploadError) {
      console.error('[PURE X] meal-photo upload failed:', uploadError);
      return { ok: false, error: `Upload failed: ${uploadError.message}` };
    }

    // Signed URL — 1 year, since the bucket is private but we want
    // the photo to display in the meal history view long-term.
    const { data: signed, error: signError } = await supabase.storage
      .from('meal-photos')
      .createSignedUrl(path, 60 * 60 * 24 * 365);
    if (signError || !signed?.signedUrl) {
      return { ok: false, error: `Could not sign URL: ${signError?.message ?? 'unknown'}` };
    }

    // ─── 2. Call Claude Sonnet vision ───────────────────────────
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      // claude-sonnet-4-5 — current Sonnet generation, strong on
      // structured output and image understanding.
      model: 'claude-sonnet-4-5',
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: photoBase64,
              },
            },
            {
              type: 'text',
              text: 'Analyse this meal. Return only the JSON.',
            },
          ],
        },
      ],
    });

    // ─── 3. Parse the JSON response ─────────────────────────────
    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();

    // Sometimes models wrap JSON in markdown — strip if present.
    const jsonText = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let raw: unknown;
    try {
      raw = JSON.parse(jsonText);
    } catch {
      return {
        ok: false,
        error: `AI returned non-JSON: ${text.slice(0, 200)}`,
      };
    }

    const analysis = aiResponseSchema.safeParse(raw);
    if (!analysis.success) {
      return {
        ok: false,
        error: `AI response shape invalid: ${analysis.error.issues[0]?.message}`,
      };
    }

    return {
      ok: true,
      photoUrl: signed.signedUrl,
      analysis: analysis.data,
    };
  } catch (err) {
    console.error('[PURE X] analyzeMealPhoto failed:', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
