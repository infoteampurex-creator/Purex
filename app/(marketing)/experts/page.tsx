import type { Metadata } from 'next';
import { ExpertsGrid } from '@/components/marketing/sections/ExpertsGrid';
import { VisionMissionAim } from '@/components/marketing/sections/VisionMissionAim';

export const metadata: Metadata = {
  title: 'The Team · PURE X',
  description:
    'Meet the five specialists behind PURE X — doctors, physiotherapists, trainers, and mental health consultants working as one unified system across India and UK.',
};

export default function ExpertsPage() {
  return (
    <main className="relative bg-bg text-text">
      {/* Hero */}
      <section className="relative pt-28 md:pt-36 pb-8 md:pb-12 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, rgba(198, 255, 61, 0.08) 0%, transparent 55%)',
          }}
        />
        <div className="container-safe relative text-center">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-accent font-bold mb-5">
            <span className="w-4 h-px bg-accent" />
            The Team
            <span className="w-4 h-px bg-accent" />
          </div>
          <h1 className="font-display font-semibold text-4xl md:text-6xl tracking-tight leading-[1.02] mb-5 max-w-3xl mx-auto">
            Five specialists.
            <br />
            One <span className="text-accent">integrated system</span>.
          </h1>
          <p className="text-lg md:text-xl text-text-muted leading-relaxed max-w-2xl mx-auto">
            PURE X is not a solo-trainer platform. Every client works with a coordinated
            team of doctors, physiotherapists, coaches, and mental health consultants —
            all reading from the same playbook.
          </p>
        </div>
      </section>

      {/* Expert cards (India + UK groups) */}
      <ExpertsGrid />

      {/* Vision/Mission/Aim as closing statement */}
      <VisionMissionAim />
    </main>
  );
}
