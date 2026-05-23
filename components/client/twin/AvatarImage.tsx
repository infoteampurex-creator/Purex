'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

interface Props {
  src: string;
  width?: number;
  accent?: string;
  /** Brighter aura + warmer color grade — used by Day-90 future avatar. */
  glow?: boolean;
}

/**
 * Live avatar render — character WebP layered over a holographic SVG
 * stage with multi-layer ambient animation.
 *
 * Animation layers (each at a different tempo to give the eye
 * variety and a sense of depth):
 *   1. Aura halo — breathes 4s cycle (soft + slow)
 *   2. Background grid — subtle parallax drift 12s cycle
 *   3. Floating particles — random drift upward, 4-7s per particle
 *   4. Pulse rings from base — emanate every 2.5s
 *   5. Vertical scan line — sweeps top→bottom every 6s
 *   6. Character — independent subtle breathing (3.5s, NOT moving
 *      with the background — that was the user's main complaint)
 *   7. Ring base — pulse dots orbit + dashed mid-ring rotates
 *   8. Heart pulse on chest — vital sign, 1.2s cycle
 */
export function AvatarImage({
  src,
  width = 220,
  accent = '#7dd3ff',
  glow = false,
}: Props) {
  const height = Math.round(width / 0.92);
  const totalH = height + 22;
  const accentKey = accent.replace('#', '');

  // Deterministic particle positions so they don't reshuffle on re-render
  const particles = Array.from({ length: 8 }, (_, i) => {
    const seed = i * 47;
    return {
      x: 10 + ((seed * 13) % 90), // 10-100% horizontal
      delay: (seed * 0.17) % 5,
      duration: 4 + ((seed * 11) % 4),
      size: 1.2 + (i % 3) * 0.5,
    };
  });

  return (
    <div
      className="relative flex items-end justify-center overflow-hidden rounded-xl"
      style={{ width, height: totalH }}
    >
      {/* ═══ LAYER 1: Pulsing aura halo (background) ═══ */}
      <motion.div
        animate={{
          opacity: glow ? [0.55, 0.95, 0.55] : [0.40, 0.75, 0.40],
          scale: [1, 1.06, 1],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 65% 70% at 50% 45%,
            ${accent}40 0%,
            ${accent}10 45%,
            transparent 75%)`,
        }}
      />

      {/* ═══ LAYER 2: Slowly drifting grid backdrop ═══ */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width={width}
        height={totalH}
        viewBox={`0 0 ${width} ${totalH}`}
      >
        <defs>
          <pattern
            id={`grid-${accentKey}`}
            width="22"
            height="22"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 22 0 L 0 0 0 22"
              fill="none"
              stroke={accent}
              strokeOpacity="0.10"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <motion.rect
          x={0}
          y={0}
          width={width}
          height={totalH}
          fill={`url(#grid-${accentKey})`}
          animate={{ y: [0, -22, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        />
      </svg>

      {/* ═══ LAYER 3: Floating particles drifting upward ═══ */}
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: accent,
            left: `${p.x}%`,
            bottom: '8%',
            filter: `drop-shadow(0 0 4px ${accent})`,
          }}
          animate={{
            y: [0, -(totalH * 0.7)],
            opacity: [0, 0.9, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* ═══ LAYER 4: Pulse rings emanating from base ═══ */}
      {[0, 1.2, 2.4].map((delay, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: width * 0.4,
            height: 8,
            left: '50%',
            bottom: 6,
            x: '-50%',
            border: `1px solid ${accent}`,
            opacity: 0,
          }}
          animate={{
            scaleX: [1, 1.8],
            scaleY: [1, 0.5],
            opacity: [0.55, 0],
          }}
          transition={{
            duration: 2.5,
            delay,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* ═══ LAYER 5: Vertical scan line ═══ */}
      <motion.div
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          height: 2,
          background: `linear-gradient(90deg,
            transparent 0%,
            ${accent}99 50%,
            transparent 100%)`,
          boxShadow: `0 0 12px ${accent}`,
          mixBlendMode: 'screen',
        }}
        animate={{ top: ['0%', '95%'], opacity: [0, 0.9, 0.9, 0] }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          repeatDelay: 2.5,
          ease: 'linear',
          times: [0, 0.1, 0.9, 1],
        }}
      />

      {/* ═══ LAYER 6: Character — breathes INDEPENDENTLY of background ═══ */}
      <motion.div
        animate={{
          scale: [1, 1.013, 1],
          y: [0, -2, 0],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative z-10"
        style={{
          width,
          height,
          filter: glow
            ? `drop-shadow(0 0 24px ${accent}cc) drop-shadow(0 0 44px ${accent}66)`
            : `drop-shadow(0 0 16px ${accent}55) drop-shadow(0 8px 18px rgba(0,0,0,0.6))`,
        }}
      >
        <Image
          src={src}
          alt="Twin avatar"
          fill
          sizes={`${width}px`}
          priority={false}
          style={{ objectFit: 'contain', objectPosition: 'bottom' }}
        />

        {/* Heart pulse — small accent dot on chest area, pulsing */}
        <motion.span
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 6,
            height: 6,
            left: '50%',
            top: '32%',
            backgroundColor: '#ff4566',
            boxShadow: '0 0 8px #ff4566',
            x: '-50%',
            mixBlendMode: 'screen',
          }}
          animate={{ opacity: [0, 0.55, 0], scale: [1, 1.6, 1] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      </motion.div>

      {/* ═══ LAYER 7: Holographic ring base under feet ═══ */}
      <svg
        className="absolute pointer-events-none z-20"
        width={width}
        height={28}
        viewBox={`0 0 ${width} 28`}
        style={{ bottom: 0, left: 0 }}
      >
        <defs>
          <radialGradient id={`base-${accentKey}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accent} stopOpacity={glow ? 0.85 : 0.65} />
            <stop offset="60%" stopColor={accent} stopOpacity="0.25" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Solid outer ring */}
        <ellipse
          cx={width / 2}
          cy={16}
          rx={width * 0.40}
          ry={5}
          fill="none"
          stroke={accent}
          strokeOpacity={glow ? 0.75 : 0.55}
          strokeWidth={1.5}
          style={{ filter: `drop-shadow(0 0 5px ${accent})` }}
        />
        {/* Dashed counter-rotating mid ring */}
        <motion.ellipse
          cx={width / 2}
          cy={18}
          rx={width * 0.33}
          ry={4}
          fill="none"
          stroke={accent}
          strokeOpacity={glow ? 0.55 : 0.40}
          strokeWidth={1}
          strokeDasharray="3 4"
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: `${width / 2}px 18px` }}
        />
        {/* Inner glow */}
        <ellipse
          cx={width / 2}
          cy={20}
          rx={width * 0.25}
          ry={3}
          fill={`url(#base-${accentKey})`}
        />
        {/* Orbiting pulse dots */}
        {[0.15, 0.5, 0.85].map((t) => {
          const x = width / 2 + Math.cos(t * Math.PI * 2) * width * 0.40;
          const y = 16 + Math.sin(t * Math.PI * 2) * 5;
          return (
            <motion.circle
              key={t}
              cx={x}
              cy={y}
              r={1.8}
              fill={accent}
              animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.4, 1] }}
              transition={{
                duration: 2.2,
                delay: t * 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{ filter: `drop-shadow(0 0 4px ${accent})` }}
            />
          );
        })}
      </svg>
    </div>
  );
}
