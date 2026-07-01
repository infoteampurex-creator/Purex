'use client';

import { forwardRef } from 'react';
import type { PureXMother } from '@/lib/data/purex-mothers';
import { PUREX_MOTHERS_META } from '@/lib/data/purex-mothers';

interface Props {
  mother: PureXMother;
  displayName?: string;
  photoUrl: string | null;
  photoOffsetX?: number;
  photoOffsetY?: number;
  photoScale?: number;
  aspect: 'portrait' | 'square';
  revealed?: boolean;
}

// ─── Palette — pure gold on jet black ────────────────────────
const G_LIGHT = '#fff2b3';
const G_BRIGHT = '#ffd94a';
const G = '#e8b845';
const G_DEEP = '#a67c00';
const G_DARK = '#5a4200';
const CREAM = '#f8ecd2';

// Font-stack CSS variables set via next/font in fonts.ts
const F_SCRIPT = "var(--font-mothers-script), 'Great Vibes', cursive";
const F_ROMAN = "var(--font-mothers-roman), 'Cinzel', 'Trajan Pro', serif";
const F_SERIF = "var(--font-mothers-playfair), 'Playfair Display', Georgia, serif";
const F_MONO = "var(--font-mothers-mono), 'JetBrains Mono', ui-monospace, monospace";

/**
 * PURE X Mothers appreciation card — v4, pure black + all-gold.
 *
 * Rebuilt to match the reference mockup shared by the user:
 * - Pure jet-black background (no wine, no pink)
 * - All-gold palette (no rose-gold on the name — gold now)
 * - PX monogram + "TEAM PURE X" lockup at top
 * - Feature icons row (Strength · Diet · 10K Steps · Consistency)
 * - Photo circle with radial light rays + gilded conic ring
 * - "60 Days Completed" seal badge with laurel + ribbon
 * - Ornate laurel wreaths flanking the mother's name
 * - Award title in a star-framed nameplate
 * - Stat icon boxes at bottom
 * - Trainer nameplate with ornamental border
 * - Cornerstone filigree flourishes
 */
export const AppreciationCard = forwardRef<HTMLDivElement, Props>(
  function AppreciationCard(
    {
      mother,
      displayName,
      photoUrl,
      photoOffsetX = 0,
      photoOffsetY = 0,
      photoScale = 1,
      aspect,
      revealed = true,
    },
    ref
  ) {
    const W = 1080;
    const H = aspect === 'portrait' ? 1350 : 1080;
    const nameToShow = (displayName?.trim() || mother.name).trim();

    const P = aspect === 'portrait';
    const L = P
      ? {
          logoTop: 50,
          brandTop: 100,
          titleTop: 132,
          subtitleTop: 220,
          badgeTop: 258,
          featuresTop: 310,
          photoTop: 372,
          photoSize: 336,
          sealX: W - 268,
          sealY: 620,
          presentedTop: 780,
          nameTop: 820,
          nameFont: 130,
          awardTitleTop: 970,
          messageTop: 1058,
          statsTop: 1140,
          trainerTop: 1250,
          footerTop: 1298,
        }
      : {
          logoTop: 32,
          brandTop: 74,
          titleTop: 100,
          subtitleTop: 180,
          badgeTop: 216,
          featuresTop: 262,
          photoTop: 316,
          photoSize: 258,
          sealX: W - 232,
          sealY: 480,
          presentedTop: 596,
          nameTop: 630,
          nameFont: 100,
          awardTitleTop: 748,
          messageTop: 0,
          statsTop: 838,
          trainerTop: 946,
          footerTop: 990,
        };

    return (
      <div
        ref={ref}
        data-purex-card
        style={{
          width: W,
          height: H,
          position: 'relative',
          overflow: 'hidden',
          fontFamily: F_SERIF,
          color: CREAM,
          background: '#000000',
        }}
      >
        {/* Faint gilded shine sweep for depth (very subtle on pure black) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(115deg,
              transparent 42%,
              rgba(255,215,74,0.030) 48%,
              rgba(255,215,74,0.060) 50%,
              rgba(255,215,74,0.030) 52%,
              transparent 58%
            )`,
            mixBlendMode: 'screen',
          }}
        />

        {/* Outer gold border + inner hairline */}
        <div
          style={{
            position: 'absolute',
            inset: 26,
            border: `3px solid ${G}`,
            borderRadius: 8,
            boxShadow: `0 0 40px rgba(232,184,69,0.20) inset`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 38,
            border: `1px solid ${G_DEEP}`,
            borderRadius: 4,
            opacity: 0.85,
          }}
        />

        {/* Ornate corner filigree flourishes */}
        <CornerFlourish x={26} y={26} rot={0} />
        <CornerFlourish x={W - 26} y={26} rot={90} />
        <CornerFlourish x={W - 26} y={H - 26} rot={180} />
        <CornerFlourish x={26} y={H - 26} rot={-90} />

        {/* ─── TOP: PX logo mark + TEAM PURE X ─────────────── */}
        <div
          style={{
            position: 'absolute',
            top: L.logoTop,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <PXLogo />
        </div>
        <div
          style={{
            position: 'absolute',
            top: L.brandTop,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: F_MONO,
            fontSize: 15,
            letterSpacing: '0.60em',
            color: G_BRIGHT,
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          Team PURE X
        </div>

        {/* ─── "PURE X Mothers" ─── */}
        <div
          style={{
            position: 'absolute',
            top: L.titleTop,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: F_ROMAN,
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: '0.01em',
            background: `linear-gradient(180deg, ${G_LIGHT} 0%, ${G_BRIGHT} 45%, ${G_DEEP} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textTransform: 'uppercase',
          }}
        >
          PURE X Mothers
        </div>

        {/* ─── "60 DAYS OF STRENGTH" ─── */}
        <div
          style={{
            position: 'absolute',
            top: L.subtitleTop,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: F_MONO,
            fontSize: 16,
            letterSpacing: '0.42em',
            color: G_BRIGHT,
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          <span style={{ color: G }}>·</span>
          &nbsp;60 Days of Strength&nbsp;
          <span style={{ color: G }}>·</span>
        </div>

        {/* ─── "Appreciation Card" ribbon ─── */}
        <div
          style={{
            position: 'absolute',
            top: L.badgeTop,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <RibbonBadge label="Appreciation Card" />
        </div>

        {/* ─── Feature icons row ─── */}
        <div
          style={{
            position: 'absolute',
            top: L.featuresTop,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: 32,
          }}
        >
          <FeatureIcon icon="dumbbell" label="Strength Training" />
          <FeatureIcon icon="bowl" label="Diet Discipline" />
          <FeatureIcon icon="shoe" label="10,000 Steps" />
          <FeatureIcon icon="target" label="Consistency" />
        </div>

        {/* ─── Photo circle w/ radial light rays + gold ring ─ */}
        <div
          style={{
            position: 'absolute',
            top: L.photoTop,
            left: '50%',
            transform: 'translateX(-50%)',
            width: L.photoSize + 120,
            height: L.photoSize + 120,
          }}
        >
          <LightRays size={L.photoSize + 120} />
        </div>
        <div
          style={{
            position: 'absolute',
            top: L.photoTop + 60,
            left: '50%',
            transform: 'translateX(-50%)',
            width: L.photoSize,
            height: L.photoSize,
            borderRadius: '50%',
            padding: 5,
            background: `conic-gradient(from 220deg, ${G_LIGHT}, ${G_BRIGHT}, ${G_DEEP}, ${G_DARK}, ${G_LIGHT})`,
            boxShadow: `0 0 90px rgba(255,217,74,0.35), 0 0 0 6px rgba(0,0,0,0.30)`,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              overflow: 'hidden',
              background: '#0a0806',
              position: 'relative',
              boxShadow: `inset 0 0 40px rgba(0,0,0,0.6)`,
            }}
          >
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt={nameToShow}
                crossOrigin="anonymous"
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: `translate(${photoOffsetX}px, ${photoOffsetY}px) scale(${photoScale})`,
                  transformOrigin: 'center',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: F_MONO,
                  fontSize: 14,
                  letterSpacing: '0.32em',
                  color: 'rgba(255,215,74,0.55)',
                  textTransform: 'uppercase',
                }}
              >
                Upload Photo
              </div>
            )}
          </div>
        </div>

        {/* ─── 60 Days Completed seal (top-right of photo) ─── */}
        <div
          style={{
            position: 'absolute',
            left: L.sealX,
            top: L.sealY,
          }}
        >
          <SixtyDaysSeal />
        </div>

        {/* ─── "PROUDLY PRESENTED TO" between laurels ─── */}
        <div
          style={{
            position: 'absolute',
            top: L.presentedTop,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: F_MONO,
            fontSize: 15,
            letterSpacing: '0.44em',
            color: G_BRIGHT,
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          Proudly Presented To
        </div>

        {/* Laurel wreaths flanking the name */}
        {P && (
          <>
            <div style={{ position: 'absolute', top: L.nameTop - 10, left: 60 }}>
              <LaurelWreath side="left" />
            </div>
            <div style={{ position: 'absolute', top: L.nameTop - 10, right: 60 }}>
              <LaurelWreath side="right" />
            </div>
          </>
        )}

        {/* ─── Mother's name — gold script calligraphy ─── */}
        <div
          style={{
            position: 'absolute',
            top: L.nameTop,
            left: P ? 240 : 40,
            right: P ? 240 : 40,
            textAlign: 'center',
            fontFamily: F_SCRIPT,
            fontSize: L.nameFont,
            fontWeight: 400,
            lineHeight: 1,
            background: `linear-gradient(180deg, ${G_LIGHT} 0%, ${G_BRIGHT} 55%, ${G_DEEP} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 4px 24px rgba(255,215,74,0.20)',
          }}
        >
          {nameToShow}
        </div>

        {/* ─── Award title in star-framed nameplate ─── */}
        <div
          style={{
            position: 'absolute',
            top: L.awardTitleTop,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          {revealed ? (
            <StarFramedTitle title={mother.title} />
          ) : (
            <StarFramedTitle title="✦ ✦ ✦" placeholder />
          )}
        </div>

        {/* ─── Appreciation message (portrait only) ─── */}
        {aspect === 'portrait' && (
          <div
            style={{
              position: 'absolute',
              top: L.messageTop,
              left: 130,
              right: 130,
              textAlign: 'center',
              fontFamily: F_SERIF,
              fontSize: 18,
              lineHeight: 1.5,
              color: CREAM,
              fontStyle: 'italic',
              fontWeight: 400,
              opacity: revealed ? 0.86 : 0.35,
            }}
          >
            {revealed
              ? mother.message
              : 'Tap Generate to reveal your award ✨'}
          </div>
        )}

        {/* ─── Stats icon boxes ─── */}
        <div
          style={{
            position: 'absolute',
            top: L.statsTop,
            left: 60,
            right: 60,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <StatBox icon="calendar" label="Started" value="May 10" />
          <StatBox icon="trophy" label="Milestone" value="60 Days" />
          <StatBox icon="dumbbell" label="Focus" value="Strength" />
          <StatBox icon="bowl" label="Diet" value="Discipline" />
          <StatBox icon="shoe" label="Daily Goal" value="10K Steps" />
        </div>

        {/* ─── TEAM PURE X + Trainer nameplate ─── */}
        <div
          style={{
            position: 'absolute',
            top: L.trainerTop,
            left: 0,
            right: 0,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontFamily: F_ROMAN,
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: '0.08em',
              background: `linear-gradient(180deg, ${G_LIGHT} 0%, ${G_BRIGHT} 55%, ${G_DEEP} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textTransform: 'uppercase',
            }}
          >
            Team{' '}
            <span style={{ color: CREAM, WebkitTextFillColor: CREAM }}>
              PURE
            </span>{' '}
            X
          </div>
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center' }}>
            <TrainerNameplate name={PUREX_MOTHERS_META.trainerName} />
          </div>
        </div>

        {/* ─── Footer motto ─── */}
        <div
          style={{
            position: 'absolute',
            top: L.footerTop,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: F_MONO,
            fontSize: 12,
            letterSpacing: '0.42em',
            color: G_BRIGHT,
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          Stronger Together <span style={{ color: G }}>·</span> Unstoppable Always
        </div>
      </div>
    );
  }
);

// ═══════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════

/** Team PureX "PX" monogram mark. */
function PXLogo() {
  return (
    <svg width="72" height="46" viewBox="0 0 72 46" fill="none">
      <defs>
        <linearGradient id="pxGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={G_LIGHT} />
          <stop offset="55%" stopColor={G_BRIGHT} />
          <stop offset="100%" stopColor={G_DEEP} />
        </linearGradient>
      </defs>
      {/* P */}
      <path
        d="M8 6 L 8 42 M 8 6 L 26 6 Q 38 6 38 18 Q 38 30 26 30 L 8 30"
        stroke="url(#pxGrad)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* X */}
      <path
        d="M 42 8 L 66 40 M 66 8 L 42 40"
        stroke="url(#pxGrad)"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* small accent dot after X */}
      <circle cx="70" cy="12" r="2.4" fill={G_BRIGHT} />
    </svg>
  );
}

/** Ribbon-style "Appreciation Card" badge. */
function RibbonBadge({ label }: { label: string }) {
  return (
    <svg width="380" height="46" viewBox="0 0 380 46" fill="none">
      <defs>
        <linearGradient id="ribGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={G_BRIGHT} />
          <stop offset="55%" stopColor={G} />
          <stop offset="100%" stopColor={G_DEEP} />
        </linearGradient>
      </defs>
      {/* Ribbon shape (rectangle with cut ends) */}
      <path
        d="M 8 8 L 12 23 L 8 38 L 60 38 L 66 23 L 60 8 Z
           M 372 8 L 368 23 L 372 38 L 320 38 L 314 23 L 320 8 Z
           M 60 8 L 320 8 L 314 23 L 320 38 L 60 38 L 66 23 Z"
        fill="url(#ribGrad)"
        stroke={G_DARK}
        strokeWidth="0.6"
      />
      <text
        x="190"
        y="30"
        textAnchor="middle"
        fontFamily={F_MONO}
        fontSize="14"
        letterSpacing="0.32em"
        fill="#0a0806"
        fontWeight="700"
        style={{ textTransform: 'uppercase' }}
      >
        ✦ {label} ✦
      </text>
    </svg>
  );
}

/** One of the four feature icons in the top row. */
function FeatureIcon({
  icon,
  label,
}: {
  icon: 'dumbbell' | 'bowl' | 'shoe' | 'target';
  label: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 14px',
        borderRadius: 8,
        border: `1px solid ${G_DEEP}`,
        background: 'linear-gradient(180deg, rgba(255,215,74,0.06), rgba(255,215,74,0.02))',
      }}
    >
      <span style={{ color: G_BRIGHT }}>
        <MiniIcon name={icon} size={20} />
      </span>
      <span
        style={{
          fontFamily: F_MONO,
          fontSize: 11,
          letterSpacing: '0.22em',
          color: G_LIGHT,
          fontWeight: 700,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
    </div>
  );
}

/** Small icon set — inline SVGs sized for the feature + stat rows. */
function MiniIcon({
  name,
  size = 20,
}: {
  name: 'dumbbell' | 'bowl' | 'shoe' | 'target' | 'calendar' | 'trophy';
  size?: number;
}) {
  const s = size;
  const c = 'currentColor';
  switch (name) {
    case 'dumbbell':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <rect x="1" y="9" width="3" height="6" rx="1" fill={c} />
          <rect x="4" y="7" width="3" height="10" rx="1" fill={c} />
          <rect x="17" y="7" width="3" height="10" rx="1" fill={c} />
          <rect x="20" y="9" width="3" height="6" rx="1" fill={c} />
          <rect x="7" y="11" width="10" height="2" rx="0.5" fill={c} />
        </svg>
      );
    case 'bowl':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <path d="M2 11 h20 a10 10 0 0 1 -20 0 Z" fill={c} />
          <path d="M6 6 Q 12 2 18 6" stroke={c} strokeWidth="1.6" fill="none" />
          <circle cx="10" cy="4" r="1" fill={c} />
          <circle cx="14" cy="4" r="1" fill={c} />
        </svg>
      );
    case 'shoe':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <path
            d="M2 15 L 3 12 L 6 11 L 9 8 L 12 9 L 18 12 L 22 14 L 22 17 L 2 17 Z"
            fill={c}
          />
          <path d="M9 8 L 10 5" stroke={c} strokeWidth="1.5" />
        </svg>
      );
    case 'target':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke={c} strokeWidth="1.6" fill="none" />
          <circle cx="12" cy="12" r="6" stroke={c} strokeWidth="1.6" fill="none" />
          <circle cx="12" cy="12" r="2" fill={c} />
        </svg>
      );
    case 'calendar':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <rect x="3" y="5" width="18" height="16" rx="2" stroke={c} strokeWidth="1.6" fill="none" />
          <path d="M3 10 L 21 10" stroke={c} strokeWidth="1.6" />
          <rect x="7" y="2" width="2" height="5" rx="0.6" fill={c} />
          <rect x="15" y="2" width="2" height="5" rx="0.6" fill={c} />
        </svg>
      );
    case 'trophy':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <path
            d="M7 3 L 17 3 L 17 10 Q 17 15 12 15 Q 7 15 7 10 Z"
            fill={c}
          />
          <path
            d="M7 6 Q 3 6 3 10 Q 3 13 7 13 M 17 6 Q 21 6 21 10 Q 21 13 17 13"
            stroke={c}
            strokeWidth="1.4"
            fill="none"
          />
          <rect x="10" y="15" width="4" height="4" fill={c} />
          <rect x="7" y="19" width="10" height="2.5" rx="0.5" fill={c} />
        </svg>
      );
  }
}

/** Circular "60 Days Completed" seal with laurel ring + ribbon tails. */
function SixtyDaysSeal() {
  return (
    <svg width="200" height="220" viewBox="0 0 200 220" fill="none">
      <defs>
        <linearGradient id="sealGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={G_LIGHT} />
          <stop offset="55%" stopColor={G_BRIGHT} />
          <stop offset="100%" stopColor={G_DEEP} />
        </linearGradient>
      </defs>
      {/* Ribbon tails behind */}
      <path
        d="M 60 160 L 40 210 L 70 195 L 80 160 Z"
        fill="url(#sealGrad)"
        opacity="0.9"
      />
      <path
        d="M 140 160 L 160 210 L 130 195 L 120 160 Z"
        fill="url(#sealGrad)"
        opacity="0.9"
      />
      {/* Outer ring */}
      <circle cx="100" cy="90" r="80" fill="#000" stroke="url(#sealGrad)" strokeWidth="4" />
      {/* Inner ring */}
      <circle cx="100" cy="90" r="70" fill="none" stroke={G_DEEP} strokeWidth="1" />
      {/* Star row across the top */}
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          d="M 0 -5 L 1.4 -1.5 L 5 -1.5 L 2.2 1 L 3.3 5 L 0 2.8 L -3.3 5 L -2.2 1 L -5 -1.5 L -1.4 -1.5 Z"
          fill="url(#sealGrad)"
          transform={`translate(${75 + i * 12} 45)`}
        />
      ))}
      {/* Laurel arcs */}
      <path d="M 32 90 Q 32 130 65 155" stroke="url(#sealGrad)" strokeWidth="2" fill="none" />
      <path d="M 168 90 Q 168 130 135 155" stroke="url(#sealGrad)" strokeWidth="2" fill="none" />
      {/* Leaves */}
      {[100, 115, 130, 145].map((y, i) => (
        <g key={`l-${i}`}>
          <ellipse cx="36" cy={y} rx="8" ry="3" transform={`rotate(-30 36 ${y})`} fill="url(#sealGrad)" opacity="0.9" />
          <ellipse cx="164" cy={y} rx="8" ry="3" transform={`rotate(30 164 ${y})`} fill="url(#sealGrad)" opacity="0.9" />
        </g>
      ))}
      {/* Big "60" */}
      <text
        x="100"
        y="98"
        textAnchor="middle"
        fontFamily={F_ROMAN}
        fontSize="46"
        fontWeight="700"
        fill="url(#sealGrad)"
      >
        60
      </text>
      {/* DAYS */}
      <text
        x="100"
        y="118"
        textAnchor="middle"
        fontFamily={F_MONO}
        fontSize="12"
        letterSpacing="0.28em"
        fill="url(#sealGrad)"
        fontWeight="700"
      >
        DAYS
      </text>
      {/* COMPLETED */}
      <text
        x="100"
        y="140"
        textAnchor="middle"
        fontFamily={F_MONO}
        fontSize="8.5"
        letterSpacing="0.28em"
        fill={G_LIGHT}
        fontWeight="700"
      >
        COMPLETED
      </text>
    </svg>
  );
}

/** Ornate laurel wreath — one side, mirrored on the right. */
function LaurelWreath({ side }: { side: 'left' | 'right' }) {
  const flip = side === 'right' ? 'scale(-1,1) translate(-140,0)' : '';
  return (
    <svg width="140" height="180" viewBox="0 0 140 180" fill="none" style={{ transform: flip }}>
      <defs>
        <linearGradient id={`laurGrad-${side}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={G_LIGHT} />
          <stop offset="100%" stopColor={G_DEEP} />
        </linearGradient>
      </defs>
      {/* Curved spine */}
      <path
        d="M 130 20 Q 60 50 40 100 Q 30 140 60 170"
        stroke={`url(#laurGrad-${side})`}
        strokeWidth="2"
        fill="none"
      />
      {/* Leaves */}
      {Array.from({ length: 10 }).map((_, i) => {
        const t = i / 9;
        const x = 130 - t * 70;
        const y = 20 + t * 150;
        const rot = -50 - i * 12;
        return (
          <ellipse
            key={i}
            cx={x}
            cy={y}
            rx="12"
            ry="4"
            transform={`rotate(${rot} ${x} ${y})`}
            fill={`url(#laurGrad-${side})`}
            opacity="0.85"
          />
        );
      })}
      {/* Berries */}
      {[0.2, 0.5, 0.8].map((t, i) => (
        <circle
          key={i}
          cx={130 - t * 70 + 6}
          cy={20 + t * 150 + 6}
          r="2.4"
          fill={G_BRIGHT}
        />
      ))}
    </svg>
  );
}

/** Star-framed nameplate that wraps the award title. */
function StarFramedTitle({
  title,
  placeholder,
}: {
  title: string;
  placeholder?: boolean;
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 26px',
        borderTop: `1.5px solid ${G}`,
        borderBottom: `1.5px solid ${G}`,
        background: 'linear-gradient(180deg, rgba(255,215,74,0.05), rgba(255,215,74,0.02))',
      }}
    >
      <StarInline />
      <span
        style={{
          fontFamily: F_MONO,
          fontSize: 15,
          letterSpacing: '0.32em',
          color: placeholder ? 'rgba(255,215,74,0.55)' : G_LIGHT,
          fontWeight: 700,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </span>
      <StarInline />
    </div>
  );
}

function StarInline() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14">
      <path
        d="M 7 0.5 L 8.7 5 L 13.5 5 L 9.7 8 L 11 13 L 7 10 L 3 13 L 4.3 8 L 0.5 5 L 5.3 5 Z"
        fill={G_BRIGHT}
      />
    </svg>
  );
}

/** Ornate corner filigree at each corner. */
function CornerFlourish({ x, y, rot }: { x: number; y: number; rot: number }) {
  return (
    <svg
      width="140"
      height="140"
      viewBox="0 0 140 140"
      style={{
        position: 'absolute',
        top: y,
        left: x,
        transform: `translate(-50%, -50%) rotate(${rot}deg)`,
      }}
      fill="none"
    >
      <defs>
        <linearGradient id={`fil-${rot}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={G_LIGHT} />
          <stop offset="100%" stopColor={G_DEEP} />
        </linearGradient>
      </defs>
      {/* Outer curl */}
      <path
        d="M 14 40 Q 14 14 40 14"
        stroke={`url(#fil-${rot})`}
        strokeWidth="2"
      />
      <path
        d="M 18 60 Q 22 20 60 18"
        stroke={`url(#fil-${rot})`}
        strokeWidth="1.5"
      />
      {/* Leaf sprigs */}
      {[
        [30, 22],
        [22, 30],
        [42, 24],
        [24, 42],
      ].map(([lx, ly], i) => (
        <ellipse
          key={i}
          cx={lx}
          cy={ly}
          rx="7"
          ry="2.6"
          transform={`rotate(${-45 + i * 20} ${lx} ${ly})`}
          fill={`url(#fil-${rot})`}
          opacity="0.85"
        />
      ))}
      {/* Small spiral flourishes */}
      <circle cx="14" cy="14" r="3.5" fill={`url(#fil-${rot})`} />
      <circle cx="14" cy="14" r="1.6" fill={G_BRIGHT} />
      <path
        d="M 60 18 Q 78 18 82 34"
        stroke={`url(#fil-${rot})`}
        strokeWidth="1.5"
        fill="none"
        opacity="0.75"
      />
      <path
        d="M 18 60 Q 18 78 34 82"
        stroke={`url(#fil-${rot})`}
        strokeWidth="1.5"
        fill="none"
        opacity="0.75"
      />
    </svg>
  );
}

/** Radial gold light rays behind the photo — the "sparkle" effect. */
function LightRays({ size }: { size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 8;
  const rays = 36;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ position: 'absolute', inset: 0, opacity: 0.6 }}
    >
      <defs>
        <radialGradient id="rayGrad" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="rgba(255,215,74,0.35)" />
          <stop offset="55%" stopColor="rgba(255,215,74,0.05)" />
          <stop offset="100%" stopColor="rgba(255,215,74,0)" />
        </radialGradient>
      </defs>
      {/* Radial glow behind everything */}
      <circle cx={cx} cy={cy} r={r} fill="url(#rayGrad)" />
      {/* Rays */}
      {Array.from({ length: rays }).map((_, i) => {
        const a = (i / rays) * Math.PI * 2;
        const x1 = cx + Math.cos(a) * (r * 0.55);
        const y1 = cy + Math.sin(a) * (r * 0.55);
        const x2 = cx + Math.cos(a) * r;
        const y2 = cy + Math.sin(a) * r;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={G_BRIGHT}
            strokeWidth={i % 3 === 0 ? 1 : 0.5}
            opacity={i % 3 === 0 ? 0.6 : 0.35}
          />
        );
      })}
      {/* Tiny sparkle dots scattered */}
      {[
        [0.14, 0.28],
        [0.86, 0.24],
        [0.10, 0.72],
        [0.90, 0.75],
        [0.28, 0.10],
        [0.72, 0.90],
      ].map(([px, py], i) => (
        <g key={i} transform={`translate(${px * size} ${py * size})`}>
          <path
            d="M 0 -4 L 1 -1 L 4 0 L 1 1 L 0 4 L -1 1 L -4 0 L -1 -1 Z"
            fill={G_LIGHT}
          />
        </g>
      ))}
    </svg>
  );
}

/** Trainer nameplate with ornamental border. */
function TrainerNameplate({ name }: { name: string }) {
  return (
    <svg width="320" height="42" viewBox="0 0 320 42" fill="none">
      <defs>
        <linearGradient id="plateGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={G_BRIGHT} />
          <stop offset="100%" stopColor={G_DEEP} />
        </linearGradient>
      </defs>
      {/* Frame */}
      <path
        d="M 16 6 L 304 6 L 316 21 L 304 36 L 16 36 L 4 21 Z"
        fill="none"
        stroke="url(#plateGrad)"
        strokeWidth="1.4"
      />
      <text
        x="160"
        y="27"
        textAnchor="middle"
        fontFamily={F_MONO}
        fontSize="14"
        letterSpacing="0.34em"
        fill={G_LIGHT}
        fontWeight="700"
        style={{ textTransform: 'uppercase' }}
      >
        Trainer: {name}
      </text>
    </svg>
  );
}

/** Stat box (bottom row) — icon + label + value. */
function StatBox({
  icon,
  label,
  value,
}: {
  icon: 'calendar' | 'trophy' | 'dumbbell' | 'bowl' | 'shoe';
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        borderRadius: 8,
        border: `1px solid ${G_DEEP}`,
        padding: '10px 6px 12px',
        textAlign: 'center',
        background:
          'linear-gradient(180deg, rgba(255,215,74,0.05), rgba(255,215,74,0.02))',
      }}
    >
      <div
        style={{
          color: G_BRIGHT,
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 4,
        }}
      >
        <MiniIcon name={icon} size={22} />
      </div>
      <div
        style={{
          fontFamily: F_MONO,
          fontSize: 9.5,
          letterSpacing: '0.24em',
          color: G_LIGHT,
          textTransform: 'uppercase',
          fontWeight: 700,
          opacity: 0.85,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: F_SERIF,
          fontSize: 17,
          color: CREAM,
          marginTop: 2,
          fontWeight: 600,
          fontStyle: 'italic',
        }}
      >
        {value}
      </div>
    </div>
  );
}
