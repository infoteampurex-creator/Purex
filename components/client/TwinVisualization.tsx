'use client';

import type { TwinProjection } from '@/lib/data/twin';
import { cn } from '@/lib/cn';

interface TwinVisualizationProps {
  projection: TwinProjection;
  variant?: 'current' | 'projected';
  label?: string;
  className?: string;
  compact?: boolean;
}

/**
 * TwinVisualization — an atmospheric, abstract visualization of the
 * client's trajectory at a given milestone.
 *
 * Deliberately NOT a literal body. This is a cinematic data-viz
 * composition — dramatic lighting, radiating energy, floating particles
 * — that evokes transformation.
 *
 * Aesthetic contrast between variants:
 *   - "current": cool blue, quiet, single soft orb
 *   - "projected": warm lime, energetic, radiating lines, multiple
 *     particles, pulsing core, live-feel
 *
 * The `projection.silhouette.glow` value (0-1) drives intensity.
 */
export function TwinVisualization({
  projection,
  variant = 'current',
  label,
  className,
  compact = false,
}: TwinVisualizationProps) {
  const isProjected = variant === 'projected';
  const glow = projection.silhouette.glow;

  const primaryColor = isProjected ? '#c6ff3d' : '#7dd3ff';
  const accentColor = isProjected ? '#eaff9a' : '#b5dcef';

  const height = compact ? 280 : 420;
  const particleCount = isProjected ? 14 + Math.round(glow * 10) : 6;

  return (
    <div
      className={cn('relative w-full overflow-hidden rounded-2xl', className)}
      style={{ height, background: '#0a0c09' }}
    >
      {/* Atmospheric background */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isProjected
            ? `
              radial-gradient(ellipse at 50% 40%, rgba(198, 255, 61, ${0.1 + glow * 0.12}) 0%, transparent 55%),
              radial-gradient(ellipse at 30% 90%, rgba(125, 211, 255, 0.06) 0%, transparent 60%),
              linear-gradient(180deg, #101510 0%, #0a0c09 100%)
            `
            : `
              radial-gradient(ellipse at 50% 40%, rgba(125, 211, 255, 0.08) 0%, transparent 55%),
              linear-gradient(180deg, #0f131a 0%, #0a0c09 100%)
            `,
        }}
      />

      {/* Energy core — SVG */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        <defs>
          <filter id={`glow-filter-${variant}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={isProjected ? 8 : 4} />
          </filter>

          <radialGradient id={`orb-${variant}`} cx="50%" cy="50%" r="50%">
            <stop
              offset="0%"
              stopColor={accentColor}
              stopOpacity={isProjected ? 0.9 : 0.4}
            />
            <stop
              offset="40%"
              stopColor={primaryColor}
              stopOpacity={isProjected ? 0.6 : 0.25}
            />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
          </radialGradient>

          <radialGradient id={`core-${variant}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={isProjected ? 0.8 : 0.4} />
            <stop offset="50%" stopColor={accentColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Pulse rings — projected only */}
        {isProjected && (
          <>
            <circle
              cx="200"
              cy="200"
              r="120"
              fill="none"
              stroke={primaryColor}
              strokeWidth="1"
              opacity="0.3"
            >
              <animate attributeName="r" values="120;180;120" dur="4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0;0.4" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle
              cx="200"
              cy="200"
              r="140"
              fill="none"
              stroke={primaryColor}
              strokeWidth="1"
              opacity="0.2"
            >
              <animate attributeName="r" values="140;200;140" dur="4s" begin="1s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0;0.3" dur="4s" begin="1s" repeatCount="indefinite" />
            </circle>
          </>
        )}

        {/* Main orb */}
        <g filter={`url(#glow-filter-${variant})`}>
          <circle cx="200" cy="200" r={isProjected ? 110 : 90} fill={`url(#orb-${variant})`}>
            {isProjected && (
              <animate attributeName="r" values="110;115;110" dur="3s" repeatCount="indefinite" />
            )}
          </circle>
        </g>

        {/* Inner core */}
        <g filter={`url(#glow-filter-${variant})`}>
          <circle cx="200" cy="200" r={isProjected ? 55 : 45} fill={`url(#core-${variant})`}>
            {isProjected && (
              <animate attributeName="r" values="55;62;55" dur="3s" repeatCount="indefinite" />
            )}
          </circle>
        </g>

        {/* Radiating lines — projected only */}
        {isProjected &&
          [...Array(12)].map((_, i) => {
            const angle = (i / 12) * Math.PI * 2;
            const x1 = 200 + Math.cos(angle) * 90;
            const y1 = 200 + Math.sin(angle) * 90;
            const x2 = 200 + Math.cos(angle) * 160;
            const y2 = 200 + Math.sin(angle) * 160;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={primaryColor}
                strokeWidth="0.8"
                strokeLinecap="round"
                opacity="0.25"
              >
                <animate
                  attributeName="opacity"
                  values="0.1;0.4;0.1"
                  dur={`${3 + (i % 3)}s`}
                  begin={`${i * 0.1}s`}
                  repeatCount="indefinite"
                />
              </line>
            );
          })}

        {/* Floor grid lines */}
        <g opacity={isProjected ? 0.25 : 0.15}>
          <line x1="0" y1="340" x2="400" y2="340" stroke={primaryColor} strokeWidth="0.5" />
          <line x1="100" y1="300" x2="300" y2="300" stroke={primaryColor} strokeWidth="0.5" opacity="0.5" />
          <line x1="150" y1="270" x2="250" y2="270" stroke={primaryColor} strokeWidth="0.5" opacity="0.3" />
        </g>
      </svg>

      {/* Floating particles */}
      <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(particleCount)].map((_, i) => {
          const seed = i * 37;
          const left = 5 + (seed * 13) % 90;
          const top = 10 + (seed * 29) % 80;
          const size = 1 + ((seed * 7) % 3);
          const duration = 4 + ((seed * 11) % 4);
          const delay = (seed * 0.13) % 4;
          const opacity = 0.3 + ((seed * 17) % 50) / 100;

          return (
            <span
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: `${size}px`,
                height: `${size}px`,
                background: primaryColor,
                opacity,
                boxShadow: `0 0 ${4 + size * 2}px ${primaryColor}`,
                animation: `twin-float ${duration}s ease-in-out ${delay}s infinite`,
              }}
            />
          );
        })}
      </div>

      {/* Label overlay */}
      {label && (
        <div className="absolute top-4 left-0 right-0 text-center z-10">
          <div
            className="inline-block font-mono text-[9px] uppercase tracking-[0.28em] font-bold mb-1"
            style={{ color: primaryColor }}
          >
            {label}
          </div>
          <div className="font-display font-semibold text-sm md:text-base text-white leading-tight">
            {projection.label}
          </div>
        </div>
      )}

      {/* Bottom status chip */}
      <div className="absolute bottom-4 left-0 right-0 text-center z-10 px-4">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border"
          style={{
            background: `${primaryColor}08`,
            borderColor: `${primaryColor}33`,
            color: primaryColor,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: primaryColor,
              boxShadow: `0 0 8px ${primaryColor}`,
              animation: isProjected ? 'twin-pulse-dot 1.5s ease-in-out infinite' : undefined,
            }}
          />
          <span className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.18em] font-bold">
            {isProjected ? 'ATHLETIC · RADIANT' : 'BASELINE · QUIET'}
          </span>
        </div>
      </div>

      {/* Vignette */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{ boxShadow: 'inset 0 0 100px 20px rgba(10, 12, 9, 0.6)' }}
      />

      {/* Keyframes */}
      <style jsx global>{`
        @keyframes twin-float {
          0%,
          100% {
            transform: translateY(0) scale(1);
            opacity: 0.35;
          }
          50% {
            transform: translateY(-40px) scale(1.3);
            opacity: 0.9;
          }
        }
        @keyframes twin-pulse-dot {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.3);
          }
        }
      `}</style>
    </div>
  );
}
