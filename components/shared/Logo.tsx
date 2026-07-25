import Image from 'next/image';
import { cn } from '@/lib/cn';

/**
 * Team Purex wordmark — official brand PNG.
 * Uses next/image for automatic optimization. The PNG lives at
 * /public/brand/logo.png (native 868×670 landscape).
 *
 * Set the visual size via `className` (default h-10). Width scales
 * automatically to preserve the ~1.3:1 aspect ratio.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/logo.png"
      alt="Team Purex"
      width={868}
      height={670}
      priority
      className={cn('h-10 w-auto object-contain', className)}
    />
  );
}
