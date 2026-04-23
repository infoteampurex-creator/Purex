'use client';

import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

/**
 * "In Action" gallery — 9 training intensity moments.
 *
 * Layout: uniform 3x3 grid. All photos are the same 3:4 portrait
 * aspect ratio — optimized for portrait photos as supplied by the user.
 *
 * ─────────── PHOTO NAMING CONVENTION ─────────────────────────────
 * Drop all 9 files at /public/in-action/ with these EXACT filenames:
 *
 *   in-action-01.jpg  ← top-left         (row 1, col 1)
 *   in-action-02.jpg  ← top-center       (row 1, col 2)
 *   in-action-03.jpg  ← top-right        (row 1, col 3)
 *   in-action-04.jpg  ← mid-left         (row 2, col 1)
 *   in-action-05.jpg  ← mid-center       (row 2, col 2)
 *   in-action-06.jpg  ← mid-right        (row 2, col 3)
 *   in-action-07.jpg  ← bottom-left      (row 3, col 1)
 *   in-action-08.jpg  ← bottom-center    (row 3, col 2)
 *   in-action-09.jpg  ← bottom-right     (row 3, col 3)
 *
 * SPECS per photo:
 *   • Aspect ratio: 3:4 portrait (e.g. 600×800, 900×1200, 750×1000)
 *   • Format: JPEG or WebP
 *   • Max 300KB each (compress with tinyjpg.com)
 * ─────────────────────────────────────────────────────────────────
 */

interface ActionPhoto {
  id: number;
  label: string;
  src: string;
  alt: string;
}

const PHOTOS: ActionPhoto[] = [
  { id: 1, label: 'Deadlift',      src: '/in-action/in-action-01.jpg', alt: 'Heavy deadlift lockout' },
  { id: 2, label: 'Zone 2',        src: '/in-action/in-action-02.jpg', alt: 'Steady state cardio' },
  { id: 3, label: 'Sled Push',     src: '/in-action/in-action-03.jpg', alt: 'HYROX sled push' },
  { id: 4, label: 'Mobility',      src: '/in-action/in-action-04.jpg', alt: 'Warm up mobility work' },
  { id: 5, label: 'Personal Best', src: '/in-action/in-action-05.jpg', alt: 'Hero action moment' },
  { id: 6, label: 'Clean & Jerk',  src: '/in-action/in-action-06.jpg', alt: 'Olympic lift' },
  { id: 7, label: 'Conditioning',  src: '/in-action/in-action-07.jpg', alt: 'Metcon session' },
  { id: 8, label: 'Sprint',        src: '/in-action/in-action-08.jpg', alt: 'Running sprint' },
  { id: 9, label: 'Recovery',      src: '/in-action/in-action-09.jpg', alt: 'Post-session recovery' },
];

export function InActionGallery() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Ambient radial glow behind */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(198, 255, 61, 0.04) 0%, transparent 60%)',
        }}
      />

      <div className="container-safe relative">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-end justify-between gap-8 mb-10 md:mb-14"
        >
          <div>
            <div className="inline-flex items-center gap-2 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.22em] text-accent font-bold mb-4">
              <Flame size={13} strokeWidth={2.5} />
              In Action
            </div>
            <h2 className="font-display font-semibold text-3xl md:text-5xl tracking-tight leading-[1.05] max-w-[20ch]">
              The work behind every transformation.
            </h2>
            <p className="mt-4 text-text-muted max-w-xl">
              Moments from real sessions — our athletes training, lifting, sweating, and
              recovering. No staged shoots, no stock imagery.
            </p>
          </div>

          <div className="hidden md:block flex-shrink-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
              <span className="text-accent font-bold">9</span> / moments captured
            </div>
          </div>
        </motion.div>

        {/* Uniform 3x3 grid for rectangular photos
            Mobile: 1 column (full width)
            Tablet: 2 columns
            Desktop: 3 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {PHOTOS.map((photo, idx) => (
            <PhotoTile key={photo.id} photo={photo} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PhotoTile({ photo, index }: { photo: ActionPhoto; index: number }) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        duration: 0.7,
        delay: Math.min(index * 0.06, 0.4),
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative group overflow-hidden rounded-xl md:rounded-2xl border border-border bg-bg-card aspect-[3/4]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.src}
        alt={photo.alt}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        onError={(e) => {
          // Hide broken image, fall back to gradient + label
          e.currentTarget.style.display = 'none';
        }}
      />

      {/* Dark fallback gradient (visible when image is missing/broken) */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(135deg, rgba(20, 24, 20, 0.95) 0%, rgba(10, 14, 10, 1) 100%)',
        }}
      />

      {/* Bottom vignette for label readability */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      {/* Label — bottom-left */}
      <figcaption className="absolute left-3 bottom-3 md:left-4 md:bottom-4">
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md backdrop-blur-sm"
          style={{
            background: 'rgba(10, 12, 9, 0.7)',
            border: '1px solid rgba(198, 255, 61, 0.25)',
          }}
        >
          <div className="w-1 h-1 rounded-full bg-accent" />
          <span className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.14em] text-accent font-bold">
            {photo.label}
          </span>
        </div>
      </figcaption>

      {/* Photo number badge — top-left, hover reveal */}
      <div
        className="absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center font-mono text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'rgba(198, 255, 61, 0.95)',
          color: '#0a0c09',
        }}
      >
        {String(photo.id).padStart(2, '0')}
      </div>
    </motion.figure>
  );
}
