'use client';

import { useEffect } from 'react';

/**
 * Dismiss the native Android / iOS splash screen the moment React
 * hydrates on the first page. Paired with `launchAutoHide: false` in
 * capacitor.config.ts, this is what reclaims the 3.5 s of dead splash
 * time on cold-start reported by the user on 2026-07-16.
 *
 * Cost model:
 *   - Web / SSR: renders null, no cost
 *   - Native WebView: dynamically imports @capacitor/splash-screen only
 *     when Capacitor.isNativePlatform() is true, so the plugin JS
 *     never ships to plain-web visitors.
 *
 * Runs once per mount — placed high in the tree (root layout) so it
 * fires the instant any page hydrates. If it fires before the WebView
 * is truly interactive there's no downside — hide() is idempotent.
 */
export function NativeSplashDismisser() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;
        // Wait one frame so the initial React tree paints under the
        // splash first — dismissing during the very first paint can
        // show a white flash on some devices.
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        if (cancelled) return;
        const { SplashScreen } = await import('@capacitor/splash-screen');
        await SplashScreen.hide({ fadeOutDuration: 250 });
      } catch {
        // silent — splash's launchShowDuration fallback covers this
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
