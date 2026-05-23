'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

interface Props {
  /** Resolved path under public/ — e.g. '/twin/avatars/male-heavy.png'. */
  src: string;
  /** Rendered width in px. Height auto-scales. Default 220. */
  width?: number;
  /** Glow accent colour around the character + ring base. */
  accent?: string;
  /** Optional Day-90 treatment: brighter aura + warm color grade. */
  glow?: boolean;
}

/**
 * Premium "live avatar" rendering — character PNG layered over a
 * holographic ring base, circuit grid backdrop, and ambient glow.
 *
 * Visually matches the user's reference design (Healthify-style 3D
 * character on a tech base). Pure SVG/CSS chrome, no Three.js, no
 * runtime cost beyond an image load.
 */
export function AvatarImage({
  src,
  width = 220,
  accent = '#7dd3ff',
  glow = false,
}: Props) {
  // PNGs were cropped to portrait — aspect ratio ~0.92:1 (W:H)
  const height = Math.round(width / 0.92);
  return (
    <div
      className="relative flex items-end justify-center"
      style={{ width, height: height + 22 /* extra room for ring base */ }}
    >
      {/* ─── Circuit grid backdrop ─── */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width={width}
        height={height + 22}
        viewBox={`0 0 ${width} ${height + 22}`}
        style={{ overflow: 'visible' }}
      >
        <defs>
          <pattern
            id={`grid-${accent.replace('#', '')}`}
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke={accent}
              strokeOpacity="0.10"
              strokeWidth="0.5"
            />
          </pattern>
          <radialGradient id={`bg-glow-${accent.replace('#', '')}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accent} stopOpacity={glow ? 0.30 : 0.18} />
            <stop offset="60%" stopColor={accent} stopOpacity="0.04" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Soft halo behind the character */}
        <ellipse
          cx={width / 2}
          cy={(height + 22) * 0.45}
          rx={width * 0.45}
          ry={(height + 22) * 0.42}
          fill={`url(#bg-glow-${accent.replace('#', '')})`}
        />

        {/* Subtle grid overlay */}
        <rect
          x={0}
          y={0}
          width={width}
          height={height + 22}
          fill={`url(#grid-${accent.replace('#', '')})`}
        />
      </svg>

      {/* ─── Character PNG with breathing animation ─── */}
      {/* Larger Y movement + scale + subtle rotation = visibly alive */}
      <motion.div
        animate={{
          y: [0, -5, 0],
          scale: [1, 1.015, 1],
          rotate: [0, 0.5, 0, -0.5, 0],
        }}
        transition={{
          y: { duration: 3.6, repeat: Infinity, ease: 'easeInOut' },
          scale: { duration: 3.6, repeat: Infinity, ease: 'easeInOut' },
          rotate: { duration: 7.2, repeat: Infinity, ease: 'easeInOut' },
        }}
        className="relative"
        style={{
          width,
          height,
          filter: glow
            ? `drop-shadow(0 0 22px ${accent}cc) drop-shadow(0 0 40px ${accent}66)`
            : `drop-shadow(0 0 14px ${accent}55) drop-shadow(0 6px 16px rgba(0,0,0,0.6))`,
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
      </motion.div>

      {/* ─── Holographic ring base under feet ─── */}
      <svg
        className="absolute pointer-events-none"
        width={width}
        height={28}
        viewBox={`0 0 ${width} 28`}
        style={{ bottom: 0, left: 0 }}
      >
        <defs>
          <radialGradient id={`base-${accent.replace('#', '')}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accent} stopOpacity={glow ? 0.85 : 0.65} />
            <stop offset="60%" stopColor={accent} stopOpacity="0.25" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Three nested ellipses for the layered tech-ring effect */}
        <ellipse
          cx={width / 2}
          cy={16}
          rx={width * 0.40}
          ry={5}
          fill="none"
          stroke={accent}
          strokeOpacity={glow ? 0.7 : 0.50}
          strokeWidth={1.5}
          style={{ filter: `drop-shadow(0 0 4px ${accent})` }}
        />
        <ellipse
          cx={width / 2}
          cy={18}
          rx={width * 0.33}
          ry={4}
          fill="none"
          stroke={accent}
          strokeOpacity={glow ? 0.55 : 0.35}
          strokeWidth={1}
          strokeDasharray="3 4"
        />
        <ellipse
          cx={width / 2}
          cy={20}
          rx={width * 0.25}
          ry={3}
          fill={`url(#base-${accent.replace('#', '')})`}
        />

        {/* Pulse dots on the outermost ring */}
        {[0.15, 0.5, 0.85].map((t) => {
          const x = width / 2 + Math.cos(t * Math.PI * 2) * width * 0.40;
          const y = 16 + Math.sin(t * Math.PI * 2) * 5;
          return (
            <motion.circle
              key={t}
              cx={x}
              cy={y}
              r={1.6}
              fill={accent}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{
                duration: 2.2,
                delay: t * 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{ filter: `drop-shadow(0 0 3px ${accent})` }}
            />
          );
        })}
      </svg>
    </div>
  );
}
