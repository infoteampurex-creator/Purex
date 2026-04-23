'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { AuthActionState } from '@/lib/actions/auth';

const updatePasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export async function updatePassword(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((i) => {
      if (!fieldErrors[i.path[0] as string]) {
        fieldErrors[i.path[0] as string] = i.message;
      }
    });
    return { ok: false, error: 'Please fix the highlighted fields.', fieldErrors };
  }

  const supabase = await createClient();

  // Verify session exists before attempting password update
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      error:
        'Your password reset link has expired or was already used. Please request a new one.',
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/client/dashboard');
}
