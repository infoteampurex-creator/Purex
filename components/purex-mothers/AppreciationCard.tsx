'use client';

import { forwardRef } from 'react';
import type { PureXMother } from '@/lib/data/purex-mothers';
import { PUREX_MOTHERS_META } from '@/lib/data/purex-mothers';

interface Props {
  mother: PureXMother;
  photoUrl: string | null;
  /** Photo position + scale (drag-to-position + zoom). */
  photoOffsetX?: number;
  photoOffsetY?: number;
  photoScale?: number;
  /** 'portrait' = 1080x1350 (WhatsApp status), 'square' = 1080x1080 (Insta) */
  aspect: 'portrait' | 'square';
}

/**
 * PURE X Mothers appreciation card.
 *
 * Rendered at ACTUAL export dimensions (1080x1350 / 1080x1080) with
 * CSS `transform: scale()` used only for on-screen preview. That keeps
 * the html-to-image export pixel-perfect and identical to what the
 * user sees.
 *
 * Palette: dark charcoal skeleton + deep magenta/pink accents +
 * rose-gold shine. Same premium language as the PureX Score gold
 * card but flipped to feminine-strong.
 */
export const AppreciationCard = forwardRef<HTMLDivElement, Props>(
  function AppreciationCard(
    {
      mother,
      photoUrl,
      photoOffsetX = 0,
      photoOffsetY = 0,
      photoScale = 1,
      aspect,
    },
    ref
  ) {
    const width = 1080;
    const height = aspect === 'portrait' ? 1350 : 1080;

    // Rose-gold palette
    const ROSE_LIGHT = '#f8d4c1';
    const ROSE = '#e8b298';
    const ROSE_DEEP = '#c68960';
    const PINK = '#ff2f8f';
    const PINK_DEEP = '#c11f6b';

    return (
      <div
        ref={ref}
        // Data attribute helps html-to-image find the exact node
        data-purex-card
        style={{
          width,
          height,
          position: 'relative',
          overflow: 'hidden',
          fontFamily:
            "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
          color: '#f8f4ef',
          background: '#0a0a0d',
        }}
      >
        {/* Layer 1 — dark base gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(ellipse at 15% 0%, rgba(255,47,143,0.20) 0%, transparent 55%),
              radial-gradient(ellipse at 85% 100%, rgba(230,57,128,0.16) 0%, transparent 55%),
              linear-gradient(180deg, #14090f 0%, #0a0a0d 45%, #0a0a0d 100%)
            `,
          }}
        />

        {/* Layer 2 — rose-gold shine bands (subtle diagonal) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(120deg,
              transparent 40%,
              rgba(248,212,193,0.06) 48%,
              rgba(248,212,193,0.10) 50%,
              rgba(248,212,193,0.06) 52%,
              transparent 60%
            )`,
            mixBlendMode: 'screen',
          }}
        />

        {/* Layer 3 — dotted texture */}
        <svg
          width={width}
          height={height}
          style={{ position: 'absolute', inset: 0, opacity: 0.15 }}
        >
          <defs>
            <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="7" cy="7" r="0.6" fill={ROSE_LIGHT} />
            </pattern>
          </defs>
          <rect width={width} height={height} fill="url(#dots)" />
        </svg>

        {/* Rose-gold outer border frame */}
        <div
          style={{
            position: 'absolute',
            inset: 32,
            border: `2px solid ${ROSE}`,
            borderRadius: 24,
            boxShadow: `inset 0 0 60px rgba(230,178,152,0.10)`,
          }}
        />
        {/* Inner thin gold hairline */}
        <div
          style={{
            position: 'absolute',
            inset: 42,
            border: `1px solid ${ROSE_DEEP}`,
            borderRadius: 18,
            opacity: 0.55,
          }}
        />

        {/* ─── HEADER ───────────────────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            top: 78,
            left: 0,
            right: 0,
            textAlign: 'center',
          }}
        >
          {/* Small brand kicker */}
          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: 18,
              letterSpacing: '0.42em',
              color: ROSE_LIGHT,
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {PUREX_MOTHERS_META.brand}
          </div>
          <div
            style={{
              fontSize: 74,
              fontWeight: 700,
              lineHeight: 1,
              marginTop: 18,
              letterSpacing: '-0.02em',
              background: `linear-gradient(180deg, #ffe1e9 0%, ${PINK} 60%, ${PINK_DEEP} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            PURE X Mothers
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: 20,
              letterSpacing: '0.28em',
              color: ROSE,
              marginTop: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            60 Days of Strength
          </div>
        </div>

        {/* ─── APPRECIATION BADGE ─────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            top: aspect === 'portrait' ? 322 : 292,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 26px',
            borderRadius: 999,
            background: `linear-gradient(90deg, ${PINK_DEEP} 0%, ${PINK} 100%)`,
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: 15,
            letterSpacing: '0.34em',
            color: '#fff',
            fontWeight: 700,
            textTransform: 'uppercase',
            boxShadow: '0 12px 30px rgba(255,47,143,0.35)',
          }}
        >
          Appreciation Card
        </div>

        {/* ─── PHOTO CIRCLE ────────────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            top: aspect === 'portrait' ? 418 : 372,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 380,
            height: 380,
            borderRadius: '50%',
            padding: 6,
            background: `conic-gradient(from 220deg, ${ROSE_LIGHT}, ${PINK}, ${ROSE_DEEP}, ${ROSE_LIGHT})`,
            boxShadow: `0 20px 60px rgba(255,47,143,0.35), 0 0 0 8px rgba(255,255,255,0.02)`,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              overflow: 'hidden',
              background: '#1a0e14',
              position: 'relative',
              boxShadow: `inset 0 0 40px rgba(0,0,0,0.5)`,
            }}
          >
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt={mother.name}
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
                  color: 'rgba(248,212,193,0.55)',
                  textTransform: 'uppercase',
                }}
              >
                Upload Photo
              </div>
            )}
          </div>
        </div>

        {/* ─── PROUDLY PRESENTED TO ───────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            top: aspect === 'portrait' ? 840 : 790,
            left: 0,
            right: 0,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: 14,
              letterSpacing: '0.42em',
              color: ROSE,
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            Proudly Presented To
          </div>
          <div
            style={{
              fontSize: 88,
              fontWeight: 700,
              lineHeight: 1,
              marginTop: 14,
              fontStyle: 'italic',
              letterSpacing: '-0.015em',
              background: `linear-gradient(180deg, #ffe1e9 0%, ${ROSE_LIGHT} 40%, ${PINK} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {mother.name}
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 600,
              marginTop: 18,
              color: '#f8f4ef',
              fontStyle: 'italic',
              letterSpacing: '0.01em',
            }}
          >
            {mother.title}
          </div>
        </div>

        {/* ─── APPRECIATION MESSAGE + STATS + FOOTER ──────────── */}
        {aspect === 'portrait' && (
          <>
            <div
              style={{
                position: 'absolute',
                top: 1080,
                left: 92,
                right: 92,
                textAlign: 'center',
                fontSize: 22,
                lineHeight: 1.5,
                fontStyle: 'italic',
                color: 'rgba(248,244,239,0.86)',
                fontWeight: 400,
              }}
            >
              &ldquo;{mother.message}&rdquo;
            </div>

            <StatsRow top={1180} rose={ROSE} roseLight={ROSE_LIGHT} />

            <Footer top={1250} rose={ROSE} roseLight={ROSE_LIGHT} />
          </>
        )}

        {aspect === 'square' && (
          <>
            <StatsRow top={950} rose={ROSE} roseLight={ROSE_LIGHT} />
            <Footer top={1000} rose={ROSE} roseLight={ROSE_LIGHT} />
          </>
        )}

        {/* Rose-gold corner ornaments — tiny elegant flourish */}
        <CornerOrnament top={52} left={52} rose={ROSE} />
        <CornerOrnament top={52} right={52} rose={ROSE} rotate={90} />
        <CornerOrnament bottom={52} left={52} rose={ROSE} rotate={-90} />
        <CornerOrnament bottom={52} right={52} rose={ROSE} rotate={180} />
      </div>
    );
  }
);

// ─── Stats row + footer + ornaments ─────────────────────────────

function StatsRow({
  top,
  rose,
  roseLight,
}: {
  top: number;
  rose: string;
  roseLight: string;
}) {
  const items: Array<[string, string]> = [
    ['Started', 'May 10'],
    ['Milestone', '60 Days'],
    ['Focus', 'Strength'],
    ['Discipline', 'Diet'],
    ['Daily Goal', '10K Steps'],
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
        gap: 8,
      }}
    >
      {items.map(([label, value]) => (
        <div key={label} style={{ textAlign: 'center', flex: 1 }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: 11,
              letterSpacing: '0.24em',
              color: roseLight,
              textTransform: 'uppercase',
              fontWeight: 700,
              opacity: 0.65,
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: 22,
              color: '#f8f4ef',
              marginTop: 6,
              fontWeight: 600,
              fontStyle: 'italic',
            }}
          >
            {value}
          </div>
        </div>
      ))}
      {/* Vertical rose-gold dividers */}
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${20 * i}%`,
            top: 2,
            bottom: 2,
            width: 1,
            background: `linear-gradient(180deg, transparent, ${rose}, transparent)`,
            opacity: 0.35,
          }}
        />
      ))}
    </div>
  );
}

function Footer({
  top,
  rose,
  roseLight,
}: {
  top: number;
  rose: string;
  roseLight: string;
}) {
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
          margin: '0 auto 18px',
          width: 120,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${rose}, transparent)`,
        }}
      />
      <div
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: 15,
          letterSpacing: '0.34em',
          color: '#f8f4ef',
          fontWeight: 700,
          textTransform: 'uppercase',
        }}
      >
        {PUREX_MOTHERS_META.brand}
      </div>
      <div
        style={{
          fontSize: 20,
          color: roseLight,
          marginTop: 8,
          fontStyle: 'italic',
        }}
      >
        Trainer: {PUREX_MOTHERS_META.trainerName}
      </div>
      <div
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: 12,
          letterSpacing: '0.30em',
          color: rose,
          marginTop: 18,
          fontWeight: 700,
          textTransform: 'uppercase',
          opacity: 0.85,
        }}
      >
        Stronger Together · Unstoppable Always
      </div>
    </div>
  );
}

function CornerOrnament({
  top,
  left,
  right,
  bottom,
  rose,
  rotate = 0,
}: {
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  rose: string;
  rotate?: number;
}) {
  return (
    <svg
      width="42"
      height="42"
      viewBox="0 0 42 42"
      style={{
        position: 'absolute',
        top,
        left,
        right,
        bottom,
        transform: `rotate(${rotate}deg)`,
      }}
    >
      <path
        d="M2 12 L2 2 L12 2"
        stroke={rose}
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M2 20 L2 6"
        stroke={rose}
        strokeWidth="1"
        fill="none"
        opacity="0.5"
      />
      <circle cx="2" cy="2" r="2" fill={rose} />
    </svg>
  );
}
