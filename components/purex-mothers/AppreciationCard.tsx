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

// ─── Palette — rose-gold + champagne on wine ─────────────────
// Replaces the candy-pink of the previous iteration. Rose gold is
// the shade you'd expect on fine jewellery — warm, feminine, but
// mature. The name gets a champagne→rose-gold→bronze gradient so
// it reads as a signature, not a slogan.
const GOLD_LIGHT = '#f5d78e';
const GOLD = '#e8b854';
const GOLD_DEEP = '#a97b25';
const GOLD_DARK = '#6f4d10';
const ROSE_GOLD_LIGHT = '#f8d6c1'; // champagne
const ROSE_GOLD = '#e0a68a'; // rose-gold mid
const ROSE_GOLD_DEEP = '#a56d4d'; // bronze
const ACCENT_JEWEL = '#c7365f'; // deep ruby, used sparingly
const CREAM = '#f8ecd2';
const CREAM_MUTED = 'rgba(248,236,210,0.82)';

// Font stack CSS variables — set via next/font in fonts.ts
const F_SCRIPT = "var(--font-mothers-script), 'Great Vibes', 'Sacramento', cursive";
const F_ROMAN = "var(--font-mothers-roman), 'Cinzel', 'Trajan Pro', serif";
const F_SERIF = "var(--font-mothers-playfair), 'Playfair Display', 'Cormorant Garamond', Georgia, serif";
const F_MONO = "var(--font-mothers-mono), 'JetBrains Mono', ui-monospace, monospace";

/**
 * PURE X Mothers appreciation card — royal proclamation edition.
 *
 * Every position is parameterised by aspect ratio so the two
 * variants don't collide. Portrait is 1080x1350 (WhatsApp status),
 * square is 1080x1080 (Instagram post).
 *
 * Design direction:
 * - Deep wine background w/ radial depth (proclamation-feel)
 * - Cinzel engraved caps for "PURE X Mothers" (feels carved)
 * - Great Vibes calligraphy script for the mother's name
 *   (signature-style, in rose-gold champagne gradient)
 * - Gold ornamental filigree: crown, cornerstones, dividers
 * - Ruby accent used ONLY as jewel-tone punctuation (crown gem,
 *   cornerstone anchors) — never as body color
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

    // Layout coordinates, aspect-tuned. Every element gets an explicit
    // top so we never have overlap. Careful math below — the ribbon
    // must sit BELOW the name (previous bug), the footer must fit
    // ABOVE the border.
    const L =
      aspect === 'portrait'
        ? {
            crownTop: 62,
            brandKickerTop: 118,
            titleTop: 148,
            subtitleTop: 244,
            badgeTop: 292,
            photoTop: 356,
            photoSize: 380,
            presentedTop: 780,
            nameTop: 830,
            nameFont: 130, // script needs to be BIG
            ribbonTop: 984,
            titleAwardTop: 1010,
            titleAwardFont: 32,
            messageTop: 1090,
            statsTop: 1180,
            footerTop: 1244,
          }
        : {
            crownTop: 40,
            brandKickerTop: 90,
            titleTop: 116,
            subtitleTop: 200,
            badgeTop: 244,
            photoTop: 292,
            photoSize: 288,
            presentedTop: 610,
            nameTop: 650,
            nameFont: 108,
            ribbonTop: 774,
            titleAwardTop: 796,
            titleAwardFont: 28,
            messageTop: 0, // no room in square
            statsTop: 870,
            footerTop: 936,
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
          background: '#0a0508',
        }}
      >
        {/* ═══ Layer 1: deep-wine background depth ══════════════ */}
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

        {/* ═══ Layer 2: gilded shine sweep ══════════════════════ */}
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

        {/* ═══ Layer 3: filigree dot pattern ═══════════════════ */}
        <svg
          width={W}
          height={H}
          style={{ position: 'absolute', inset: 0, opacity: 0.10 }}
        >
          <defs>
            <pattern id="filigree" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="0.7" fill={GOLD_LIGHT} />
              <circle cx="0" cy="0" r="0.4" fill={GOLD_DEEP} />
              <circle cx="20" cy="20" r="0.4" fill={GOLD_DEEP} />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#filigree)" />
        </svg>

        {/* ═══ Gilded double-line border ════════════════════════ */}
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

        {/* ═══ Cornerstone crests ═══════════════════════════════ */}
        <CornerCrest x={28} y={28} rot={0} />
        <CornerCrest x={W - 28} y={28} rot={90} />
        <CornerCrest x={W - 28} y={H - 28} rot={180} />
        <CornerCrest x={28} y={H - 28} rot={-90} />

        {/* ═══ Laurel crown ═════════════════════════════════════ */}
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

        {/* ═══ Brand kicker ═════════════════════════════════════ */}
        <div
          style={{
            position: 'absolute',
            top: L.brandKickerTop,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: F_MONO,
            fontSize: 16,
            letterSpacing: '0.55em',
            color: GOLD_LIGHT,
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          Team PURE X
        </div>

        {/* ═══ Main title in engraved Cinzel roman ═════════════ */}
        <div
          style={{
            position: 'absolute',
            top: L.titleTop,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: F_ROMAN,
            fontSize: 78,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: '0.02em',
            background: `linear-gradient(180deg, ${GOLD_LIGHT} 0%, ${GOLD} 55%, ${GOLD_DEEP} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textTransform: 'uppercase',
          }}
        >
          PURE X Mothers
        </div>

        {/* ═══ Subtitle with filigree dots ══════════════════════ */}
        <div
          style={{
            position: 'absolute',
            top: L.subtitleTop,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: F_MONO,
            fontSize: 17,
            letterSpacing: '0.36em',
            color: GOLD_LIGHT,
            fontWeight: 700,
            textTransform: 'uppercase',
            opacity: 0.85,
          }}
        >
          <FiligreeDiamond />
          &nbsp;60 Days of Strength&nbsp;
          <FiligreeDiamond />
        </div>

        {/* ═══ Appreciation ribbon badge ════════════════════════ */}
        <div
          style={{
            position: 'absolute',
            top: L.badgeTop,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 32px',
            borderRadius: 999,
            background: `linear-gradient(90deg, ${GOLD_DEEP} 0%, ${GOLD} 50%, ${GOLD_DEEP} 100%)`,
            fontFamily: F_MONO,
            fontSize: 13,
            letterSpacing: '0.44em',
            color: '#1a0510',
            fontWeight: 700,
            textTransform: 'uppercase',
            boxShadow: '0 8px 24px rgba(232,184,84,0.30), inset 0 0 12px rgba(255,255,255,0.24)',
          }}
        >
          ✦ Appreciation Card ✦
        </div>

        {/* ═══ Photo circle w/ gilded conic ring ═══════════════ */}
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
            boxShadow: `0 20px 60px rgba(196,54,95,0.30), 0 0 0 8px rgba(0,0,0,0.20)`,
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
                  fontFamily: F_MONO,
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

        {/* ═══ "Proudly Presented To" — engraved mono ══════════ */}
        <div
          style={{
            position: 'absolute',
            top: L.presentedTop,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: F_MONO,
            fontSize: 13,
            letterSpacing: '0.50em',
            color: GOLD,
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          <FiligreeDiamond />
          &nbsp;Proudly Presented To&nbsp;
          <FiligreeDiamond />
        </div>

        {/* ═══ Mother's name — CALLIGRAPHY SCRIPT ═══════════════ */}
        {/* Rose-gold champagne gradient, Great Vibes cursive.     */}
        {/* This is the emotional focal point of the whole card.   */}
        <div
          style={{
            position: 'absolute',
            top: L.nameTop,
            left: 40,
            right: 40,
            textAlign: 'center',
            fontFamily: F_SCRIPT,
            fontSize: L.nameFont,
            fontWeight: 400,
            lineHeight: 1,
            letterSpacing: '0em',
            background: `linear-gradient(180deg, ${ROSE_GOLD_LIGHT} 0%, ${ROSE_GOLD} 50%, ${ROSE_GOLD_DEEP} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 4px 24px rgba(224,166,138,0.20)',
            padding: '0 20px',
          }}
        >
          {nameToShow}
        </div>

        {/* ═══ Ornamental ribbon divider — BELOW the name ═══════ */}
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
              gap: 14,
            }}
          >
            <div
              style={{
                width: 80,
                height: 1,
                background: `linear-gradient(90deg, transparent, ${GOLD})`,
              }}
            />
            <FiligreeDiamond />
            <div
              style={{
                width: 80,
                height: 1,
                background: `linear-gradient(90deg, ${GOLD}, transparent)`,
              }}
            />
          </div>
        </div>

        {/* ═══ Award title in Playfair italic ═══════════════════ */}
        <div
          style={{
            position: 'absolute',
            top: L.titleAwardTop,
            left: 80,
            right: 80,
            textAlign: 'center',
            fontFamily: F_SERIF,
            fontSize: L.titleAwardFont,
            fontWeight: 600,
            lineHeight: 1.15,
            color: revealed ? CREAM : 'transparent',
            fontStyle: 'italic',
            letterSpacing: '0.03em',
          }}
        >
          {revealed ? (
            mother.title
          ) : (
            <span
              style={{
                color: 'rgba(245,215,142,0.55)',
                fontSize: L.titleAwardFont - 4,
                letterSpacing: '0.30em',
              }}
            >
              ✦ ✦ ✦
            </span>
          )}
        </div>

        {/* ═══ Appreciation message (portrait only) ═══════════ */}
        {aspect === 'portrait' && (
          <div
            style={{
              position: 'absolute',
              top: L.messageTop,
              left: 100,
              right: 100,
              textAlign: 'center',
              fontFamily: F_SERIF,
              fontSize: 20,
              lineHeight: 1.5,
              fontStyle: 'italic',
              color: CREAM_MUTED,
              fontWeight: 400,
            }}
          >
            {revealed ? (
              <>&ldquo;{mother.message}&rdquo;</>
            ) : (
              <span
                style={{
                  color: 'rgba(245,215,142,0.55)',
                  fontFamily: F_MONO,
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

        <StatsRow top={L.statsTop} />
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
              fontFamily: F_MONO,
              fontSize: 10,
              letterSpacing: '0.32em',
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
              fontFamily: F_SERIF,
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
                opacity: 0.5,
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
      <div
        style={{
          margin: '0 auto 12px',
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
          fontFamily: F_MONO,
          fontSize: 13,
          letterSpacing: '0.42em',
          color: GOLD,
          fontWeight: 700,
          textTransform: 'uppercase',
        }}
      >
        Team PURE X
      </div>
      <div
        style={{
          fontFamily: F_SERIF,
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
          fontFamily: F_MONO,
          fontSize: 10,
          letterSpacing: '0.36em',
          color: GOLD_DEEP,
          marginTop: 12,
          fontWeight: 700,
          textTransform: 'uppercase',
        }}
      >
        Stronger Together · Unstoppable Always
      </div>
    </div>
  );
}

/** Laurel-wreath crown SVG with a ruby jewel center. */
function Crown() {
  return (
    <svg width="96" height="52" viewBox="0 0 96 52" fill="none">
      <defs>
        <linearGradient id="crownGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GOLD_LIGHT} />
          <stop offset="60%" stopColor={GOLD} />
          <stop offset="100%" stopColor={GOLD_DEEP} />
        </linearGradient>
      </defs>
      {/* Laurel arcs */}
      <path d="M4 32 Q 22 8 48 8" stroke="url(#crownGrad)" strokeWidth="1.5" fill="none" />
      <path d="M92 32 Q 74 8 48 8" stroke="url(#crownGrad)" strokeWidth="1.5" fill="none" />
      {/* Left leaves */}
      {[12, 20, 28, 36].map((x, i) => (
        <ellipse
          key={`ll-${i}`}
          cx={x}
          cy={26 - i * 3}
          rx="4.5"
          ry="1.8"
          transform={`rotate(-${35 + i * 8} ${x} ${26 - i * 3})`}
          fill="url(#crownGrad)"
          opacity="0.9"
        />
      ))}
      {/* Right leaves */}
      {[12, 20, 28, 36].map((x, i) => (
        <ellipse
          key={`lr-${i}`}
          cx={96 - x}
          cy={26 - i * 3}
          rx="4.5"
          ry="1.8"
          transform={`rotate(${35 + i * 8} ${96 - x} ${26 - i * 3})`}
          fill="url(#crownGrad)"
          opacity="0.9"
        />
      ))}
      {/* Center crown gem */}
      <path
        d="M38 14 L48 4 L58 14 L52 26 L44 26 Z"
        fill="url(#crownGrad)"
        stroke={GOLD_DEEP}
        strokeWidth="0.8"
      />
      <circle cx="48" cy="14" r="3" fill={ACCENT_JEWEL} />
      <circle cx="48" cy="14" r="1.4" fill={ROSE_GOLD_LIGHT} />
    </svg>
  );
}

/** Diamond filigree separator (inline). */
function FiligreeDiamond() {
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

/** Ornate cornerstone crest at one of the four card corners. */
function CornerCrest({ x, y, rot }: { x: number; y: number; rot: number }) {
  return (
    <svg
      width="72"
      height="72"
      viewBox="0 0 72 72"
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
      <path
        d="M6 28 Q 6 6 28 6"
        stroke={`url(#crn-${rot})`}
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M12 26 Q 12 12 26 12"
        stroke={GOLD}
        strokeWidth="1"
        fill="none"
        opacity="0.75"
      />
      <path
        d="M6 28 L 6 36 Q 6 42 12 42"
        stroke={`url(#crn-${rot})`}
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M28 6 L 36 6 Q 42 6 42 12"
        stroke={`url(#crn-${rot})`}
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="6" cy="6" r="3.2" fill={`url(#crn-${rot})`} />
      <circle cx="6" cy="6" r="1.6" fill={ACCENT_JEWEL} />
    </svg>
  );
}
