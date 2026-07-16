'use client';

import { motion } from 'framer-motion';
import { Heart, Activity, Thermometer, Droplets } from 'lucide-react';

export interface VitalsSnapshot {
  heartRateBpm: number | null;
  hrvMs: number | null;
  spo2Pct: number | null;
  skinTempC: number | null;
  /** True when we're rendering demo/preview values, not real health data. */
  isPreview: boolean;
}

/**
 * Compact "medical monitor" style vitals strip. Sits under the Twin
 * avatar on the dashboard hero. Each vital renders with a subtle live
 * animation — the heart pulses at the current HR, the ECG line
 * breathes, the HRV number ticks up and down softly.
 *
 * Vital signs are the single biggest tell of "premium fitness app" —
 * Whoop shows HR + HRV + skin temp + SpO2, Fitbit shows resting HR
 * and O2, Garmin shows all four. Adding this to the Twin card puts
 * us at parity with the visual density they hit.
 *
 * When Health Connect / Whoop / Fitbit sync lands, these come from
 * real data. Until then, the preview mode shows sample vitals
 * clearly labelled with a "Sample" chip so it's honest.
 */
export function VitalsStrip({ vitals }: { vitals: VitalsSnapshot }) {
  const { heartRateBpm, hrvMs, spo2Pct, skinTempC, isPreview } = vitals;

  // Cardiac cycle in seconds derived from bpm. 60 bpm = 1 s / beat.
  // Falls back to 1 s if we don't have a value.
  const beatSeconds = heartRateBpm ? 60 / Math.max(30, heartRateBpm) : 1;

  return (
    <section
      className="relative rounded-2xl border overflow-hidden px-4 py-3"
      style={{
        background: `
          radial-gradient(ellipse at 0% 0%, rgba(255,71,102,0.10), transparent 50%),
          linear-gradient(180deg, #0d1310 0%, #0a0c09 100%)
        `,
        borderColor: 'rgba(255,71,102,0.28)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div
          className="inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.22em] font-bold"
          style={{ fontSize: 9, color: '#ff8fa3' }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{
              background: '#ff4566',
              animation: `pulse-dot ${beatSeconds}s ease-in-out infinite`,
            }}
          />
          Vital Signs
        </div>
        {isPreview && (
          <span
            className="font-mono uppercase tracking-[0.14em] font-bold px-2 py-0.5 rounded-full"
            style={{
              fontSize: 8,
              color: '#ffd24d',
              background: 'rgba(255,210,77,0.10)',
              border: '1px solid rgba(255,210,77,0.32)',
            }}
          >
            Sample
          </span>
        )}
      </div>

      {/* ECG-ish line — a stylised waveform, not clinical. */}
      <svg
        width="100%"
        height="22"
        viewBox="0 0 320 22"
        aria-hidden
        className="opacity-70 mb-2"
      >
        <defs>
          <linearGradient id="ecg-fade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ff4566" stopOpacity="0" />
            <stop offset="20%" stopColor="#ff4566" stopOpacity="0.85" />
            <stop offset="80%" stopColor="#ff4566" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#ff4566" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d="M 0 11 L 40 11 L 55 11 L 60 6 L 65 15 L 70 4 L 75 17 L 80 11 L 130 11 L 145 11 L 150 6 L 155 15 L 160 4 L 165 17 L 170 11 L 220 11 L 235 11 L 240 6 L 245 15 L 250 4 L 255 17 L 260 11 L 320 11"
          fill="none"
          stroke="url(#ecg-fade)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          animate={{ x: [0, -20, 0] }}
          transition={{
            duration: beatSeconds * 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </svg>

      <div className="grid grid-cols-4 gap-1">
        <Vital
          icon={Heart}
          value={heartRateBpm != null ? Math.round(heartRateBpm) : '—'}
          unit="bpm"
          color="#ff4566"
          pulseSeconds={beatSeconds}
        />
        <Vital
          icon={Activity}
          value={hrvMs != null ? Math.round(hrvMs) : '—'}
          unit="ms"
          color="#7dd3ff"
        />
        <Vital
          icon={Droplets}
          value={spo2Pct != null ? `${Math.round(spo2Pct)}` : '—'}
          unit="%"
          color="#c6ff3d"
        />
        <Vital
          icon={Thermometer}
          value={skinTempC != null ? skinTempC.toFixed(1) : '—'}
          unit="°C"
          color="#ffd24d"
        />
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.35); opacity: 1; }
        }
      `}</style>
    </section>
  );
}

function Vital({
  icon: Icon,
  value,
  unit,
  color,
  pulseSeconds,
}: {
  icon: React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    color?: string;
    style?: React.CSSProperties;
  }>;
  value: number | string;
  unit: string;
  color: string;
  pulseSeconds?: number;
}) {
  return (
    <div className="flex flex-col items-center py-1">
      <Icon
        size={12}
        strokeWidth={2.2}
        color={color}
        style={{
          animation: pulseSeconds
            ? `pulse-dot ${pulseSeconds}s ease-in-out infinite`
            : undefined,
        }}
      />
      <div
        className="font-display font-bold leading-none tabular-nums mt-1"
        style={{ fontSize: 16, color: 'rgba(245,245,240,0.98)' }}
      >
        {value}
      </div>
      <div
        className="font-mono uppercase tracking-[0.14em] font-bold"
        style={{ fontSize: 8, color: 'rgba(255,255,255,0.50)', marginTop: 1 }}
      >
        {unit}
      </div>
    </div>
  );
}
