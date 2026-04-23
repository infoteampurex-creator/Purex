'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

interface AmbientVideoProps {
  /**
   * Video source(s). Accepts:
   *   - Single URL string: '/videos/hero.mp4' (self-hosted)
   *   - External URL: 'https://stream.mux.com/xxx.m3u8'
   *   - Array of sources for multiple formats (mp4 + webm)
   * Falls back gracefully to poster image if video fails.
   */
  src: string | Array<{ src: string; type: string }>;

  /**
   * Poster image shown:
   *   - Before video loads
   *   - If video fails or reduced-motion preferred
   *   - Always on mobile/low-power devices (mobile optimization)
   * Strongly recommended.
   */
  poster?: string;

  /**
   * Playback speed. 1 = normal. 0.5-0.8 for ambient/dreamy feel.
   */
  playbackRate?: number;

  /**
   * Opacity of video layer. 0.4-0.7 typical for backdrop behind text.
   */
  opacity?: number;

  /**
   * Object-fit behavior. Default 'cover'.
   */
  objectFit?: 'cover' | 'contain';

  /**
   * Object-position CSS string (e.g. 'center 30%').
   */
  objectPosition?: string;

  /**
   * Skip autoplay on mobile (saves bandwidth + battery).
   */
  desktopOnly?: boolean;

  className?: string;
}

/**
 * Premium ambient looping video component for PURE X.
 *
 * Design choices:
 * - autoplay + muted + playsinline + loop (browser autoplay policy compliance)
 * - preload="metadata" — skips full preload, loads on play
 * - Intersection Observer — only plays when visible (saves CPU)
 * - prefers-reduced-motion respect — shows poster, skips video
 * - Mobile optimization — by default, mobile gets poster only (saves data)
 * - Error handling — falls back to poster on any video failure
 * - No controls — purely ambient
 */
export function AmbientVideo({
  src,
  poster,
  playbackRate = 1,
  opacity = 1,
  objectFit = 'cover',
  objectPosition = 'center',
  desktopOnly = false,
  className,
}: AmbientVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldPlay, setShouldPlay] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Detect mobile (for bandwidth conservation)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Detect reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Intersection Observer — only play when visible
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShouldPlay(entry.isIntersecting),
      { threshold: 0.1, rootMargin: '50px' }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Play/pause based on visibility
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Apply playback rate
    if (playbackRate !== 1) {
      video.playbackRate = playbackRate;
    }

    if (shouldPlay) {
      video.play().catch(() => {
        // Autoplay blocked — poster will show instead
        setHasError(true);
      });
    } else {
      video.pause();
    }
  }, [shouldPlay, playbackRate]);

  // Decide whether to show video or just poster
  const showPoster = hasError || prefersReducedMotion || (desktopOnly && isMobile);

  return (
    <div
      ref={containerRef}
      className={cn('absolute inset-0 overflow-hidden', className)}
      aria-hidden
    >
      {/* Poster layer — always rendered, acts as fallback */}
      {poster && (
        <div
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            opacity: showPoster ? opacity : 0,
            backgroundImage: `url(${poster})`,
            backgroundSize: objectFit,
            backgroundPosition: objectPosition,
            backgroundRepeat: 'no-repeat',
          }}
        />
      )}

      {/* Video layer */}
      {!showPoster && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster={poster}
          onError={() => setHasError(true)}
          className="absolute inset-0 w-full h-full transition-opacity duration-700"
          style={{
            objectFit,
            objectPosition,
            opacity,
          }}
        >
          {typeof src === 'string' ? (
            <source src={src} type={src.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
          ) : (
            src.map((source, i) => (
              <source key={i} src={source.src} type={source.type} />
            ))
          )}
        </video>
      )}
    </div>
  );
}
