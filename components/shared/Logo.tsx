import { cn } from '@/lib/cn';

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 140 32"
      className={cn('h-8 w-auto', className)}
      fill="none"
      aria-label="PURE X"
    >
      <text
        x="0"
        y="24"
        fontFamily="var(--font-display), sans-serif"
        fontSize="22"
        fontWeight="800"
        letterSpacing="-0.02em"
        fill="currentColor"
      >
        PURE
      </text>
      <text
        x="58"
        y="24"
        fontFamily="var(--font-display), sans-serif"
        fontSize="22"
        fontWeight="800"
        letterSpacing="-0.02em"
        fill="#c6ff3d"
      >
        X
      </text>
      <circle cx="78" cy="26" r="1.5" fill="#c6ff3d" />
    </svg>
  );
}
