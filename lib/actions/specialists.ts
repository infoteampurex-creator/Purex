'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAuth } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// ─── Schema ────────────────────────────────────────────────────────────

const updateSpecialistSchema = z.object({
  expertId: z.string().uuid(),
  name: z.string().min(2).max(120).optional(),
  title: z.string().min(2).max(160).optional(),
  shortRole: z.string().min(2).max(40).optional(),
  location: z.string().max(120).nullable().optional(),
  calendlyUrl: z
    .string()
    .url()
    .or(z.literal(''))
    .nullable()
    .optional(),
  photoUrl: z
    .string()
    .url()
    .or(z.literal(''))
    .nullable()
    .optional(),
  bioShort: z.string().max(2000).nullable().optional(),
  clientsTrained: z.number().int().min(0).max(100000).nullable().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateSpecialistInput = z.input<typeof updateSpecialistSchema>;

export type UpdateSpecialistResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Update an existing specialist (expert) row from the admin panel.
 * Admin-only. Uses the service-role client so RLS doesn't block the
 * write — the action's own auth check is the gate.
 */
export async function updateSpecialist(
  input: UpdateSpecialistInput
): Promise<UpdateSpecialistResult> {
  const adminUser = await requireAuth({ adminOnly: true });
  if (!adminUser) {
    return { ok: false, error: 'Not authorised. Admin access required.' };
  }

  const parsed = updateSpecialistSchema.safeParse(input);
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

  const data = parsed.data;
  const update: Record<string, string | number | boolean | null> = {};

  if (data.name !== undefined) update.name = data.name;
  if (data.title !== undefined) update.title = data.title;
  if (data.shortRole !== undefined) update.short_role = data.shortRole;
  if (data.location !== undefined) update.location = data.location;
  if (data.calendlyUrl !== undefined) {
    update.calendly_url = data.calendlyUrl === '' ? null : data.calendlyUrl;
  }
  if (data.photoUrl !== undefined) {
    update.photo_url = data.photoUrl === '' ? null : data.photoUrl;
  }
  if (data.bioShort !== undefined) update.bio_short = data.bioShort;
  if (data.clientsTrained !== undefined) {
    update.clients_trained = data.clientsTrained;
  }
  if (data.isActive !== undefined) update.is_active = data.isActive;

  if (Object.keys(update).length === 0) {
    return { ok: true };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('experts')
    .update(update)
    .eq('id', data.expertId);

  if (error) {
    console.error('[updateSpecialist] failed:', error);
    return { ok: false, error: error.message };
  }

  revalidatePath('/admin/specialists');
  // Marketing pages also display experts; refresh those too.
  revalidatePath('/experts');
  revalidatePath('/');

  return { ok: true };
}
