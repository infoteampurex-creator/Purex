'use client';

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Returns true when the React tree is running inside the Capacitor
 * Android/iOS native app (not a browser).
 *
 * Starts as `false` and flips to `true` after mount if running inside
 * Capacitor — this avoids hydration mismatches (server always renders
 * web-mode, client may upgrade).
 */
export function useIsApp(): boolean {
  const [isApp, setIsApp] = useState(false);

  useEffect(() => {
    setIsApp(Capacitor.isNativePlatform());
  }, []);

  return isApp;
}
