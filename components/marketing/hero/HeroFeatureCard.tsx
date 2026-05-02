'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRef, useState, useCallback } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { AmbientVideo } from '@/components/shared/AmbientVideo';
import { SIVA_HERO_VIDEO } from '@/lib/videos';
import { HeroPhotoCarousel } from './HeroPhotoCarousel';

/**
 * Siva Reddy hero feature card with ambient + interactive animation.
 *
 * Animation layers:
 *   1. Entrance — fades up with rotateX tilt settle (Framer Motion)
 *   2. Ambient breathing — continuous slow zoom + drift (CSS keyframes, never stops)
 *   3. Ambient glow pulse — neon green border/glow breathes slowly
 *   4. Live dot — "Training Today" chip pulses
 *   5. Mouse tilt — overrides ambient on hover, smooth handoff
 *   6. Hover boost — contrast, saturation, scale increase
 *   7. Particle drift — subtle floating dust motes over the photo
 */
export function HeroFeatureCard() {
  const ref = useRef<HTMLAnchorElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [tilt, setTilt] = useState({
    rotX: 0, rotY: 0, glowX: 50, glowY: 50, active: false,
  });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const nx = (x - rect.width / 2) / (rect.width / 2);
    const ny = (y - rect.height / 2) / (rect.height / 2);
    setTilt({
      rotX: -ny * 8,
      rotY: nx * 8,
      glowX: (x / rect.width) * 100,
      glowY: (y / rect.height) * 100,
      active: true,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ rotX: 0, rotY: 0, glowX: 50, glowY: 50, active: false });
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // HERO PHOTOS — place files at /public/trainers/hero/hero-1.jpg ... hero-9.jpg
  //
  // The carousel cycles through all photos in order with:
  //   - 5s per photo
  //   - 1.2s crossfade
  //   - Ken Burns zoom during display
  //   - Progress bar + counter at bottom
  //   - Pause on hover
  //
  // Leave HERO_PHOTOS empty ([]) to skip the carousel and fall back to the
  // gradient silhouette placeholder.
  // ═══════════════════════════════════════════════════════════════════
  const HERO_PHOTOS: string[] = [];
  const useCarousel = HERO_PHOTOS.length > 0;

  // ═══════════════════════════════════════════════════════════════════
  // SINGLE TRAINER PHOTO — simplest option
  // Drop one photo at /public/trainers/trainer-siva-reddy.jpg and set
  // this to true to show it. Takes priority over carousel fallback.
  // Set to null to fall back to silhouette placeholder.
  // ═══════════════════════════════════════════════════════════════════
  const SINGLE_TRAINER_PHOTO: string | null = '/trainers/trainer-siva-reddy.jpg';

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: -8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
      style={{ perspective: '1800px', perspectiveOrigin: '50% 50%' }}
    >
      <Link
        href="/book/siva-reddy"
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="group relative block rounded-[28px] overflow-hidden border bg-bg-card"
        style={{
          aspectRatio: '4/5.2',
          transform: `rotateX(${tilt.rotX}deg) rotateY(${tilt.rotY}deg) translateZ(${tilt.active ? 20 : 0}px)`,
          transformStyle: 'preserve-3d',
          transition: tilt.active
            ? 'transform 0.12s ease-out, box-shadow 0.3s ease, border-color 0.3s ease'
            : 'transform 0.8s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s ease, border-color 0.4s ease',
          borderColor: tilt.active ? 'rgba(198, 255, 61, 0.5)' : 'rgba(37, 42, 36, 1)',
          boxShadow: tilt.active
            ? '0 50px 100px -20px rgba(0,0,0,0.7), 0 0 60px rgba(198,255,61,0.3), 0 0 120px rgba(198,255,61,0.1)'
            : '0 20px 50px -20px rgba(0,0,0,0.6)',
          animation: 'pureX-ambient-glow 6s ease-in-out infinite',
        }}
      >
        {/* ═══ LAYER 1 — Photo with ambient animation ═══ */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            transform: `translateZ(${tilt.active ? -40 : 0}px)`,
            transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
            transformStyle: 'preserve-3d',
          }}
        >
          {SIVA_HERO_VIDEO ? (
            // ═══ VIDEO MODE — takes priority if configured ═══
            <div
              className="absolute inset-0"
              style={{
                animation: tilt.active
                  ? 'none'
                  : 'pureX-photo-breathe 14s ease-in-out infinite',
              }}
            >
              <AmbientVideo
                src={SIVA_HERO_VIDEO.src}
                poster={SIVA_HERO_VIDEO.poster ?? HERO_PHOTOS[0] ?? undefined}
                opacity={SIVA_HERO_VIDEO.opacity ?? 1}
                playbackRate={SIVA_HERO_VIDEO.playbackRate ?? 1}
                objectPosition={SIVA_HERO_VIDEO.objectPosition ?? 'center 15%'}
                desktopOnly={SIVA_HERO_VIDEO.desktopOnly ?? false}
              />
            </div>
          ) : SINGLE_TRAINER_PHOTO ? (
            // ═══ SINGLE PHOTO MODE — one photo with ambient breathing ═══
            <div
              className="absolute inset-0"
              style={{
                animation: tilt.active
                  ? 'none'
                  : 'pureX-photo-breathe 14s ease-in-out infinite',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={SINGLE_TRAINER_PHOTO}
                alt="Siva Reddy — PT Head, PURE X"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: 'center top' }}
              />
            </div>
          ) : useCarousel ? (
            <>
              {/* Photo carousel — crossfade between multiple photos */}
              <HeroPhotoCarousel
                photos={HERO_PHOTOS}
                alt="Siva Reddy — PT Head, PURE X"
                objectPosition="center 15%"
                durationMs={5000}
                fadeMs={1200}
              />

              {/* Floating dust motes over the photo carousel */}
              <div className="absolute inset-0 pointer-events-none z-10">
                <span
                  className="absolute rounded-full bg-accent/40"
                  style={{
                    width: '3px',
                    height: '3px',
                    top: '20%',
                    left: '30%',
                    animation: 'pureX-mote-1 9s ease-in-out infinite',
                    filter: 'blur(0.5px)',
                  }}
                />
                <span
                  className="absolute rounded-full bg-accent/30"
                  style={{
                    width: '2px',
                    height: '2px',
                    top: '60%',
                    left: '70%',
                    animation: 'pureX-mote-2 12s ease-in-out infinite',
                    filter: 'blur(0.5px)',
                  }}
                />
                <span
                  className="absolute rounded-full bg-white/30"
                  style={{
                    width: '2px',
                    height: '2px',
                    top: '40%',
                    left: '80%',
                    animation: 'pureX-mote-3 11s ease-in-out infinite',
                    filter: 'blur(0.8px)',
                  }}
                />
                <span
                  className="absolute rounded-full bg-accent/25"
                  style={{
                    width: '4px',
                    height: '4px',
                    top: '75%',
                    left: '20%',
                    animation: 'pureX-mote-1 13s ease-in-out infinite 2s',
                    filter: 'blur(1px)',
                  }}
                />
              </div>
            </>
          ) : (
            // Fallback
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(160deg, #2a3a1a 0%, #1a2014 50%, #0a0c09 100%)',
              }}
            >
              <svg viewBox="0 0 100 140" className="absolute inset-0 w-full h-full opacity-40">
                <defs>
                  <radialGradient id="siva-sil" cx="50%" cy="25%" r="60%">
                    <stop offset="0%" stopColor="#fff" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#000" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle cx="50" cy="35" r="13" fill="url(#siva-sil)" />
                <path
                  d="M28 55 Q50 48 72 55 L78 100 Q72 130 60 140 L40 140 Q28 130 22 100 Z"
                  fill="url(#siva-sil)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center px-6">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent/60 text-center leading-relaxed">
                  Drop photo at<br />/public/trainers/trainer-siva-reddy.jpg
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ═══ LAYER 2 — Dark gradient for readability ═══ */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(180deg, rgba(10,12,9,0.05) 0%, transparent 45%, rgba(10,12,9,0.35) 75%, rgba(10,12,9,0.92) 100%),
              radial-gradient(ellipse at 50% 105%, rgba(10,12,9,0.7), transparent 50%)
            `,
            transform: `translateZ(${tilt.active ? -5 : 0}px)`,
            transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />

        {/* ═══ LAYER 3 — Neon mouse-follow glow ═══ */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            opacity: tilt.active ? 1 : 0,
            background: `radial-gradient(circle 380px at ${tilt.glowX}% ${tilt.glowY}%, rgba(198,255,61,0.35), rgba(198,255,61,0.08) 45%, transparent 70%)`,
            mixBlendMode: 'screen',
            transform: 'translateZ(10px)',
          }}
        />

        {/* ═══ LAYER 4a — Corner accent top-right (pulses continuously) ═══ */}
        <div
          className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
          style={{
            background:
              'conic-gradient(from 270deg at 100% 0%, rgba(198,255,61,0.7), transparent 30%)',
            opacity: tilt.active ? 0.9 : 0.45,
            transition: 'opacity 0.4s ease',
            mixBlendMode: 'screen',
            transform: 'translateZ(8px)',
            animation: tilt.active ? 'none' : 'pureX-corner-pulse 4s ease-in-out infinite',
          }}
        />

        {/* ═══ LAYER 4b — Corner accent bottom-left ═══ */}
        <div
          className="absolute bottom-0 left-0 w-24 h-24 pointer-events-none"
          style={{
            background:
              'conic-gradient(from 90deg at 0% 100%, rgba(198,255,61,0.5), transparent 30%)',
            opacity: tilt.active ? 0.7 : 0.3,
            transition: 'opacity 0.4s ease',
            mixBlendMode: 'screen',
            transform: 'translateZ(8px)',
            animation: tilt.active ? 'none' : 'pureX-corner-pulse 4s ease-in-out infinite 2s',
          }}
        />

        {/* ═══ LAYER 5 — Top credentials tag ═══ */}
        {/* ═══ LAYER 5 — Top role tag ═══ */}
        <div
          className="absolute top-4 left-4 right-4 md:top-5 md:left-5 md:right-5 flex items-start justify-end gap-2"
          style={{
            transform: `translateZ(${tilt.active ? 30 : 15}px)`,
            transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <div className="inline-flex items-center bg-bg/60 backdrop-blur-md border border-border px-2 py-1 md:px-2.5 rounded-full flex-shrink-0">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted font-bold">
              PT Head
            </span>
          </div>
        </div>

        {/* ═══ LAYER 6 — Name, title, stats, CTA (furthest forward) ═══ */}
        <div
          className="absolute left-4 right-4 bottom-4 md:left-6 md:right-6 md:bottom-6"
          style={{
            transform: `translateZ(${tilt.active ? 60 : 30}px)`,
            transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <div className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.18em] text-accent font-bold mb-1.5">
            Siva Reddy · Head Coach
          </div>
          <h3
            className="font-display font-bold text-lg sm:text-xl md:text-2xl tracking-tight leading-[1.1] text-white mb-2"
            style={{ textShadow: '0 4px 30px rgba(0,0,0,0.7)' }}
          >
            Meet your <span className="text-accent">coach</span>.
          </h3>
          <p
            className="text-[11px] md:text-xs text-white/85 leading-snug mb-2.5 md:mb-3 max-w-[32ch]"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}
          >
            ICN Gold medalist. HYROX Pro Athlete. 300+ clients coached.
          </p>

          {/* Stat row — hide on smallest screens to save space */}
          <div className="hidden sm:flex gap-2 mb-3 flex-wrap">
            <StatChip num="HYROX" label="Pro Athlete" />
            <StatChip num="ICN" label="Gold" />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.18em] text-white/70 font-bold">
              Book session →
            </div>
            <div
              className={cn(
                'w-10 h-10 md:w-12 md:h-12 rounded-full border flex items-center justify-center transition-all duration-300',
                tilt.active
                  ? 'bg-accent border-accent text-bg scale-110'
                  : 'bg-bg/40 backdrop-blur-md border-white/30 text-white'
              )}
              style={{
                boxShadow: tilt.active ? '0 0 40px rgba(198,255,61,0.6)' : 'none',
              }}
            >
              <ArrowUpRight size={18} strokeWidth={2.5} className="md:hidden" />
              <ArrowUpRight size={20} strokeWidth={2.5} className="hidden md:block" />
            </div>
          </div>
        </div>

        {/* ═══ LAYER 7 — Inner highlight stroke ═══ */}
        <div
          className="absolute inset-0 rounded-[28px] pointer-events-none"
          style={{
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.3)',
            transform: 'translateZ(70px)',
          }}
        />
      </Link>
    </motion.div>
  );
}

function StatChip({ num, label }: { num: string; label: string }) {
  return (
    <div className="inline-flex items-baseline gap-1 bg-bg/50 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full">
      <span className="font-display font-bold text-sm text-accent leading-none">{num}</span>
      <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/70 font-bold">
        {label}
      </span>
    </div>
  );
}
