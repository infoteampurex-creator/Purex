'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import { FALLBACK_TRANSFORMATIONS, type Transformation } from '@/lib/constants';

const SLUGS = new Set<string>(FALLBACK_TRANSFORMATIONS.map((t) => t.slug));

/**
 * Inline transformation-story panel that reacts to the URL hash.
 *
 * Mounted once on /transformations under the gallery. When the hash
 * matches a transformation slug — e.g. /transformations#sravya-hormonal-balance
 * — the panel expands with that story's photos + prose. Clicking
 * another card on the page updates the hash → the panel swaps content
 * without a full route transition. Clicking the close button clears
 * the hash.
 *
 * Direct visits with a hash (e.g. shared social link) auto-open the
 * matching story on mount and scroll it into view.
 */
export function TransformationStoryViewer() {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Read & subscribe to the URL hash.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const applyHash = (smooth: boolean) => {
      const raw = window.location.hash.replace(/^#/, '');
      const slug = SLUGS.has(raw) ? raw : null;
      setOpenSlug(slug);
      if (slug) {
        // Wait a tick for the panel to render before scrolling.
        requestAnimationFrame(() => {
          panelRef.current?.scrollIntoView({
            behavior: smooth ? 'smooth' : 'auto',
            block: 'start',
          });
        });
      }
    };

    // Initial — jump to position without smooth-scroll so deep-links don't feel jerky.
    applyHash(false);

    const onHashChange = () => applyHash(true);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const close = () => {
    setOpenSlug(null);
    // Clear the hash without a router transition so the page state stays.
    if (typeof window !== 'undefined') {
      window.history.replaceState(
        null,
        '',
        window.location.pathname + window.location.search
      );
    }
  };

  const story = openSlug
    ? FALLBACK_TRANSFORMATIONS.find((t) => t.slug === openSlug)
    : null;

  return (
    <section
      ref={panelRef}
      aria-live="polite"
      className="scroll-mt-24"
    >
      <AnimatePresence initial={false} mode="wait">
        {story && (
          <motion.div
            key={story.slug}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="container-safe pb-20 md:pb-28"
          >
            <StoryPanel story={story} onClose={close} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ─── Panel layout ──────────────────────────────────────────────────

function StoryPanel({
  story,
  onClose,
}: {
  story: Transformation;
  onClose: () => void;
}) {
  return (
    <div className="relative rounded-2xl border border-border bg-bg-card overflow-hidden">
      {/* Close button — pinned, always visible on small screens too */}
      <button
        onClick={onClose}
        aria-label="Close story"
        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-bg/90 backdrop-blur-sm border border-border-soft flex items-center justify-center text-text-muted hover:text-accent hover:border-accent/40 transition-all"
      >
        <X size={16} strokeWidth={2.5} />
      </button>

      <div className="p-5 md:p-10">
        {/* Hero */}
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent font-bold mb-3">
          {story.goal} · {story.duration}
        </div>
        <h2 className="font-display font-semibold text-3xl md:text-5xl tracking-tight leading-[1.05] mb-4">
          {story.firstName}&rsquo;s journey
        </h2>
        <p className="font-display italic text-lg md:text-2xl text-text-muted leading-relaxed border-l-2 border-accent/40 pl-5 max-w-3xl">
          &ldquo;{story.headline}&rdquo;
        </p>

        {/* Photos + story.
            lg+: photos in a sticky left column, story scrolls on the right.
            Below lg: photos stack first, then story. */}
        <div className="mt-8 md:mt-12 grid lg:grid-cols-[5fr_6fr] gap-8 lg:gap-12 items-start">
          {/* Photos */}
          <div className="space-y-4">
            <PhotoPanel
              src={story.beforeImageUrl}
              alt={`${story.firstName} before`}
              label="Before"
              labelStyle="muted"
            />
            <PhotoPanel
              src={story.afterImageUrl}
              alt={`${story.firstName} after`}
              label="After"
              labelStyle="accent"
            />
          </div>

          {/* Prose */}
          <article className="space-y-5 text-base md:text-[17px] text-text leading-[1.75]">
            {story.story.map((para, i) => (
              <p key={i}>{para}</p>
            ))}

            <div className="mt-10 pt-6 border-t border-border-soft flex items-center justify-between gap-4 flex-wrap">
              <p className="text-sm text-text-muted m-0">
                Inspired? Your transformation starts with a conversation.
              </p>
              <a
                href="/book"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-bg font-semibold text-sm hover:bg-accent-hover transition-colors"
              >
                Start now
                <ArrowRight size={14} strokeWidth={2.5} />
              </a>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

function PhotoPanel({
  src,
  alt,
  label,
  labelStyle,
}: {
  src: string;
  alt: string;
  label: string;
  labelStyle: 'muted' | 'accent';
}) {
  return (
    <div className="relative aspect-[4/5] md:aspect-[3/4] overflow-hidden rounded-xl bg-bg-inset">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 40vw, 100vw"
        className="object-cover object-top"
        // Two unrelated issues, one combined fix:
        //   1. The panel mounts inside AnimatePresence + motion.div
        //      whose `transform` can suppress the lazy-load
        //      intersection observer → use `priority` to skip lazy.
        //   2. Vercel's image optimizer occasionally times out on
        //      cold-start for fresh deploys, leaving every photo
        //      stuck on a broken placeholder → `unoptimized` serves
        //      the file straight from /public.
        // The transformation JPGs are already reasonably sized, so
        // bypassing optimization here costs us nothing.
        priority
        unoptimized
      />
      <div
        className={
          labelStyle === 'accent'
            ? 'absolute top-3 right-3 px-3 py-1 rounded-md bg-accent text-bg font-mono text-[10px] uppercase tracking-[0.18em] font-bold'
            : 'absolute top-3 left-3 px-3 py-1 rounded-md bg-bg/85 backdrop-blur-sm font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold'
        }
      >
        {label}
      </div>
    </div>
  );
}
