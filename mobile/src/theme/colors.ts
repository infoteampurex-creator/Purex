/**
 * Brand colours for the Teampurex mobile app.
 *
 * Mirrors the design tokens in the web's globals.css so designs feel
 * identical across surfaces. Source of truth lives here for the
 * mobile-only screens; if a new colour gets added on the web, mirror
 * it here too.
 */

export const colors = {
  bg: '#0a0c09',
  bgCard: '#161a16',
  bgElevated: '#1f2620',
  bgInset: '#0d100c',
  border: '#2a2e23',
  borderSoft: '#1f2519',
  text: '#f4f7eb',
  textMuted: '#a0a69a',
  textDim: '#7a8273',
  accent: '#c6ff3d',
  accentHover: '#b3eb1f',
  danger: '#ff6b6b',
  amber: '#ffb84d',
  whatsapp: '#25D366',
} as const;

export type BrandColor = keyof typeof colors;
