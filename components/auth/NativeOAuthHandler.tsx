'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Bridges the Google OAuth flow when the app is running inside
 * Capacitor. See GoogleSignInButton for the native path — this
 * component is the second half of that flow.
 *
 * Flow recap:
 *   1. User taps "Continue with Google" in the app
 *   2. GoogleSignInButton opens Chrome Custom Tabs with the OAuth URL
 *   3. Google → Supabase → `com.teampurex.app://auth-callback?…`
 *   4. Android sees our registered intent-filter (AndroidManifest)
 *      and delivers the URL back to the app
 *   5. `App.addListener('appUrlOpen')` fires → THIS component:
 *        a. Closes the Chrome Custom Tab
 *        b. Extracts the auth tokens (Supabase puts them in the URL
 *           fragment: #access_token=…&refresh_token=…&…)
 *        c. Calls supabase.auth.setSession() so cookies land in the
 *           WebView's Supabase client
 *        d. Refreshes the router so server components re-run with
 *           the fresh session
 *        e. Navigates to /client/dashboard (or the ?next= path)
 *
 * Mounted globally via the client-side (client) layout so it's
 * listening regardless of which page the user is on when the deep
 * link fires. Silent no-op on web.
 */
export function NativeOAuthHandler() {
  const router = useRouter();

  useEffect(() => {
    let unsub: (() => void) | null = null;

    (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;

        const { App } = await import('@capacitor/app');
        const listener = await App.addListener('appUrlOpen', async ({ url }) => {
          if (!url.startsWith('com.teampurex.app://auth-callback')) return;

          // eslint-disable-next-line no-console
          console.log('[oauth] deep link received', url);

          // Close the Chrome Custom Tab if it's still open.
          try {
            const { Browser } = await import('@capacitor/browser');
            await Browser.close();
          } catch {
            // ignore — tab might already be closed
          }

          const supabase = createClient();

          // Supabase can return the session two ways:
          //   1. Fragment: #access_token=…&refresh_token=…&expires_in=…
          //      (implicit grant — modern Supabase default for mobile)
          //   2. Query: ?code=… (PKCE — need to exchange server-side)
          // Prefer #1 because it doesn't need a second network round-trip.
          const parsed = new URL(url.replace('com.teampurex.app://', 'https://placeholder.local/'));

          // 1. Fragment tokens
          const fragParams = new URLSearchParams(
            parsed.hash.startsWith('#') ? parsed.hash.slice(1) : parsed.hash
          );
          const accessToken = fragParams.get('access_token');
          const refreshToken = fragParams.get('refresh_token');

          // 2. Query code (PKCE fallback)
          const code = parsed.searchParams.get('code');
          const next =
            parsed.searchParams.get('next') || '/client/dashboard';

          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) {
              // eslint-disable-next-line no-console
              console.warn('[oauth] setSession failed', error);
              return;
            }
          } else if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              // eslint-disable-next-line no-console
              console.warn('[oauth] exchangeCodeForSession failed', error);
              return;
            }
          } else {
            // eslint-disable-next-line no-console
            console.warn('[oauth] deep-link URL had no tokens or code', url);
            return;
          }

          // Refresh the RSC cache so server components re-fetch with
          // the new auth cookies, then navigate.
          router.refresh();
          router.replace(next);
        });

        unsub = () => {
          listener.remove().catch(() => {
            // ignore
          });
        };
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[oauth] handler init failed', err);
      }
    })();

    return () => {
      if (unsub) unsub();
    };
  }, [router]);

  return null;
}
