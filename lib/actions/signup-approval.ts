'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAuth } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';
import { welcomeEmail, rejectionEmail } from '@/lib/email/templates';

// ─── Schemas ───────────────────────────────────────────────────────

const idSchema = z.object({
  userId: z.string().uuid(),
});

export type SignupApprovalResult =
  | { ok: true; emailSent: boolean }
  | { ok: false; error: string };

// ─── approveSignup ─────────────────────────────────────────────────

export async function approveSignup(
  input: z.infer<typeof idSchema>
): Promise<SignupApprovalResult> {
  const adminUser = await requireAuth({ adminOnly: true });
  if (!adminUser) {
    return { ok: false, error: 'Not authorised. Admin access required.' };
  }

  const parsed = idSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const admin = createAdminClient();

  // Update status + record audit fields.
  const { data: updated, error } = await admin
    .from('profiles')
    .update({
      signup_status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: adminUser.id,
    })
    .eq('id', parsed.data.userId)
    .select('email, full_name, first_name')
    .single();

  if (error || !updated) {
    console.error('[approveSignup] update failed:', error);
    return {
      ok: false,
      error: error?.message ?? 'Could not update the profile.',
    };
  }

  // Send welcome email. Non-blocking — if Resend isn't configured the
  // action still succeeds; admin can WhatsApp the client manually.
  const firstName =
    updated.first_name ??
    updated.full_name?.split(/\s+/)[0] ??
    'there';

  const { subject, html, text } = welcomeEmail({ firstName });
  const emailResult = await sendEmail({
    to: updated.email,
    subject,
    html,
    text,
  });

  revalidatePath('/admin/clients');
  revalidatePath('/admin/dashboard');

  return { ok: true, emailSent: emailResult.ok };
}

// ─── rejectSignup ──────────────────────────────────────────────────

export async function rejectSignup(
  input: z.infer<typeof idSchema>
): Promise<SignupApprovalResult> {
  const adminUser = await requireAuth({ adminOnly: true });
  if (!adminUser) {
    return { ok: false, error: 'Not authorised. Admin access required.' };
  }

  const parsed = idSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const admin = createAdminClient();

  const { data: updated, error } = await admin
    .from('profiles')
    .update({
      signup_status: 'rejected',
      approved_at: new Date().toISOString(),
      approved_by: adminUser.id,
    })
    .eq('id', parsed.data.userId)
    .select('email, full_name, first_name')
    .single();

  if (error || !updated) {
    console.error('[rejectSignup] update failed:', error);
    return {
      ok: false,
      error: error?.message ?? 'Could not update the profile.',
    };
  }

  const firstName =
    updated.first_name ??
    updated.full_name?.split(/\s+/)[0] ??
    'there';

  const { subject, html, text } = rejectionEmail({ firstName });
  const emailResult = await sendEmail({
    to: updated.email,
    subject,
    html,
    text,
  });

  revalidatePath('/admin/clients');
  revalidatePath('/admin/dashboard');

  return { ok: true, emailSent: emailResult.ok };
}
