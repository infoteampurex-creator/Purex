'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// ─── Validation ─────────────────────────────────────────────────

const stringArray = z
  .array(z.string().trim().min(1).max(200))
  .max(40)
  .default([]);

const updateSchema = z.object({
  clientId: z.string().uuid(),
  conditions: stringArray,
  allergies: stringArray,
  injuries: stringArray,
  medications: stringArray,
  coachNotes: z.string().max(2000).nullable().optional(),
});

export type UpdateHealthConditionsInput = z.infer<typeof updateSchema>;

export type UpdateResult =
  | { ok: true }
  | { ok: false; error: string };

// ─── Update (admin-only) ────────────────────────────────────────

/**
 * Upsert the health profile for a client. Admin-only — non-admins
 * are RLS-rejected at the DB layer, but we also do an in-action
 * role check for a cleaner error message.
 *
 * Used by the coach side of the Health tab on /admin/clients/[id].
 */
export async function updateHealthConditions(
  input: UpdateHealthConditionsInput
): Promise<UpdateResult> {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }
  const data = parsed.data;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: 'Not signed in' };

    // Role check — gives a friendlier error than the RLS 401
    const { data: roleRow } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    const role = roleRow?.role ?? 'user';
    if (role !== 'admin' && role !== 'super_admin') {
      return { ok: false, error: 'Only coaches can edit health conditions.' };
    }

    const { error } = await supabase
      .from('client_health_profile')
      .upsert(
        {
          client_id: data.clientId,
          conditions: data.conditions,
          allergies: data.allergies,
          injuries: data.injuries,
          medications: data.medications,
          coach_notes: data.coachNotes ?? null,
          updated_by: user.id,
        },
        { onConflict: 'client_id' }
      );

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath('/client/health');
    revalidatePath(`/admin/clients/${data.clientId}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}
