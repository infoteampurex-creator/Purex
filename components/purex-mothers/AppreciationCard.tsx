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
 * Team Purex Mothers appreciation card.
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
    // Card dimensions match the native size of the reference PNG so
    // there's no scaling / cropping. Portrait = 1122x1402.
    const W = aspect === 'portrait' ? 1122 : 1080;
    const H = aspect === 'portrait' ? 1402 : 1080;
    const nameToShow = (displayName?.trim() || mother.name).trim();
    // Cache-bust the template PNG. Since we sometimes edit the same
    // file (paint over baked-in text, remove decorative bars), we
    // append a version query so browsers + CDN don't serve stale
    // cached copies. Bump this any time the template PNG changes.
    const TEMPLATE_VERSION = 'v7';
    const templateSrc =
      aspect === 'portrait'
        ? `/purex-mothers/card-template-portrait.png?${TEMPLATE_VERSION}`
        : `/purex-mothers/card-template-square.png?${TEMPLATE_VERSION}`;

    // Overlay coordinates tuned to the NEW reference PNG (mothers-1)
    // at native 1122×1402. Template art now has proper empty
    // placeholders instead of baked-in text.
    // Measured positions:
    //   Photo ring is much larger and lower (~47% down, radius ~205)
    //   Name area sits between the laurel wreaths (~69% down)
    //   Award title inside the star frame (~74% down)
    //   Message area below the star frame (~79% down)
    const L =
      aspect === 'portrait'
        ? {
            // Template positions measured directly from screenshot
            // where user showed my overlays landing above their target
            // bars. Title needs to sit inside the star-cornered bar
            // BELOW the name bar. Message needs to overlap the
            // baked-in "For bringing discipline…" text so my dynamic
            // text visually replaces it.
            photoCx: 561,
            photoCy: 690,
            photoR: 215,
            nameTop: 985,
            nameHeight: 90,
            nameFont: 72,
            titleTop: 1115,       // moved down into the second bar
            titleHeight: 45,
            titleFont: 18,
            titleLeft: 280,
            titleRight: 280,
            msgTop: 1215,         // moved down to overlap the baked-in msg
            msgFont: 20,          // matches baked-in font size for coverage
            msgLeft: 200,
            msgRight: 200,
          }
        : {
            photoCx: 540,
            photoCy: 500,
            photoR: 170,
            nameTop: 650,
            nameHeight: 100,
            nameFont: 108,
            titleTop: 810,
            titleHeight: 40,
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
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: `translate(${photoOffsetX}px, ${photoOffsetY}px) scale(${photoScale})`,
                    transformOrigin: 'center',
                    pointerEvents: 'none',
                  }}
                  draggable={false}
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

            {/* Mother's name in gold script.
                Rendered inside a fixed-height container with flex
                centering so the script text (with its long
                ascenders/descenders) always sits centred inside the
                double-line name bar — no top-clip, no bottom-clip. */}
            <div
              style={{
                position: 'absolute',
                top: L.nameTop,
                left: 60,
                right: 60,
                height: L.nameHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  // Switched from Great Vibes script to Playfair Display
                  // bold italic. Great Vibes has long descenders that
                  // kept getting clipped on the export.
                  fontFamily: F_SERIF,
                  fontSize: L.nameFont,
                  fontWeight: 700,
                  fontStyle: 'italic',
                  lineHeight: 1.15,
                  letterSpacing: '0.01em',
                  textAlign: 'center',
                  background: goldGradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  whiteSpace: 'nowrap',
                }}
              >
                {nameToShow}
              </div>
            </div>

            {/* Award title — sits inside its dedicated bar on the
                template. Flex-centered so the mono caps sit vertically
                aligned regardless of font metric. */}
            <div
              style={{
                position: 'absolute',
                top: L.titleTop,
                left: L.titleLeft,
                right: L.titleRight,
                height: L.titleHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: F_MONO,
                  fontSize: L.titleFont,
                  fontWeight: 700,
                  letterSpacing: '0.28em',
                  color: revealed ? '#fff2b3' : 'rgba(255,215,74,0.45)',
                  textTransform: 'uppercase',
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {revealed ? mother.title : '✦ ✦ ✦'}
              </div>
            </div>

            {/* Appreciation message — only rendered when revealed.
                Sits directly on the template with no black cover; the
                template's baked-in placeholder message reads as
                Vani's default, which is fine as a visual anchor
                before Generate is tapped. */}
            {aspect === 'portrait' && L.msgTop > 0 && revealed && (
              <div
                style={{
                  position: 'absolute',
                  top: L.msgTop,
                  left: L.msgLeft,
                  right: L.msgRight,
                  textAlign: 'center',
                  fontFamily: F_SERIF,
                  fontSize: L.msgFont,
                  lineHeight: 1.45,
                  color: '#faeed4',
                  fontStyle: 'italic',
                  fontWeight: 600,
                  letterSpacing: '0.01em',
                }}
              >
                {mother.message}
              </div>
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
