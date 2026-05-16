import Image from 'next/image';
import { type JourneyPost } from '@/lib/data/mother-strong-types';

interface Props {
  posts: JourneyPost[];
}

/**
 * Read-only journey feed grid for the public leaderboard page.
 *
 * Each post is a square card with the photo (admin-compressed to
 * 1200x1200) and the participant + caption + day overlay.
 */
export function JourneyFeed({ posts }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {posts.map((p) => (
        <div
          key={p.id}
          className="group rounded-xl bg-bg-card border border-border-soft overflow-hidden transition-colors hover:border-accent/40"
        >
          <div className="relative aspect-square bg-bg-inset">
            <Image
              src={p.imageUrl}
              alt={p.caption ?? `Mother Strong cohort photo${p.dayNumber ? `, day ${p.dayNumber}` : ''}`}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
              unoptimized
            />
            {p.dayNumber != null && (
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-bg/85 backdrop-blur-sm font-mono text-[10px] uppercase tracking-[0.12em] text-accent font-bold">
                Day {p.dayNumber}
              </span>
            )}
          </div>
          {(p.participantName || p.caption) && (
            <div className="px-3 py-3">
              {p.participantName && (
                <div className="font-display font-semibold text-sm truncate">
                  {p.participantName}
                </div>
              )}
              {p.caption && (
                <div className="text-xs text-text-muted leading-relaxed mt-1 line-clamp-2">
                  {p.caption}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
