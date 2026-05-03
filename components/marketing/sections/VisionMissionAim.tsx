'use client';

import { motion } from 'framer-motion';
import { Compass, Target, Flag } from 'lucide-react';

/**
 * Vision · Mission · Aim section — from the PURE X brand document.
 * Placed after Hero, before other content sections.
 *
 * Three-column card layout: each statement gets its own card with an
 * icon, label, and the full text.
 */

const PILLARS = [
  {
    label: 'Vision',
    icon: Compass,
    headline:
      "India's leading performance fitness brand.",
    body: 'Transforming individuals of all ages into natural hybrid athletes by unlocking their full physical potential and building lifelong functional and cardiovascular health.',
    accent: '#c6ff3d', // lime
  },
  {
    label: 'Mission',
    icon: Target,
    headline: 'Train individuals into hybrid athletes.',
    body: 'We train individuals and couples to become hybrid athletes by integrating personalised coaching, medical expertise, and performance-based programs such as HYROX, Ironman Triathlon, and endurance events.',
    accent: '#7dd3ff', // sky
  },
  {
    label: 'Aim',
    icon: Flag,
    headline: "India's strongest generation of natural hybrid athletes.",
    body: "Build a generation that treats fitness as a lifestyle — not a phase — through systems that work for real people living real lives.",
    accent: '#ffb84d', // amber
  },
];

export function VisionMissionAim() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Ambient background */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(198, 255, 61, 0.05) 0%, transparent 50%)',
        }}
      />

      <div className="container-safe relative">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12 md:mb-16 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.22em] text-accent font-bold mb-4">
            <span className="inline-block w-4 h-px bg-accent" />
            Why PURE X exists
            <span className="inline-block w-4 h-px bg-accent" />
          </div>
          <h2 className="font-display font-semibold text-3xl sm:text-4xl md:text-5xl tracking-tight leading-[1.15]">
            Built on a <span className="text-accent">vision</span>.
            <br />
            Driven by a <span className="text-accent">mission</span>.
            <br />
            Measured by an <span className="text-accent">aim</span>.
          </h2>
        </motion.div>

        {/* Three pillar cards */}
        <div className="grid md:grid-cols-3 gap-4 md:gap-5">
          {PILLARS.map((pillar, idx) => (
            <motion.div
              key={pillar.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{
                duration: 0.7,
                delay: idx * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group relative rounded-2xl bg-bg-card border border-border p-6 md:p-7 hover:border-accent/40 transition-all duration-500 overflow-hidden"
            >
              {/* Corner accent glow */}
              <div
                aria-hidden
                className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                style={{
                  background: `radial-gradient(circle, ${pillar.accent}26 0%, transparent 70%)`,
                }}
              />

              {/* Icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                style={{
                  background: `${pillar.accent}14`,
                  border: `1px solid ${pillar.accent}40`,
                  color: pillar.accent,
                }}
              >
                <pillar.icon size={20} strokeWidth={2} />
              </div>

              {/* Label */}
              <div
                className="font-mono text-[10px] uppercase tracking-[0.22em] font-bold mb-3"
                style={{ color: pillar.accent }}
              >
                {pillar.label}
              </div>

              {/* Headline */}
              <h3 className="font-display font-semibold text-xl md:text-[22px] tracking-tight leading-[1.15] mb-3">
                {pillar.headline}
              </h3>

              {/* Body */}
              <p className="text-sm text-text-muted leading-relaxed">{pillar.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
