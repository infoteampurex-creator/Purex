import {
  Playfair_Display,
  Great_Vibes,
  Cinzel,
  JetBrains_Mono,
} from 'next/font/google';

/**
 * Type-family for the appreciation card. next/font inlines Google
 * fonts into the response so html-to-image can pick them up when
 * exporting the PNG (no external stylesheet race).
 *
 * - Playfair Display: body serif (award title, appreciation line)
 * - Great Vibes: calligraphy script for the mother's name
 * - Cinzel: engraved roman caps for "PURE X Mothers" heading
 * - JetBrains Mono: uppercase mono labels (existing brand)
 */
export const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-mothers-playfair',
  display: 'swap',
});

export const greatVibes = Great_Vibes({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-mothers-script',
  display: 'swap',
});

export const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-mothers-roman',
  display: 'swap',
});

export const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mothers-mono',
  display: 'swap',
});

export const mothersFontClasses = [
  playfair.variable,
  greatVibes.variable,
  cinzel.variable,
  jetbrains.variable,
].join(' ');
