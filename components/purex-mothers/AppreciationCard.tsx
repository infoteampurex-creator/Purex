'use client';

import { forwardRef, useState } from 'react';
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

// Font stack CSS variables (set via next/font in fonts.ts)
const F_SCRIPT = "var(--font-mothers-script), 'Great Vibes', cursive";
const F_SERIF = "var(--font-mothers-playfair), 'Playfair Display', Georgia, serif";
const F_MONO = "var(--font-mothers-mono), 'JetBrains Mono', ui-monospace, monospace";

/**
 * PURE X Mothers appreciation card.
 *
 * Rendering strategy: TEMPLATE-IMAGE.
 * The user's designed reference PNG (with all the illustrated
 * ornaments, silhouettes, seal, laurel wreaths, corner filigree)
 * is loaded as the card background. Only the parts that change
 * per-mother are overlaid on top:
 *
 *   - Circular photo inside the gold ring
 *   - Mother's name in gold Great Vibes script
 *   - Award title (revealed after Generate)
 *   - Appreciation message (portrait only)
 *
 * REQUIRED ASSETS (drop into public/purex-mothers/):
 *   card-template-portrait.png   (1080 × 1620)  — required
 *   card-template-square.png     (1080 × 1080)  — optional
 *
 * If the template PNG is missing, we render a friendly placeholder
 * so the app doesn't visually break — the user sees clear instructions
 * on where to save the file.
 *
 * Overlay coordinates are tuned to the reference art. If you replace
 * the template PNG with a different design, re-tune the LAYOUT
 * constant below.
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
    const [templateFailed, setTemplateFailed] = useState(false);
    const W = 1080;
    const H = aspect === 'portrait' ? 1620 : 1080;
    const nameToShow = (displayName?.trim() || mother.name).trim();
    const templateSrc =
      aspect === 'portrait'
        ? '/purex-mothers/card-template-portrait.png'
        : '/purex-mothers/card-template-square.png';

    // Overlay coordinates tuned to the reference PNG.
    const L =
      aspect === 'portrait'
        ? {
            photoCx: 540,
            photoCy: 745,
            photoR: 225,
            nameTop: 990,
            nameFont: 128,
            titleTop: 1135,
            titleFont: 22,
            titleLeft: 240,
            titleRight: 240,
            msgTop: 1200,
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
        {/* ═══ Template background image ═══════════════════════ */}
        {!templateFailed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={templateSrc}
            alt=""
            crossOrigin="anonymous"
            onError={() => setTemplateFailed(true)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}

        {/* ═══ Fallback placeholder when the PNG is missing ════ */}
        {templateFailed && <MissingTemplateNotice templateSrc={templateSrc} />}

        {/* ═══ Photo circle (only if template loaded) ══════════ */}
        {!templateFailed && (
          <>
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

            {/* Cover the placeholder "Vani" text on the template */}
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

            {/* Mother's name in gold script */}
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

            {/* Cover placeholder title */}
            <div
              style={{
                position: 'absolute',
                left: L.titleLeft,
                top: L.titleTop - 10,
                right: L.titleRight,
                height: L.titleFont + 20,
                background: '#000000',
              }}
            />

            {/* Award title */}
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

            {/* Cover placeholder message + render dynamic message */}
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
          </>
        )}
      </div>
    );
  }
);

/** Friendly instructions when the template PNG hasn't been uploaded yet. */
function MissingTemplateNotice({ templateSrc }: { templateSrc: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 40,
        border: '2px dashed rgba(255,215,74,0.35)',
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        textAlign: 'center',
        color: '#f8ecd2',
        background: '#0a0806',
      }}
    >
      <div
        style={{
          fontFamily: F_MONO,
          fontSize: 12,
          letterSpacing: '0.36em',
          color: '#ffd94a',
          fontWeight: 700,
          textTransform: 'uppercase',
        }}
      >
        Template PNG needed
      </div>
      <div
        style={{
          fontFamily: F_SERIF,
          fontStyle: 'italic',
          fontSize: 28,
          marginTop: 16,
          maxWidth: 500,
          lineHeight: 1.3,
        }}
      >
        Save your reference image at
      </div>
      <div
        style={{
          fontFamily: F_MONO,
          fontSize: 15,
          marginTop: 12,
          padding: '10px 18px',
          borderRadius: 8,
          background: 'rgba(255,215,74,0.08)',
          border: '1px solid rgba(255,215,74,0.35)',
          color: '#fff2b3',
        }}
      >
        public{templateSrc}
      </div>
      <div
        style={{
          fontFamily: F_SERIF,
          fontSize: 16,
          marginTop: 20,
          opacity: 0.75,
          maxWidth: 540,
          lineHeight: 1.5,
        }}
      >
        1080 × 1620 pixels · portrait
        <br />
        Once the file is there, the card will use it as the background
        and overlay only the mother&apos;s photo, name, and award title.
      </div>
    </div>
  );
}
