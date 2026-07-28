'use client';

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Bell, X } from 'lucide-react';

const STORAGE_KEY = 'teampurex.push.prompted';

/**
 * First-launch push notification permission prompt.
 *
 * Mounts silently on every /client/* page. On the first time a signed-in
 * user reaches the app after install:
 *
 *   1. Wait 4 s so the mother lands on the dashboard, sees the animated
 *      hero, and orients — asking for permission the moment they arrive
 *      reads as spammy.
 *   2. Show a small bottom-sheet card explaining WHY we want
 *      notifications ("your coach can nudge you when it's time to
 *      train"). Two buttons: "Enable notifications" / "Maybe later".
 *   3. On tap, call PushNotifications.requestPermissions() — that fires
 *      the native OS-level permission dialog. If granted, register the
 *      token.
 *   4. Store `teampurex.push.prompted = true` regardless of choice so
 *      we never re-ask on the same install.
 *
 * If not running inside Capacitor (browser / web), the component
 * renders null and does nothing — no bundled native code ships to web.
 *
 * The Whoop / Fitbit / Google Fit pattern is identical: ask at the
 * first opportunity after value has been shown, not on cold start.
 */
export function PushNotificationBootstrap() {
  const [visible, setVisible] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;

    // Check the CURRENT OS-level permission state before deciding
    // whether to show the card. Previously we only checked a local
    // "was ever prompted" flag, which meant users who tapped Later
    // (or whose previous install got a permission grant that was
    // later revoked at the OS level) never saw the card again — even
    // when they genuinely wanted to re-enable.
    //
    // New rule: show the card whenever the OS says permission isn't
    // granted right now. The "was ever prompted" flag still
    // suppresses re-showing within the same session so we don't
    // spam the user.
    (async () => {
      try {
        const mod = await import('@capacitor/push-notifications');
        const perm = await mod.PushNotifications.checkPermissions();
        if (cancelled) return;
        if (perm.receive === 'granted') return; // already good; nothing to do
        // Suppress within the same session only
        if (window.sessionStorage.getItem(STORAGE_KEY)) return;

        const timer = setTimeout(() => {
          if (!cancelled) setVisible(true);
        }, 4000);
        return () => clearTimeout(timer);
      } catch {
        // ignore — plugin unavailable, skip silently
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const markPrompted = () => {
    try {
      // sessionStorage (not localStorage) — suppresses the card for
      // the current app-open only. If the user reopens the app
      // tomorrow and permission still isn't granted, they'll see it
      // again. This mirrors how iOS / Google Fit / Whoop handle
      // recovery from "Later".
      window.sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // silent — sessionStorage can throw in private mode
    }
    setVisible(false);
  };

  const enable = async () => {
    setRequesting(true);
    try {
      const mod = await import('@capacitor/push-notifications');
      const perm = await mod.PushNotifications.requestPermissions();
      // If the user granted the OS-level permission, register with
      // FCM to get a device token. This is safe now that
      // google-services.json is in android/app/ (Firebase project
      // teampurex-70419 added 2026-07-25). Previously register()
      // crashed the app because FCM couldn't initialise without
      // the config file (PR #111 disabled the call).
      if (perm.receive === 'granted') {
        // On registration, POST the FCM device token to our /api/push/register
        // endpoint so the admin panel can send targeted nudges. Server-side
        // upserts on the token column so a rotated token from the same
        // device replaces the previous row instead of stacking duplicates.
        mod.PushNotifications.addListener('registration', async (token) => {
          // eslint-disable-next-line no-console
          console.log('[push] FCM token registered');
          try {
            const platform = Capacitor.getPlatform();
            const res = await fetch('/api/push/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token: token.value,
                platform: platform === 'ios' ? 'ios' : platform === 'android' ? 'android' : 'web',
              }),
            });
            if (!res.ok) {
              const err = await res.text();
              // eslint-disable-next-line no-console
              console.warn('[push] token POST failed', err);
            }
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('[push] token POST threw', err);
          }
        });
        mod.PushNotifications.addListener('registrationError', (err) => {
          // eslint-disable-next-line no-console
          console.warn('[push] FCM registration error:', err);
        });
        await mod.PushNotifications.register();
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[push] permission request failed', err);
    } finally {
      markPrompted();
      setRequesting(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-4 z-40 pointer-events-auto"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom) + 88px)', // above bottom nav
      }}
    >
      <div
        className="relative rounded-2xl border p-4 shadow-2xl"
        style={{
          background:
            'radial-gradient(ellipse at 0% 0%, rgba(198,255,61,0.16), transparent 60%), linear-gradient(180deg, #14180f 0%, #0a0c09 100%)',
          borderColor: 'rgba(198,255,61,0.35)',
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.6)',
        }}
      >
        <button
          type="button"
          onClick={markPrompted}
          aria-label="Dismiss"
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:text-text hover:bg-white/5 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3 pr-8">
          <div
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(198,255,61,0.12)',
              border: '1px solid rgba(198,255,61,0.35)',
            }}
          >
            <Bell size={18} style={{ color: '#c6ff3d' }} />
          </div>
          <div className="min-w-0">
            <div
              className="font-display font-semibold text-base leading-tight mb-1"
              style={{ color: 'rgba(245,245,240,0.98)' }}
            >
              Stay in sync with your coach
            </div>
            <p
              className="leading-snug"
              style={{ fontSize: 13, color: 'rgba(245,245,240,0.72)' }}
            >
              Get gentle nudges for workouts, meals, and daily check-ins.
              Nothing spammy.
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={enable}
            disabled={requesting}
            className="flex-1 rounded-xl px-4 py-2.5 font-mono uppercase tracking-[0.18em] font-bold"
            style={{
              fontSize: 11,
              color: '#0a0c09',
              background:
                'linear-gradient(135deg, #d4ff5a 0%, #a8e60a 100%)',
              opacity: requesting ? 0.7 : 1,
            }}
          >
            {requesting ? 'Enabling…' : 'Enable notifications'}
          </button>
          <button
            type="button"
            onClick={markPrompted}
            className="rounded-xl px-4 py-2.5 font-mono uppercase tracking-[0.16em] font-bold"
            style={{
              fontSize: 11,
              color: 'rgba(245,245,240,0.65)',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.10)',
            }}
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
