import { cn } from '@/lib/cn';

/**
 * Team Purex wordmark — TEAM stacked over PUREX.
 * Brand name is one word "Purex" (not "PURE X"). Visually the
 * X is coloured lime green (#c6ff3d) as the signature accent
 * but there's no space between "PURE" and "X".
 *
 * Renders responsive to `className` sizing (default h-10) — set
 * a height via className and width scales automatically via
 * viewBox.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 60"
      className={cn('h-10 w-auto', className)}
      fill="none"
      aria-label="Team Purex"
    >
      {/* TEAM — small, wide-tracked, sits above PUREX */}
      <text
        x="60"
        y="14"
        textAnchor="middle"
        fontFamily="var(--font-display), sans-serif"
        fontSize="11"
        fontWeight="800"
        letterSpacing="0.36em"
        fill="currentColor"
      >
        TEAM
      </text>
      {/* PURE — main brand, tight tracking */}
      <text
        x="0"
        y="52"
        fontFamily="var(--font-display), sans-serif"
        fontSize="32"
        fontWeight="800"
        letterSpacing="-0.02em"
        fill="currentColor"
      >
        PURE
      </text>
      {/* X — same size, no gap, lime green */}
      <text
        x="82"
        y="52"
        fontFamily="var(--font-display), sans-serif"
        fontSize="32"
        fontWeight="800"
        letterSpacing="-0.02em"
        fill="#c6ff3d"
      >
        X
      </text>
    </svg>
  );
}
