'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAuth } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// ════════════════════════════════════════════════════════════════════
// Client feedback call — weekly recurring slot.
// One row per client. Admin sets it once; recurs forever until paused
// or cleared. Same module-level constraint as enquiries.ts: this is
// a 'use server' file, so only ASYNC FUNCTIONS may be exported
// (Next 16 Turbopack crashes module-load otherwise).
// ════════════════════════════════════════════════════════════════════

// Internal type — NOT exported.
type Result = { ok: true } | { ok: false; error: string };

const setSchema = z.object({
  clientId: z.string().uuid(),
  // 0 = Monday … 6 = Sunday (matches 00021_weekly_schedule convention).
  dayOfWeek: z.number().int().min(0).max(6),
  // 'HH:MM' 24-hour. We tack on ':00' before sending to Postgres `time`.
  timeOfDay: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Time must look like HH:MM'),
  durationMin: z.number().int().min(10).max(120).optional(),
  notes: z.string().max(2000).optional(),
});

export async function setClientFeedbackSchedule(
  input: z.input<typeof setSchema>
): Promise<Result> {
  const adminUser = await requireAuth({ adminOnly: true });
  if (!adminUser) return { ok: false, error: 'Not authorised.' };

  const parsed = setSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }
  const d = parsed.data;
  const admin = createAdminClient();

  // Upsert — one slot per client. Edit-in-place rather than version.
  const { error } = await admin.from('client_feedback_schedule').upsert(
    {
      client_id: d.clientId,
      day_of_week: d.dayOfWeek,
      time_of_day: `${d.timeOfDay}:00`,
      duration_min: d.durationMin ?? 30,
      notes: d.notes ?? null,
      paused: false,
      set_by: adminUser.id,
    },
    { onConflict: 'client_id' }
  );

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/feedback-schedule');
  revalidatePath(`/admin/clients/${d.clientId}`);
  return { ok: true };
}

const clearSchema = z.object({ clientId: z.string().uuid() });

export async function clearClientFeedbackSchedule(
  input: z.input<typeof clearSchema>
): Promise<Result> {
  const adminUser = await requireAuth({ adminOnly: true });
  if (!adminUser) return { ok: false, error: 'Not authorised.' };

  const parsed = clearSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('client_feedback_schedule')
    .delete()
    .eq('client_id', parsed.data.clientId);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/feedback-schedule');
  revalidatePath(`/admin/clients/${parsed.data.clientId}`);
  return { ok: true };
}

const pauseSchema = z.object({
  clientId: z.string().uuid(),
  paused: z.boolean(),
});

export async function pauseClientFeedbackSchedule(
  input: z.input<typeof pauseSchema>
): Promise<Result> {
  const adminUser = await requireAuth({ adminOnly: true });
  if (!adminUser) return { ok: false, error: 'Not authorised.' };

  const parsed = pauseSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('client_feedback_schedule')
    .update({ paused: parsed.data.paused })
    .eq('client_id', parsed.data.clientId);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/feedback-schedule');
  revalidatePath(`/admin/clients/${parsed.data.clientId}`);
  return { ok: true };
}
