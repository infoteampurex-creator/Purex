import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Auth callback handler.
 *
 * Supabase sends password reset and email confirmation links pointing here:
 *   /auth/callback?code=<one-time-code>&next=<redirect-path>
 *
 * We exchange the code for a session, then redirect the user to the
 * `next` path (e.g. /reset-password for password reset flow).
 *
 * This route is PUBLIC (not protected by middleware) because the user
 * is mid-authentication and doesn't have a session yet.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/client/dashboard';

  if (!code) {
    // No code provided — redirect to login with an error
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Invalid or expired link')}`
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  // Successful code exchange — session is now set in cookies.
  // Redirect to the next page (reset-password, dashboard, etc.)
  return NextResponse.redirect(`${origin}${next}`);
}
