import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '@/theme/colors';

/**
 * The Teampurex 'X' monogram — the lime-green X from the wordmark,
 * isolated as a standalone mark.
 *
 * Two strokes crossing at the centre, slight overshoot at the ends
 * to feel athletic rather than typographic. Stroke colour defaults
 * to the brand accent, but accepts any colour override for use in
 * other contexts (e.g. white-on-accent inverse states).
 *
 * Used wherever the app needs a compact brand beat: nav header,
 * loading spinners, empty-state illustrations, the foreground of
 * the Android adaptive icon (rendered to PNG in PR A3 via expo
 * asset pipeline).
 */
interface XMarkProps {
  size?: number;
  color?: string;
}

export function XMark({ size = 64, color = colors.accent }: XMarkProps) {
  // Stroke width scales with size — keeps the X visually balanced
  // from 24px (small UI) up to 512px (Play Store listing icon).
  const stroke = Math.max(2, size * 0.14);

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* Left-leaning stroke (top-left → bottom-right) */}
      <Path
        d="M 12 12 L 88 88"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="square"
      />
      {/* Right-leaning stroke (top-right → bottom-left) */}
      <Path
        d="M 88 12 L 12 88"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="square"
      />
    </Svg>
  );
}
