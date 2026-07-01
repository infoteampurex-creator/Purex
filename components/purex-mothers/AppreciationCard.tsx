'use client';

import { forwardRef } from 'react';
import type { PureXMother } from '@/lib/data/purex-mothers';
import { PUREX_MOTHERS_META } from '@/lib/data/purex-mothers';

interface Props {
  mother: PureXMother;
  /** Overrides mother.name — used when the mother has typed her full
   *  name with surname. Falls back to mother.name when empty. */
  displayName?: string;
  photoUrl: string | null;
  photoOffsetX?: number;
  photoOffsetY?: number;
  photoScale?: number;
  /** 'portrait' = 1080x1350 (WhatsApp status), 'square' = 1080x1080 (Insta) */
  aspect: 'portrait' | 'square';
  /** When false, the award title + appreciation message are hidden
   *  behind a placeholder — the reveal is the payoff. */
  revealed?: boolean;
}

// ─── Palette ─────────────────────────────────────────────────
// Royal-invitation palette: deep wine background, ornate gold
// borders and filigree, pink for the mother's name only (so the
// eye lands there first).
const GOLD_LIGHT = '#f5d78e';
const GOLD = '#e8b854';
const GOLD_DEEP = '#a97b25';
const GOLD_DARK = '#6f4d10';
const PINK_LIGHT = '#ffcfe0';
const PINK = '#ff2f8f';
const PINK_DEEP = '#a01656';
const CREAM = '#faeed4';

/**
 * PURE X Mothers appreciation card — royal edition.
 *
 * Renders at ACTUAL export dimensions (1080x1350 / 1080x1080).
 * On-screen preview uses CSS transform:scale() so the exported PNG
 * is pixel-identical to what the user sees.
 *
 * Design intent: fine-invitation royal. Deep wine background,
 * gilded borders with cornerstones, a laurel-wreath crown at top,
 * a gold ribbon behind the mother's name, filigree separators.
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

    // Effective name (mother.name if the user didn't type one)
    const nameToShow = (displayName?.trim() || mother.name).trim();

    // Portrait vs square layout tuning — every y-position is
    // parameterised so the two variants don't collide.
    const L =
      aspect === 'portrait'
        ? {
            crownTop: 70,
            brandKickerTop: 128,
            titleTop: 158,
            subtitleTop: 244,
            badgeTop: 300,
            photoTop: 372,
            photoSize: 380,
            presentedTop: 810,
            nameTop: 858,
            nameFont: 96,
            ribbonTop: 900,
            titleAwardTop: 964,
            titleAwardFont: 30,
            messageTop: 1070,
            statsTop: 1170,
            footerTop: 1240,
          }
        : {
            crownTop: 46,
            brandKickerTop: 96,
            titleTop: 122,
            subtitleTop: 200,
            badgeTop: 250,
            photoTop: 296,
            photoSize: 300,
            presentedTop: 638,
            nameTop: 680,
            nameFont: 82,
            ribbonTop: 718,
            titleAwardTop: 774,
            titleAwardFont: 26,
            messageTop: 0, // no room in square
            statsTop: 850,
            footerTop: 920,
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
          fontFamily:
            "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
          color: CREAM,
          background: '#0a0508',
        }}
      >
        {/* ═══ Layer 1: deep wine background ═══════════════════ */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(ellipse at 20% 0%, rgba(120,20,60,0.55) 0%, transparent 55%),
              radial-gradient(ellipse at 80% 100%, rgba(90,10,50,0.45) 0%, transparent 55%),
              radial-gradient(ellipse at 50% 50%, rgba(60,10,40,0.30) 0%, transparent 65%),
              linear-gradient(180deg, #1a0510 0%, #0a0508 65%, #05030a 100%)
            `,
          }}
        />

        {/* ═══ Layer 2: subtle gilded shine sweep ══════════════ */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(115deg,
              transparent 40%,
              rgba(245,215,142,0.045) 47%,
              rgba(245,215,142,0.09) 50%,
              rgba(245,215,142,0.045) 53%,
              transparent 60%
            )`,
            mixBlendMode: 'screen',
          }}
        />

        {/* ═══ Layer 3: ornate filigree dot pattern ════════════ */}
        <svg
          width={W}
          height={H}
          style={{ position: 'absolute', inset: 0, opacity: 0.12 }}
        >
          <defs>
            <pattern id="filigree" width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="9" cy="9" r="0.7" fill={GOLD_LIGHT} />
              <circle cx="0" cy="0" r="0.4" fill={GOLD_DEEP} />
              <circle cx="18" cy="18" r="0.4" fill={GOLD_DEEP} />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#filigree)" />
        </svg>

        {/* ═══ Gilded double-line border frame ═════════════════ */}
        <div
          style={{
            position: 'absolute',
            inset: 28,
            border: `3px solid ${GOLD}`,
            borderRadius: 18,
            boxShadow: `0 0 40px rgba(232,184,84,0.15) inset`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 40,
            border: `1px solid ${GOLD_DEEP}`,
            borderRadius: 12,
            opacity: 0.75,
          }}
        />

        {/* ═══ Ornate cornerstones (four corners) ══════════════ */}
        <CornerCrest x={28} y={28} rot={0} />
        <CornerCrest x={W - 28} y={28} rot={90} />
        <CornerCrest x={W - 28} y={H - 28} rot={180} />
        <CornerCrest x={28} y={H - 28} rot={-90} />

        {/* ═══ Crown / laurel wreath at top ═══════════════════ */}
        <div
          style={{
            position: 'absolute',
            top: L.crownTop,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <Crown />
        </div>

        {/* ═══ Small brand kicker ═════════════════════════════ */}
        <div
          style={{
            position: 'absolute',
            top: L.brandKickerTop,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: 18,
            letterSpacing: '0.42em',
            color: GOLD_LIGHT,
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          {PUREX_MOTHERS_META.brand}
        </div>

        {/* ═══ Main title — "PURE X Mothers" ══════════════════ */}
        <div
          style={{
            position: 'absolute',
            top: L.titleTop,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 74,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: '-0.01em',
            background: `linear-gradient(180deg, ${GOLD_LIGHT} 0%, ${GOLD} 55%, ${GOLD_DEEP} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontStyle: 'italic',
          }}
        >
          PURE X Mothers
        </div>

        {/* ═══ Subtitle "60 Days of Strength" ═════════════════ */}
        <div
          style={{
            position: 'absolute',
            top: L.subtitleTop,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: 18,
            letterSpacing: '0.30em',
            color: GOLD_LIGHT,
            fontWeight: 700,
            textTransform: 'uppercase',
            opacity: 0.85,
          }}
        >
          <FiligreeInline />
          &nbsp;60 Days of Strength&nbsp;
          <FiligreeInline />
        </div>

        {/* ═══ Appreciation badge ═════════════════════════════ */}
        <div
          style={{
            position: 'absolute',
            top: L.badgeTop,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 30px',
            borderRadius: 999,
            background: `linear-gradient(90deg, ${GOLD_DEEP} 0%, ${GOLD} 50%, ${GOLD_DEEP} 100%)`,
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: 14,
            letterSpacing: '0.38em',
            color: '#1a0510',
            fontWeight: 700,
            textTransform: 'uppercase',
            boxShadow: '0 8px 24px rgba(232,184,84,0.25), inset 0 0 12px rgba(255,255,255,0.20)',
          }}
        >
          ✦ Appreciation Card ✦
        </div>

        {/* ═══ Photo circle with gilded ring ══════════════════ */}
        <div
          style={{
            position: 'absolute',
            top: L.photoTop,
            left: '50%',
            transform: 'translateX(-50%)',
            width: L.photoSize,
            height: L.photoSize,
            borderRadius: '50%',
            padding: 6,
            background: `conic-gradient(from 220deg, ${GOLD_LIGHT}, ${GOLD}, ${GOLD_DEEP}, ${GOLD_DARK}, ${GOLD_LIGHT})`,
            boxShadow: `0 20px 60px rgba(160,22,86,0.35), 0 0 0 8px rgba(0,0,0,0.20)`,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              overflow: 'hidden',
              background: '#1a0510',
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
                  fontFamily:
                    "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: 14,
                  letterSpacing: '0.32em',
                  color: 'rgba(245,215,142,0.55)',
                  textTransform: 'uppercase',
                }}
              >
                Upload Photo
              </div>
            )}
          </div>
        </div>

        {/* ═══ "Proudly Presented To" ═════════════════════════ */}
        <div
          style={{
            position: 'absolute',
            top: L.presentedTop,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: 13,
            letterSpacing: '0.44em',
            color: GOLD,
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          <FiligreeInline />
          &nbsp;Proudly Presented To&nbsp;
          <FiligreeInline />
        </div>

        {/* ═══ Mother's name (italic display, pink) ═══════════ */}
        <div
          style={{
            position: 'absolute',
            top: L.nameTop,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: L.nameFont,
            fontWeight: 700,
            lineHeight: 1,
            fontStyle: 'italic',
            letterSpacing: '-0.015em',
            background: `linear-gradient(180deg, #ffe1ee 0%, ${PINK_LIGHT} 40%, ${PINK} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 4px 24px rgba(255,47,143,0.15)',
          }}
        >
          {nameToShow}
        </div>

        {/* ═══ Gold ribbon under name + award title ═══════════ */}
        <div
          style={{
            position: 'absolute',
            top: L.ribbonTop,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 60,
                height: 1,
                background: `linear-gradient(90deg, transparent, ${GOLD}, ${GOLD})`,
              }}
            />
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${GOLD_LIGHT}, ${GOLD_DEEP})`,
                boxShadow: `0 0 12px ${GOLD}`,
              }}
            />
            <div
              style={{
                width: 60,
                height: 1,
                background: `linear-gradient(90deg, ${GOLD}, ${GOLD}, transparent)`,
              }}
            />
          </div>
        </div>

        {/* ═══ Award title (or placeholder if unrevealed) ═════ */}
        <div
          style={{
            position: 'absolute',
            top: L.titleAwardTop,
            left: 60,
            right: 60,
            textAlign: 'center',
            fontSize: L.titleAwardFont,
            fontWeight: 600,
            lineHeight: 1.15,
            color: revealed ? CREAM : 'transparent',
            fontStyle: 'italic',
            letterSpacing: '0.02em',
          }}
        >
          {revealed ? (
            mother.title
          ) : (
            <span
              style={{
                color: 'rgba(245,215,142,0.55)',
                fontStyle: 'italic',
                fontSize: L.titleAwardFont - 4,
                letterSpacing: '0.30em',
              }}
            >
              ✦ ✦ ✦
            </span>
          )}
        </div>

        {/* ═══ Appreciation message (portrait only — no room in square) */}
        {aspect === 'portrait' && (
          <div
            style={{
              position: 'absolute',
              top: L.messageTop,
              left: 100,
              right: 100,
              textAlign: 'center',
              fontSize: 20,
              lineHeight: 1.55,
              fontStyle: 'italic',
              color: 'rgba(250,238,212,0.82)',
              fontWeight: 400,
            }}
          >
            {revealed ? (
              <>&ldquo;{mother.message}&rdquo;</>
            ) : (
              <span
                style={{
                  color: 'rgba(245,215,142,0.55)',
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: 13,
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  fontStyle: 'normal',
                  fontWeight: 700,
                }}
              >
                Tap Generate to reveal your award ✨
              </span>
            )}
          </div>
        )}

        {/* ═══ Stats row ══════════════════════════════════════ */}
        <StatsRow top={L.statsTop} />

        {/* ═══ Footer ═════════════════════════════════════════ */}
        <Footer top={L.footerTop} />
      </div>
    );
  }
);

// ─── Sub-components ────────────────────────────────────────────

function StatsRow({ top }: { top: number }) {
  const items: Array<[string, string]> = [
    ['Started', 'May 10'],
    ['Days', '60'],
    ['Focus', 'Strength'],
    ['Diet', 'Discipline'],
    ['Daily', '10K Steps'],
  ];
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 80,
        right: 80,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}
    >
      {items.map(([label, value], i) => (
        <div key={label} style={{ textAlign: 'center', flex: 1, position: 'relative' }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: 10,
              letterSpacing: '0.28em',
              color: GOLD_LIGHT,
              textTransform: 'uppercase',
              fontWeight: 700,
              opacity: 0.75,
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: 22,
              color: CREAM,
              marginTop: 6,
              fontWeight: 600,
              fontStyle: 'italic',
            }}
          >
            {value}
          </div>
          {i < items.length - 1 && (
            <div
              style={{
                position: 'absolute',
                right: -1,
                top: 6,
                bottom: 4,
                width: 1,
                background: `linear-gradient(180deg, transparent, ${GOLD}, transparent)`,
                opacity: 0.45,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function Footer({ top }: { top: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 0,
        right: 0,
        textAlign: 'center',
      }}
    >
      {/* Ornamental divider */}
      <div
        style={{
          margin: '0 auto 14px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 100,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${GOLD})`,
          }}
        />
        <div
          style={{
            width: 8,
            height: 8,
            transform: 'rotate(45deg)',
            background: GOLD,
            boxShadow: `0 0 10px ${GOLD}`,
          }}
        />
        <div
          style={{
            width: 100,
            height: 1,
            background: `linear-gradient(90deg, ${GOLD}, transparent)`,
          }}
        />
      </div>
      <div
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: 14,
          letterSpacing: '0.36em',
          color: GOLD,
          fontWeight: 700,
          textTransform: 'uppercase',
        }}
      >
        {PUREX_MOTHERS_META.brand}
      </div>
      <div
        style={{
          fontSize: 20,
          color: GOLD_LIGHT,
          marginTop: 6,
          fontStyle: 'italic',
        }}
      >
        Trainer: {PUREX_MOTHERS_META.trainerName}
      </div>
      <div
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: 11,
          letterSpacing: '0.32em',
          color: GOLD_DEEP,
          marginTop: 14,
          fontWeight: 700,
          textTransform: 'uppercase',
        }}
      >
        Stronger Together · Unstoppable Always
      </div>
    </div>
  );
}

/** A regal laurel-wreath crown SVG rendered above the brand. */
function Crown() {
  return (
    <svg width="88" height="46" viewBox="0 0 88 46" fill="none">
      <defs>
        <linearGradient id="crownGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GOLD_LIGHT} />
          <stop offset="60%" stopColor={GOLD} />
          <stop offset="100%" stopColor={GOLD_DEEP} />
        </linearGradient>
      </defs>
      {/* Left laurel arc */}
      <path
        d="M4 28 Q 20 6 44 8"
        stroke="url(#crownGrad)"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Right laurel arc */}
      <path
        d="M84 28 Q 68 6 44 8"
        stroke="url(#crownGrad)"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Leaves left */}
      {[10, 18, 26, 34].map((x, i) => (
        <ellipse
          key={`ll-${i}`}
          cx={x}
          cy={22 - i * 3}
          rx="4"
          ry="1.6"
          transform={`rotate(-${35 + i * 8} ${x} ${22 - i * 3})`}
          fill="url(#crownGrad)"
          opacity="0.9"
        />
      ))}
      {/* Leaves right */}
      {[10, 18, 26, 34].map((x, i) => (
        <ellipse
          key={`lr-${i}`}
          cx={88 - x}
          cy={22 - i * 3}
          rx="4"
          ry="1.6"
          transform={`rotate(${35 + i * 8} ${88 - x} ${22 - i * 3})`}
          fill="url(#crownGrad)"
          opacity="0.9"
        />
      ))}
      {/* Center crown / gem */}
      <path
        d="M36 12 L44 4 L52 12 L48 22 L40 22 Z"
        fill="url(#crownGrad)"
        stroke={GOLD_DEEP}
        strokeWidth="0.8"
      />
      <circle cx="44" cy="12" r="2.2" fill={PINK} opacity="0.9" />
      <circle cx="44" cy="12" r="1" fill={PINK_LIGHT} />
    </svg>
  );
}

/** A tiny inline diamond used as an ornamental separator. */
function FiligreeInline() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <path d="M6 1 L11 6 L6 11 L1 6 Z" fill={GOLD} stroke={GOLD_DEEP} strokeWidth="0.5" />
      <circle cx="6" cy="6" r="1" fill={GOLD_LIGHT} />
    </svg>
  );
}

/** Ornate cornerstone at one of the four card corners. */
function CornerCrest({ x, y, rot }: { x: number; y: number; rot: number }) {
  return (
    <svg
      width="70"
      height="70"
      viewBox="0 0 70 70"
      style={{
        position: 'absolute',
        top: y,
        left: x,
        transform: `translate(-50%, -50%) rotate(${rot}deg)`,
      }}
    >
      <defs>
        <linearGradient id={`crn-${rot}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={GOLD_LIGHT} />
          <stop offset="100%" stopColor={GOLD_DEEP} />
        </linearGradient>
      </defs>
      {/* Outer curl */}
      <path
        d="M4 26 Q 4 4 26 4"
        stroke={`url(#crn-${rot})`}
        strokeWidth="2"
        fill="none"
      />
      {/* Inner curl */}
      <path
        d="M10 24 Q 10 10 24 10"
        stroke={GOLD}
        strokeWidth="1"
        fill="none"
        opacity="0.75"
      />
      {/* Corner flourish */}
      <path
        d="M4 26 L 4 34 Q 4 40 10 40"
        stroke={`url(#crn-${rot})`}
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M26 4 L 34 4 Q 40 4 40 10"
        stroke={`url(#crn-${rot})`}
        strokeWidth="1.5"
        fill="none"
      />
      {/* Center anchor gem */}
      <circle cx="4" cy="4" r="3" fill={`url(#crn-${rot})`} />
      <circle cx="4" cy="4" r="1.5" fill={PINK} />
    </svg>
  );
}
