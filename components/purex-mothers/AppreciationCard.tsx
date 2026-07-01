'use client';

import { forwardRef } from 'react';
import type { PureXMother } from '@/lib/data/purex-mothers';

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

// Font-stack CSS variables set via next/font in fonts.ts
const F_SCRIPT = "var(--font-mothers-script), 'Great Vibes', cursive";
const F_SERIF = "var(--font-mothers-playfair), 'Playfair Display', Georgia, serif";
const F_MONO = "var(--font-mothers-mono), 'JetBrains Mono', ui-monospace, monospace";

/**
 * PURE X Mothers appreciation card — TEMPLATE MODE.
 *
 * Instead of hand-coding every ornament in SVG (which never matched
 * the reference), the card now uses the user-supplied reference PNG
 * as the background. Only the parts that change per-mother are
 * overlaid on top:
 *
 *   - Circular photo inside the gold ring
 *   - Mother's name in gold calligraphy script
 *   - Award title (revealed after Generate)
 *   - Appreciation message (portrait only)
 *
 * Required asset:
 *   /public/purex-mothers/card-template-portrait.png
 *   /public/purex-mothers/card-template-square.png (optional)
 *
 * Coordinates are tuned to the reference mockup and can be tweaked
 * in one place (the LAYOUT constant below) if the template art
 * shifts.
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
    const H = aspect === 'portrait' ? 1620 : 1080;
    const nameToShow = (displayName?.trim() || mother.name).trim();
    const templateSrc =
      aspect === 'portrait'
        ? '/purex-mothers/card-template-portrait.png'
        : '/purex-mothers/card-template-square.png';

    // ─── Layout coordinates (portrait 1080x1620) ─────────────
    // Positions match where each element sits on the reference PNG.
    // Photo circle covers the placeholder trainer photo.
    // Name overlay covers "Vani" placeholder.
    // Title overlay covers "CONSISTENCY ENTERTAINMENT STAR" placeholder.
    // Message overlay covers the italic message placeholder.
    const L =
      aspect === 'portrait'
        ? {
            photoCx: 540,
            photoCy: 700,
            photoR: 210,
            nameTop: 900,
            nameFont: 132,
            titleTop: 1070,
            titleFont: 22,
            titleLeft: 220,
            titleRight: 220,
            msgTop: 1140,
            msgFont: 20,
            msgLeft: 240,
            msgRight: 240,
          }
        : {
            photoCx: 540,
            photoCy: 500,
            photoR: 170,
            nameTop: 650,
            nameFont: 108,
            titleTop: 810,
            titleFont: 20,
            titleLeft: 180,
            titleRight: 180,
            msgTop: 0,
            msgFont: 0,
            msgLeft: 0,
            msgRight: 0,
          };

    // Gold gradient for the name — matches the reference's warm gold.
    const goldGradient =
      'linear-gradient(180deg, #fff2b3 0%, #ffd94a 50%, #a67c00 100%)';

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
          background: '#000000',
        }}
      >
        {/* ═══ Layer 1: reference template PNG ═════════════════ */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={templateSrc}
          alt=""
          crossOrigin="anonymous"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        {/* ═══ Layer 2: dark cover over the placeholder photo ══ */}
        {/* Hides the "trainer wearing PURE X shirt" placeholder    */}
        {/* so the mother's uploaded photo sits cleanly inside the  */}
        {/* gold ring.                                              */}
        <div
          style={{
            position: 'absolute',
            left: L.photoCx - L.photoR,
            top: L.photoCy - L.photoR,
            width: L.photoR * 2,
            height: L.photoR * 2,
            borderRadius: '50%',
            overflow: 'hidden',
            background: '#0a0806',
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.6)',
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

        {/* ═══ Layer 3: cover the "Vani" placeholder ═══════════ */}
        {/* Solid black rectangle sits behind the dynamic name so   */}
        {/* the underlying placeholder text is invisible even when  */}
        {/* the mother has a shorter name.                          */}
        <div
          style={{
            position: 'absolute',
            left: 100,
            top: L.nameTop - 30,
            right: 100,
            height: L.nameFont + 40,
            background: '#000000',
          }}
        />

        {/* ═══ Mother's name in gold script ═════════════════════ */}
        <div
          style={{
            position: 'absolute',
            top: L.nameTop,
            left: 60,
            right: 60,
            textAlign: 'center',
            fontFamily: F_SCRIPT,
            fontSize: L.nameFont,
            fontWeight: 400,
            lineHeight: 1,
            background: goldGradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 4px 24px rgba(255,215,74,0.20)',
          }}
        >
          {nameToShow}
        </div>

        {/* ═══ Layer 4: cover the title placeholder ═════════════ */}
        <div
          style={{
            position: 'absolute',
            left: L.titleLeft,
            top: L.titleTop - 8,
            right: L.titleRight,
            height: L.titleFont + 16,
            background: '#000000',
          }}
        />

        {/* ═══ Award title (revealed after Generate) ════════════ */}
        <div
          style={{
            position: 'absolute',
            top: L.titleTop,
            left: L.titleLeft,
            right: L.titleRight,
            textAlign: 'center',
            fontFamily: F_MONO,
            fontSize: L.titleFont,
            fontWeight: 700,
            letterSpacing: '0.28em',
            color: revealed ? '#fff2b3' : 'rgba(255,215,74,0.45)',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}
        >
          {revealed ? mother.title : '✦ ✦ ✦'}
        </div>

        {/* ═══ Layer 5: cover the message placeholder + render ══ */}
        {aspect === 'portrait' && L.msgTop > 0 && (
          <>
            <div
              style={{
                position: 'absolute',
                left: L.msgLeft,
                top: L.msgTop - 6,
                right: L.msgRight,
                height: L.msgFont * 2.5,
                background: '#000000',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: L.msgTop,
                left: L.msgLeft,
                right: L.msgRight,
                textAlign: 'center',
                fontFamily: F_SERIF,
                fontSize: L.msgFont,
                lineHeight: 1.4,
                color: '#f8ecd2',
                fontStyle: 'italic',
                fontWeight: 400,
                opacity: revealed ? 0.9 : 0.4,
              }}
            >
              {revealed
                ? mother.message
                : 'Tap Generate to reveal your award ✨'}
            </div>
          </>
        )}
      </div>
    );
  }
);
