'use client';

import { useEffect, useMemo, useState } from 'react';
import { AvatarImage } from './AvatarImage';
import type { BodyProportions } from '@/lib/data/body-proportions';
import type { Gender } from '@/lib/data/body-measurements';

/**
 * Renders <AvatarImage> at 260 px on mobile, 320 px on md+.
 *
 * When `proportions` and/or `heightCm` are provided, a measurement-
 * driven CSS transform is applied on top so each user's silhouette
 * actually reflects their real body — not just the 4-tier bodyType
 * bucket. Height stretches Y, waist+hip+chest averages drive X.
 *
 * Scale ranges are DELIBERATELY tight (0.92-1.10 vertical,
 * 0.88-1.14 horizontal) so the character never looks visually
 * distorted — you notice the difference in a side-by-side comparison,
 * but no one figure reads as "warped." The heavier lift is still the
 * bodyType bucket that picks which base PNG (lean/athletic/solid/
 * heavy) — this just fine-tunes on top.
 *
 * Transform origin is `bottom center` so the figure stays planted on
 * the holographic ring platform regardless of how it scales.
 */
export function TwinAvatarResponsive({
  src,
  accent = '#c6ff3d',
  glow = false,
  proportions,
  heightCm,
  gender,
}: {
  src: string;
  accent?: string;
  glow?: boolean;
  /** From deriveBodyProportions(measurements, height, gender). Optional. */
  proportions?: BodyProportions | null;
  /** User's height in centimetres, if known. Drives vertical scale. */
  heightCm?: number | null;
  /** Male / female — chooses the reference-height baseline. */
  gender?: Gender | null;
}) {
  const [isMd, setIsMd] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setIsMd(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const measurementScale = useMemo(
    () => computeMeasurementScale(proportions, heightCm, gender),
    [proportions, heightCm, gender]
  );

  return (
    <div
      style={{
        transform: `scale(${measurementScale.x}, ${measurementScale.y})`,
        transformOrigin: 'bottom center',
        // Guard against sub-pixel edges when the scale is non-integer.
        willChange: 'transform',
      }}
    >
      <AvatarImage
        src={src}
        width={isMd ? 320 : 260}
        accent={accent}
        glow={glow}
      />
    </div>
  );
}

/**
 * Measurement → CSS scale. Kept intentionally tight so silhouettes
 * differ noticeably in side-by-side comparisons without any
 * individual figure looking distorted.
 */
function computeMeasurementScale(
  proportions: BodyProportions | null | undefined,
  heightCm: number | null | undefined,
  gender: Gender | null | undefined
): { x: number; y: number } {
  if (!proportions && !heightCm) return { x: 1, y: 1 };

  // Vertical scale from height
  const refHeight = gender === 'female' ? 162 : 175;
  const y = heightCm
    ? clamp(heightCm / refHeight, 0.92, 1.1)
    : 1;

  // Horizontal scale from waist / hip / chest averages
  let x = 1;
  if (proportions) {
    const widthAvg =
      (proportions.waistScale + proportions.hipScale + proportions.chestScale) /
      3;
    // Soften the effect — proportions can range 0.7-1.5, we compress
    // into 0.88-1.14 for visible-but-not-warped effect.
    x = clamp(1 + (widthAvg - 1) * 0.4, 0.88, 1.14);
  }
  return { x, y };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
