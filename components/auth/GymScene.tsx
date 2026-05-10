'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GymSceneProps {
  /** Reserved for legacy variant compatibility — currently unused. */
  activated?: boolean;
}

/**
 * Brand-only headline lines that cycle on the login page. Deliberately
 * about the methodology, never about specific clients — the auth page
 * shouldn't leak any roster info.
 */
const BRAND_LINES: Array<{ primary: string; secondary: string }> = [
  { primary: 'Train for life.', secondary: 'Not just aesthetics.' },
  { primary: 'Five specialists.', secondary: 'One playbook.' },
  { primary: 'Hundred days.', secondary: 'Witnessed.' },
];

const ROTATE_MS = 5000;

/**
 * Login left panel composition (desktop only).
 *
 * Top:    Glowing PURE X neon wordmark with subtle pulse
 * Center: Static deadlift silhouette with plate-dot pulse
 * Bottom: Manifesto + 3 pillar chips
 *
 * Background composition (option A — cinematic ambient motion):
 *   - Radial accent halos behind the figure
 *   - Slow-drifting grid pattern overlay
 *   - Slow accent-tinted gradient sweep that travels across the panel
 *   - Three floating motes from the existing pureX-mote-* keyframes
 */
export function GymScene({ activated: _activated }: GymSceneProps = {}) {
  return (
    <div className="relative w-full h-full bg-bg overflow-hidden flex flex-col">
      {/* ─── Backdrop atmosphere ─── */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 50% 40%, rgba(198, 255, 61, 0.10) 0%, transparent 55%),
            radial-gradient(ellipse at 50% 100%, rgba(198, 255, 61, 0.04) 0%, transparent 50%),
            #0a0c09
          `,
        }}
      />

      {/* Slow-drifting grid — sells the "lit room" texture */}
      <div
        aria-hidden
        className="absolute inset-[-40px] pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(198,255,61,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(198,255,61,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          animation: 'pureX-grid-drift 18s linear infinite',
          willChange: 'transform',
        }}
      />

      {/* Slow accent gradient sweep — the panel feels lit */}
      <div
        aria-hidden
        className="absolute inset-y-0 -inset-x-[40%] pointer-events-none"
        style={{
          background:
            'linear-gradient(105deg, transparent 35%, rgba(198,255,61,0.10) 50%, transparent 65%)',
          animation: 'pureX-sweep 14s ease-in-out infinite',
          willChange: 'transform, opacity',
        }}
      />

      {/* Floating motes — three different paths/speeds */}
      <span
        aria-hidden
        className="absolute pointer-events-none rounded-full"
        style={{
          left: '20%',
          top: '70%',
          width: 4,
          height: 4,
          background: 'rgba(198,255,61,0.6)',
          boxShadow: '0 0 12px rgba(198,255,61,0.6)',
          animation: 'pureX-mote-1 9s ease-in-out infinite',
        }}
      />
      <span
        aria-hidden
        className="absolute pointer-events-none rounded-full"
        style={{
          left: '70%',
          top: '55%',
          width: 3,
          height: 3,
          background: 'rgba(198,255,61,0.5)',
          boxShadow: '0 0 10px rgba(198,255,61,0.5)',
          animation: 'pureX-mote-2 11s ease-in-out infinite',
        }}
      />
      <span
        aria-hidden
        className="absolute pointer-events-none rounded-full"
        style={{
          left: '40%',
          top: '30%',
          width: 2,
          height: 2,
          background: 'rgba(198,255,61,0.4)',
          boxShadow: '0 0 8px rgba(198,255,61,0.4)',
          animation: 'pureX-mote-3 13s ease-in-out infinite',
        }}
      />

      {/* Subtle vignette */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.5) 100%)',
        }}
      />

      {/* ════════════════════════════════════════════════════
           TOP — PURE X neon wordmark
      ════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="relative pt-16 pb-4 flex flex-col items-center z-10"
      >
        <NeonWordmark />
        <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.28em] text-accent font-bold">
          Station 01
        </div>
      </motion.div>

      {/* ════════════════════════════════════════════════════
           CENTER — Rotating brand tagline (no client data)
      ════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.5 }}
        className="relative flex-1 flex items-center justify-center px-12 z-10"
      >
        <RotatingTagline />
      </motion.div>

      {/* ════════════════════════════════════════════════════
           BOTTOM — Pillar chips
      ════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.8 }}
        className="relative pb-12 px-12 z-10 text-center"
      >
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <PillarChip label="100 days" />
          <Dot />
          <PillarChip label="5 specialists" />
          <Dot />
          <PillarChip label="Witnessed" />
        </div>
      </motion.div>
    </div>
  );
}

// ─── Center: rotating two-line brand statement ─────────────────────

function RotatingTagline() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % BRAND_LINES.length),
      ROTATE_MS
    );
    return () => window.clearInterval(id);
  }, []);

  const line = BRAND_LINES[index];

  return (
    <div className="relative max-w-md text-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="font-display font-semibold tracking-tight leading-[1.15]"
          style={{ fontSize: 'clamp(1.75rem, 3.4vw, 2.75rem)' }}
        >
          <div className="text-text">{line.primary}</div>
          <div className="text-text-muted mt-1.5">{line.secondary}</div>
        </motion.div>
      </AnimatePresence>

      {/* Slim progress strip showing which line we're on. Three short
          bars, the active one bright, others dimmed — matches the
          ambient-motion vibe without adding noise. */}
      <div
        aria-hidden
        className="mt-9 flex items-center justify-center gap-2"
      >
        {BRAND_LINES.map((_, i) => (
          <div
            key={i}
            className="h-px transition-all duration-500 ease-out"
            style={{
              width: i === index ? 28 : 14,
              background:
                i === index
                  ? 'rgba(198, 255, 61, 0.85)'
                  : 'rgba(255, 255, 255, 0.18)',
              boxShadow:
                i === index
                  ? '0 0 8px rgba(198, 255, 61, 0.6)'
                  : 'none',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Big neon-style PURE X wordmark ───────────────────────────────

function NeonWordmark() {
  return (
    <div
      className="font-display font-bold tracking-[-0.02em] leading-none flex items-baseline gap-2"
      style={{ fontSize: '4rem' }}
    >
      <span
        className="text-text"
        style={{
          animation: 'pureX-white-breathe 6s ease-in-out infinite',
        }}
      >
        PURE
      </span>
      <span
        className="text-accent"
        style={{
          animation: 'pureX-neon-breathe 6s ease-in-out infinite',
        }}
      >
        X
      </span>
    </div>
  );
}

function PillarChip({ label }: { label: string }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-dim font-bold">
      {label}
    </span>
  );
}

function Dot() {
  return <span className="text-text-dim text-xs">·</span>;
}
