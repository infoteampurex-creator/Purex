import Image from 'next/image';
import { cn } from '@/lib/cn';

interface AvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  xs: { box: 28, text: 'text-[10px]' },
  sm: { box: 36, text: 'text-xs' },
  md: { box: 48, text: 'text-sm' },
  lg: { box: 64, text: 'text-lg' },
  xl: { box: 96, text: 'text-2xl' },
};

/**
 * Admin/client avatar. Shows photo if provided, otherwise shows initials
 * on a brand-green gradient background.
 */
export function Avatar({ name, photoUrl, size = 'md', className }: AvatarProps) {
  const { box, text } = sizeMap[size];

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Show photo if URL exists
  if (photoUrl) {
    return (
      <div
        className={cn(
          'relative rounded-full overflow-hidden flex-shrink-0 border',
          className
        )}
        style={{
          width: box,
          height: box,
          borderColor: 'rgba(198, 255, 61, 0.25)',
        }}
      >
        <Image
          src={photoUrl}
          alt={name}
          width={box}
          height={box}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Initials fallback
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-display font-bold flex-shrink-0',
        text,
        className
      )}
      style={{
        width: box,
        height: box,
        background:
          'linear-gradient(135deg, rgba(198, 255, 61, 0.15), rgba(77, 255, 184, 0.08))',
        color: '#c6ff3d',
        border: '1px solid rgba(198, 255, 61, 0.25)',
      }}
    >
      {initials}
    </div>
  );
}
