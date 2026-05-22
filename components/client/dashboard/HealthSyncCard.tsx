'use client';

import dynamic from 'next/dynamic';
import { useIsApp } from '@/lib/hooks/useIsApp';

/**
 * Dispatcher — only mount the Health Connect card inside the mobile
 * app. Web never loads the plugin module, the kiwi-health bundle, or
 * any of the sync UI.
 */
const HealthSyncCardInner = dynamic(
  () =>
    import('./HealthSyncCardInner').then((m) => m.HealthSyncCardInner),
  { ssr: false, loading: () => null }
);

export function HealthSyncCard() {
  const isApp = useIsApp();
  if (!isApp) return null;
  return <HealthSyncCardInner />;
}
