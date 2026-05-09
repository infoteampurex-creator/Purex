'use client';

import { motion } from 'framer-motion';
import { DeadliftSilhouette } from './DeadliftSilhouette';

interface GymSceneProps {
  /** Reserved for legacy variant compatibility — currently unused. */
  activated?: boolean;
}

/**
 * Login left panel composition (desktop only).
 *
 * Top:    Glowing PURE X neon wordmark with subtle pulse on letters
 * Center: Static deadlift silhouette (single pose, no animation)
 * Bottom: Manifesto + 3 pillar chips
 *
 * Replaces the previous animated SVG version which felt jerky.
 * No moving parts — pure premium static composition.
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
           TOP — Big PURE X neon wordmark
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
           CENTER — Static deadlift silhouette
      ════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.5 }}
        className="relative flex-1 flex items-center justify-center px-12 z-10"
      >
        <div className="w-full max-w-[280px]">
          <DeadliftSilhouette />
        </div>
      </motion.div>

      {/* ════════════════════════════════════════════════════
           BOTTOM — Manifesto
      ════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.8 }}
        className="relative pb-12 px-12 z-10 text-center"
      >
        <div className="font-display font-semibold text-xl text-text tracking-tight leading-[1.3] mb-3">
          Train for life.
          <br />
          <span className="text-text-muted">Not just aesthetics.</span>
        </div>

        {/* Three pillar chips */}
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

// ─── Big neon-style PURE X wordmark ───────────────────────────────

function NeonWordmark() {
  return (
    <div
      className="font-display font-bold tracking-[-0.02em] leading-none flex items-baseline gap-2"
      style={{
        fontSize: '4rem', // 64px
      }}
    >
      <span
        className="text-text"
        style={{
          textShadow:
            '0 0 8px rgba(255, 255, 255, 0.3), 0 0 24px rgba(255, 255, 255, 0.15)',
        }}
      >
        PURE
      </span>
      <span
        className="text-accent"
        style={{
          textShadow:
            '0 0 8px rgba(198, 255, 61, 0.6), 0 0 24px rgba(198, 255, 61, 0.4), 0 0 48px rgba(198, 255, 61, 0.2)',
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
