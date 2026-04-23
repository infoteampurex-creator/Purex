import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Users,
  Trophy,
  Flame,
  Stethoscope,
  Activity,
  Brain,
  MessageSquare,
  Target,
} from 'lucide-react';
import { FALLBACK_PROGRAMS, FALLBACK_EXPERTS, whatsappLink } from '@/lib/constants';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// ─── Per-program editorial content ────────────────────────────────────
// Extra details (beyond the base inclusions in constants) that bring the
// plan to life — who it's for, what happens in a typical week, and the
// differentiator vs adjacent tiers.
const PROGRAM_DETAILS: Record<
  string,
  {
    heroTagline: string;
    whoFor: string[];
    whatYouGet: { icon: any; label: string; description: string }[];
    weeklyRhythm: string[];
    differentiator: string;
    recommendedFor: string;
  }
> = {
  'pure-foundation': {
    heroTagline:
      'The entry point. A structured first step before you commit to anything bigger.',
    whoFor: [
      'You\'re curious about PURE X but not ready for a multi-month programme',
      'You need a clear plan — not a free YouTube video mix',
      'You want professional guidance at a price that doesn\'t hurt',
    ],
    whatYouGet: [
      {
        icon: Target,
        label: 'Client Profiling',
        description:
          'A deep-dive conversation covering your goals, lifestyle, work, sleep, and health baseline.',
      },
      {
        icon: Activity,
        label: 'Personalised Workout Plan',
        description:
          'Built around your schedule, experience level, and equipment access. No generic templates.',
      },
      {
        icon: Sparkles,
        label: 'Diet Guidance',
        description:
          'Realistic nutrition starting points — what to eat, what to avoid, daily water and sleep targets.',
      },
      {
        icon: MessageSquare,
        label: '1 Progress Call',
        description:
          'A follow-up call 30 days in to review progress and decide next steps.',
      },
    ],
    weeklyRhythm: [
      'Day 1 — Onboarding call + profile completed',
      'Week 1 — Receive your custom plan via WhatsApp',
      'Weeks 1-4 — Follow the plan, track weight daily',
      'Day 30 — Progress call + decide whether to upgrade',
    ],
    differentiator:
      'Foundation is a one-time payment. It\'s not a subscription — it\'s a starting line.',
    recommendedFor:
      'Perfect as a 4-week trial before committing to Core or Elite.',
  },
  'pure-core': {
    heroTagline:
      'The transformation system. Full integration — training, medical, physio, mental health, and community.',
    whoFor: [
      'You want sustainable transformation, not a 30-day detox',
      'You need accountability built into your routine, not willpower',
      'You want professional guidance across fitness, nutrition, and recovery',
    ],
    whatYouGet: [
      {
        icon: Target,
        label: 'Everything in Foundation',
        description:
          'Your profile, personalised plan, water and sleep targets — plus all of Core\'s integrations layered on top.',
      },
      {
        icon: Stethoscope,
        label: 'Doctor Consultation',
        description:
          'Monthly check-in with Chandralekha, our Consultant Doctor. Blood work reviewed, health markers tracked.',
      },
      {
        icon: Activity,
        label: 'Physiotherapy Assessment',
        description:
          'Krishna screens your movement patterns and prescribes corrective work integrated into your training.',
      },
      {
        icon: Sparkles,
        label: 'Full App Tracking',
        description:
          'Steps, meals, water, sleep, mood — synced to your coach, visible in real time. No more Excel spreadsheets.',
      },
      {
        icon: Flame,
        label: 'Streak System',
        description:
          'Daily streaks reward consistency. Miss a day and your coach knows — intervention happens before habits slip.',
      },
      {
        icon: Brain,
        label: 'AI Chat Support',
        description:
          'Quick questions answered 24/7. When it\'s serious, it escalates to a real coach.',
      },
      {
        icon: MessageSquare,
        label: 'Weekly Progress Calls',
        description:
          'A 30-minute call every week with your assigned coach. Plan, reflect, adjust, repeat.',
      },
      {
        icon: Trophy,
        label: 'Challenges & Competitions',
        description:
          'Monthly micro-challenges inside the community keep momentum up. Leaderboards, not loneliness.',
      },
    ],
    weeklyRhythm: [
      'Monday — Week plan sent by coach, targets set',
      'Wednesday — Mid-week adherence check-in via WhatsApp',
      'Friday — Nutrition review + weekend game plan',
      'Sunday — Weekly progress call (30 min)',
    ],
    differentiator:
      'Core is where the integrated team delivers — doctor, physio, and coach all reading from your real-time data.',
    recommendedFor:
      'The most popular plan. Ideal for serious transformation without needing 1-on-1 in-person training.',
  },
  'pure-elite': {
    heroTagline:
      'Premium performance. 1-on-1 coaching, outdoor training, race prep, and the full PURE X inner circle.',
    whoFor: [
      'You\'re training for HYROX, IRONMAN, a marathon, or another event',
      'You want 1-on-1 in-person sessions, not just online plans',
      'You want direct weekly access to every specialist on the team',
    ],
    whatYouGet: [
      {
        icon: Target,
        label: 'Everything in Core',
        description:
          'Full app tracking, weekly calls, doctor and physio consultations, streaks, and AI support.',
      },
      {
        icon: Activity,
        label: '1-on-1 Performance Training',
        description:
          'In-person sessions with Siva Reddy (Hyderabad) or Paula Konasionok (London). Technique, progression, intensity.',
      },
      {
        icon: Flame,
        label: 'HYROX / Ironman / Marathon Prep',
        description:
          'Sport-specific training cycles. Pacing strategies. Race-day protocols. Built for competition readiness.',
      },
      {
        icon: Sparkles,
        label: 'Weekly Outdoor Sessions',
        description:
          'Running, sled work, functional circuits — training that happens outside, where real athletes train.',
      },
      {
        icon: Users,
        label: 'PURE X Club Access',
        description:
          'The inner-circle community. Exclusive events, client-only meetups, athlete Q&As with the founders.',
      },
      {
        icon: MessageSquare,
        label: 'Weekly Expert Access',
        description:
          'Direct weekly time with Doctor, Physio, and Mental Health Consultant. Not a shared inbox — your hour.',
      },
      {
        icon: Stethoscope,
        label: 'Advanced Performance Tracking',
        description:
          'HRV, VO₂ max estimates, recovery markers. Data that elite athletes track — now tracking you.',
      },
      {
        icon: Trophy,
        label: 'Competition Readiness',
        description:
          'Race-day preparation with Siva Jampana (HYROX Pro Doubles). Taper protocols. Equipment check. Mental prep.',
      },
    ],
    weeklyRhythm: [
      'Monday — 1-on-1 strength session (90 min)',
      'Tuesday — Outdoor conditioning (70 min)',
      'Wednesday — Recovery + physio check-in (60 min)',
      'Thursday — 1-on-1 skill work (60 min)',
      'Friday — Long session (90 min)',
      'Saturday — Optional brick session or rest',
      'Sunday — Progress review + mental health session',
    ],
    differentiator:
      'Elite is where the PURE X team works at full intensity. 1-on-1 attention, in-person coaching, and race-specific periodisation.',
    recommendedFor:
      'Athletes with a target event. Serious transformation seekers who can commit to 4+ sessions per week.',
  },
  'elite-couple': {
    heroTagline:
      'Two athletes. One plan. Built for couples who want to train together and win together.',
    whoFor: [
      'You\'re a couple training for HYROX Doubles or a shared fitness goal',
      'You want joint programming that respects individual starting points',
      'You believe partners who train together, stay together — literally',
    ],
    whatYouGet: [
      {
        icon: Users,
        label: 'Joint Training Sessions (3-4/week)',
        description:
          'Structured sessions built for two. Paired movements, shared cardio, individual strength tracks within the same block.',
      },
      {
        icon: Stethoscope,
        label: 'Individual Physio & Doctor',
        description:
          'Each partner gets their own physio assessment and medical consultation. Couples plan — individual care.',
      },
      {
        icon: Sparkles,
        label: 'Combined Nutrition Plan',
        description:
          'One kitchen, two plates. Meal plans designed to work together — shared protein targets, separate calorie needs.',
      },
      {
        icon: Trophy,
        label: 'HYROX Doubles Race Prep',
        description:
          'Transition training. Pacing together. Race-day strategy — the thing most couples forget to train.',
      },
      {
        icon: MessageSquare,
        label: '24hr Coach Access for Both',
        description:
          'Both partners have direct coach access. Two WhatsApp threads, one coordinated programme.',
      },
      {
        icon: Target,
        label: 'Monthly Couples Review',
        description:
          'A joint monthly review with your coach covering individual progress, joint goals, and relationship-level wins.',
      },
      {
        icon: Activity,
        label: 'Shared Progress Tracking',
        description:
          'Dashboard view of both partners\' streaks, scores, and milestones — a healthy kind of couple\'s competition.',
      },
      {
        icon: Flame,
        label: 'Community Events Access',
        description:
          'Couples-only events. Meet other PURE X pairs. Race together at competitions.',
      },
    ],
    weeklyRhythm: [
      'Mon / Wed / Fri — Joint training session (60-75 min)',
      'Tuesday — Individual tracks (each partner trains solo)',
      'Thursday — Optional skill work or rest',
      'Saturday — Long outdoor session or brick',
      'Sunday — Joint progress call (45 min)',
    ],
    differentiator:
      'Elite Couple is the only fitness programme in India designed specifically for two committed people training as one unit.',
    recommendedFor:
      'Committed couples with shared goals. HYROX Doubles competitors. Partners who transform together.',
  },
};

// ─── Next.js dynamic route boilerplate ───────────────────────────────
export async function generateStaticParams() {
  return FALLBACK_PROGRAMS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const program = FALLBACK_PROGRAMS.find((p) => p.slug === slug);
  if (!program) return { title: 'Plan not found · PURE X' };
  return {
    title: `${program.name} · ${program.priceDisplay}${program.priceSuffix} · PURE X`,
    description: program.description,
  };
}

// ─── Page component ─────────────────────────────────────────────────
export default async function ProgramDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const program = FALLBACK_PROGRAMS.find((p) => p.slug === slug);
  if (!program) notFound();

  const details = PROGRAM_DETAILS[slug];
  const otherPrograms = FALLBACK_PROGRAMS.filter((p) => p.slug !== slug);

  return (
    <main className="relative bg-bg text-text">
      {/* ─── Hero ──────────────────────────────────────────────── */}
      <section className="relative pt-28 md:pt-36 pb-8 md:pb-12 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background: program.isFeatured
              ? 'radial-gradient(ellipse at 50% 0%, rgba(198, 255, 61, 0.12) 0%, transparent 55%)'
              : 'radial-gradient(ellipse at 50% 0%, rgba(198, 255, 61, 0.06) 0%, transparent 55%)',
          }}
        />

        <div className="container-safe relative">
          <Link
            href="/programs"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted hover:text-accent transition-colors mb-8 md:mb-10"
          >
            <ArrowLeft size={12} />
            All plans
          </Link>

          <div className="grid lg:grid-cols-[1.3fr_1fr] gap-10 lg:gap-14 items-start">
            <div>
              {/* Featured ribbon */}
              {program.isFeatured && (
                <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-accent/15 border border-accent/40">
                  <Sparkles size={11} className="text-accent" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-accent font-bold mb-3">
                <span className="w-4 h-px bg-accent" />
                {program.tag}
              </div>

              <h1 className="font-display font-semibold text-4xl md:text-6xl tracking-tight leading-[1.02] mb-4">
                {program.name}
              </h1>

              <p className="text-lg md:text-xl text-text leading-relaxed mb-6 max-w-2xl">
                {details?.heroTagline || program.tagline}
              </p>

              <p className="text-base text-text-muted leading-relaxed mb-8 max-w-2xl">
                {program.description}
              </p>

              {/* Price block */}
              <div className="flex items-baseline gap-2 mb-6">
                <span className="font-display font-bold text-5xl md:text-6xl text-accent leading-none tabular-nums">
                  {program.priceDisplay}
                </span>
                <span className="font-mono text-sm uppercase tracking-[0.12em] text-text-muted">
                  {program.priceSuffix || 'one-time'}
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/book"
                  className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-accent text-bg font-semibold hover:bg-accent-hover transition-colors"
                >
                  Book a Consultation
                  <ArrowRight size={16} />
                </Link>
                <a
                  href={whatsappLink(
                    `Hi PURE X team, I'm interested in the ${program.name} plan. Can you share more?`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 h-12 px-6 rounded-full border border-border text-text-muted hover:border-accent/40 hover:text-text transition-colors"
                >
                  Ask on WhatsApp
                </a>
              </div>
            </div>

            {/* Right: Who is this for? */}
            {details?.whoFor && (
              <div className="rounded-2xl bg-bg-card border border-border p-6 md:p-7 lg:sticky lg:top-28">
                <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-4">
                  <Users size={12} strokeWidth={2.5} />
                  Who this is for
                </div>
                <ul className="space-y-3">
                  {details.whoFor.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2
                        size={15}
                        strokeWidth={2.2}
                        className="text-accent flex-shrink-0 mt-1"
                      />
                      <span className="text-sm text-text-muted leading-relaxed">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>

                {details.recommendedFor && (
                  <div className="mt-6 pt-6 border-t border-border-soft">
                    <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent font-bold mb-2">
                      Recommended For
                    </div>
                    <p className="text-sm text-text leading-relaxed italic">
                      {details.recommendedFor}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── What you get ──────────────────────────────────────── */}
      {details?.whatYouGet && (
        <section className="relative py-16 md:py-24 border-t border-border-soft">
          <div className="container-safe">
            <div className="max-w-2xl mb-10 md:mb-14">
              <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-3">
                <span className="w-3 h-px bg-accent" />
                What's included
              </div>
              <h2 className="font-display font-semibold text-3xl md:text-5xl tracking-tight leading-[1.05]">
                Everything in this plan.
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-3 md:gap-4">
              {details.whatYouGet.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div
                    key={i}
                    className="rounded-2xl bg-bg-card border border-border p-5 md:p-6 hover:border-accent/30 transition-all duration-500"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: 'rgba(198, 255, 61, 0.08)',
                          border: '1px solid rgba(198, 255, 61, 0.25)',
                          color: '#c6ff3d',
                        }}
                      >
                        <Icon size={18} strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display font-semibold text-base md:text-lg text-white mb-1.5">
                          {item.label}
                        </h3>
                        <p className="text-sm text-text-muted leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── Weekly rhythm ─────────────────────────────────────── */}
      {details?.weeklyRhythm && (
        <section className="relative py-16 md:py-24 border-t border-border-soft bg-bg-card/40">
          <div className="container-safe max-w-3xl">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-3">
                <Flame size={12} strokeWidth={2.5} />
                A typical week
              </div>
              <h2 className="font-display font-semibold text-3xl md:text-4xl tracking-tight leading-[1.05]">
                What your week looks like.
              </h2>
            </div>

            <div className="space-y-2">
              {details.weeklyRhythm.map((line, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-4 rounded-xl bg-bg-card border border-border-soft"
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold w-8 flex-shrink-0 pt-1">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <p className="text-sm text-text leading-relaxed">{line}</p>
                </div>
              ))}
            </div>

            {details.differentiator && (
              <div className="mt-8 rounded-2xl border border-accent/30 bg-accent/5 p-5 md:p-6">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold mb-2 flex items-center gap-2">
                  <Sparkles size={11} />
                  Why this plan
                </div>
                <p className="text-base text-text leading-relaxed italic">
                  {details.differentiator}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── Base inclusions list (from constants) ─────────────── */}
      <section className="relative py-16 md:py-20 border-t border-border-soft">
        <div className="container-safe max-w-3xl">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-3">
              <CheckCircle2 size={12} strokeWidth={2.5} />
              Inclusions checklist
            </div>
            <h2 className="font-display font-semibold text-2xl md:text-3xl tracking-tight leading-[1.1]">
              The fine print, without the fine print.
            </h2>
          </div>

          <ul className="space-y-2.5">
            {program.inclusions.map((inc) => (
              <li
                key={inc}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-bg-card border border-border-soft"
              >
                <CheckCircle2
                  size={16}
                  strokeWidth={2.2}
                  className="text-accent flex-shrink-0"
                />
                <span className="text-sm text-text">{inc}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── Compare with other plans ────────────────────────── */}
      <section className="relative py-16 md:py-20 border-t border-border-soft bg-bg-card/40">
        <div className="container-safe">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-3">
              <span className="w-3 h-px bg-accent" />
              Compare
            </div>
            <h2 className="font-display font-semibold text-2xl md:text-3xl tracking-tight leading-[1.1]">
              Other plans you might consider.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-3 md:gap-4">
            {otherPrograms.map((p) => (
              <Link
                key={p.slug}
                href={`/programs/${p.slug}`}
                className="group rounded-2xl bg-bg-card border border-border p-5 hover:border-accent/40 transition-all duration-500"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold mb-2">
                  {p.tag}
                </div>
                <div className="font-display font-semibold text-lg text-white mb-1">
                  {p.name}
                </div>
                <div className="flex items-baseline gap-1.5 mb-3">
                  <span className="font-display font-bold text-xl text-accent tabular-nums">
                    {p.priceDisplay}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-muted">
                    {p.priceSuffix || 'one-time'}
                  </span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed mb-3">
                  {p.tagline}
                </p>
                <div className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-accent font-bold group-hover:gap-2 transition-all">
                  See plan
                  <ArrowRight size={10} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─────────────────────────────────────────── */}
      <section className="relative py-16 md:py-24 border-t border-border-soft">
        <div className="container-safe">
          <div className="rounded-3xl bg-bg-card border border-accent/30 p-8 md:p-14 text-center relative overflow-hidden">
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 100%, rgba(198, 255, 61, 0.12) 0%, transparent 60%)',
              }}
            />
            <div className="relative">
              <h3 className="font-display font-semibold text-3xl md:text-5xl tracking-tight leading-[1.05] mb-4 max-w-2xl mx-auto">
                Ready to start?
              </h3>
              <p className="text-text-muted text-lg mb-8 max-w-xl mx-auto">
                Book a free 20-minute consultation — we'll confirm {program.name}{' '}
                is the right fit before you commit.
              </p>
              <Link
                href="/book"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-accent text-bg font-semibold hover:bg-accent-hover transition-colors"
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
