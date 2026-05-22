'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Download,
  Heart,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useHealthConnect } from '@/lib/hooks/useHealthConnect';
import { syncHealthConnectDay } from '@/lib/actions/health-connect-sync';

/**
 * App-only Health Connect sync card. Renders one of four states:
 *
 *   1. NotInstalled  → "Install Health Connect" with deep-link
 *   2. NotConnected  → "Connect" button (triggers permission request)
 *   3. Syncing       → spinner + last-sync timestamp
 *   4. Connected     → live readings + "Refresh" button
 *
 * On Android with Health Connect installed AND permissions granted,
 * the inner hook auto-reads on mount, and this card pushes that read
 * to Supabase via the syncHealthConnectDay server action. The Twin's
 * stat values then update on the next page render.
 */
export function HealthSyncCardInner() {
  const hc = useHealthConnect();
  const [syncing, setSyncing] = useState(false);
  const [lastSyncIso, setLastSyncIso] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Auto-push readings to Supabase whenever we get a fresh read
  const pushToSupabase = useCallback(
    async (readings: typeof hc.readings) => {
      if (!readings.readAt) return;
      setSyncing(true);
      setSyncError(null);
      const today = new Date().toISOString().slice(0, 10);
      const res = await syncHealthConnectDay({
        logDate: today,
        steps: readings.steps,
        sleepMinutes: readings.sleepMinutes,
        waterMl: readings.waterMl,
      });
      setSyncing(false);
      if (res.ok) {
        setLastSyncIso(new Date().toISOString());
      } else {
        setSyncError(res.error ?? 'Sync failed');
      }
    },
    []
  );

  // When readings refresh (post-mount or after refresh button), persist them.
  useEffect(() => {
    if (hc.readings.readAt && hc.hasPermissions) {
      void pushToSupabase(hc.readings);
    }
  }, [hc.readings.readAt, hc.hasPermissions, hc.readings, pushToSupabase]);

  // Hide on platforms where Health Connect can't run
  if (hc.availability === 'Unknown' || hc.availability === 'NotSupported') {
    return null;
  }

  // ─── NotInstalled state ───
  if (hc.availability === 'NotInstalled') {
    return (
      <CardShell tone="warn">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ background: 'rgba(255, 210, 77, 0.12)', border: '1px solid rgba(255, 210, 77, 0.30)' }}>
            <Download size={16} style={{ color: '#ffd24d' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] font-bold mb-1"
                 style={{ color: '#ffd24d' }}>
              Health Connect required
            </div>
            <div className="font-display font-semibold leading-tight" style={{ fontSize: 14 }}>
              Install Health Connect to auto-sync
            </div>
            <p className="leading-relaxed mt-1 mb-3" style={{ fontSize: 12, color: 'rgba(245,245,240,0.65)' }}>
              We pull steps, sleep, and water from Google Fit, Samsung Health,
              Fitbit, and any other app you use — all via the Health Connect
              system service.
            </p>
            <a
              href="https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg font-mono uppercase tracking-[0.16em] font-bold"
              style={{
                fontSize: 11,
                color: '#0a0c09',
                backgroundColor: '#ffd24d',
              }}
            >
              <Download size={12} />
              Open Play Store
            </a>
          </div>
        </div>
      </CardShell>
    );
  }

  // ─── Available but no permissions yet ───
  if (!hc.hasPermissions) {
    return (
      <CardShell tone="connect">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ background: 'rgba(198, 255, 61, 0.12)', border: '1px solid rgba(198, 255, 61, 0.30)' }}>
            <Activity size={16} style={{ color: '#c6ff3d' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] font-bold mb-1 text-accent">
              Auto-sync available
            </div>
            <div className="font-display font-semibold leading-tight" style={{ fontSize: 14 }}>
              Connect your fitness data
            </div>
            <p className="leading-relaxed mt-1 mb-3" style={{ fontSize: 12, color: 'rgba(245,245,240,0.65)' }}>
              Sync your <b>steps</b>, <b>sleep</b>, <b>water</b>, and <b>heart rate</b>{' '}
              from Health Connect. Your Twin updates automatically as the day
              unfolds.
            </p>
            <button
              onClick={() => void hc.requestPermissions()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg font-mono uppercase tracking-[0.16em] font-bold"
              style={{
                fontSize: 11,
                color: '#0a0c09',
                backgroundColor: '#c6ff3d',
                boxShadow: '0 0 16px rgba(198,255,61,0.30)',
              }}
            >
              <Activity size={12} />
              Connect Health Connect
            </button>
          </div>
        </div>
      </CardShell>
    );
  }

  // ─── Connected: show live readings + refresh ───
  return (
    <CardShell tone="connected">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: '#c6ff3d', boxShadow: '0 0 6px #c6ff3d' }}
          />
          <div
            className="font-mono uppercase tracking-[0.22em] font-bold"
            style={{ fontSize: 10, color: '#c6ff3d' }}
          >
            Health Connect · Live
          </div>
        </div>
        <button
          onClick={() => void hc.readToday()}
          disabled={hc.loading || syncing}
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md font-mono uppercase tracking-[0.16em] font-bold disabled:opacity-50"
          style={{
            fontSize: 9,
            color: 'rgba(245,245,240,0.7)',
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {hc.loading || syncing ? (
            <Loader2 size={11} className="animate-spin" />
          ) : (
            <RefreshCw size={11} />
          )}
          {hc.loading ? 'Reading' : syncing ? 'Syncing' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Reading label="Steps" value={hc.readings.steps.toLocaleString()} />
        <Reading label="Sleep" value={formatSleep(hc.readings.sleepMinutes)} />
        <Reading label="Water" value={formatWater(hc.readings.waterMl)} />
        <Reading
          label="HR"
          value={hc.readings.heartRateBpm > 0 ? `${hc.readings.heartRateBpm}` : '—'}
          unit={hc.readings.heartRateBpm > 0 ? 'bpm' : undefined}
          icon={<Heart size={9} style={{ color: '#ff8a4d' }} />}
        />
      </div>

      <AnimatePresence>
        {lastSyncIso && !syncError && (
          <motion.div
            key="ok"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 flex items-center gap-1.5"
          >
            <CheckCircle2 size={10} style={{ color: '#c6ff3d' }} />
            <span
              className="font-mono uppercase tracking-[0.16em]"
              style={{ fontSize: 9, color: 'rgba(245,245,240,0.50)' }}
            >
              Synced · {formatRelative(lastSyncIso)}
            </span>
          </motion.div>
        )}
        {syncError && (
          <motion.div
            key="err"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 flex items-center gap-1.5"
          >
            <AlertCircle size={10} style={{ color: '#ff8a4d' }} />
            <span
              className="font-mono uppercase tracking-[0.16em]"
              style={{ fontSize: 9, color: '#ff8a4d' }}
            >
              {syncError}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </CardShell>
  );
}

// ─── helpers ────────────────────────────────────────────────────────

function CardShell({
  tone,
  children,
}: {
  tone: 'warn' | 'connect' | 'connected';
  children: React.ReactNode;
}) {
  const tints = {
    warn:      { border: 'rgba(255,210,77,0.18)', glow: 'rgba(255,210,77,0.10)' },
    connect:   { border: 'rgba(198,255,61,0.18)', glow: 'rgba(198,255,61,0.10)' },
    connected: { border: 'rgba(255,255,255,0.06)', glow: 'rgba(198,255,61,0.05)' },
  }[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative rounded-2xl overflow-hidden p-4"
      style={{
        background: `
          linear-gradient(135deg, ${tints.glow} 0%, transparent 60%),
          linear-gradient(180deg, #10130f 0%, #0a0c09 100%)
        `,
        border: `1px solid ${tints.border}`,
      }}
    >
      {children}
    </motion.div>
  );
}

function Reading({
  label,
  value,
  unit,
  icon,
}: {
  label: string;
  value: string;
  unit?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="text-center">
      <div className="font-mono uppercase tracking-[0.14em] font-bold flex items-center justify-center gap-1"
           style={{ fontSize: 9, color: 'rgba(245,245,240,0.50)' }}>
        {icon}
        {label}
      </div>
      <div className="font-display font-bold tabular-nums leading-none mt-1"
           style={{ fontSize: 16, color: '#f5f5f0' }}>
        {value}
      </div>
      {unit && (
        <div className="font-mono mt-0.5"
             style={{ fontSize: 8, color: 'rgba(245,245,240,0.40)' }}>
          {unit}
        </div>
      )}
    </div>
  );
}

function formatSleep(mins: number): string {
  if (mins <= 0) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h${m}`;
}

function formatWater(ml: number): string {
  if (ml <= 0) return '—';
  if (ml >= 1000) return `${(ml / 1000).toFixed(1)}L`;
  return `${ml}ml`;
}

function formatRelative(iso: string): string {
  const diffSec = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.round(diffSec / 60)}m ago`;
  return `${Math.round(diffSec / 3600)}h ago`;
}
