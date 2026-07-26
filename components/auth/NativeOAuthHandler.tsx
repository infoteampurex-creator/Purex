'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Bridges the Google OAuth flow when the app runs inside Capacitor.
 * See GoogleSignInButton for the native path — this is the second half.
 *
 *   1. User taps "Continue with Google" in the app
 *   2. GoogleSignInButton opens Chrome Custom Tabs on the OAuth URL
 *   3. Google → Supabase → `com.teampurex.app://auth-callback…`
 *   4. Android's intent-filter routes the deep link back to our app
 *   5. THIS handler picks up the URL and completes the sign-in
 *
 * URL-format defensiveness matters here:
 *
 *   Android intents strip URL fragments (`#…`) in some routing paths
 *   — a well-known quirk that causes deep-link OAuth to silently
 *   fail. We defensively check BOTH query-string and fragment for
 *   `access_token/refresh_token` (Supabase implicit-grant format)
 *   AND for `code` (PKCE format). One of them will always be there.
 *
 * We also check `App.getLaunchUrl()` on mount in case the deep link
 * arrived BEFORE our listener attached (which happens on a fresh
 * launch of the app from the Chrome custom-tab redirect).
 *
 * Debug logs go to console.log with an `[oauth]` prefix — Chrome
 * DevTools with USB debugging filters them cleanly.
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

        // Handle any URL that opened the app (case: app was closed
        // when the deep link fired — appUrlOpen might not fire, but
        // getLaunchUrl returns the pending URL).
        try {
          const launch = await App.getLaunchUrl();
          if (launch?.url) {
            // eslint-disable-next-line no-console
            console.log('[oauth] launch URL detected', launch.url);
            void handleUrl(launch.url);
          }
        } catch {
          // ignore — no launch URL
        }

        const listener = await App.addListener('appUrlOpen', async ({ url }) => {
          // eslint-disable-next-line no-console
          console.log('[oauth] appUrlOpen event', url);
          void handleUrl(url);
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

    async function handleUrl(url: string): Promise<void> {
      if (!url.toLowerCase().startsWith('com.teampurex.app://')) return;
      // eslint-disable-next-line no-console
      console.log('[oauth] matched custom-scheme URL', url);

      // Close the Chrome Custom Tab if it's still open.
      try {
        const { Browser } = await import('@capacitor/browser');
        await Browser.close();
      } catch {
        // ignore — tab might already be closed
      }

      // Robust URL split — Android sometimes hands us the fragment
      // separately from the query part, sometimes drops the fragment
      // entirely. Parse both defensively without relying on the URL
      // constructor's fragment handling (which mis-handles some
      // custom-scheme edge cases).
      const rawAfterHost = url.replace(/^com\.teampurex\.app:\/\/[^/?#]*/i, '');
      // Everything after "auth-callback"
      let queryPart = '';
      let fragPart = '';
      const hashIx = rawAfterHost.indexOf('#');
      const queryIx = rawAfterHost.indexOf('?');
      if (hashIx > -1 && (queryIx === -1 || hashIx < queryIx)) {
        // Fragment appears before query: rare, but handle it
        fragPart = rawAfterHost.slice(hashIx + 1).split('?')[0];
        queryPart = queryIx > -1 ? rawAfterHost.slice(queryIx + 1) : '';
      } else {
        if (queryIx > -1) {
          queryPart = rawAfterHost.slice(queryIx + 1).split('#')[0];
        }
        if (hashIx > -1) {
          fragPart = rawAfterHost.slice(hashIx + 1);
        }
      }

      const query = new URLSearchParams(queryPart);
      const frag = new URLSearchParams(fragPart);

      // Try every place Supabase might put the credentials
      const accessToken =
        frag.get('access_token') || query.get('access_token');
      const refreshToken =
        frag.get('refresh_token') || query.get('refresh_token');
      const code = query.get('code') || frag.get('code');
      const errCode = query.get('error') || frag.get('error');
      const errDesc =
        query.get('error_description') || frag.get('error_description');
      const next = query.get('next') || frag.get('next') || '/client/dashboard';

      // eslint-disable-next-line no-console
      console.log('[oauth] parsed', {
        hasAccess: !!accessToken,
        hasRefresh: !!refreshToken,
        hasCode: !!code,
        errCode,
        errDesc,
        next,
      });

      if (errCode) {
        // eslint-disable-next-line no-console
        console.warn('[oauth] provider returned error', errCode, errDesc);
        return;
      }

      const supabase = createClient();

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
        // eslint-disable-next-line no-console
        console.log('[oauth] setSession OK');
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          // eslint-disable-next-line no-console
          console.warn('[oauth] exchangeCodeForSession failed', error);
          return;
        }
        // eslint-disable-next-line no-console
        console.log('[oauth] exchangeCodeForSession OK');
      } else {
        // eslint-disable-next-line no-console
        console.warn(
          '[oauth] deep-link URL had no tokens, no code, no error — Supabase probably fell back to Site URL because the custom scheme is not whitelisted in Supabase Redirect URLs.',
          url
        );
        return;
      }

      // Refresh RSC cache so server components re-fetch with new
      // auth cookies, then navigate.
      router.refresh();
      router.replace(next);
    }

    return () => {
      if (unsub) unsub();
    };
  }, [router]);

  return null;
}
