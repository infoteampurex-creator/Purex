'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAuth } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { FALLBACK_PROGRAMS } from '@/lib/constants';

// ─── Schema ────────────────────────────────────────────────────────────

const createClientSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(80),
  phone: z.string().max(40).optional(),
  planSlug: z.string().optional(),
  coachSlug: z.string().optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;

export type CreateClientResult =
  | {
      ok: true;
      clientId: string;
      tempPassword: string;
    }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string>;
    };

// ─── Helpers ───────────────────────────────────────────────────────────

/**
 * 16-char URL-safe temp password. The trainer shares this with the client
 * via WhatsApp; the client changes it on first login.
 */
function generateTempPassword(): string {
  const alphabet =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

function planTierFromSlug(
  slug: string | undefined
): 'fit_check' | 'online_live' | 'personal_transformation' | 'elite_couple' | null {
  if (!slug) return null;
  // Best-effort mapping from program slug to plan_tier enum.
  // Unknown slugs fall through to null (plan_tier is nullable).
  if (slug.includes('foundation') || slug.includes('fit')) return 'fit_check';
  if (slug.includes('online') || slug.includes('live')) return 'online_live';
  if (slug.includes('elite') || slug.includes('couple')) return 'elite_couple';
  if (slug.includes('core') || slug.includes('personal') || slug.includes('transformation'))
    return 'personal_transformation';
  return null;
}

// ─── Action ────────────────────────────────────────────────────────────

/**
 * Create a client account from the admin panel.
 *
 * Flow:
 *   1. Verify caller is admin (RLS-bypassing code below requires this).
 *   2. Generate a temp password.
 *   3. Use the service-role admin API to create the auth user with
 *      email_confirm: true (no confirmation email sent).
 *   4. Update the profile row (the on-signup trigger creates it; we add
 *      phone/first_name).
 *   5. Insert a client_plans row if a plan was selected, looking up the
 *      assigned expert by slug when possible.
 *   6. Return the temp password so the modal can display it for sharing.
 *
 * The trainer shares the temp password via WhatsApp; the client changes
 * it on first login.
 */
export async function createClientFromAdmin(
  input: CreateClientInput
): Promise<CreateClientResult> {
  // ─── 1. Authorise caller ────────────────────────────────────────────
  const adminUser = await requireAuth({ adminOnly: true });
  if (!adminUser) {
    return { ok: false, error: 'Not authorised. Admin access required.' };
  }

  // ─── 2. Validate input ──────────────────────────────────────────────
  const parsed = createClientSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const key = issue.path[0] as string | undefined;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    });
    return {
      ok: false,
      error: 'Please fix the highlighted fields.',
      fieldErrors,
    };
  }

  const { email, fullName, phone, planSlug, coachSlug } = parsed.data;
  const firstName = fullName.split(/\s+/)[0] ?? fullName;

  // ─── 3. Create the auth user (no confirmation email) ────────────────
  const admin = createAdminClient();

  const tempPassword = generateTempPassword();

  const { data: createdUser, error: createUserError } =
    await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        // Tells the handle_new_user trigger (00012) to auto-approve
        // this account instead of dropping it into pending_approval.
        admin_created: true,
      },
    });

  if (createUserError || !createdUser.user) {
    // Common case: email already registered.
    const message = createUserError?.message ?? 'Could not create the account.';
    const isDuplicate =
      message.toLowerCase().includes('already') ||
      message.toLowerCase().includes('registered') ||
      message.toLowerCase().includes('duplicate');
    return {
      ok: false,
      error: isDuplicate
        ? 'An account with this email already exists.'
        : message,
      fieldErrors: isDuplicate ? { email: 'Email already in use' } : undefined,
    };
  }

  const clientId = createdUser.user.id;

  // ─── 4. Fill in extra profile fields ────────────────────────────────
  // The on-signup trigger has created the row; update phone/first_name.
  const { error: profileError } = await admin
    .from('profiles')
    .update({
      full_name: fullName,
      first_name: firstName,
      phone: phone ?? null,
      role: 'user',
    })
    .eq('id', clientId);

  if (profileError) {
    // Profile update failed but auth user exists — surface it but don't
    // block. The user can still log in; admin can edit the profile later.
    console.error('[createClientFromAdmin] profile update failed:', profileError);
  }

  // ─── 5. Insert client_plans row if a plan was selected ──────────────
  if (planSlug) {
    const program = FALLBACK_PROGRAMS.find((p) => p.slug === planSlug);
    const planName = program?.name ?? planSlug;
    const planTier = planTierFromSlug(planSlug);

    let assignedExpertId: string | null = null;
    if (coachSlug) {
      const { data: expertRow } = await admin
        .from('experts')
        .select('id')
        .eq('slug', coachSlug)
        .maybeSingle();
      assignedExpertId = expertRow?.id ?? null;
    }

    const { error: planError } = await admin.from('client_plans').insert({
      client_id: clientId,
      plan_name: planName,
      plan_tier: planTier,
      assigned_expert_id: assignedExpertId,
      status: 'active',
    });

    if (planError) {
      console.error('[createClientFromAdmin] plan insert failed:', planError);
    }
  }

  // ─── 6. Refresh the admin pages that read this data ────────────────
  revalidatePath('/admin/clients');
  revalidatePath('/admin/dashboard');

  return {
    ok: true,
    clientId,
    tempPassword,
  };
}

// ─── Update existing client ─────────────────────────────────────────────

const PLAN_STATUS = ['active', 'onboarding', 'paused', 'completed', 'cancelled'] as const;
type PlanStatus = (typeof PLAN_STATUS)[number];

const updateClientSchema = z.object({
  clientId: z.string().uuid(),
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(80)
    .optional(),
  phone: z.string().max(40).nullable().optional(),
  planSlug: z.string().nullable().optional(),
  coachSlug: z.string().nullable().optional(),
  status: z.enum(PLAN_STATUS).optional(),
});

export type UpdateClientInput = z.input<typeof updateClientSchema>;

export type UpdateClientResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Update an existing client's profile + plan from the admin panel.
 *
 * Edits applied:
 *   - profiles: full_name, first_name, phone (whichever fields are sent).
 *   - client_plans: latest plan row gets plan_name, plan_tier,
 *     assigned_expert_id, status updated. If no plan row exists yet and
 *     a planSlug or status is provided, a new row is inserted.
 *
 * Setting status='active' with a plan assigned is the path to "onboard"
 * a signed-up user — flips them out of the onboarding badge.
 */
export async function updateClient(
  input: UpdateClientInput
): Promise<UpdateClientResult> {
  const adminUser = await requireAuth({ adminOnly: true });
  if (!adminUser) {
    return { ok: false, error: 'Not authorised. Admin access required.' };
  }

  const parsed = updateClientSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const key = issue.path[0] as string | undefined;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    });
    return {
      ok: false,
      error: 'Please fix the highlighted fields.',
      fieldErrors,
    };
  }

  const { clientId, fullName, phone, planSlug, coachSlug, status } = parsed.data;
  const admin = createAdminClient();

  // ─── 1. Update profile fields if any were sent ─────────────────────
  const profileUpdate: Record<string, string | null> = {};
  if (fullName !== undefined) {
    profileUpdate.full_name = fullName;
    profileUpdate.first_name = fullName.split(/\s+/)[0] ?? fullName;
  }
  if (phone !== undefined) {
    profileUpdate.phone = phone;
  }

  if (Object.keys(profileUpdate).length > 0) {
    const { error: profileError } = await admin
      .from('profiles')
      .update(profileUpdate)
      .eq('id', clientId);

    if (profileError) {
      console.error('[updateClient] profile update failed:', profileError);
      return { ok: false, error: profileError.message };
    }
  }

  // ─── 2. Update / insert plan if any plan field was sent ────────────
  const planTouched =
    planSlug !== undefined || coachSlug !== undefined || status !== undefined;

  if (planTouched) {
    const { data: existingPlanRow, error: planLookupError } = await admin
      .from('client_plans')
      .select('id')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (planLookupError) {
      console.error('[updateClient] plan lookup failed:', planLookupError);
      return { ok: false, error: planLookupError.message };
    }

    // Resolve plan name + tier from slug if provided.
    let planName: string | null = null;
    let planTier:
      | 'fit_check'
      | 'online_live'
      | 'personal_transformation'
      | 'elite_couple'
      | null = null;

    if (planSlug) {
      const program = FALLBACK_PROGRAMS.find((p) => p.slug === planSlug);
      planName = program?.name ?? planSlug;
      planTier = planTierFromSlug(planSlug);
    }

    // Resolve expert id from slug if provided.
    let assignedExpertId: string | null | undefined = undefined;
    if (coachSlug !== undefined) {
      if (coachSlug === null || coachSlug === '') {
        assignedExpertId = null;
      } else {
        const { data: expertRow } = await admin
          .from('experts')
          .select('id')
          .eq('slug', coachSlug)
          .maybeSingle();
        assignedExpertId = expertRow?.id ?? null;
      }
    }

    const planPayload: Record<string, string | PlanStatus | null> = {};
    if (planSlug !== undefined) {
      planPayload.plan_name = planName ?? '';
      planPayload.plan_tier = planTier;
    }
    if (assignedExpertId !== undefined) {
      planPayload.assigned_expert_id = assignedExpertId;
    }
    if (status !== undefined) {
      planPayload.status = status;
    }

    if (existingPlanRow?.id) {
      const { error: updateErr } = await admin
        .from('client_plans')
        .update(planPayload)
        .eq('id', existingPlanRow.id);
      if (updateErr) {
        console.error('[updateClient] plan update failed:', updateErr);
        return { ok: false, error: updateErr.message };
      }
    } else {
      // No existing plan — insert one. plan_name is required.
      const insertPayload = {
        client_id: clientId,
        plan_name: planName ?? 'Custom plan',
        plan_tier: planTier,
        assigned_expert_id: assignedExpertId ?? null,
        status: status ?? 'active',
      };
      const { error: insertErr } = await admin
        .from('client_plans')
        .insert(insertPayload);
      if (insertErr) {
        console.error('[updateClient] plan insert failed:', insertErr);
        return { ok: false, error: insertErr.message };
      }
    }
  }

  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath('/admin/clients');
  revalidatePath('/admin/dashboard');

  return { ok: true };
}
