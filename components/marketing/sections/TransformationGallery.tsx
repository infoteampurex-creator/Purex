'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowUpRight, X } from 'lucide-react';
import { FALLBACK_TRANSFORMATIONS, type Transformation } from '@/lib/constants';

/**
 * Transformations gallery.
 *
 * Card layout: side-by-side BEFORE / AFTER photos, first name + CTA below.
 * Click a card → full-screen modal with the complete transformation journey.
 *
 * Mounted on the homepage and on /transformations.
 */
export function TransformationGallery() {
  const [selected, setSelected] = useState<Transformation | null>(null);

  // Esc to dismiss + scroll lock while modal is open
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [selected]);

  return (
    <section id="transformations" className="py-20 md:py-28 bg-bg">
      <div className="container-safe">
        {/* Header */}
        <div className="max-w-3xl mb-12 md:mb-16">
          <span className="eyebrow">Transformations</span>
          <h2 className="mt-3 font-display font-semibold text-display-lg tracking-tight">
            Real journeys.{' '}
            <span className="text-accent">Sustainable change.</span>
          </h2>
          <p className="mt-4 text-base text-text-muted leading-relaxed">
            Five people. Five very different lives. One thing in common — they
            stopped chasing quick fixes and started building systems that lasted.
          </p>
        </div>

        {/* Grid — 1 col mobile, 2 col tablet, 3 col desktop */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {FALLBACK_TRANSFORMATIONS.map((story) => (
            <TransformationCard
              key={story.slug}
              story={story}
              onClick={() => setSelected(story)}
            />
          ))}
        </div>

        {/* CTA below */}
        <div className="mt-12 md:mt-16 text-center">
          <Link
            href="/book"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-bg font-semibold text-sm hover:bg-accent-hover transition-colors"
          >
            Start your own transformation
            <ArrowRight size={14} strokeWidth={2.5} />
          </Link>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selected && (
          <TransformationModal
            story={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

// ─── CARD ──────────────────────────────────────────────────────────

function TransformationCard({
  story,
  onClick,
}: {
  story: Transformation;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col rounded-xl overflow-hidden bg-bg-card border border-border hover:border-accent/40 transition-all duration-500 text-left"
    >
      {/* Side-by-side photos */}
      <div className="grid grid-cols-2 aspect-[1/1] relative overflow-hidden">
        {/* BEFORE */}
        <div className="relative overflow-hidden">
          <Image
            src={story.beforeImageUrl}
            alt={`${story.firstName} before`}
            fill
            sizes="(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 50vw"
            className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-bg/80 backdrop-blur-sm font-mono text-[9px] uppercase tracking-[0.18em] text-text-muted font-bold">
            Before
          </div>
        </div>

        {/* Divider line */}
        <div
          aria-hidden
          className="absolute top-0 bottom-0 left-1/2 w-px bg-gradient-to-b from-transparent via-accent/40 to-transparent z-10"
        />

        {/* AFTER */}
        <div className="relative overflow-hidden">
          <Image
            src={story.afterImageUrl}
            alt={`${story.firstName} after`}
            fill
            sizes="(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 50vw"
            className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-accent text-bg font-mono text-[9px] uppercase tracking-[0.18em] font-bold">
            After
          </div>
        </div>
      </div>

      {/* Footer with name + CTA */}
      <div className="p-5 md:p-6">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-2xl tracking-tight leading-none">
              {story.firstName}
            </h3>
            <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-accent font-bold truncate">
              {story.goal}
            </div>
          </div>
          <div className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.18em] text-text-muted font-bold group-hover:text-accent transition-colors flex-shrink-0">
            Read journey
            <ArrowUpRight size={11} strokeWidth={2.5} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── MODAL ─────────────────────────────────────────────────────────

function TransformationModal({
  story,
  onClose,
}: {
  story: Transformation;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-start md:items-center justify-center p-0 md:p-6 overflow-y-auto"
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl bg-bg-card border-y md:border md:rounded-2xl border-border shadow-2xl my-0 md:my-8 overflow-hidden"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-bg/90 backdrop-blur-sm border border-border-soft flex items-center justify-center hover:bg-bg-elevated hover:border-accent/40 transition-all"
        >
          <X size={16} strokeWidth={2.5} />
        </button>

        {/* Photos — stack on narrow viewports, side-by-side once there's
            room for both portraits to read clearly. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 sm:aspect-[16/9] md:aspect-[2/1] relative bg-bg-inset">
          <div className="relative overflow-hidden aspect-[4/5] sm:aspect-auto">
            <Image
              src={story.beforeImageUrl}
              alt={`${story.firstName} before`}
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover object-top"
              priority
            />
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-bg/85 backdrop-blur-sm font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold">
              Before
            </div>
          </div>
          <div
            aria-hidden
            className="hidden sm:block absolute top-0 bottom-0 left-1/2 w-px bg-gradient-to-b from-transparent via-accent/50 to-transparent z-10"
          />
          <div className="relative overflow-hidden aspect-[4/5] sm:aspect-auto">
            <Image
              src={story.afterImageUrl}
              alt={`${story.firstName} after`}
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover object-top"
              priority
            />
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-accent text-bg font-mono text-[10px] uppercase tracking-[0.18em] font-bold">
              After
            </div>
          </div>
        </div>

        {/* Content — let the page-level scroll handle long text rather
            than the inner div on small screens, and let prose use the
            full card width instead of capping at max-w-2xl. */}
        <div className="p-6 md:p-10">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-3">
            {story.goal} · {story.duration}
          </div>

          <h2 className="font-display font-semibold text-2xl md:text-4xl tracking-tight leading-[1.15] mb-6">
            {story.firstName}&rsquo;s journey
          </h2>

          <p className="font-display italic text-lg md:text-xl text-text-muted leading-relaxed mb-8 pl-4 border-l-2 border-accent/40">
            &ldquo;{story.headline}&rdquo;
          </p>

          {/* Story paragraphs */}
          <div className="space-y-5 text-base md:text-[17px] text-text leading-[1.7]">
            {story.story.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {/* Footer CTA */}
          <div className="mt-10 pt-6 border-t border-border-soft flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-text-muted">
              Inspired? Your transformation starts with a conversation.
            </p>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-bg font-semibold text-sm hover:bg-accent-hover transition-colors"
            >
              Start now
              <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
