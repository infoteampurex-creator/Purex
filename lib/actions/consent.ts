'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { z } from 'zod';
import { requireAuth } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { CURRENT_CONSENT_VERSION } from '@/lib/data/consent-text';

// ════════════════════════════════════════════════════════════════════
// Client consent signing + withdrawal.
//
// 'use server' file → only async functions exported (Next 16 Turbopack
// constraint we've already hit twice on this codebase).
// ════════════════════════════════════════════════════════════════════

type Result = { ok: true } | { ok: false; error: string };

const signSchema = z.object({
  signedName: z.string().trim().min(2, 'Please type your full name').max(160),
  agreedToTerms: z.boolean(),
  agreedToDataCollection: z.boolean(),
  agreedToProgressPhotos: z.boolean(),
  agreedToMarketingUse: z.boolean(),
  agreedToWhatsapp: z.boolean(),
  agreedToEmail: z.boolean(),
  agreedToPhone: z.boolean(),
  agreedToPush: z.boolean(),
  /** Hidden honeypot. Must be empty. */
  website: z.string().max(0).optional().or(z.literal('')),
  /** Where to send the user after signing (relative path only). */
  redirectTo: z.string().optional(),
});

export async function signConsent(
  input: z.input<typeof signSchema>
): Promise<Result> {
  const user = await requireAuth();
  if (!user) return { ok: false, error: 'Please sign in again.' };

  const parsed = signSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }
  const d = parsed.data;

  if ((d.website ?? '').length > 0) {
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }

  // Mandatory boxes must be ticked.
  if (!d.agreedToTerms || !d.agreedToDataCollection) {
    return {
      ok: false,
      error:
        'You must agree to the terms and to data collection in order to use the app.',
    };
  }

  // Capture audit metadata.
  const hdrs = await headers();
  const ip =
    hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    hdrs.get('x-real-ip') ??
    null;
  const userAgent = hdrs.get('user-agent') ?? null;

  const admin = createAdminClient();
  const { error } = await admin.from('client_consent_records').insert({
    user_id: user.id,
    consent_version: CURRENT_CONSENT_VERSION,
    signed_name: d.signedName.trim(),
    agreed_to_terms: d.agreedToTerms,
    agreed_to_data_collection: d.agreedToDataCollection,
    agreed_to_progress_photos: d.agreedToProgressPhotos,
    agreed_to_marketing_use: d.agreedToMarketingUse,
    agreed_to_whatsapp: d.agreedToWhatsapp,
    agreed_to_email: d.agreedToEmail,
    agreed_to_phone: d.agreedToPhone,
    agreed_to_push: d.agreedToPush,
    ip_address: ip,
    user_agent: userAgent,
  });

  if (error) {
    console.error('[consent] insert failed', error);
    return { ok: false, error: error.message };
  }

  revalidatePath('/client', 'layout');

  // Server-side redirect after success — Next 15+ pattern: throw a
  // redirect() from inside the action. We do this after the insert
  // so a failure surfaces the error to the form instead of bouncing.
  const target =
    d.redirectTo && d.redirectTo.startsWith('/')
      ? d.redirectTo
      : '/client/dashboard';
  redirect(target);
}

const withdrawSchema = z.object({
  consentRecordId: z.string().uuid().optional(),
  reason: z.string().max(2000).optional(),
});

/**
 * Mark the user's currently-active consent record as withdrawn.
 * After this they will be re-prompted to sign on next /client/* visit.
 * If `consentRecordId` is omitted we withdraw the latest active row.
 */
export async function withdrawConsent(
  input: z.input<typeof withdrawSchema>
): Promise<Result> {
  const user = await requireAuth();
  if (!user) return { ok: false, error: 'Please sign in again.' };

  const parsed = withdrawSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }

  const admin = createAdminClient();

  // Find the latest active record for this user if no id given.
  let targetId = parsed.data.consentRecordId;
  if (!targetId) {
    const { data: latest } = await admin
      .from('client_consent_records')
      .select('id')
      .eq('user_id', user.id)
      .is('withdrawn_at', null)
      .order('signed_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!latest) {
      return { ok: false, error: 'No active consent on file to withdraw.' };
    }
    targetId = (latest as { id: string }).id;
  }

  const { error } = await admin
    .from('client_consent_records')
    .update({
      withdrawn_at: new Date().toISOString(),
      withdrawn_reason: parsed.data.reason?.trim() || null,
    })
    .eq('id', targetId)
    .eq('user_id', user.id); // belt-and-braces: never let one user touch another's record

  if (error) {
    console.error('[consent] withdraw failed', error);
    return { ok: false, error: error.message };
  }

  revalidatePath('/client', 'layout');
  return { ok: true };
}
