import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { FALLBACK_TRANSFORMATIONS } from '@/lib/constants';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Pre-render a static page per transformation so each story is its own
 * indexable, shareable URL — e.g. /transformations/sravya-hormonal-balance.
 */
export function generateStaticParams() {
  return FALLBACK_TRANSFORMATIONS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const story = FALLBACK_TRANSFORMATIONS.find((t) => t.slug === slug);
  if (!story) return { title: 'Transformation · PURE X' };

  return {
    title: `${story.firstName}'s journey · PURE X`,
    description: story.headline,
    openGraph: {
      title: `${story.firstName}'s journey — ${story.goal}`,
      description: story.headline,
      images: [story.afterImageUrl],
    },
  };
}

export default async function TransformationStoryPage({ params }: PageProps) {
  const { slug } = await params;
  const story = FALLBACK_TRANSFORMATIONS.find((t) => t.slug === slug);
  if (!story) notFound();

  const currentIndex = FALLBACK_TRANSFORMATIONS.findIndex(
    (t) => t.slug === slug
  );
  const nextStory =
    FALLBACK_TRANSFORMATIONS[(currentIndex + 1) % FALLBACK_TRANSFORMATIONS.length];

  return (
    <main className="relative bg-bg text-text">
      {/* Back link */}
      <div className="container-safe pt-24 md:pt-28 pb-4">
        <Link
          href="/transformations"
          className="inline-flex items-center gap-2 text-xs text-text-muted hover:text-accent transition-colors font-mono uppercase tracking-[0.18em] font-bold"
        >
          <ArrowLeft size={12} />
          All transformations
        </Link>
      </div>

      {/* Hero — eyebrow + name + headline */}
      <section className="container-safe pt-2 pb-8 md:pb-12">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent font-bold mb-3">
          {story.goal} · {story.duration}
        </div>
        <h1 className="font-display font-semibold text-4xl md:text-6xl tracking-tight leading-[1.05] mb-5">
          {story.firstName}&rsquo;s journey
        </h1>
        <p className="font-display italic text-xl md:text-2xl text-text-muted leading-relaxed max-w-3xl border-l-2 border-accent/40 pl-5">
          &ldquo;{story.headline}&rdquo;
        </p>
      </section>

      {/* Photos + story.
          At lg+ the photos sit in a column on the left and the story
          reads alongside on the right (case-study style). Below lg they
          stack — photos first, then prose. */}
      <section className="container-safe pb-16 md:pb-24">
        <div className="grid lg:grid-cols-[5fr_6fr] gap-8 lg:gap-12 items-start">
          {/* Photos column */}
          <div className="lg:sticky lg:top-24 space-y-4">
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

          {/* Story column */}
          <article className="space-y-6 text-base md:text-[17px] text-text leading-[1.75]">
            {story.story.map((para, i) => (
              <p key={i}>{para}</p>
            ))}

            {/* CTA */}
            <div className="mt-12 pt-8 border-t border-border-soft flex items-center justify-between gap-4 flex-wrap">
              <p className="text-sm text-text-muted m-0">
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
          </article>
        </div>
      </section>

      {/* Next story */}
      <section className="border-t border-border-soft bg-bg-card/40">
        <div className="container-safe py-12 md:py-16">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted font-bold mb-3">
            Next story
          </div>
          <Link
            href={`/transformations/${nextStory.slug}`}
            className="group inline-flex items-center gap-4 flex-wrap"
          >
            <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
              <Image
                src={nextStory.afterImageUrl}
                alt={nextStory.firstName}
                fill
                sizes="80px"
                className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div>
              <div className="font-display font-semibold text-2xl tracking-tight group-hover:text-accent transition-colors">
                {nextStory.firstName}&rsquo;s journey
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold mt-1">
                {nextStory.goal}
              </div>
            </div>
            <ArrowRight
              size={18}
              className="text-text-muted group-hover:text-accent group-hover:translate-x-1 transition-all"
            />
          </Link>
        </div>
      </section>
    </main>
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
        priority
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
