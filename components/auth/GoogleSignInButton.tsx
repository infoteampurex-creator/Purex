'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

/**
 * "Continue with Google" — Supabase Google OAuth.
 *
 * Setup (one-time, must be done in the Supabase dashboard by an admin):
 *
 *   1. Create an OAuth 2.0 Client ID in Google Cloud Console.
 *      Authorized redirect URIs must include:
 *        https://<project-ref>.supabase.co/auth/v1/callback
 *   2. Supabase Dashboard → Authentication → Providers → Google.
 *      Paste Client ID + Client Secret, enable, save.
 *   3. Supabase Dashboard → Authentication → URL Configuration.
 *      Site URL: https://www.teampurex.com
 *      Redirect URLs: https://www.teampurex.com/auth/callback
 *
 * Until those three steps are complete this button will show a
 * gracefully-degrading error toast. Once configured, tapping it
 * takes the user through Google's OAuth flow and back to
 * /auth/callback, which the Supabase middleware / server client
 * already handles.
 *
 * Whoop / Fitbit / Google Fit all offer OAuth as the primary
 * sign-in method — email/password is the fallback. This closes the
 * "why doesn't this feel like a real app" gap.
 */
export function GoogleSignInButton({ redirectTo }: { redirectTo?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        setIsNative(Capacitor.isNativePlatform());
      } catch {
        // web bundle without Capacitor — stays false
      }
    })();
  }, []);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const redirectPath = redirectTo ?? '/client/dashboard';

      if (isNative) {
        // ── Native path — Chrome Custom Tabs + custom-scheme deep link ──
        //
        // Google blocks OAuth from embedded WebViews. Workaround:
        //   1. Ask Supabase for the OAuth URL (skipBrowserRedirect so
        //      the WebView doesn't try to redirect itself).
        //   2. Open that URL in Chrome Custom Tabs via @capacitor/browser.
        //      Google treats Chrome Custom Tabs as a real browser and
        //      allows the sign-in.
        //   3. Set Supabase's redirectTo to our custom scheme
        //      com.teampurex.app://auth-callback — Supabase does the
        //      second-hop redirect there, Android intercepts it, our
        //      NativeOAuthHandler component completes the sign-in
        //      inside the WebView.
        const { data, error: err } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `com.teampurex.app://auth-callback?next=${encodeURIComponent(redirectPath)}`,
            skipBrowserRedirect: true,
          },
        });
        if (err) throw err;
        if (!data?.url) throw new Error('No OAuth URL from Supabase');
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({
          url: data.url,
          presentationStyle: 'popover',
          windowName: '_self',
        });
        // Loading stays true — the NativeOAuthHandler component
        // triggers the actual navigation into the app once the deep
        // link fires. If the user cancels, tapping the button again
        // starts a fresh flow.
        return;
      }

      // ── Web path — normal Supabase redirect flow ──
      const origin = window.location.origin;
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
        },
      });
      if (err) throw err;
      // Web OAuth flow takes over the browser; no need to reset loading.
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Google sign-in failed';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className="w-full h-12 rounded-full bg-white text-gray-900 font-semibold text-sm hover:bg-gray-50 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 inline-flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Opening Google…
            </>
          ) : (
            <>
              <GoogleGlyph />
              Continue with Google
            </>
          )}
        </button>
        {error && (
          <p className="text-xs text-danger text-center">{error}</p>
        )}
      </div>
      {/* Divider — shown alongside the button on web. When the button
          hides itself on native (return null above), this divider
          goes with it and the email form sits flush at the top. */}
      <div className="relative flex items-center gap-3 py-1">
        <div className="flex-1 h-px bg-border-soft" />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim font-bold">
          or with email
        </span>
        <div className="flex-1 h-px bg-border-soft" />
      </div>
    </div>
  );
}

/** Google's official four-colour "G" glyph. Vector so it stays crisp. */
function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.712A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.712V4.956H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.044l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.956L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
