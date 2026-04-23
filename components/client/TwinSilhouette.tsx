'use client';

import type { TwinProjection } from '@/lib/data/twin';
import { cn } from '@/lib/cn';

interface TwinSilhouetteProps {
  projection: TwinProjection;
  variant?: 'current' | 'projected';
  label?: string;
  className?: string;
  compact?: boolean;
}

/**
 * Cinematic body silhouette — realistic anatomy with dramatic rim lighting,
 * muscle definition overlays, atmospheric particles, and a moody vignette.
 * Replaces the previous stick-figure.
 *
 * All pure SVG — no dependencies, no external assets.
 */
export function TwinSilhouette({
  projection,
  variant = 'current',
  label,
  className,
  compact = false,
}: TwinSilhouetteProps) {
  const { silhouette } = projection;
  const isProjected = variant === 'projected';

  // Palette
  const primaryColor = isProjected ? '#c6ff3d' : '#8fa3b5';
  const rimColor = isProjected ? '#eaff9a' : '#d5e2f0';
  const bodyFill = isProjected ? '#5a8a1d' : '#3e4e5e';
  const shadowFill = isProjected ? '#1f3504' : '#1a2230';

  // Posture
  const postureLift = silhouette.posture * 5;

  // Geometry (viewBox 240x380)
  const cx = 120;
  const headR = 22;
  const headCy = 50 - postureLift;

  const shoulderW = 48 * silhouette.shoulders;
  const shoulderY = 92 - postureLift;
  const chestW = 44 * silhouette.shoulders;
  const chestY = 128;
  const waistW = 32 * silhouette.waist;
  const waistY = 178;
  const hipW = 40 * silhouette.torsoWidth;
  const hipY = 210;

  const thighW = 20 * silhouette.legMass;
  const thighY = 250;
  const kneeW = 14 * silhouette.legMass;
  const kneeY = 290;
  const calfW = 15 * silhouette.legMass;
  const calfY = 310;
  const ankleY = 360;

  const armInner = shoulderW - 6;
  const armOuter = shoulderW + 4;
  const elbowOuter = shoulderW + 2;
  const elbowInner = shoulderW - 8;
  const elbowY = 170;
  const wristY = 215;
  const wristW = 10;

  const glowIntensity = 0.35 + silhouette.glow * 0.55;
  const particleCount = isProjected ? 14 : 0;

  return (
    <div className={cn('relative flex flex-col items-center', className)}>
      {label && (
        <div className="mb-3 text-center relative z-10">
          <div
            className="font-mono text-[9px] uppercase tracking-[0.22em] font-bold mb-1"
            style={{ color: primaryColor }}
          >
            {label}
          </div>
          <div className="font-display font-semibold text-sm md:text-base text-white leading-tight">
            {projection.label}
          </div>
        </div>
      )}

      <svg
        viewBox="0 0 240 380"
        className={cn('w-full h-auto', compact ? 'max-w-[160px]' : 'max-w-[220px]')}
        aria-hidden
      >
        <defs>
          <radialGradient id={`bg-${variant}`} cx="50%" cy="40%" r="70%">
            <stop
              offset="0%"
              stopColor={isProjected ? '#1a2308' : '#14191f'}
              stopOpacity="1"
            />
            <stop offset="100%" stopColor="#0a0c09" stopOpacity="1" />
          </radialGradient>

          <linearGradient id={`body-${variant}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={bodyFill} stopOpacity="0.95" />
            <stop offset="55%" stopColor={bodyFill} stopOpacity="0.78" />
            <stop offset="100%" stopColor={shadowFill} stopOpacity="0.9" />
          </linearGradient>

          <radialGradient id={`aura-${variant}`} cx="50%" cy="55%" r="55%">
            <stop
              offset="0%"
              stopColor={primaryColor}
              stopOpacity={glowIntensity * 0.45}
            />
            <stop offset="60%" stopColor={primaryColor} stopOpacity={glowIntensity * 0.1} />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
          </radialGradient>

          <radialGradient id={`floor-${variant}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>

          <filter id={`glow-${variant}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={isProjected ? 3 : 1.8} result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Moody background */}
        <rect width="240" height="380" fill={`url(#bg-${variant})`} rx="12" />

        {/* Aura glow behind figure */}
        <ellipse
          cx={cx}
          cy={200}
          rx={90 + silhouette.glow * 20}
          ry={170 + silhouette.glow * 15}
          fill={`url(#aura-${variant})`}
        />

        {/* Body silhouette */}
        <g>
          {/* Head */}
          <path
            d={`
              M ${cx} ${headCy - headR}
              C ${cx + headR * 0.85} ${headCy - headR}, ${cx + headR} ${headCy - headR * 0.5}, ${cx + headR} ${headCy}
              C ${cx + headR} ${headCy + headR * 0.8}, ${cx + headR * 0.55} ${headCy + headR * 1.15}, ${cx} ${headCy + headR * 1.2}
              C ${cx - headR * 0.55} ${headCy + headR * 1.15}, ${cx - headR} ${headCy + headR * 0.8}, ${cx - headR} ${headCy}
              C ${cx - headR} ${headCy - headR * 0.5}, ${cx - headR * 0.85} ${headCy - headR}, ${cx} ${headCy - headR}
              Z
            `}
            fill={`url(#body-${variant})`}
          />

          {/* Neck */}
          <path
            d={`
              M ${cx - 9} ${headCy + headR * 0.95}
              L ${cx - 11} ${shoulderY - 3}
              L ${cx + 11} ${shoulderY - 3}
              L ${cx + 9} ${headCy + headR * 0.95}
              Z
            `}
            fill={`url(#body-${variant})`}
          />

          {/* Torso */}
          <path
            d={`
              M ${cx - shoulderW} ${shoulderY}
              C ${cx - shoulderW - 3} ${shoulderY + 15}, ${cx - chestW - 2} ${chestY - 10}, ${cx - chestW} ${chestY}
              C ${cx - chestW + 2} ${chestY + 25}, ${cx - waistW - 2} ${waistY - 20}, ${cx - waistW} ${waistY}
              C ${cx - waistW - 1} ${waistY + 10}, ${cx - hipW + 2} ${hipY - 5}, ${cx - hipW} ${hipY}
              L ${cx + hipW} ${hipY}
              C ${cx + hipW - 2} ${hipY - 5}, ${cx + waistW + 1} ${waistY + 10}, ${cx + waistW} ${waistY}
              C ${cx + waistW + 2} ${waistY - 20}, ${cx + chestW - 2} ${chestY + 25}, ${cx + chestW} ${chestY}
              C ${cx + chestW + 2} ${chestY - 10}, ${cx + shoulderW + 3} ${shoulderY + 15}, ${cx + shoulderW} ${shoulderY}
              C ${cx + shoulderW - 8} ${shoulderY - 4}, ${cx + 14} ${shoulderY - 5}, ${cx + 11} ${shoulderY - 3}
              L ${cx - 11} ${shoulderY - 3}
              C ${cx - 14} ${shoulderY - 5}, ${cx - shoulderW + 8} ${shoulderY - 4}, ${cx - shoulderW} ${shoulderY}
              Z
            `}
            fill={`url(#body-${variant})`}
          />

          {/* Left arm */}
          <path
            d={`
              M ${cx - armInner} ${shoulderY + 2}
              C ${cx - armOuter - 2} ${shoulderY + 30}, ${cx - elbowOuter - 4} ${elbowY - 20}, ${cx - elbowOuter} ${elbowY}
              C ${cx - elbowOuter + 2} ${elbowY + 15}, ${cx - elbowInner - wristW - 1} ${wristY - 10}, ${cx - elbowInner - wristW} ${wristY + 5}
              L ${cx - elbowInner + wristW / 2} ${wristY + 5}
              C ${cx - elbowInner + wristW / 2 - 1} ${wristY - 5}, ${cx - elbowInner - 2} ${elbowY + 10}, ${cx - elbowInner + 2} ${elbowY}
              C ${cx - elbowInner + 6} ${elbowY - 25}, ${cx - armInner + 2} ${shoulderY + 20}, ${cx - armInner + 4} ${shoulderY + 4}
              Z
            `}
            fill={`url(#body-${variant})`}
          />

          {/* Right arm */}
          <path
            d={`
              M ${cx + armInner} ${shoulderY + 2}
              C ${cx + armOuter + 2} ${shoulderY + 30}, ${cx + elbowOuter + 4} ${elbowY - 20}, ${cx + elbowOuter} ${elbowY}
              C ${cx + elbowOuter - 2} ${elbowY + 15}, ${cx + elbowInner + wristW + 1} ${wristY - 10}, ${cx + elbowInner + wristW} ${wristY + 5}
              L ${cx + elbowInner - wristW / 2} ${wristY + 5}
              C ${cx + elbowInner - wristW / 2 + 1} ${wristY - 5}, ${cx + elbowInner + 2} ${elbowY + 10}, ${cx + elbowInner - 2} ${elbowY}
              C ${cx + elbowInner - 6} ${elbowY - 25}, ${cx + armInner - 2} ${shoulderY + 20}, ${cx + armInner - 4} ${shoulderY + 4}
              Z
            `}
            fill={`url(#body-${variant})`}
          />

          {/* Left leg */}
          <path
            d={`
              M ${cx - hipW + 4} ${hipY}
              C ${cx - thighW - 2} ${thighY - 10}, ${cx - thighW - 4} ${thighY + 20}, ${cx - thighW} ${thighY + 30}
              C ${cx - kneeW - 2} ${kneeY - 5}, ${cx - kneeW - 1} ${kneeY + 10}, ${cx - kneeW} ${kneeY + 15}
              C ${cx - calfW - 3} ${calfY - 5}, ${cx - calfW - 3} ${calfY + 20}, ${cx - calfW / 2 - 4} ${ankleY - 5}
              L ${cx - 4} ${ankleY}
              C ${cx - 4} ${calfY + 15}, ${cx - 4} ${thighY + 20}, ${cx - 4} ${hipY + 4}
              Z
            `}
            fill={`url(#body-${variant})`}
          />

          {/* Right leg */}
          <path
            d={`
              M ${cx + hipW - 4} ${hipY}
              C ${cx + thighW + 2} ${thighY - 10}, ${cx + thighW + 4} ${thighY + 20}, ${cx + thighW} ${thighY + 30}
              C ${cx + kneeW + 2} ${kneeY - 5}, ${cx + kneeW + 1} ${kneeY + 10}, ${cx + kneeW} ${kneeY + 15}
              C ${cx + calfW + 3} ${calfY - 5}, ${cx + calfW + 3} ${calfY + 20}, ${cx + calfW / 2 + 4} ${ankleY - 5}
              L ${cx + 4} ${ankleY}
              C ${cx + 4} ${calfY + 15}, ${cx + 4} ${thighY + 20}, ${cx + 4} ${hipY + 4}
              Z
            `}
            fill={`url(#body-${variant})`}
          />
        </g>

        {/* Rim light — cinematic left-side highlight */}
        <g filter={`url(#glow-${variant})`} opacity={0.9}>
          <path
            d={`
              M ${cx - headR + 1} ${headCy - 3}
              C ${cx - headR + 2} ${headCy - headR * 0.6}, ${cx - headR * 0.7} ${headCy - headR + 1}, ${cx - 3} ${headCy - headR + 1}
            `}
            stroke={rimColor}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            opacity={0.95}
          />
          <path
            d={`
              M ${cx - shoulderW + 2} ${shoulderY - 1}
              C ${cx - shoulderW - 2} ${shoulderY + 10}, ${cx - shoulderW - 4} ${shoulderY + 30}, ${cx - shoulderW - 2} ${shoulderY + 50}
            `}
            stroke={rimColor}
            strokeWidth={2.2}
            fill="none"
            strokeLinecap="round"
            opacity={0.95}
          />
          <path
            d={`
              M ${cx - armOuter} ${shoulderY + 30}
              C ${cx - elbowOuter - 3} ${elbowY - 15}, ${cx - elbowOuter - 3} ${elbowY + 5}, ${cx - elbowOuter - 2} ${elbowY + 20}
            `}
            stroke={rimColor}
            strokeWidth={1.8}
            fill="none"
            strokeLinecap="round"
            opacity={0.8}
          />
          <path
            d={`
              M ${cx - chestW + 1} ${chestY + 20}
              C ${cx - waistW - 2} ${waistY - 15}, ${cx - waistW - 2} ${waistY + 2}, ${cx - waistW - 1} ${waistY + 15}
            `}
            stroke={rimColor}
            strokeWidth={1.8}
            fill="none"
            strokeLinecap="round"
            opacity={0.85}
          />
          <path
            d={`
              M ${cx - thighW - 2} ${thighY + 15}
              C ${cx - kneeW - 3} ${kneeY}, ${cx - calfW - 3} ${calfY + 10}, ${cx - calfW / 2 - 5} ${ankleY - 15}
            `}
            stroke={rimColor}
            strokeWidth={1.5}
            fill="none"
            strokeLinecap="round"
            opacity={0.7}
          />
        </g>

        {/* Muscle definition — appears as athletic level rises */}
        {silhouette.glow > 0.35 && (
          <g opacity={0.3 + silhouette.glow * 0.3}>
            {/* Pec line */}
            <path
              d={`M ${cx - 16} ${chestY - 5} Q ${cx} ${chestY + 6} ${cx + 16} ${chestY - 5}`}
              stroke={rimColor}
              strokeWidth={1}
              fill="none"
              strokeLinecap="round"
            />
            {/* Ab centre */}
            <line
              x1={cx}
              y1={chestY + 12}
              x2={cx}
              y2={waistY - 5}
              stroke={rimColor}
              strokeWidth={0.8}
              opacity={0.6}
            />
            {/* Abs */}
            {silhouette.glow > 0.55 && (
              <>
                <line x1={cx - 10} y1={chestY + 25} x2={cx + 10} y2={chestY + 25}
                  stroke={rimColor} strokeWidth={0.6} opacity={0.5} />
                <line x1={cx - 11} y1={chestY + 40} x2={cx + 11} y2={chestY + 40}
                  stroke={rimColor} strokeWidth={0.6} opacity={0.5} />
                <line x1={cx - 10} y1={chestY + 55} x2={cx + 10} y2={chestY + 55}
                  stroke={rimColor} strokeWidth={0.6} opacity={0.4} />
              </>
            )}
            {/* Bicep peaks */}
            {silhouette.glow > 0.5 && (
              <>
                <ellipse
                  cx={cx - elbowOuter + 5}
                  cy={(shoulderY + elbowY) / 2}
                  rx={4}
                  ry={10}
                  fill={rimColor}
                  opacity={0.15}
                />
                <ellipse
                  cx={cx + elbowOuter - 5}
                  cy={(shoulderY + elbowY) / 2}
                  rx={4}
                  ry={10}
                  fill={rimColor}
                  opacity={0.15}
                />
              </>
            )}
            {/* Quad lines */}
            <line
              x1={cx - thighW / 2}
              y1={thighY + 5}
              x2={cx - kneeW / 2 - 2}
              y2={kneeY + 5}
              stroke={rimColor}
              strokeWidth={0.6}
              opacity={0.4}
            />
            <line
              x1={cx + thighW / 2}
              y1={thighY + 5}
              x2={cx + kneeW / 2 + 2}
              y2={kneeY + 5}
              stroke={rimColor}
              strokeWidth={0.6}
              opacity={0.4}
            />
          </g>
        )}

        {/* Floating particles — projected variant */}
        {isProjected &&
          [...Array(particleCount)].map((_, i) => {
            const seed = i * 37;
            const x = 40 + (seed % 160);
            const y = 60 + ((seed * 13) % 300);
            const size = 1 + ((seed * 7) % 3);
            const opacity = 0.3 + ((seed * 11) % 50) / 100;
            const delay = (i * 0.25) % 3;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={size}
                fill={primaryColor}
                opacity={opacity}
              >
                <animate
                  attributeName="cy"
                  values={`${y};${y - 40};${y}`}
                  dur="6s"
                  begin={`${delay}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values={`${opacity};${opacity * 1.4};${opacity * 0.3}`}
                  dur="6s"
                  begin={`${delay}s`}
                  repeatCount="indefinite"
                />
              </circle>
            );
          })}

        {/* Floor shadow */}
        <ellipse
          cx={cx}
          cy={370}
          rx={50}
          ry={7}
          fill={`url(#floor-${variant})`}
          opacity={0.85}
        />

        {/* Vignette */}
        <rect
          width="240"
          height="380"
          fill="none"
          stroke="#0a0c09"
          strokeWidth="24"
          opacity="0.4"
          rx="12"
        />
      </svg>
    </div>
  );
}
