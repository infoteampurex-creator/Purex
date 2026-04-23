'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/cn';

interface HeroPhotoCarouselProps {
  photos: string[]; // e.g. ['/trainers/hero/hero-1.jpg', ...]
  alt?: string;
  objectPosition?: string; // default 'center 15%' to frame faces
  /** ms per photo before transitioning to next */
  durationMs?: number;
  /** ms crossfade duration */
  fadeMs?: number;
  className?: string;
}

/**
 * Cinematic hero photo carousel.
 *
 * Features:
 *   - Crossfade transition between photos (1.2s default)
 *   - Ken Burns zoom — each photo slowly scales from 100% → 106% during display
 *   - Progress bar fills during each photo's display time
 *   - Photo counter (X / Y) in mono type
 *   - Pauses on hover so user can study the current frame
 *   - Respects prefers-reduced-motion (shows first photo static)
 *   - Preloads all photos after first mount
 */
export function HeroPhotoCarousel({
  photos,
  alt = 'PURE X coaching session',
  objectPosition = 'center 15%',
  durationMs = 5000,
  fadeMs = 1200,
  className,
}: HeroPhotoCarouselProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const [progress, setProgress] = useState(0);

  // Detect reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Advance photo index on interval, unless paused or reduced motion
  useEffect(() => {
    if (reducedMotion || paused || photos.length <= 1) {
      if (intervalRef.current) clearTimeout(intervalRef.current);
      return;
    }

    startTimeRef.current = Date.now();

    const tick = () => {
      setActiveIdx((prev) => (prev + 1) % photos.length);
      startTimeRef.current = Date.now();
      intervalRef.current = setTimeout(tick, durationMs);
    };

    intervalRef.current = setTimeout(tick, durationMs);

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, [photos.length, durationMs, paused, reducedMotion]);

  // Progress bar updates every 50ms
  useEffect(() => {
    if (reducedMotion || paused || photos.length <= 1) {
      setProgress(0);
      return;
    }
    startTimeRef.current = Date.now();

    const raf = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      setProgress(pct);
    }, 50);

    return () => clearInterval(raf);
  }, [activeIdx, durationMs, paused, reducedMotion, photos.length]);

  if (photos.length === 0) return null;

  return (
    <div
      className={cn('absolute inset-0 overflow-hidden', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Photo stack — only active photo visible, with Ken Burns zoom */}
      <AnimatePresence mode="sync">
        <motion.div
          key={activeIdx}
          initial={{ opacity: 0, scale: 1.0 }}
          animate={{
            opacity: 1,
            scale: reducedMotion ? 1.0 : 1.06,
          }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: fadeMs / 1000, ease: [0.4, 0, 0.6, 1] },
            scale: {
              duration: durationMs / 1000,
              ease: 'linear',
            },
          }}
          className="absolute inset-0"
          style={{ willChange: 'opacity, transform' }}
        >
          <Image
            src={photos[activeIdx]}
            alt={`${alt} — ${activeIdx + 1} of ${photos.length}`}
            fill
            sizes="(max-width: 900px) 90vw, 500px"
            priority={activeIdx === 0}
            quality={90}
            className="object-cover"
            style={{
              objectPosition,
              filter: 'contrast(1.05) saturate(1.08)',
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Preload remaining photos (invisible) */}
      <div className="hidden">
        {photos.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt=""
            width={1}
            height={1}
            priority={i < 3}
            quality={90}
          />
        ))}
      </div>

      {/* Bottom progress bar + counter overlay */}
      {photos.length > 1 && (
        <div className="absolute inset-x-0 bottom-0 pointer-events-none z-20">
          {/* Gradient fade to make overlay readable */}
          <div
            className="h-20 w-full"
            style={{
              background:
                'linear-gradient(180deg, transparent 0%, rgba(10, 12, 9, 0.85) 100%)',
            }}
          />

          <div className="absolute inset-x-0 bottom-0 px-5 pb-4">
            {/* Counter */}
            <div className="flex items-end justify-between mb-2">
              <div className="flex items-baseline gap-2">
                <span
                  className="font-display font-bold text-2xl text-accent tabular-nums"
                  style={{
                    textShadow: '0 0 12px rgba(198, 255, 61, 0.6)',
                  }}
                >
                  {String(activeIdx + 1).padStart(2, '0')}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted font-bold">
                  / {String(photos.length).padStart(2, '0')}
                </span>
              </div>

              {paused && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-mono text-[9px] uppercase tracking-[0.22em] text-accent font-bold"
                >
                  · paused
                </motion.span>
              )}
            </div>

            {/* Segmented progress bar — one segment per photo */}
            <div className="flex items-center gap-1">
              {photos.map((_, i) => {
                const isActive = i === activeIdx;
                const isPast = i < activeIdx;
                const segmentProgress = isActive ? progress : isPast ? 100 : 0;
                return (
                  <div
                    key={i}
                    className="flex-1 h-[2px] rounded-full overflow-hidden"
                    style={{
                      background: 'rgba(198, 255, 61, 0.15)',
                    }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${segmentProgress}%`,
                        background: '#c6ff3d',
                        boxShadow: isActive
                          ? '0 0 6px rgba(198, 255, 61, 0.7)'
                          : 'none',
                        transition: isActive
                          ? 'none'
                          : 'width 0.4s ease-out',
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
