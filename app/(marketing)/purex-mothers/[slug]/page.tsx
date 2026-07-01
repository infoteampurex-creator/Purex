import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MothersPageView } from '@/components/purex-mothers/MothersPageView';
import { mothersFontClasses } from '@/components/purex-mothers/fonts';
import {
  findMotherBySlug,
  PUREX_MOTHERS,
  PUREX_MOTHERS_META,
} from '@/lib/data/purex-mothers';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Prebuild one static page per mother so the SSG cache is warm. */
export function generateStaticParams() {
  return PUREX_MOTHERS.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const mother = findMotherBySlug(slug);
  if (!mother) {
    return { title: 'PURE X Mothers — 60 Days of Strength' };
  }
  const title = `${mother.name} · ${mother.title} — PURE X Mothers`;
  const description = `${mother.name} completed 60 Days of Strength with ${PUREX_MOTHERS_META.brand}. Trainer: ${PUREX_MOTHERS_META.trainerName}.`;
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
  };
}

export default async function PureXMotherPage({ params }: PageProps) {
  const { slug } = await params;
  const mother = findMotherBySlug(slug);
  if (!mother) notFound();
  return (
    <div className={mothersFontClasses}>
      <MothersPageView initialMother={mother} />
    </div>
  );
}
