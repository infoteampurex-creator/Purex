'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// ───────────────────────── SCHEMAS ─────────────────────────

const signInSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const signUpSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

// ───────────────────────── TYPES ─────────────────────────

export type AuthActionState = {
  ok: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
};

// ───────────────────────── ACTIONS ─────────────────────────

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
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
  const { data: authData, error } = await supabase.auth.signInWithPassword(
    parsed.data
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  // If caller specified an explicit redirect (e.g. post-booking flow), honor it.
  // Empty strings are treated as absent (form may submit "" for unset hidden input).
  const rawRedirect = formData.get('redirect') as string | null;
  const explicitRedirect =
    rawRedirect && rawRedirect.trim().length > 0 ? rawRedirect : null;

  // Default: route based on the user's role
  let redirectPath = '/client/dashboard';

  if (!explicitRedirect && authData.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    if (profile?.role === 'admin' || profile?.role === 'super_admin') {
      redirectPath = '/admin/dashboard';
    }
  } else if (explicitRedirect) {
    redirectPath = explicitRedirect;
  }

  revalidatePath('/', 'layout');
  redirect(redirectPath);
}

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
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
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
      },
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  // Create profile row (Supabase trigger should do this, but fallback)
  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      email: parsed.data.email,
      full_name: parsed.data.fullName,
      role: 'user',
    });
  }

  // If email confirmation is required (Supabase default), show message
  if (data.user && !data.session) {
    return {
      ok: true,
      message: 'Check your email to confirm your account.',
    };
  }

  revalidatePath('/', 'layout');
  redirect('/client/dashboard');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function requestPasswordReset(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    email: formData.get('email'),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid email',
    };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    // Route through /auth/callback first so the code is exchanged for a session
    // before the user lands on /reset-password. Without this, updateUser() will
    // throw "Auth session missing".
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return {
    ok: true,
    message: "If that email is registered, you'll receive a reset link shortly.",
  };
}
