import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

/**
 * The full TEAM PURE X wordmark — same lockup as the web header and
 * the marketing logo the user provided. Used on the splash screen and
 * the unauthenticated screens (login / signup) as the brand anchor.
 *
 *   TEAM      ← small, white, uppercase, tracked
 *   PURE X    ← large, "PURE" white + "X" accent green
 *
 * Pure React Native primitives — no SVG dependency, no rasterised
 * image. Scales crisp on every Android density (mdpi → xxxhdpi).
 */
interface WordmarkProps {
  /** Pixel size of the main "PURE X" line. Defaults to 56. */
  size?: number;
  /** Show the small "TEAM" preface above? Defaults to true. */
  includeTeam?: boolean;
}

export function Wordmark({ size = 56, includeTeam = true }: WordmarkProps) {
  const mainHeight = size;
  // 'TEAM' is roughly 1/4 the height of the main line, matching the
  // marketing logo proportions.
  const teamSize = Math.round(size * 0.22);
  // Gap between TEAM and PURE X scales with size, capped sensibly.
  const gap = Math.max(2, Math.round(size * 0.06));

  return (
    <View style={styles.root} accessible accessibilityRole="header" accessibilityLabel="Team Pure X">
      {includeTeam && (
        <Text
          style={[
            styles.team,
            {
              fontSize: teamSize,
              lineHeight: teamSize * 1.1,
              letterSpacing: teamSize * 0.18,
              marginBottom: gap,
            },
          ]}
        >
          TEAM
        </Text>
      )}
      <View style={styles.mainRow}>
        <Text
          style={[
            styles.mainPure,
            {
              fontSize: mainHeight,
              lineHeight: mainHeight * 1.0,
            },
          ]}
        >
          PURE
        </Text>
        <Text
          style={[
            styles.mainX,
            {
              fontSize: mainHeight,
              lineHeight: mainHeight * 1.0,
              marginLeft: mainHeight * 0.18,
            },
          ]}
        >
          X
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'flex-start',
  },
  team: {
    color: colors.text,
    fontWeight: '700',
    // System font on Android maps to Roboto; the heavy weight + wide
    // tracking captures the marketing logo's feel without bundling a
    // custom font.
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  mainPure: {
    color: colors.text,
    fontWeight: '900',
    letterSpacing: -1,
  },
  mainX: {
    color: colors.accent,
    fontWeight: '900',
    letterSpacing: -1,
  },
});
