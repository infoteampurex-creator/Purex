import Link from 'next/link';
import { Metadata } from 'next';
import { ArrowRight, Quote, Medal, Users, Dumbbell, Brain, Heart, Activity } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About PURE X · The Story',
  description:
    'Built on real transformation. Designed for life. The story of PURE X — from two personal journeys to a fully integrated health coaching system.',
};

export default function AboutPage() {
  return (
    <main className="relative bg-bg text-text">
      {/* ─── Hero ────────────────────────────────────────── */}
      <section className="relative pt-32 md:pt-40 pb-16 md:pb-24 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, rgba(198, 255, 61, 0.08) 0%, transparent 55%)',
          }}
        />

        <div className="container-safe relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-accent font-bold mb-6">
              <span className="w-4 h-px bg-accent" />
              The PURE X Story
            </div>
            <h1 className="font-display font-semibold text-4xl md:text-6xl tracking-tight leading-[1.02] mb-6">
              Built on real{' '}
              <span className="text-accent">transformation</span>.
              <br />
              Designed for life.
            </h1>
            <p className="text-lg md:text-xl text-text-muted leading-relaxed max-w-2xl">
              PURE X was not created as a fitness brand. It was built as a solution to a
              real problem — one that was lived, experienced, and solved through discipline,
              resilience, and two journeys that converged into one system.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Siva Reddy's story ───────────────────────────── */}
      <section className="relative py-16 md:py-24 border-t border-border-soft">
        <div className="container-safe">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-16 items-start">
            {/* Left column: framed title & stats */}
            <div className="lg:sticky lg:top-28">
              <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-4">
                <span className="w-3 h-px bg-accent" />
                Chapter One
              </div>
              <h2 className="font-display font-semibold text-3xl md:text-4xl tracking-tight leading-[1.05] mb-6">
                A personal transformation.
              </h2>
              <p className="text-text-muted mb-8 leading-relaxed">
                The beginning of PURE X was Siva Reddy's 40kg transformation — from stressed
                corporate engineer to ICN medalist and professional trainer.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <StatBox num="40kg" label="Weight lost" />
                <StatBox num="ICN" label="Gold medalist" />
                <StatBox num="100+" label="Clients trained" />
                <StatBox num="Gold" label="Best Transformation 2024" />
              </div>
            </div>

            {/* Right column: story */}
            <div className="prose-custom space-y-6 text-[16px] leading-[1.75] text-text-muted">
              <p>
                Siva Reddy's journey began far from the fitness industry. An Electronics and
                Communications Engineer, he started his career in the corporate world — a
                fast-paced, high-pressure environment that gradually took a toll on his
                physical and mental health.
              </p>
              <p>
                This became his turning point. Determined to take control of his life, Siva
                committed to structured training, discipline, and long-term lifestyle change.
                Through consistency and a system-driven approach, he achieved a remarkable{' '}
                <strong className="text-text">40kg weight loss</strong> and complete
                transformation in strength, fitness, and mental well-being.
              </p>

              <Pullquote>
                True transformation requires structure, discipline, and the right system.
              </Pullquote>

              <p>
                His journey evolved beyond personal transformation into competitive success —
                Gold Medal in the Best Transformation category and Bronze in Men's Fitness
                Model at ICN 2024.
              </p>
              <p>
                Following his transformation, Siva made a defining decision to leave his
                corporate career and pursue fitness professionally. He built his expertise
                through certifications in strength training, injury rehabilitation, personal
                training, and nutrition — then applied his own transformation system to train{' '}
                <strong className="text-text">100+ clients</strong> across fat loss, muscle
                building, hormonal balance, post-pregnancy recovery, injury rehabilitation,
                and calisthenics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Siva Jampana's story ─────────────────────────── */}
      <section className="relative py-16 md:py-24 border-t border-border-soft bg-bg-card/40">
        <div className="container-safe">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-start">
            {/* Left column: story */}
            <div className="prose-custom space-y-6 text-[16px] leading-[1.75] text-text-muted lg:order-1 order-2">
              <p>
                While Siva Reddy was building his fitness expertise, Siva Jampana was mastering
                a completely different domain. A Mechanical Engineer with experience in the
                automotive industry, he developed strong systems thinking, discipline, and
                execution ability.
              </p>
              <p>
                As an Indo-German Chamber of Commerce certified Technical Trainer, he trained{' '}
                <strong className="text-text">10,000+ professionals</strong>, mastering
                structured coaching and large-scale learning systems. After completing his
                Master's in Engineering Management with distinction and rebuilding his career
                in the United Kingdom, he faced his own need for transformation.
              </p>

              <Pullquote>
                When expertise meets structure — transformation becomes predictable.
              </Pullquote>

              <p>
                Friends for over 15 years, Siva Jampana turned to Siva Reddy for guidance.
                What followed was not just coaching — it was real-world validation of a
                transformation system. Through structured training and discipline, Siva
                Jampana achieved a <strong className="text-text">20kg weight loss</strong>,
                significant strength and physique gains, complete lifestyle change, and
                progression to HYROX Pro Doubles.
              </p>
              <p>
                That realization — that the right system makes transformation predictable —
                led to the creation of PURE X.
              </p>
            </div>

            {/* Right column: framed title & stats */}
            <div className="lg:sticky lg:top-28 lg:order-2 order-1">
              <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-4">
                <span className="w-3 h-px bg-accent" />
                Chapter Two
              </div>
              <h2 className="font-display font-semibold text-3xl md:text-4xl tracking-tight leading-[1.05] mb-6">
                The missing piece: structure & scale.
              </h2>
              <p className="text-text-muted mb-8 leading-relaxed">
                Siva Jampana brought engineering precision and systems thinking — plus his own
                20kg transformation and HYROX Pro competition experience.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <StatBox num="20kg" label="Weight lost" />
                <StatBox num="10k+" label="Trained" />
                <StatBox num="MEng" label="Distinction" />
                <StatBox num="HYROX" label="Pro Doubles" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Integrated system ────────────────────────────── */}
      <section className="relative py-16 md:py-24 border-t border-border-soft">
        <div className="container-safe">
          <div className="max-w-3xl mb-10 md:mb-14">
            <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-4">
              <span className="w-3 h-px bg-accent" />
              A new standard
            </div>
            <h2 className="font-display font-semibold text-3xl md:text-5xl tracking-tight leading-[1.05] mb-5">
              Integrated health.
              <br />
              Not just fitness.
            </h2>
            <p className="text-lg text-text-muted leading-relaxed">
              PURE X brings together doctors, physiotherapists, fitness trainers, nutrition
              experts, and mental health professionals — all working as one unified system.
              Because real transformation requires more than workouts.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <PillarCard
              icon={<Activity size={20} />}
              title="Medical Safety"
              body="Pre-programme screening, medical clearance, and ongoing monitoring — built into every journey."
            />
            <PillarCard
              icon={<Dumbbell size={20} />}
              title="Training Systems"
              body="Scientific, progressive, personalised. Designed by an ICN medalist and refined through 100+ real client transformations."
            />
            <PillarCard
              icon={<Heart size={20} />}
              title="Injury Prevention"
              body="Physiotherapy embedded from day one — prevention-first, not reactive. Movement screening before any training begins."
            />
            <PillarCard
              icon={<Brain size={20} />}
              title="Mental Health"
              body="UK-trained mental health support. Because the mind and body are inseparable — and true transformation needs both."
            />
            <PillarCard
              icon={<Medal size={20} />}
              title="Performance Coaching"
              body="CIMSPA-endorsed coaching for HYROX, IRONMAN, and hybrid athletic performance — built for events, lived as a lifestyle."
            />
            <PillarCard
              icon={<Users size={20} />}
              title="Global Access"
              body="Hyderabad and London. Clients from anywhere in the world connect with the right specialist at the right time."
            />
          </div>
        </div>
      </section>

      {/* ─── Philosophy ───────────────────────────────────── */}
      <section className="relative py-16 md:py-24 border-t border-border-soft bg-bg-card/40">
        <div className="container-safe">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-5">
              <span className="w-3 h-px bg-accent" />
              The PURE X Philosophy
              <span className="w-3 h-px bg-accent" />
            </div>
            <h2 className="font-display font-semibold text-3xl md:text-5xl tracking-tight leading-[1.05] mb-8">
              Not shortcuts. Not trends.
              <br />
              <span className="text-accent">Not temporary change.</span>
            </h2>
            <p className="text-lg text-text-muted leading-relaxed max-w-2xl mx-auto mb-10">
              Everything at PURE X is built on one foundation:{' '}
              <strong className="text-text">real transformation</strong>. Not theory. Not
              assumptions. Lived experience — turned into a system that works for anyone
              willing to commit.
            </p>
            <div className="inline-flex items-center gap-3 pt-8 border-t border-border-soft">
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent font-bold">
                PURE X
              </div>
              <span className="w-1 h-1 rounded-full bg-accent" />
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted">
                Performance · Health · Transformation
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────── */}
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
                Train for life. Not just aesthetics.
              </h3>
              <p className="text-text-muted text-lg mb-8 max-w-xl mx-auto">
                Begin where you are. Let the system take you the rest of the way.
              </p>
              <Link
                href="/book"
                className="inline-flex items-center gap-2 h-12 px-6 md:px-7 rounded-full bg-accent text-bg font-semibold hover:bg-accent-hover transition-colors"
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

// ─── Small components ─────────────────────────────────────────────────
function StatBox({ num, label }: { num: string; label: string }) {
  return (
    <div className="rounded-xl bg-bg-card border border-border p-4">
      <div className="font-display font-bold text-2xl text-accent leading-none">{num}</div>
      <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted mt-2">
        {label}
      </div>
    </div>
  );
}

function Pullquote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="relative my-8 pl-6 border-l-2 border-accent">
      <Quote
        size={28}
        className="absolute -top-2 -left-1 text-accent/30"
        strokeWidth={1.5}
      />
      <p className="font-display font-semibold text-xl md:text-2xl tracking-tight leading-[1.2] text-text not-italic">
        {children}
      </p>
    </blockquote>
  );
}

function PillarCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl bg-bg-card border border-border p-5 md:p-6 hover:border-accent/40 transition-all duration-500">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-accent"
        style={{
          background: 'rgba(198, 255, 61, 0.08)',
          border: '1px solid rgba(198, 255, 61, 0.25)',
        }}
      >
        {icon}
      </div>
      <h3 className="font-display font-semibold text-base md:text-lg tracking-tight leading-tight mb-2">
        {title}
      </h3>
      <p className="text-sm text-text-muted leading-relaxed">{body}</p>
    </div>
  );
}
