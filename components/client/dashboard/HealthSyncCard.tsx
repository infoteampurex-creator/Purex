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
  {
    ssr: false,
    // Visible placeholder while the dynamic chunk loads — replaces
    // the previous null fallback that hid all chunk-loading errors.
    loading: () => (
      <div
        className="rounded-2xl p-4 animate-pulse"
        style={{
          background: 'linear-gradient(180deg, #10130f 0%, #0a0c09 100%)',
          border: '1px solid rgba(198,255,61,0.18)',
        }}
      >
        <div
          className="font-mono text-[10px] uppercase tracking-[0.22em] font-bold"
          style={{ color: '#c6ff3d' }}
        >
          Health Connect · loading…
        </div>
      </div>
    ),
  }
);

export function HealthSyncCard() {
  const isApp = useIsApp();
  if (!isApp) return null;
  return <HealthSyncCardInner />;
}
