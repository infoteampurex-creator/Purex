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
    if (window.localStorage.getItem(STORAGE_KEY)) return;

    const timer = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  const markPrompted = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // silent — localStorage can throw in private mode
    }
    setVisible(false);
  };

  const enable = async () => {
    setRequesting(true);
    try {
      const mod = await import('@capacitor/push-notifications');
      const perm = await mod.PushNotifications.requestPermissions();
      if (perm.receive === 'granted') {
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
