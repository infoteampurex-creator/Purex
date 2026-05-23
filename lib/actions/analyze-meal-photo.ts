'use server';

import { GoogleGenerativeAI, SchemaType, type Schema } from '@google/generative-ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// ─── AI prompt ──────────────────────────────────────────────────────

/**
 * System prompt tuned for Indian food + portion sizes. Gemini's
 * JSON Mode + responseSchema enforce shape; the prompt focuses on
 * domain calibration rather than format wrangling.
 */
const SYSTEM_INSTRUCTION = `You are a nutrition analyst specialised in Indian cuisine.

Identify the food visible in the user's photo and estimate the
macros for the visible portion. Use Indian serving conventions
(katori, cup, roti pieces, idli count, etc.) and assume typical
Indian home-cooking preparations unless visual cues suggest otherwise.

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

// Strict JSON shape — Gemini honours this via responseSchema.
const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    name: { type: SchemaType.STRING, description: 'Short human label of the dish, max 80 chars' },
    description: { type: SchemaType.STRING, description: 'One sentence describing the dish and portion' },
    calories: { type: SchemaType.INTEGER, description: 'Estimated total calories (kcal)' },
    protein_g: { type: SchemaType.INTEGER, description: 'Grams of protein' },
    carbs_g: { type: SchemaType.INTEGER, description: 'Grams of carbohydrates' },
    fats_g: { type: SchemaType.INTEGER, description: 'Grams of fat' },
    fiber_g: { type: SchemaType.INTEGER, description: 'Grams of fiber' },
    confidence: {
      type: SchemaType.NUMBER,
      description: '0 to 1 — confidence in the macro estimate',
    },
    items: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          portion: { type: SchemaType.STRING },
          calories: { type: SchemaType.INTEGER },
        },
        required: ['name', 'calories'],
      },
    },
  },
  required: [
    'name',
    'description',
    'calories',
    'protein_g',
    'carbs_g',
    'fats_g',
    'fiber_g',
    'confidence',
  ],
};

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
 * the meal-photos bucket, sends it to Gemini 2.0 Flash, parses the
 * structured JSON response, returns both the photo URL + AI analysis.
 *
 * Gemini was chosen over Claude / GPT-4o because cost-per-scan is
 * ~100x lower (~₹0.025 vs ₹0.80) and Google's free tier (1500
 * req/day) covers early-stage usage with no spend at all. Quality
 * on Indian portions is slightly weaker than Claude — acceptable
 * since the user reviews and edits the macros before saving.
 */
export async function analyzeMealPhoto(
  input: AnalyzeMealPhotoInput
): Promise<AnalyzeMealPhotoResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const { photoBase64, mediaType, logDate } = parsed.data;

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: 'AI vision is not configured (GOOGLE_AI_API_KEY missing on server).',
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

    // ─── 2. Call Gemini 2.0 Flash ───────────────────────────────
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      // gemini-2.0-flash: best price/quality for image understanding
      // in late 2025 / 2026. Free tier: 1500 req/day. Paid: ~$0.0003
      // per image-in scan.
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema,
        // Conservative — encourages estimates over creativity
        temperature: 0.2,
        maxOutputTokens: 800,
      },
    });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mediaType,
          data: photoBase64,
        },
      },
      {
        text: 'Analyse this meal. Return only the JSON object — no prose.',
      },
    ]);

    const text = result.response.text().trim();

    let raw: unknown;
    try {
      raw = JSON.parse(text);
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
