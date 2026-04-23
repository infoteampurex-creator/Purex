'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { AmbientVideo } from '@/components/shared/AmbientVideo';
import type { VideoSlot } from '@/lib/videos';

interface HeroBackdropProps {
  /**
   * Optional URL for a cinematic gym photo. Drop a file at /public/hero/hero-backdrop.jpg
   * (or .webp) and pass "/hero/hero-backdrop.jpg" here.
   * When null, falls back to the SVG gym silhouette.
   */
  imageSrc?: string | null;
  /**
   * Opacity of the photo (if provided). Defaults to 0.5 — image is darkened
   * so the text overlay stays readable.
   */
  imageOpacity?: number;
  /**
   * Optional ambient video. Takes priority over imageSrc when provided.
   * Image (if also provided) is used as poster while video loads.
   */
  videoSlot?: VideoSlot | null;
}

/**
 * Cinematic gym atmosphere layer for the hero.
 * Render priority:
 *   1. Ambient video (if videoSlot provided) — poster photo used as fallback
 *   2. Real photo (if imageSrc provided)
 *   3. SVG gym silhouette (default fallback)
 * Effects layer is identical in all cases.
 */
export function HeroBackdrop({
  imageSrc = null,
  imageOpacity = 0.5,
  videoSlot = null,
}: HeroBackdropProps = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    const handleScroll = () => setScrollY(window.scrollY);

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden
    >
      {/* LAYER 1 — Deep base gradient (always visible) */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 90% 70% at 20% 35%, rgba(198,255,61,0.08), transparent 55%),
            radial-gradient(ellipse 70% 50% at 85% 80%, rgba(198,255,61,0.04), transparent 60%),
            linear-gradient(180deg, #070905 0%, #0e120d 40%, #0a0c09 100%)
          `,
        }}
      />

      {/* LAYER 2a — Ambient video (highest priority when provided) */}
      {videoSlot && (
        <div
          className="absolute inset-0"
          style={{
            transform: `translateY(${scrollY * 0.15}px) scale(1.08)`,
            transition: 'transform 0.1s linear',
          }}
        >
          <AmbientVideo
            src={videoSlot.src}
            poster={videoSlot.poster ?? imageSrc ?? undefined}
            opacity={videoSlot.opacity ?? imageOpacity}
            playbackRate={videoSlot.playbackRate ?? 0.7}
            objectPosition={videoSlot.objectPosition}
            desktopOnly={videoSlot.desktopOnly ?? true}
          />
          {/* Brand tint over video */}
          <div
            className="absolute inset-0"
            style={{
              background: `
                linear-gradient(180deg, rgba(10,12,9,0.5) 0%, rgba(10,12,9,0.3) 50%, rgba(10,12,9,0.85) 100%),
                radial-gradient(ellipse 80% 60% at 30% 40%, rgba(198,255,61,0.10), transparent 60%)
              `,
            }}
          />
        </div>
      )}

      {/* LAYER 2b — Real photo (if provided and no video) */}
      {!videoSlot && imageSrc && (
        <div
          className="absolute inset-0"
          style={{
            transform: `translateY(${scrollY * 0.15}px) scale(1.08)`,
            transition: 'transform 0.1s linear',
          }}
        >
          <Image
            src={imageSrc}
            alt=""
            fill
            priority
            quality={85}
            sizes="100vw"
            className="object-cover"
            style={{ opacity: imageOpacity }}
          />
          {/* Brand tint over photo */}
          <div
            className="absolute inset-0"
            style={{
              background: `
                linear-gradient(180deg, rgba(10,12,9,0.5) 0%, rgba(10,12,9,0.3) 50%, rgba(10,12,9,0.85) 100%),
                radial-gradient(ellipse 80% 60% at 30% 40%, rgba(198,255,61,0.10), transparent 60%)
              `,
            }}
          />
        </div>
      )}

      {/* LAYER 2c — SVG gym silhouette fallback (only when no photo and no video) */}
      {!videoSlot && !imageSrc && (
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.14]"
          viewBox="0 0 1600 900"
          preserveAspectRatio="xMidYMid slice"
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
        >
          <defs>
            <linearGradient id="silhouette-fade" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1a2014" />
              <stop offset="100%" stopColor="#0a0c09" />
            </linearGradient>
            <filter id="gym-blur">
              <feGaussianBlur stdDeviation="2.5" />
            </filter>
          </defs>
          <g filter="url(#gym-blur)" fill="url(#silhouette-fade)">
            <rect x="0" y="70" width="1600" height="4" />
            <rect x="0" y="130" width="1600" height="2" />
            <polygon points="100,75 140,115 180,75" />
            <polygon points="260,75 300,115 340,75" />
            <polygon points="420,75 460,115 500,75" />
            <polygon points="580,75 620,115 660,75" />
            <polygon points="740,75 780,115 820,75" />
            <polygon points="900,75 940,115 980,75" />
            <polygon points="1060,75 1100,115 1140,75" />
            <polygon points="1220,75 1260,115 1300,75" />
            <polygon points="1380,75 1420,115 1460,75" />
          </g>
          <g fill="url(#silhouette-fade)" opacity="0.9">
            <rect x="120" y="500" width="8" height="340" />
            <rect x="240" y="500" width="8" height="340" />
            <rect x="115" y="540" width="140" height="6" />
            <rect x="115" y="620" width="140" height="6" />
            <rect x="115" y="700" width="140" height="6" />
            <rect x="80" y="618" width="220" height="10" rx="2" />
            <circle cx="90" cy="623" r="24" />
            <circle cx="90" cy="623" r="16" fill="#0a0c09" />
            <circle cx="290" cy="623" r="24" />
            <circle cx="290" cy="623" r="16" fill="#0a0c09" />
          </g>
          <g fill="url(#silhouette-fade)" opacity="0.7">
            <rect x="480" y="780" width="120" height="40" rx="6" />
            <circle cx="495" cy="820" r="10" />
            <circle cx="585" cy="820" r="10" />
          </g>
          <g fill="url(#silhouette-fade)" opacity="0.75">
            <rect x="1200" y="730" width="80" height="8" rx="2" />
            <rect x="1204" y="740" width="72" height="8" rx="2" />
            <rect x="1208" y="750" width="64" height="8" rx="2" />
            <rect x="1212" y="760" width="56" height="8" rx="2" />
            <rect x="1200" y="770" width="80" height="60" rx="4" />
          </g>
          <g fill="url(#silhouette-fade)" opacity="0.7">
            <rect x="1340" y="810" width="180" height="10" rx="3" />
            <rect x="1340" y="790" width="50" height="30" rx="4" />
            <rect x="1480" y="770" width="40" height="50" rx="4" />
          </g>
          <rect x="0" y="835" width="1600" height="2" fill="url(#silhouette-fade)" opacity="0.6" />
        </svg>
      )}

      {/* LAYER 3 — Volumetric light rays */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            conic-gradient(from 180deg at 30% -10%, transparent 0deg, rgba(198,255,61,0.05) 20deg, transparent 40deg),
            conic-gradient(from 180deg at 70% -10%, transparent 0deg, rgba(198,255,61,0.04) 25deg, transparent 50deg)
          `,
          mixBlendMode: 'screen',
        }}
      />

      {/* LAYER 4 — Mouse-follow cinematic spotlight */}
      <div
        className="absolute inset-0 transition-all duration-700 ease-out"
        style={{
          background: `radial-gradient(circle 700px at ${mousePos.x}% ${mousePos.y}%, rgba(198,255,61,0.08), transparent 55%)`,
        }}
      />

      {/* LAYER 5 — Editorial grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #c6ff3d 1px, transparent 1px), linear-gradient(to bottom, #c6ff3d 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage:
            'radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 100%)',
        }}
      />

      {/* LAYER 6 — Film grain */}
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Bottom fade */}
      <div
        className="absolute inset-x-0 bottom-0 h-32"
        style={{
          background: 'linear-gradient(to top, #0a0c09 0%, transparent 100%)',
        }}
      />
    </div>
  );
}
