import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Teampurex — Capacitor configuration.
 *
 * Strategy: HOSTED MODE.
 *   The Android app is a thin WebView pointing at https://www.teampurex.com.
 *   Every Next.js feature (server actions, Supabase auth via cookies,
 *   route-handler endpoints, ISR pages) works without any "API layer"
 *   refactor — the app simply IS the website, launched from the home
 *   screen as a real native app.
 *
 * Pros of hosted mode:
 *   • Zero static-export friction. Next.js stays fully dynamic.
 *   • Auth, server actions, all current features carry over instantly.
 *   • One source of truth — fix it on web, app gets the fix
 *     (no OTA tooling, no rebundle).
 *
 * Trade-offs:
 *   • Requires internet on first load. We add an offline page later.
 *   • Slight first-paint delay vs bundled assets (~300ms on 4G).
 *
 * Future: when we want OFFLINE-FIRST behaviour (logging workouts at
 * the gym with patchy signal), we switch this to bundled mode +
 * static-export the routes that need to work offline. Out of scope
 * for v1.
 */
const config: CapacitorConfig = {
  appId: 'com.teampurex.app',
  appName: 'Teampurex',
  // `webDir` is required by Capacitor's CLI even in hosted mode.
  // Points at Next's static-export directory — unused at runtime
  // because `server.url` overrides it, but the CLI validates it
  // exists. We create an empty `out/` directory in the repo so
  // `npx cap sync` doesn't error on a fresh clone.
  webDir: 'out',
  server: {
    // Load the live site inside the WebView. When we eventually want
    // the staging build, override this in capacitor.config.local.ts
    // (gitignored) and pass --config to cap sync.
    url: 'https://www.teampurex.com',
    androidScheme: 'https',
    cleartext: false,
  },
  android: {
    // Hide the OS-level navigation bar when the keyboard opens so
    // form fields aren't pushed off-screen on small phones.
    adjustMarginsForEdgeToEdge: 'force',
    // Allow mixed content from teampurex.com (only used in dev when
    // we point to localhost). Production stays https-only.
    allowMixedContent: false,
    // Capacitor 7 default — webContentsDebuggingEnabled is true in
    // debug builds, false in release builds. Leave alone.
  },
  plugins: {
    SplashScreen: {
      // Hold the splash screen for 1.5s after WebView is ready.
      // Long enough to mask the network round-trip on a cold start;
      // short enough that warm starts don't feel sluggish.
      launchShowDuration: 1500,
      backgroundColor: '#0a0c09',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      spinnerColor: '#c6ff3d',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      // App is dark-themed; ask Android to render the status bar
      // icons in light style (white).
      style: 'dark',
      backgroundColor: '#0a0c09',
      overlaysWebView: false,
    },
  },
};

export default config;
