import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { FALLBACK_TRANSFORMATIONS, type Transformation } from '@/lib/constants';

/**
 * Transformations gallery — grid of teaser cards.
 *
 * Each card is a link to /transformations#{slug}. On the
 * /transformations page itself, the <TransformationStoryViewer />
 * sits below this gallery and renders the story matching the URL
 * hash inline. On the homepage, clicking a card navigates to the
 * /transformations page with the hash, which auto-opens the story
 * on arrival.
 *
 * No modal, no per-story route. The hash is the single source of
 * truth for "which story is open."
 */
export function TransformationGallery() {
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

        {/* Grid of cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {FALLBACK_TRANSFORMATIONS.map((story) => (
            <TransformationCard key={story.slug} story={story} />
          ))}
        </div>

        {/* Outro CTA */}
        <div className="mt-14 md:mt-20 flex items-center justify-center">
          <Link
            href="/book"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-bg font-semibold text-sm hover:bg-accent-hover transition-colors"
          >
            Start your journey
            <ArrowRight size={14} strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── CARD ──────────────────────────────────────────────────────────

function TransformationCard({ story }: { story: Transformation }) {
  return (
    <a
      // Use a regular <a> rather than next/link so on /transformations
      // the click triggers a hashchange (picked up by StoryViewer)
      // rather than a route transition. On the homepage it navigates
      // to /transformations and arrives with the hash already set.
      href={`/transformations#${story.slug}`}
      className="group relative flex flex-col rounded-xl overflow-hidden bg-bg-card border border-border hover:border-accent/40 transition-all duration-500 scroll-mt-24"
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
            unoptimized
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
            <ArrowUpRight
              size={11}
              strokeWidth={2.5}
              className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </div>
        </div>
      </div>
    </a>
  );
}
