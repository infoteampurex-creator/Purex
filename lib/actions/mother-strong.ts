'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { z } from 'zod';
import sharp from 'sharp';
import { requireAuth } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { CHALLENGE_DURATION_DAYS } from '@/lib/data/mother-strong-types';

// ════════════════════════════════════════════════════════════════════
// REGISTRATION (public)
// ════════════════════════════════════════════════════════════════════

const onlyDigits = (v: string) => v.replace(/\D/g, '');

const registerSchema = z.object({
  fullName: z.string().min(2, 'Please enter your full name').max(120),
  whatsapp: z
    .string()
    .transform(onlyDigits)
    .refine((v) => /^[0-9]{10}$/.test(v), 'Please enter a 10-digit number'),
  age: z.coerce
    .number()
    .int()
    .min(18, 'You must be 18 or older to join')
    .max(110),
  city: z.string().min(1, 'City is required').max(80),
  state: z.string().min(1, 'State is required').max(80),
  showPhotoPublicly: z.coerce.boolean().default(true),
  heightCm: z.coerce.number().min(100).max(250).optional().nullable(),
  weightKg: z.coerce.number().min(25).max(250).optional().nullable(),
  goal: z.enum([
    'weight_loss',
    'hormonal_balance',
    'daily_activity',
    'stress_mental_health',
    'general_fitness',
    'doctors_advice',
  ]),
  healthCondition: z.string().max(500).optional().nullable(),
  emergencyContactName: z.string().min(2, 'Emergency contact name required').max(120),
  emergencyContactNumber: z
    .string()
    .transform(onlyDigits)
    .refine((v) => /^[0-9]{10}$/.test(v), 'Please enter a 10-digit number'),
  preferredLanguage: z.enum(['en', 'hi']).default('en'),
  consent: z
    .union([z.boolean(), z.string()])
    .transform((v) => v === true || v === 'on' || v === 'true')
    .refine((v) => v === true, 'You must accept the consent box to register'),
  // Honeypot — must be empty. Bots fill in everything.
  website: z.string().max(0, '').optional().or(z.literal('')),
});

export type RegisterParticipantInput = z.input<typeof registerSchema>;

export type RegisterParticipantResult =
  | {
      ok: true;
      displayId: string;
      endDate: string;
      whatsappGroupLink: string | null;
    }
  | {
      ok: false;
      error: string;
      duplicate?: boolean;
      fieldErrors?: Record<string, string>;
    };

/**
 * Public registration server action. Validates, compresses the photo,
 * uploads to Storage, inserts the participant row, and returns the
 * info the success screen needs.
 *
 * - Honeypot field `website` must be empty.
 * - Photo is compressed server-side to 800×800 max, ~85% JPEG quality.
 * - WhatsApp uniqueness is enforced by the DB; duplicates return a
 *   friendly message so we can link the user to their leaderboard row.
 */
export async function registerParticipant(
  formData: FormData
): Promise<RegisterParticipantResult> {
  // Pull form fields. `formData.get()` returns string | File | null.
  const raw = {
    fullName: formData.get('fullName')?.toString() ?? '',
    whatsapp: formData.get('whatsapp')?.toString() ?? '',
    age: formData.get('age')?.toString() ?? '',
    city: formData.get('city')?.toString() ?? '',
    state: formData.get('state')?.toString() ?? '',
    showPhotoPublicly:
      formData.get('showPhotoPublicly')?.toString() === 'on' ||
      formData.get('showPhotoPublicly')?.toString() === 'true',
    heightCm: formData.get('heightCm')?.toString() || undefined,
    weightKg: formData.get('weightKg')?.toString() || undefined,
    goal: formData.get('goal')?.toString() ?? '',
    healthCondition: formData.get('healthCondition')?.toString() || undefined,
    emergencyContactName: formData.get('emergencyContactName')?.toString() ?? '',
    emergencyContactNumber: formData.get('emergencyContactNumber')?.toString() ?? '',
    preferredLanguage:
      (formData.get('preferredLanguage')?.toString() as 'en' | 'hi') || 'en',
    consent: formData.get('consent')?.toString() ?? '',
    website: formData.get('website')?.toString() ?? '',
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const key = issue.path[0] as string | undefined;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    });
    return {
      ok: false,
      error: 'Please fix the highlighted fields and try again.',
      fieldErrors,
    };
  }

  const data = parsed.data;
  const admin = createAdminClient();

  // Honeypot already drained by schema (max length 0). Belt-and-braces:
  if ((raw.website ?? '').length > 0) {
    // Silently succeed-looking response — don't tell the bot it failed.
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }

  // ─── Duplicate check (friendlier message than the unique-constraint error) ───
  const { data: existing } = await admin
    .from('mother_strong_participants')
    .select('display_id')
    .eq('whatsapp', data.whatsapp)
    .maybeSingle();

  if (existing) {
    return {
      ok: false,
      duplicate: true,
      error: 'This WhatsApp number is already registered.',
    };
  }

  // ─── Photo (optional) — compress + upload ───
  const photoFile = formData.get('photo');
  let photoUrl: string | null = null;

  if (photoFile && photoFile instanceof File && photoFile.size > 0) {
    try {
      const inputBuffer = Buffer.from(await photoFile.arrayBuffer());
      const optimised = await sharp(inputBuffer)
        .rotate() // honour EXIF orientation
        .resize({ width: 800, height: 800, fit: 'cover', position: 'attention' })
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer();

      // Path: profiles/<whatsapp>-<timestamp>.jpg — display_id is
      // generated by the DB on insert, so we use whatsapp + timestamp
      // for the storage key (it's deterministic to the participant).
      const path = `profiles/${data.whatsapp}-${Date.now()}.jpg`;
      const { error: uploadErr } = await admin.storage
        .from('mother-strong-photos')
        .upload(path, optimised, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadErr) {
        console.error('[mother-strong] photo upload failed', uploadErr);
      } else {
        const { data: pub } = admin.storage
          .from('mother-strong-photos')
          .getPublicUrl(path);
        photoUrl = pub.publicUrl;
      }
    } catch (err) {
      console.error('[mother-strong] photo compression threw', err);
      // Non-blocking — registration proceeds without a photo.
    }
  }

  // ─── Insert the participant ───
  const today = new Date().toISOString().slice(0, 10);
  const endDate = addDaysIso(today, CHALLENGE_DURATION_DAYS - 1);

  const { data: inserted, error: insertErr } = await admin
    .from('mother_strong_participants')
    .insert({
      full_name: data.fullName.trim(),
      whatsapp: data.whatsapp,
      age: data.age,
      city: data.city.trim(),
      state: data.state.trim(),
      photo_url: photoUrl,
      show_photo_publicly: data.showPhotoPublicly,
      height_cm: data.heightCm ?? null,
      weight_kg: data.weightKg ?? null,
      goal: data.goal,
      health_condition: data.healthCondition?.trim() || null,
      emergency_contact_name: data.emergencyContactName.trim(),
      emergency_contact_number: data.emergencyContactNumber,
      preferred_language: data.preferredLanguage,
      start_date: today,
      end_date: endDate,
    })
    .select('display_id, end_date')
    .single();

  if (insertErr || !inserted) {
    // 23505 is the unique-constraint code in case the duplicate check
    // raced. Treat it like a friendly duplicate, not a crash.
    if (insertErr?.code === '23505') {
      return {
        ok: false,
        duplicate: true,
        error: 'This WhatsApp number is already registered.',
      };
    }
    console.error('[mother-strong] insert failed', insertErr);
    return {
      ok: false,
      error: insertErr?.message ?? 'Could not save your registration. Try again.',
    };
  }

  // Fetch the WhatsApp group link for the success screen.
  const { data: cfg } = await admin
    .from('mother_strong_config')
    .select('whatsapp_group_link')
    .eq('id', 1)
    .maybeSingle();

  updateTag('mother-strong-leaderboard');
  revalidatePath('/mother-strong');
  revalidatePath('/mother-strong/leaderboard');

  return {
    ok: true,
    displayId: inserted.display_id,
    endDate: inserted.end_date,
    whatsappGroupLink: cfg?.whatsapp_group_link ?? null,
  };
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ════════════════════════════════════════════════════════════════════
// DAILY ENTRY (admin)
// ════════════════════════════════════════════════════════════════════

const upsertEntrySchema = z.object({
  participantId: z.string().uuid(),
  dayNumber: z.coerce.number().int().min(1).max(CHALLENGE_DURATION_DAYS),
  stepCount: z.coerce.number().int().min(0).max(200000),
});

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Single cell update from the admin daily-entry grid. Upserts on the
 * (participant_id, day_number) unique key so editing an existing cell
 * is the same call as adding a new one.
 */
export async function upsertDailyEntry(
  input: z.input<typeof upsertEntrySchema>
): Promise<ActionResult> {
  const adminUser = await requireAuth({ adminOnly: true });
  if (!adminUser) return { ok: false, error: 'Not authorised.' };

  const parsed = upsertEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('mother_strong_daily_entries')
    .upsert(
      {
        participant_id: parsed.data.participantId,
        day_number: parsed.data.dayNumber,
        step_count: parsed.data.stepCount,
        entered_at: new Date().toISOString(),
        entered_by: adminUser.id,
      },
      { onConflict: 'participant_id,day_number' }
    );

  if (error) {
    console.error('[mother-strong] daily entry upsert failed', error);
    return { ok: false, error: error.message };
  }

  updateTag('mother-strong-leaderboard');
  revalidatePath('/mother-strong/leaderboard');
  revalidatePath('/mother-strong/my-progress');
  revalidatePath('/admin/mother-strong');

  return { ok: true };
}

/**
 * Bulk-paste handler. Trainer pastes N step counts (one per line)
 * starting at a given participant + day; we upsert them sequentially.
 */
const bulkPasteSchema = z.object({
  participantId: z.string().uuid(),
  startDay: z.coerce.number().int().min(1).max(CHALLENGE_DURATION_DAYS),
  counts: z.array(z.coerce.number().int().min(0).max(200000)),
});

export async function bulkPasteEntries(
  input: z.input<typeof bulkPasteSchema>
): Promise<ActionResult> {
  const adminUser = await requireAuth({ adminOnly: true });
  if (!adminUser) return { ok: false, error: 'Not authorised.' };

  const parsed = bulkPasteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const { participantId, startDay, counts } = parsed.data;
  if (counts.length === 0) return { ok: true };
  if (startDay + counts.length - 1 > CHALLENGE_DURATION_DAYS) {
    return {
      ok: false,
      error: `Bulk paste would write past Day ${CHALLENGE_DURATION_DAYS}.`,
    };
  }

  const admin = createAdminClient();
  const rows = counts.map((stepCount, i) => ({
    participant_id: participantId,
    day_number: startDay + i,
    step_count: stepCount,
    entered_at: new Date().toISOString(),
    entered_by: adminUser.id,
  }));

  const { error } = await admin
    .from('mother_strong_daily_entries')
    .upsert(rows, { onConflict: 'participant_id,day_number' });

  if (error) {
    console.error('[mother-strong] bulk paste failed', error);
    return { ok: false, error: error.message };
  }

  updateTag('mother-strong-leaderboard');
  revalidatePath('/mother-strong/leaderboard');
  revalidatePath('/admin/mother-strong');

  return { ok: true };
}

// ════════════════════════════════════════════════════════════════════
// STATUS + CONFIG (admin)
// ════════════════════════════════════════════════════════════════════

const setStatusSchema = z.object({
  participantId: z.string().uuid(),
  status: z.enum(['active', 'dropped', 'completed']),
});

export async function setParticipantStatus(
  input: z.input<typeof setStatusSchema>
): Promise<ActionResult> {
  const adminUser = await requireAuth({ adminOnly: true });
  if (!adminUser) return { ok: false, error: 'Not authorised.' };

  const parsed = setStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('mother_strong_participants')
    .update({ status: parsed.data.status })
    .eq('id', parsed.data.participantId);

  if (error) return { ok: false, error: error.message };

  updateTag('mother-strong-leaderboard');
  revalidatePath('/admin/mother-strong');
  revalidatePath('/mother-strong/leaderboard');

  return { ok: true };
}

const updateConfigSchema = z.object({
  challengeStartDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  dailyGoal: z.coerce.number().int().min(1000).max(50000).optional(),
  whatsappGroupLink: z.string().url().or(z.literal('')).optional(),
  cohortLabel: z.string().max(120).optional(),
});

export async function updateMotherStrongConfig(
  input: z.input<typeof updateConfigSchema>
): Promise<ActionResult> {
  const adminUser = await requireAuth({ adminOnly: true });
  if (!adminUser) return { ok: false, error: 'Not authorised.' };

  const parsed = updateConfigSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const admin = createAdminClient();
  const patch: Record<string, string | number | null> = {
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.challengeStartDate !== undefined) {
    patch.challenge_start_date = parsed.data.challengeStartDate;
  }
  if (parsed.data.dailyGoal !== undefined) {
    patch.daily_goal = parsed.data.dailyGoal;
  }
  if (parsed.data.whatsappGroupLink !== undefined) {
    patch.whatsapp_group_link = parsed.data.whatsappGroupLink || null;
  }
  if (parsed.data.cohortLabel !== undefined) {
    patch.cohort_label = parsed.data.cohortLabel;
  }

  const { error } = await admin
    .from('mother_strong_config')
    .update(patch)
    .eq('id', 1);

  if (error) return { ok: false, error: error.message };

  updateTag('mother-strong-leaderboard');
  revalidatePath('/admin/mother-strong');
  revalidatePath('/mother-strong');

  return { ok: true };
}

// ════════════════════════════════════════════════════════════════════
// JOURNEY POSTS (admin)
// ════════════════════════════════════════════════════════════════════

export type JourneyPostResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

const journeyPostSchema = z.object({
  participantId: z.string().uuid().optional().nullable(),
  caption: z.string().max(500).optional().nullable(),
  dayNumber: z.coerce.number().int().min(1).max(CHALLENGE_DURATION_DAYS).optional().nullable(),
});

/**
 * Admin upload to the public journey feed. Accepts a FormData with
 * an `image` File plus optional caption / participant link / day.
 */
export async function createJourneyPost(
  formData: FormData
): Promise<JourneyPostResult> {
  const adminUser = await requireAuth({ adminOnly: true });
  if (!adminUser) return { ok: false, error: 'Not authorised.' };

  const raw = {
    participantId: formData.get('participantId')?.toString() || undefined,
    caption: formData.get('caption')?.toString() || undefined,
    dayNumber: formData.get('dayNumber')?.toString() || undefined,
  };
  const parsed = journeyPostSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const imageFile = formData.get('image');
  if (!imageFile || !(imageFile instanceof File) || imageFile.size === 0) {
    return { ok: false, error: 'Please attach an image.' };
  }

  const admin = createAdminClient();
  try {
    const buf = Buffer.from(await imageFile.arrayBuffer());
    // Journey photos are wider — keep more horizontal range than a
    // headshot. Max 1200×1200, 85% JPEG.
    const optimised = await sharp(buf)
      .rotate()
      .resize({ width: 1200, height: 1200, fit: 'inside' })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();

    const path = `journey/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { error: upErr } = await admin.storage
      .from('mother-strong-photos')
      .upload(path, optimised, { contentType: 'image/jpeg' });

    if (upErr) return { ok: false, error: upErr.message };

    const { data: pub } = admin.storage
      .from('mother-strong-photos')
      .getPublicUrl(path);

    const { data: inserted, error } = await admin
      .from('mother_strong_journey_posts')
      .insert({
        participant_id: parsed.data.participantId ?? null,
        caption: parsed.data.caption ?? null,
        image_url: pub.publicUrl,
        day_number: parsed.data.dayNumber ?? null,
        posted_by: adminUser.id,
      })
      .select('id')
      .single();

    if (error || !inserted) {
      return { ok: false, error: error?.message ?? 'Could not save the post.' };
    }

    revalidatePath('/mother-strong');
    revalidatePath('/admin/mother-strong');

    return { ok: true, id: inserted.id };
  } catch (err) {
    console.error('[mother-strong] journey post failed', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

const deleteJourneySchema = z.object({ id: z.string().uuid() });

export async function deleteJourneyPost(
  input: z.input<typeof deleteJourneySchema>
): Promise<ActionResult> {
  const adminUser = await requireAuth({ adminOnly: true });
  if (!adminUser) return { ok: false, error: 'Not authorised.' };

  const parsed = deleteJourneySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Invalid input' };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('mother_strong_journey_posts')
    .delete()
    .eq('id', parsed.data.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/mother-strong');
  revalidatePath('/admin/mother-strong');

  return { ok: true };
}
