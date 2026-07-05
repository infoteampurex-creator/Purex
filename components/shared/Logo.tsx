import { cn } from '@/lib/cn';

/**
 * Team PURE X wordmark — TEAM stacked over PURE X.
 * The X is in the signature lime green (#c6ff3d).
 *
 * Renders responsive to `className` sizing (default h-10) — set a
 * height via className and width scales automatically via viewBox.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 130 60"
      className={cn('h-10 w-auto', className)}
      fill="none"
      aria-label="Team PURE X"
    >
      {/* TEAM — small, wide-tracked, sits above PURE X */}
      <text
        x="65"
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
      {/* PURE — large, tight-tracked, main brand */}
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
      {/* X — same size, lime green */}
      <text
        x="90"
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
