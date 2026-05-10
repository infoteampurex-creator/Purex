'use client';

import { motion } from 'framer-motion';

interface GymSceneProps {
  /** Reserved for legacy variant compatibility — currently unused. */
  activated?: boolean;
}

/**
 * Login left panel — giant illuminated PURE X wall poster.
 *
 * Composition:
 *   - Dark concrete wall (gradient + subtle grain)
 *   - Soft accent halo behind the wordmark, slowly breathing
 *   - Massive PURE X wordmark with layered neon text-shadow that pulses
 *     in time with the halo
 *   - "Station 01" caption + bottom-of-frame poster marks
 *
 * Inspired by a backlit signage piece on a workout-floor wall — bold,
 * physical, and quiet rather than busy.
 */
export function GymScene({ activated: _activated }: GymSceneProps = {}) {
  return (
    <div className="relative w-full h-full bg-bg overflow-hidden flex flex-col items-center justify-center">
      {/* ─── Wall surface ─── */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(180deg, #0d100b 0%, #0a0c09 50%, #07090a 100%)
          `,
        }}
      />

      {/* Subtle grain so the wall reads as a physical surface, not flat black */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* Faint horizontal scan lines — adds the "concrete + ceiling
          striplight" feel without being distracting */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent 0 3px, rgba(198,255,61,0.6) 3px 4px)',
        }}
      />

      {/* Vignette suggesting uneven wall lighting */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      {/* ─── Wall halo behind the wordmark ─── */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none flex items-center justify-center"
      >
        <div
          style={{
            width: '90%',
            height: '70%',
            background:
              'radial-gradient(ellipse at center, rgba(198, 255, 61, 0.22) 0%, rgba(198, 255, 61, 0.08) 35%, transparent 70%)',
            animation: 'pureX-wall-halo 6s ease-in-out infinite',
            filter: 'blur(40px)',
          }}
        />
      </div>

      {/* ─── Wordmark ─── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        className="relative z-10 flex flex-col items-center px-8"
      >
        <NeonWordmark />

        {/* Station caption */}
        <div className="mt-8 font-mono text-[11px] uppercase tracking-[0.42em] text-accent/85 font-bold">
          Station 01
        </div>
      </motion.div>

      {/* ─── Bottom poster marks ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        className="absolute bottom-8 left-0 right-0 px-10 z-10 flex items-end justify-between gap-4"
      >
        <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-text-dim">
          Train for life · Not just aesthetics
        </div>
        <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-text-dim hidden md:block">
          Edition 001 / ∞
        </div>
      </motion.div>

      {/* Top-left mounting marks (tiny screws on the poster) */}
      <div
        aria-hidden
        className="absolute top-6 left-6 right-6 flex justify-between pointer-events-none z-10"
      >
        <Screw />
        <Screw />
      </div>
      <div
        aria-hidden
        className="absolute bottom-6 left-6 right-6 flex justify-between pointer-events-none z-10"
      >
        <Screw />
        <Screw />
      </div>
    </div>
  );
}

// ─── Big neon-style PURE X wordmark ───────────────────────────────

function NeonWordmark() {
  return (
    <div
      className="font-display font-bold tracking-[-0.04em] leading-none flex items-baseline"
      style={{
        // Caps so it stays sane on ultrawide; floors so it never collapses
        fontSize: 'clamp(5rem, 12vw, 13rem)',
      }}
    >
      <span
        style={{
          color: '#f4f7eb',
          animation: 'pureX-white-breathe 6s ease-in-out infinite',
        }}
      >
        PURE
      </span>
      <span
        className="ml-3 md:ml-4"
        style={{
          color: '#c6ff3d',
          animation: 'pureX-neon-breathe 6s ease-in-out infinite',
        }}
      >
        X
      </span>
    </div>
  );
}

// Tiny corner element — sells the "physical poster mounted on the wall" idea.
function Screw() {
  return (
    <span
      aria-hidden
      className="block w-1.5 h-1.5 rounded-full"
      style={{
        background: '#1a1d18',
        boxShadow:
          'inset 0 1px 1px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05)',
      }}
    />
  );
}
