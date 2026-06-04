'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAuth } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';
import {
  APPLICATION_SECTIONS,
  isFieldFilled,
  type Section,
  type Field,
} from '@/lib/data/application-sections';
import { BRAND } from '@/lib/constants';

// ════════════════════════════════════════════════════════════════════
// PUBLIC submission
// ════════════════════════════════════════════════════════════════════

export type SubmitApplicationResult =
  | { ok: true; id: string }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string>;
    };

const baseSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  fullName: z.string().min(2, 'Please enter your full name').max(120),
  whatsapp: z.string().optional().nullable(),
  enquiryId: z.string().uuid().optional().nullable(),
  payload: z.record(z.unknown()),
  // Honeypot
  website: z.string().max(0, '').optional().or(z.literal('')),
});

export async function submitApplication(
  raw: unknown
): Promise<SubmitApplicationResult> {
  const parsed = baseSchema.safeParse(raw);
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

  if ((data.website ?? '').length > 0) {
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }

  // Per-section validation — walks the section config and checks
  // each required field. Builds a Record<sectionKey.fieldKey, msg>
  // so the client can highlight the right input.
  const fieldErrors = validateAgainstSections(data.payload);
  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      error: 'Some required questions are missing answers.',
      fieldErrors,
    };
  }

  const admin = createAdminClient();
  const { data: inserted, error } = await admin
    .from('application_forms')
    .insert({
      enquiry_id: data.enquiryId ?? null,
      full_name: data.fullName.trim(),
      email: data.email.trim().toLowerCase(),
      whatsapp: data.whatsapp ?? null,
      payload: data.payload,
    })
    .select('id')
    .single();

  if (error || !inserted) {
    console.error('[applications] insert failed', error);
    return {
      ok: false,
      error: error?.message ?? 'Could not save your application. Try again.',
    };
  }

  // If linked to an enquiry, transition that enquiry to 'qualified'
  // (the team only sends the application link to qualified leads,
  // so submission confirms the qualification).
  if (data.enquiryId) {
    await admin
      .from('enquiries')
      .update({ status: 'qualified' })
      .eq('id', data.enquiryId)
      .neq('status', 'converted');
  }

  // Fire admin notification email (non-blocking).
  const adminInbox =
    process.env.EMAIL_ADMIN_INBOX?.trim() || BRAND.internalEmail;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
    'https://www.teampurex.com';

  try {
    await sendEmail({
      to: adminInbox,
      subject: `Application received · ${data.fullName.trim()}`,
      html: buildAdminEmailHtml({
        fullName: data.fullName.trim(),
        email: data.email.trim(),
        whatsapp: data.whatsapp ?? '',
        adminLink: `${siteUrl}/admin/applications-detailed/${inserted.id}`,
      }),
    });
  } catch (err) {
    console.error('[applications] notification email failed', err);
  }

  revalidatePath('/admin/applications-detailed');
  if (data.enquiryId) {
    revalidatePath(`/admin/applications/${data.enquiryId}`);
  }

  return { ok: true, id: inserted.id };
}

// ════════════════════════════════════════════════════════════════════
// ADMIN actions
// ════════════════════════════════════════════════════════════════════

const updateApplicationStatusSchema = z.object({
  applicationId: z.string().uuid(),
  status: z.enum(['submitted', 'reviewing', 'onboarded', 'archived']),
});

export type AdminResult = { ok: true } | { ok: false; error: string };

export async function updateApplicationStatus(
  input: z.input<typeof updateApplicationStatusSchema>
): Promise<AdminResult> {
  const adminUser = await requireAuth({ adminOnly: true });
  if (!adminUser) return { ok: false, error: 'Not authorised.' };

  const parsed = updateApplicationStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const admin = createAdminClient();
  const patch: Record<string, string> = { status: parsed.data.status };
  if (parsed.data.status === 'reviewing' || parsed.data.status === 'onboarded') {
    patch.reviewed_by = adminUser.id;
    patch.reviewed_at = new Date().toISOString();
  }

  const { error } = await admin
    .from('application_forms')
    .update(patch)
    .eq('id', parsed.data.applicationId);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/applications-detailed');
  revalidatePath(`/admin/applications-detailed/${parsed.data.applicationId}`);
  return { ok: true };
}

const notesSchema = z.object({
  applicationId: z.string().uuid(),
  notes: z.string().max(5000),
});

export async function updateApplicationNotes(
  input: z.input<typeof notesSchema>
): Promise<AdminResult> {
  const adminUser = await requireAuth({ adminOnly: true });
  if (!adminUser) return { ok: false, error: 'Not authorised.' };

  const parsed = notesSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('application_forms')
    .update({ admin_notes: parsed.data.notes || null })
    .eq('id', parsed.data.applicationId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/applications-detailed/${parsed.data.applicationId}`);
  return { ok: true };
}

// ════════════════════════════════════════════════════════════════════
// Validation helper
// ════════════════════════════════════════════════════════════════════

function validateAgainstSections(
  payload: Record<string, unknown>
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const section of APPLICATION_SECTIONS) {
    const sectionData = (payload[section.key] as Record<string, unknown>) ?? {};
    for (const field of section.fields) {
      if (!field.required) continue;
      const value = sectionData[field.key];
      if (!isFieldFilled(field, value)) {
        errors[`${section.key}.${field.key}`] = `${field.label} is required.`;
      }
    }
  }
  return errors;
}

// ════════════════════════════════════════════════════════════════════
// Email template — minimal, points to admin detail
// ════════════════════════════════════════════════════════════════════

function buildAdminEmailHtml(input: {
  fullName: string;
  email: string;
  whatsapp: string;
  adminLink: string;
}): string {
  const escapeHtml = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  return `<!doctype html>
<html><body style="margin:0;padding:32px 16px;background:#0a0c09;color:#e8eadc;font-family:system-ui,-apple-system,Segoe UI,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
  <table width="540" cellpadding="0" cellspacing="0" style="background:#0f1410;border:1px solid #2a2e23;border-radius:16px;overflow:hidden;">
    <tr><td style="padding:24px 28px 16px 28px;border-bottom:1px solid #2a2e23;">
      <div style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:22px;letter-spacing:-0.5px;">
        <span style="color:#f4f7eb;">PURE</span><span style="color:#c6ff3d;margin-left:4px;">X</span>
      </div>
      <div style="font-family:monospace;font-size:11px;letter-spacing:3px;color:#a0a69a;text-transform:uppercase;margin-top:6px;font-weight:700;">Detailed application received</div>
    </td></tr>
    <tr><td style="padding:24px 28px;">
      <div style="font-size:22px;font-weight:700;color:#f4f7eb;">${escapeHtml(input.fullName)}</div>
      <div style="font-size:14px;color:#a0a69a;margin-top:4px;">
        <a href="mailto:${escapeHtml(input.email)}" style="color:#a0a69a;text-decoration:none;">${escapeHtml(input.email)}</a>
        ${input.whatsapp ? ` · <a href="https://wa.me/91${escapeHtml(input.whatsapp)}" style="color:#25D366;text-decoration:none;">+91 ${escapeHtml(input.whatsapp)}</a>` : ''}
      </div>
      <div style="margin-top:24px;text-align:center;">
        <a href="${escapeHtml(input.adminLink)}" style="display:inline-block;background:#c6ff3d;color:#0a0c09;font-weight:700;font-size:14px;padding:14px 28px;border-radius:999px;text-decoration:none;letter-spacing:0.3px;">Read the full application →</a>
      </div>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}
