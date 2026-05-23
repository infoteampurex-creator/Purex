'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Ruler, Plus, Sparkles } from 'lucide-react';
import { BodyMeasurementsSheet } from './BodyMeasurementsSheet';
import type {
  BodyMeasurements,
  ProfileBodySettings,
} from '@/lib/data/body-measurements';

interface Props {
  latest: BodyMeasurements | null;
  profileSettings: ProfileBodySettings;
}

const ACCENT = '#7dd3ff';

const cmToIn = (cm: number | null): number | null =>
  cm == null ? null : Math.round((cm / 2.54) * 10) / 10;

/**
 * App-only widget that surfaces the latest body measurements + a
 * CTA to update them. Drives Phase 2's parametric avatar — when
 * the user logs measurements, the avatar will morph to match.
 */
export function BodyMeasurementsCardInner({ latest, profileSettings }: Props) {
  const [open, setOpen] = useState(false);
  const unit = profileSettings.unitPref;
  const hasData = latest != null && (
    latest.chestCm != null ||
    latest.waistCm != null ||
    latest.weightKg != null
  );

  const fmt = (cm: number | null): string => {
    if (cm == null) return '—';
    if (unit === 'in') {
      const v = cmToIn(cm) ?? 0;
      return `${v}″`;
    }
    return `${cm} cm`;
  };

  const daysAgo = (() => {
    if (!latest?.measuredAt) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const measured = new Date(latest.measuredAt + 'T00:00:00');
    const diff = Math.round((today.getTime() - measured.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'today';
    if (diff === 1) return 'yesterday';
    return `${diff} days ago`;
  })();

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full rounded-2xl overflow-hidden text-left active:scale-[0.99] transition-transform"
        style={{
          background: `
            linear-gradient(135deg, ${ACCENT}0F 0%, transparent 60%),
            linear-gradient(180deg, #10130f 0%, #0a0c09 100%)
          `,
          border: `1px solid ${ACCENT}33`,
        }}
      >
        <div className="px-4 py-3.5 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `${ACCENT}1A`,
              border: `1px solid ${ACCENT}33`,
              color: ACCENT,
            }}
          >
            <Ruler size={16} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="font-mono uppercase tracking-[0.22em] font-bold"
                style={{ fontSize: 10, color: ACCENT }}
              >
                My Body
              </span>
              {!hasData && (
                <span
                  className="font-mono uppercase tracking-[0.18em] font-bold flex items-center gap-1"
                  style={{ fontSize: 8, color: '#c6ff3d' }}
                >
                  <Sparkles size={9} />
                  Calibrate
                </span>
              )}
            </div>

            {hasData ? (
              <div className="mt-1 flex items-baseline gap-3 flex-wrap">
                {latest!.chestCm != null && (
                  <Stat label="Chest" value={fmt(latest!.chestCm)} />
                )}
                {latest!.waistCm != null && (
                  <Stat label="Waist" value={fmt(latest!.waistCm)} />
                )}
                {latest!.hipsCm != null && (
                  <Stat label="Hips" value={fmt(latest!.hipsCm)} />
                )}
              </div>
            ) : (
              <div
                className="font-display font-semibold mt-0.5 leading-tight"
                style={{ fontSize: 13, color: '#f5f5f0' }}
              >
                Log your measurements to wake your live Twin
              </div>
            )}

            {hasData && daysAgo && (
              <div
                className="font-mono uppercase tracking-[0.14em] mt-0.5"
                style={{ fontSize: 9, color: 'rgba(255,255,255,0.40)' }}
              >
                Updated {daysAgo}
              </div>
            )}
          </div>

          <div
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: `${ACCENT}1A`,
              border: `1px solid ${ACCENT}40`,
              color: ACCENT,
            }}
          >
            <Plus size={14} />
          </div>
        </div>
      </motion.button>

      <BodyMeasurementsSheet
        open={open}
        onClose={() => setOpen(false)}
        latest={latest}
        profileSettings={profileSettings}
      />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <span
        className="font-mono uppercase tracking-[0.14em]"
        style={{ fontSize: 9, color: 'rgba(255,255,255,0.40)' }}
      >
        {label}
      </span>
      <span
        className="font-display font-bold tabular-nums"
        style={{ fontSize: 13, color: '#f5f5f0' }}
      >
        {value}
      </span>
    </div>
  );
}
