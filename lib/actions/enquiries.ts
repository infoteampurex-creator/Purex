'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAuth } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';
import {
  PRIMARY_GOAL_OPTIONS,
  START_TIMING_OPTIONS,
  ENQUIRY_STATUS_LABEL,
  type EnquiryStatus,
} from '@/lib/data/enquiries-types';
import { BRAND } from '@/lib/constants';

// ════════════════════════════════════════════════════════════════════
// PUBLIC submission
// ════════════════════════════════════════════════════════════════════

const onlyDigits = (v: string) => v.replace(/\D/g, '');

const enquirySchema = z.object({
  fullName: z.string().min(2, 'Please enter your full name').max(120),
  whatsapp: z
    .string()
    .transform(onlyDigits)
    .refine((v) => /^[0-9]{10}$/.test(v), 'Enter a 10-digit number'),
  email: z.string().email('Enter a valid email address').max(160),
  primaryGoal: z.enum(
    PRIMARY_GOAL_OPTIONS.map((o) => o.value) as [string, ...string[]]
  ),
  startTiming: z.enum(
    START_TIMING_OPTIONS.map((o) => o.value) as [string, ...string[]]
  ),
  message: z.string().max(1000).optional().nullable(),
  preferredLanguage: z.enum(['en', 'hi']).default('en'),
  consent: z
    .union([z.boolean(), z.string()])
    .transform((v) => v === true || v === 'on' || v === 'true')
    .refine((v) => v === true, 'You must accept the consent box to submit'),
  // Honeypot — must be empty.
  website: z.string().max(0, '').optional().or(z.literal('')),
});

// Internal type — NOT exported. Next 16's Turbopack crashes on
// non-async-function exports from 'use server' files.
type SubmitEnquiryResult =
  | { ok: true; id: string }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string>;
    };

export async function submitEnquiry(
  formData: FormData
): Promise<SubmitEnquiryResult> {
  try {
    return await submitEnquiryInner(formData);
  } catch (err) {
    // Top-level safety net — if anything inside throws (Supabase client
    // init, an unexpected DB error, a Resend SDK crash, a revalidate
    // failure) we never want to bubble a 5xx to the visitor's browser.
    // Log enough context to debug from Vercel logs.
    console.error('[enquiries] UNHANDLED submitEnquiry exception', {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      formKeys: Array.from(formData.keys()),
    });
    return {
      ok: false,
      error:
        'Something went wrong on our side. Please try again, or WhatsApp us directly.',
    };
  }
}

async function submitEnquiryInner(
  formData: FormData
): Promise<SubmitEnquiryResult> {
  const raw = {
    fullName: formData.get('fullName')?.toString() ?? '',
    whatsapp: formData.get('whatsapp')?.toString() ?? '',
    email: formData.get('email')?.toString() ?? '',
    primaryGoal: formData.get('primaryGoal')?.toString() ?? '',
    startTiming: formData.get('startTiming')?.toString() ?? '',
    message: formData.get('message')?.toString() || undefined,
    preferredLanguage:
      (formData.get('preferredLanguage')?.toString() as 'en' | 'hi') || 'en',
    consent: formData.get('consent')?.toString() ?? '',
    website: formData.get('website')?.toString() ?? '',
  };

  const parsed = enquirySchema.safeParse(raw);
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

  // Honeypot belt-and-braces
  if ((raw.website ?? '').length > 0) {
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }

  const admin = createAdminClient();

  // Insert. Source is set from the optional referrer info on the page.
  const source = formData.get('source')?.toString() || null;

  const { data: inserted, error: insertErr } = await admin
    .from('enquiries')
    .insert({
      full_name: data.fullName.trim(),
      whatsapp: data.whatsapp,
      email: data.email.trim().toLowerCase(),
      primary_goal: data.primaryGoal,
      start_timing: data.startTiming,
      message: data.message?.trim() || null,
      preferred_language: data.preferredLanguage,
      source,
    })
    .select('id')
    .single();

  if (insertErr || !inserted) {
    console.error('[enquiries] insert failed', insertErr);
    return {
      ok: false,
      error: insertErr?.message ?? 'Could not save your enquiry. Try again.',
    };
  }

  // ─── Fire admin notification email (non-blocking) ───
  const goalLabel =
    PRIMARY_GOAL_OPTIONS.find((o) => o.value === data.primaryGoal)?.label ??
    data.primaryGoal;
  const timingLabel =
    START_TIMING_OPTIONS.find((o) => o.value === data.startTiming)?.label ??
    data.startTiming;

  const adminInbox =
    process.env.EMAIL_ADMIN_INBOX?.trim() || BRAND.internalEmail;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://www.teampurex.com';

  try {
    await sendEmail({
      to: adminInbox,
      subject: `New PURE X enquiry · ${data.fullName.trim()} · ${goalLabel}`,
      html: buildAdminEmailHtml({
        fullName: data.fullName.trim(),
        email: data.email.trim(),
        whatsapp: data.whatsapp,
        goalLabel,
        timingLabel,
        message: data.message?.trim() ?? '',
        adminLink: `${siteUrl}/admin/applications/${inserted.id}`,
        whatsappLink: `https://wa.me/91${data.whatsapp}`,
      }),
    });
  } catch (err) {
    // Email failure should NOT fail the submission — admin can still
    // see the enquiry in the panel.
    console.error('[enquiries] notification email failed', err);
  }

  revalidatePath('/admin/applications');

  return { ok: true, id: inserted.id };
}

// ════════════════════════════════════════════════════════════════════
// ADMIN actions — update status, assign specialist, add notes
// ════════════════════════════════════════════════════════════════════

const updateStatusSchema = z.object({
  enquiryId: z.string().uuid(),
  status: z.enum([
    'new',
    'contacted',
    'qualified',
    'converted',
    'rejected',
  ]),
});

// Internal type — see note above.
type AdminResult = { ok: true } | { ok: false; error: string };

export async function updateEnquiryStatus(
  input: z.input<typeof updateStatusSchema>
): Promise<AdminResult> {
  const adminUser = await requireAuth({ adminOnly: true });
  if (!adminUser) return { ok: false, error: 'Not authorised.' };

  const parsed = updateStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const admin = createAdminClient();
  const patch: Record<string, string | null> = {
    status: parsed.data.status,
  };
  if (parsed.data.status === 'contacted') {
    patch.contacted_at = new Date().toISOString();
  }
  if (parsed.data.status === 'converted') {
    patch.converted_at = new Date().toISOString();
  }

  const { error } = await admin
    .from('enquiries')
    .update(patch)
    .eq('id', parsed.data.enquiryId);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/applications');
  revalidatePath(`/admin/applications/${parsed.data.enquiryId}`);
  return { ok: true };
}

const assignSchema = z.object({
  enquiryId: z.string().uuid(),
  specialistId: z.string().uuid().nullable(),
});

export async function assignEnquirySpecialist(
  input: z.input<typeof assignSchema>
): Promise<AdminResult> {
  const adminUser = await requireAuth({ adminOnly: true });
  if (!adminUser) return { ok: false, error: 'Not authorised.' };

  const parsed = assignSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('enquiries')
    .update({ assigned_specialist_id: parsed.data.specialistId })
    .eq('id', parsed.data.enquiryId);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/applications');
  revalidatePath(`/admin/applications/${parsed.data.enquiryId}`);
  return { ok: true };
}

// ────────────────────────────────────────────────────────────────────
// Edit applicant fields + admin-captured discovery fields.
// One action because the admin team edits both at once in the same
// panel and it keeps the round-trip count down.
// ────────────────────────────────────────────────────────────────────

const onlyDigitsOpt = (v: string | null | undefined) =>
  (v ?? '').toString().replace(/\D/g, '');

const adminDataSchema = z
  .object({
    // Sales / discovery
    temperature: z.enum(['cold', 'warm', 'hot']).optional(),
    plan_discussed: z
      .enum([
        'one_to_one',
        'group',
        'transformation',
        'nutrition_only',
        'consultation',
        'undecided',
      ])
      .optional(),
    pricing_discussed: z.boolean().optional(),
    budget_inr: z.string().max(80).optional(),
    objections: z.string().max(2000).optional(),
    next_step: z
      .enum([
        'send_application',
        'follow_up',
        'send_pricing',
        'book_call',
        'awaiting_decision',
        'closed_won',
        'closed_lost',
      ])
      .optional(),
    discovery_call_date: z.string().max(40).optional(),
    follow_up_at: z.string().max(40).optional(),
    source_channel: z.string().max(120).optional(),

    // About the client
    age: z.number().int().min(10).max(100).optional(),
    gender: z.enum(['female', 'male', 'prefer_not_to_say']).optional(),
    occupation: z.string().max(160).optional(),
    city_country: z.string().max(160).optional(),
    height_cm: z.number().min(80).max(250).optional(),
    weight_kg: z.number().min(25).max(300).optional(),

    // Medical
    medical_conditions: z
      .array(
        z.enum([
          'thyroid',
          'pcos_pcod',
          'blood_pressure',
          'diabetes',
          'knee_pain',
          'back_pain',
          'asthma',
          'none',
        ])
      )
      .optional(),
    injuries_notes: z.string().max(2000).optional(),
    energy_level: z.number().int().min(1).max(10).optional(),

    // Habits + training
    food_preference: z
      .enum(['vegetarian', 'eggetarian', 'non_vegetarian', 'vegan'])
      .optional(),
    currently_working_out: z.boolean().optional(),
    workout_experience: z
      .enum(['beginner', 'intermediate', 'advanced'])
      .optional(),
    gym_access: z.boolean().optional(),
    training_days_per_week: z.enum(['3', '4', '5', '6']).optional(),

    // Commitment
    commitment_duration: z
      .enum(['3_months', '6_months', '12_months', 'long_term'])
      .optional(),
  })
  .strict();

const updateFieldsSchema = z.object({
  enquiryId: z.string().uuid(),
  fullName: z.string().min(2).max(120).optional(),
  whatsapp: z
    .string()
    .transform(onlyDigitsOpt)
    .refine(
      (v) => v === '' || /^[0-9]{10}$/.test(v),
      'Enter a 10-digit number'
    )
    .optional(),
  email: z.string().email().max(160).optional(),
  primaryGoal: z
    .enum(PRIMARY_GOAL_OPTIONS.map((o) => o.value) as [string, ...string[]])
    .optional(),
  startTiming: z
    .enum(START_TIMING_OPTIONS.map((o) => o.value) as [string, ...string[]])
    .optional(),
  message: z.string().max(2000).nullable().optional(),
  adminData: adminDataSchema.optional(),
});

export async function updateEnquiryFields(
  input: z.input<typeof updateFieldsSchema>
): Promise<AdminResult> {
  const adminUser = await requireAuth({ adminOnly: true });
  if (!adminUser) return { ok: false, error: 'Not authorised.' };

  const parsed = updateFieldsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }

  const d = parsed.data;
  const patch: Record<string, unknown> = {};
  if (d.fullName !== undefined) patch.full_name = d.fullName.trim();
  if (d.whatsapp !== undefined && d.whatsapp !== '') patch.whatsapp = d.whatsapp;
  if (d.email !== undefined) patch.email = d.email.trim().toLowerCase();
  if (d.primaryGoal !== undefined) patch.primary_goal = d.primaryGoal;
  if (d.startTiming !== undefined) patch.start_timing = d.startTiming;
  if (d.message !== undefined) {
    patch.message = d.message ? d.message.trim() : null;
  }
  if (d.adminData !== undefined) {
    // Strip undefineds before storing so the JSONB stays clean.
    const clean: Record<string, unknown> = {};
    Object.entries(d.adminData).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== null) clean[k] = v;
    });
    patch.admin_data = clean;
  }

  if (Object.keys(patch).length === 0) {
    return { ok: true };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('enquiries')
    .update(patch)
    .eq('id', d.enquiryId);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/applications');
  revalidatePath(`/admin/applications/${d.enquiryId}`);
  return { ok: true };
}

// ────────────────────────────────────────────────────────────────────
// Delete an enquiry. Permanent. Admin-only. Used when an application
// is spam, a duplicate, or was created in error.
// ────────────────────────────────────────────────────────────────────

const deleteSchema = z.object({
  enquiryId: z.string().uuid(),
});

export async function deleteEnquiry(
  input: z.input<typeof deleteSchema>
): Promise<AdminResult> {
  const adminUser = await requireAuth({ adminOnly: true });
  if (!adminUser) return { ok: false, error: 'Not authorised.' };

  const parsed = deleteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('enquiries')
    .delete()
    .eq('id', parsed.data.enquiryId);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/applications');
  return { ok: true };
}

const notesSchema = z.object({
  enquiryId: z.string().uuid(),
  notes: z.string().max(5000),
});

export async function updateEnquiryNotes(
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
    .from('enquiries')
    .update({ admin_notes: parsed.data.notes || null })
    .eq('id', parsed.data.enquiryId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/applications/${parsed.data.enquiryId}`);
  return { ok: true };
}

// ════════════════════════════════════════════════════════════════════
// Email HTML template
// ════════════════════════════════════════════════════════════════════

interface NotificationInput {
  fullName: string;
  email: string;
  whatsapp: string;
  goalLabel: string;
  timingLabel: string;
  message: string;
  adminLink: string;
  whatsappLink: string;
}

function buildAdminEmailHtml(input: NotificationInput): string {
  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#0a0c09;color:#e8eadc;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0c09;padding:32px 16px;">
  <tr>
    <td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#0f1410;border:1px solid #2a2e23;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="padding:28px 32px 18px 32px;border-bottom:1px solid #2a2e23;">
            <div style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-weight:800;font-size:24px;letter-spacing:-0.5px;">
              <span style="color:#f4f7eb;">PURE</span><span style="color:#c6ff3d;margin-left:4px;">X</span>
            </div>
            <div style="font-family:monospace;font-size:11px;letter-spacing:3px;color:#a0a69a;text-transform:uppercase;margin-top:6px;font-weight:700;">New enquiry</div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px;">
            <div style="font-size:13px;color:#a0a69a;text-transform:uppercase;letter-spacing:2px;font-weight:700;margin-bottom:8px;">From</div>
            <div style="font-size:22px;font-weight:700;color:#f4f7eb;">${escapeHtml(input.fullName)}</div>
            <div style="font-size:14px;color:#a0a69a;margin-top:4px;">
              <a href="mailto:${escapeHtml(input.email)}" style="color:#a0a69a;text-decoration:none;">${escapeHtml(input.email)}</a>
              ·
              <a href="${escapeHtml(input.whatsappLink)}" style="color:#25D366;text-decoration:none;">+91 ${escapeHtml(input.whatsapp)}</a>
            </div>

            <table cellpadding="0" cellspacing="0" style="margin-top:24px;width:100%;">
              <tr>
                <td style="background:#15110a;border:1px solid #2a2e23;border-radius:10px;padding:14px 16px;">
                  <div style="font-family:monospace;font-size:10px;letter-spacing:2px;color:#c6ff3d;text-transform:uppercase;font-weight:700;">Goal</div>
                  <div style="font-size:16px;color:#f4f7eb;margin-top:4px;font-weight:600;">${escapeHtml(input.goalLabel)}</div>
                </td>
              </tr>
              <tr><td style="height:8px;"></td></tr>
              <tr>
                <td style="background:#15110a;border:1px solid #2a2e23;border-radius:10px;padding:14px 16px;">
                  <div style="font-family:monospace;font-size:10px;letter-spacing:2px;color:#c6ff3d;text-transform:uppercase;font-weight:700;">Can start</div>
                  <div style="font-size:16px;color:#f4f7eb;margin-top:4px;font-weight:600;">${escapeHtml(input.timingLabel)}</div>
                </td>
              </tr>
              ${
                input.message
                  ? `<tr><td style="height:8px;"></td></tr>
              <tr>
                <td style="background:#15110a;border:1px solid #2a2e23;border-radius:10px;padding:14px 16px;">
                  <div style="font-family:monospace;font-size:10px;letter-spacing:2px;color:#c6ff3d;text-transform:uppercase;font-weight:700;">Message</div>
                  <div style="font-size:14px;color:#e8eadc;margin-top:6px;line-height:1.5;white-space:pre-wrap;">${escapeHtml(input.message)}</div>
                </td>
              </tr>`
                  : ''
              }
            </table>

            <div style="margin-top:28px;text-align:center;">
              <a href="${escapeHtml(input.adminLink)}" style="display:inline-block;background:#c6ff3d;color:#0a0c09;font-weight:700;font-size:14px;padding:14px 28px;border-radius:999px;text-decoration:none;letter-spacing:0.3px;">
                Open in admin →
              </a>
            </div>
            <div style="margin-top:14px;text-align:center;">
              <a href="${escapeHtml(input.whatsappLink)}" style="color:#25D366;text-decoration:none;font-size:13px;font-weight:600;">
                Reach out on WhatsApp
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 32px;border-top:1px solid #2a2e23;text-align:center;font-size:11px;color:#5a6055;font-family:monospace;letter-spacing:1px;text-transform:uppercase;">
            Train for life. Not just aesthetics.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// NOTE: do not re-export types or constants from this file. Next 16's
// stricter Turbopack pipeline for 'use server' files only allows
// exported ASYNC FUNCTIONS — re-exporting types or values crashes
// the module load with ReferenceError at runtime. Consumers should
// import directly from '@/lib/data/enquiries-types' instead.
