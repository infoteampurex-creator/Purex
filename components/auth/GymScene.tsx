'use client';

import { motion } from 'framer-motion';
import { DeadliftAnimation } from './DeadliftAnimation';

interface GymSceneProps {
  /** Reserved for legacy variant compatibility — currently unused. */
  activated?: boolean;
}

/**
 * Left panel of the auth screens.
 *
 * Composition:
 *   - Tiny PURE X wordmark anchored top-left (brand presence, not focal)
 *   - Centerpiece: animated deadlift loop (true focal point)
 *   - Below the lift: rotating manifesto lines
 *   - Subtle radial backdrop pulse for atmosphere
 *
 * Replaces the previous "neon sign + tiny corner deadlift" composition,
 * which left a lot of dead vertical space.
 */
export function GymScene({ activated: _activated }: GymSceneProps = {}) {
  return (
    <div className="relative w-full h-full bg-bg overflow-hidden">
      {/* ─── Backdrop atmosphere ─── */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 50% 60%, rgba(198, 255, 61, 0.08) 0%, transparent 55%),
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
            'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)',
        }}
      />

      {/* ─── Top-left wordmark ─── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="absolute top-6 left-6 z-10 flex items-center gap-1"
      >
        <span className="font-display font-bold text-base text-text tracking-tight">
          PURE
        </span>
        <span className="font-display font-bold text-base text-accent tracking-tight">
          X
        </span>
        <span className="ml-1.5 font-mono text-[8px] uppercase tracking-[0.2em] text-text-dim font-bold">
          · Station 01
        </span>
      </motion.div>

      {/* ─── Centerpiece: deadlift animation ─── */}
      <div className="absolute inset-0 flex items-center justify-center px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          className="w-full max-w-md"
        >
          <DeadliftAnimation />
        </motion.div>
      </div>

      {/* ─── Bottom manifesto ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.9 }}
        className="absolute bottom-8 left-6 right-6 z-10"
      >
        <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-accent font-bold mb-2">
          The 100-Day Commitment
        </div>
        <div className="font-display font-semibold text-xl text-text tracking-tight leading-[1.25] mb-4 max-w-sm">
          Train for life.
          <br />
          <span className="text-text-muted">Not just aesthetics.</span>
        </div>

        {/* Three-pillar tagline */}
        <div className="flex items-center gap-2 flex-wrap">
          <PillarChip label="100 days" />
          <span className="text-text-dim text-xs">·</span>
          <PillarChip label="6 specialists" />
          <span className="text-text-dim text-xs">·</span>
          <PillarChip label="Witnessed" />
        </div>
      </motion.div>
    </div>
  );
}

function PillarChip({ label }: { label: string }) {
  return (
    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-text-dim font-bold">
      {label}
    </span>
  );
}
