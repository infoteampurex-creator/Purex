import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getPersonalProgress, getMotherStrongConfig } from '@/lib/data/mother-strong';
import { MyProgressLookup } from '@/components/mother-strong/MyProgressLookup';
import { PersonalProgressView } from '@/components/mother-strong/PersonalProgressView';

export const metadata: Metadata = {
  title: 'My progress · PUREX Mother Strong',
  description:
    'Look up your personal PUREX Mother Strong progress — 60-day calendar, rank, streak, and total steps.',
};

export const dynamic = 'force-dynamic'; // Lookup is per-user; never cache.

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function MyProgressPage({ searchParams }: PageProps) {
  const { id } = await searchParams;
  const cleaned = id?.trim() ?? '';
  const hasQuery = cleaned.length > 0;

  const [progress, config] = await Promise.all([
    hasQuery ? getPersonalProgress(cleaned) : Promise.resolve(null),
    getMotherStrongConfig(),
  ]);

  // Distinguish "not yet looked up" from "looked up but not found" so we
  // can show a clear error to the second case.
  const notFound = hasQuery && progress === null;

  return (
    <main className="relative bg-bg text-text min-h-screen">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(198, 255, 61, 0.08) 0%, transparent 55%)',
        }}
      />

      <div className="relative container-safe pt-24 md:pt-28 pb-16">
        <Link
          href="/mother-strong"
          className="inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.16em] text-text-muted hover:text-accent transition-colors font-bold"
          style={{ minHeight: 44 }}
        >
          <ArrowLeft size={13} />
          Mother Strong
        </Link>

        <header className="mt-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-accent font-bold mb-5">
            <span className="w-4 h-px bg-accent" />
            Your progress
            <span className="w-4 h-px bg-accent" />
          </div>
          <h1 className="font-display font-semibold text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.05] mb-5">
            {progress
              ? `${firstName(progress.fullName)}'s 60-day window`
              : 'Find my progress'}
          </h1>
          {!progress && (
            <p
              className="text-text-muted leading-relaxed max-w-2xl"
              style={{ fontSize: 18 }}
            >
              Enter your PX-id (printed on your confirmation screen) or the
              10-digit WhatsApp number you registered with. We&apos;ll pull up
              your 60-day calendar.
            </p>
          )}
        </header>

        {/* Result or lookup */}
        <div className="mt-10 md:mt-12">
          {progress ? (
            <PersonalProgressView
              progress={progress}
              dailyGoal={config.dailyGoal}
              whatsappGroupLink={config.whatsappGroupLink}
            />
          ) : (
            <MyProgressLookup
              initialQuery={hasQuery ? cleaned : ''}
              notFound={notFound}
            />
          )}
        </div>
      </div>
    </main>
  );
}

function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] ?? 'Mother';
}
