'use client';

import { useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Native-feeling haptic feedback on button presses / ring taps / log
 * confirmations. Follows Whoop and Fitbit's playbook: every primary
 * CTA vibrates lightly, log-completion vibrates heavily.
 *
 * Safe to call on web — dynamically imports `@capacitor/haptics` only
 * when running inside the Capacitor WebView, so web bundles never
 * ship the native binding.
 *
 * Usage:
 *   const haptics = useHaptics();
 *   <button onClick={() => { haptics.light(); doThing(); }}>Tap</button>
 */
export function useHaptics() {
  const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();

  const impact = useCallback(
    async (style: 'light' | 'medium' | 'heavy') => {
      if (!isNative) return;
      try {
        const mod = await import('@capacitor/haptics');
        const impactStyle =
          style === 'light'
            ? mod.ImpactStyle.Light
            : style === 'medium'
            ? mod.ImpactStyle.Medium
            : mod.ImpactStyle.Heavy;
        await mod.Haptics.impact({ style: impactStyle });
      } catch {
        // silent — haptics is a nice-to-have, not a critical path
      }
    },
    [isNative]
  );

  const selectionChanged = useCallback(async () => {
    if (!isNative) return;
    try {
      const mod = await import('@capacitor/haptics');
      await mod.Haptics.selectionChanged();
    } catch {
      // silent
    }
  }, [isNative]);

  const notification = useCallback(
    async (type: 'success' | 'warning' | 'error') => {
      if (!isNative) return;
      try {
        const mod = await import('@capacitor/haptics');
        const notificationType =
          type === 'success'
            ? mod.NotificationType.Success
            : type === 'warning'
            ? mod.NotificationType.Warning
            : mod.NotificationType.Error;
        await mod.Haptics.notification({ type: notificationType });
      } catch {
        // silent
      }
    },
    [isNative]
  );

  return {
    /** Soft tap — use for standard button presses, chip selection. */
    light: () => impact('light'),
    /** Medium tap — use for primary CTA presses (Sign in, Save). */
    medium: () => impact('medium'),
    /** Firm tap — use for irreversible actions (Delete, Sign out). */
    heavy: () => impact('heavy'),
    /** Whoosh — use when tabbing between segmented controls / rings. */
    selectionChanged,
    /** Success pattern — use after logging weight, meal, workout. */
    success: () => notification('success'),
    /** Warning pattern — use before destructive confirmation. */
    warning: () => notification('warning'),
    /** Error pattern — use on save failure. */
    error: () => notification('error'),
  };
}
