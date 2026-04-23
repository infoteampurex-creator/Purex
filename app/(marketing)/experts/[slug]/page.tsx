import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { ArrowLeft, ArrowRight, MapPin, Award, CheckCircle2, Sparkles } from 'lucide-react';
import { FALLBACK_EXPERTS } from '@/lib/constants';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return FALLBACK_EXPERTS.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const expert = FALLBACK_EXPERTS.find((e) => e.slug === slug);
  if (!expert) return { title: 'Expert not found · PURE X' };
  return {
    title: `${expert.name} · ${expert.title} · PURE X`,
    description: expert.bioShort,
  };
}

export default async function ExpertProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const expert = FALLBACK_EXPERTS.find((e) => e.slug === slug);
  if (!expert) notFound();

  return (
    <main className="relative bg-bg text-text">
      {/* ─── Hero ────────────────────────────────────────── */}
      <section className="relative pt-28 md:pt-32 pb-12 md:pb-16 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 20% 0%, rgba(198, 255, 61, 0.08) 0%, transparent 55%)',
          }}
        />

        <div className="container-safe relative">
          {/* Back link */}
          <Link
            href="/experts"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted hover:text-accent transition-colors mb-8 md:mb-10"
          >
            <ArrowLeft size={12} />
            All experts
          </Link>

          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8 lg:gap-14 items-start">
            {/* Left: Photo */}
            <div className="relative">
              <div
                className="relative overflow-hidden rounded-2xl border border-border bg-bg-card"
                style={{ aspectRatio: '4/5' }}
              >
                {expert.photoUrl ? (
                  <Image
                    src={expert.photoUrl}
                    alt={expert.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover object-[center_top]"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          'radial-gradient(ellipse at 50% 30%, rgba(198,255,61,0.15) 0%, #0f1410 60%, #0a0c09 100%)',
                      }}
                    />
                    <span className="relative font-display font-black text-7xl text-white/80">
                      {expert.name
                        .split(' ')
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join('')}
                    </span>
                  </div>
                )}

                {/* Gradient for tag readability */}
                <div
                  aria-hidden
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(10,12,9,0.3) 0%, transparent 40%, transparent 70%, rgba(10,12,9,0.85) 100%)',
                  }}
                />

                {/* Role tag */}
                <div className="absolute top-4 right-4 z-10">
                  <span className="inline-flex items-center bg-bg/70 backdrop-blur-xl border border-accent/40 text-accent px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-[0.16em] font-bold">
                    {expert.shortRole}
                  </span>
                </div>

                {/* Location pin */}
                <div className="absolute bottom-4 left-4 z-10 inline-flex items-center gap-1.5 bg-bg/70 backdrop-blur-xl border border-white/20 text-white px-3 py-1.5 rounded-full">
                  <MapPin size={11} strokeWidth={2} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] font-bold">
                    {expert.location}
                  </span>
                </div>
              </div>

              {/* Stat chips */}
              <div className="grid grid-cols-2 gap-2.5 mt-4">
                <StatChip num={expert.stat.num} label={expert.stat.label} />
                {expert.yearsExperience && (
                  <StatChip num={`${expert.yearsExperience}+`} label="Years experience" />
                )}
              </div>
            </div>

            {/* Right: Name + short bio */}
            <div>
              <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-4">
                <span className="w-3 h-px bg-accent" />
                {expert.title}
              </div>
              <h1 className="font-display font-semibold text-4xl md:text-6xl tracking-tight leading-[1.02] mb-5">
                {expert.name}
              </h1>
              <p className="text-lg md:text-xl text-text-muted leading-relaxed mb-8">
                {expert.bioShort}
              </p>

              {/* Credentials as pills */}
              <div className="mb-8">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold mb-3 flex items-center gap-2">
                  <Award size={12} />
                  Credentials
                </div>
                <div className="flex flex-wrap gap-2">
                  {expert.credentials.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center px-3 py-1.5 rounded-full bg-bg-card border border-border-soft text-xs text-text-muted font-medium"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Specialisms as pills */}
              <div className="mb-8">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold mb-3 flex items-center gap-2">
                  <Sparkles size={12} />
                  Specialisms
                </div>
                <div className="flex flex-wrap gap-2">
                  {expert.specialisms.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center px-3 py-1.5 rounded-full bg-accent/8 border border-accent/25 text-accent text-xs font-mono font-bold uppercase tracking-[0.08em]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/book"
                  className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-accent text-bg font-semibold text-sm hover:bg-accent-hover transition-colors"
                >
                  Book a session with {expert.name.split(' ')[0]}
                  <ArrowRight size={14} />
                </Link>
                <Link
                  href="/experts"
                  className="inline-flex items-center gap-2 h-11 px-5 rounded-full border border-border text-text-muted hover:border-accent/40 hover:text-text transition-colors text-sm"
                >
                  Browse all experts
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Full bio ─────────────────────────────────────── */}
      {expert.bioLong && expert.bioLong.length > 0 && (
        <section className="relative py-12 md:py-20 border-t border-border-soft">
          <div className="container-safe">
            <div className="grid lg:grid-cols-[0.3fr_0.7fr] gap-8 lg:gap-16">
              <div className="lg:sticky lg:top-28">
                <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-3">
                  <span className="w-3 h-px bg-accent" />
                  Background
                </div>
                <h2 className="font-display font-semibold text-2xl md:text-3xl tracking-tight leading-[1.1]">
                  The full story.
                </h2>
              </div>

              <div className="prose-custom space-y-5 text-[16px] leading-[1.75] text-text-muted max-w-2xl">
                {expert.bioLong.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── Responsibilities ─────────────────────────────── */}
      {expert.responsibilities && expert.responsibilities.length > 0 && (
        <section className="relative py-12 md:py-20 border-t border-border-soft bg-bg-card/40">
          <div className="container-safe">
            <div className="mb-8 md:mb-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-3">
                <span className="w-3 h-px bg-accent" />
                Core responsibilities
              </div>
              <h2 className="font-display font-semibold text-2xl md:text-3xl tracking-tight leading-[1.1]">
                What {expert.name.split(' ')[0]} does at PURE X.
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-3 md:gap-4 max-w-5xl">
              {expert.responsibilities.map((r, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 md:p-5 rounded-xl bg-bg-card border border-border hover:border-accent/30 transition-colors"
                >
                  <CheckCircle2
                    size={17}
                    strokeWidth={2}
                    className="text-accent flex-shrink-0 mt-0.5"
                  />
                  <p className="text-sm text-text-muted leading-relaxed">{r}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA ──────────────────────────────────────────── */}
      <section className="relative py-16 md:py-20 border-t border-border-soft">
        <div className="container-safe">
          <div className="rounded-3xl bg-bg-card border border-accent/30 p-8 md:p-12 text-center relative overflow-hidden">
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 100%, rgba(198, 255, 61, 0.12) 0%, transparent 60%)',
              }}
            />
            <div className="relative">
              <h3 className="font-display font-semibold text-2xl md:text-4xl tracking-tight leading-[1.05] mb-3 max-w-xl mx-auto">
                Ready to work with {expert.name.split(' ')[0]}?
              </h3>
              <p className="text-text-muted mb-7 max-w-md mx-auto">
                Book a consultation and start your transformation with the right expert.
              </p>
              <Link
                href="/book"
                className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-accent text-bg font-semibold hover:bg-accent-hover transition-colors"
              >
                Book a Consultation
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatChip({ num, label }: { num: string; label: string }) {
  return (
    <div className="rounded-xl bg-bg-card border border-border p-3 text-center">
      <div className="font-display font-bold text-xl text-accent leading-none">{num}</div>
      <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted mt-1.5">
        {label}
      </div>
    </div>
  );
}
