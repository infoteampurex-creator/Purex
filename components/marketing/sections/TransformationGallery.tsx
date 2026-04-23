'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, X } from 'lucide-react';
import { FALLBACK_TRANSFORMATIONS, type Transformation } from '@/lib/constants';

export function TransformationGallery() {
  const [selected, setSelected] = useState<Transformation | null>(null);

  return (
    <>
      <section id="transformations" className="py-20 md:py-28">
        <div className="container-safe">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-14">
            <div className="max-w-3xl">
              <span className="eyebrow">Real Clients · Real Results</span>
              <h2 className="mt-3 font-display font-semibold text-display-lg tracking-tight">
                Transformations that{' '}
                <span className="text-accent">speak for themselves.</span>
              </h2>
              <p className="mt-4 text-base text-text-muted leading-relaxed max-w-xl">
                Every transformation at PURE X is medically supervised, physio-integrated, and performance-driven. No crash diets. No shortcuts. Just measurable, sustainable change.
              </p>
            </div>
            <Link
              href="/transformations"
              className="inline-flex items-center gap-2 text-sm text-text hover:text-accent transition-colors font-medium"
            >
              View all stories
              <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {FALLBACK_TRANSFORMATIONS.map((story, i) => (
              <motion.button
                key={story.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{
                  duration: 0.6,
                  ease: [0.22, 1, 0.36, 1],
                  delay: i * 0.06,
                }}
                onClick={() => setSelected(story)}
                className="group relative text-left bg-bg-card border border-border hover:border-accent/60 rounded-xl overflow-hidden transition-all duration-500 hover:-translate-y-1"
              >
                {/* Before/After split */}
                <div className="relative aspect-square overflow-hidden bg-bg-inset grid grid-cols-2">
                  {/* Before half */}
                  <div className="relative overflow-hidden">
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          'radial-gradient(ellipse at 50% 45%, #5a5a54 0%, #3a3a34 35%, transparent 65%), linear-gradient(180deg, #2a2a24 0%, #1a1a14 100%)',
                      }}
                    />
                    <div
                      className="absolute rounded-full"
                      style={{
                        left: '50%',
                        top: '15%',
                        transform: 'translateX(-50%)',
                        width: '28%',
                        aspectRatio: '1',
                        background: 'radial-gradient(circle, #6a6a5a, #3a3a30)',
                      }}
                    />
                    <div
                      className="absolute"
                      style={{
                        left: '50%',
                        top: '38%',
                        transform: 'translateX(-50%)',
                        width: '65%',
                        height: '50%',
                        borderRadius: '45% 45% 35% 35% / 40% 40% 55% 55%',
                        background:
                          'radial-gradient(ellipse at 50% 30%, #5a5a50, #2a2a24 70%)',
                      }}
                    />
                    <div className="absolute top-3 left-3 px-2 py-1 bg-bg/80 backdrop-blur-md rounded-full font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted font-bold">
                      Before
                    </div>
                  </div>
                  {/* After half */}
                  <div className="relative overflow-hidden">
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          'radial-gradient(ellipse at 50% 45%, rgba(198, 255, 61, 0.08) 0%, transparent 65%), linear-gradient(180deg, #1a2014 0%, #0a0c09 100%)',
                      }}
                    />
                    <div
                      className="absolute rounded-full"
                      style={{
                        left: '50%',
                        top: '15%',
                        transform: 'translateX(-50%)',
                        width: '26%',
                        aspectRatio: '1',
                        background:
                          'radial-gradient(circle at 50% 40%, #8a8a80, #3a3a32)',
                        boxShadow: '0 0 20px rgba(198, 255, 61, 0.15)',
                      }}
                    />
                    <div
                      className="absolute"
                      style={{
                        left: '50%',
                        top: '38%',
                        transform: 'translateX(-50%)',
                        width: '58%',
                        height: '48%',
                        borderRadius: '40% 40% 28% 28% / 35% 35% 50% 50%',
                        background: 'linear-gradient(180deg, #2a3a20 0%, #1a1f14 100%)',
                        boxShadow:
                          'inset 0 2px 8px rgba(198, 255, 61, 0.2), 0 0 30px rgba(198, 255, 61, 0.1)',
                      }}
                    />
                    <div className="absolute top-3 left-3 px-2 py-1 bg-bg/80 backdrop-blur-md rounded-full font-mono text-[9px] uppercase tracking-[0.14em] text-accent font-bold border border-accent/40">
                      After
                    </div>
                  </div>

                  {/* Divider line */}
                  <div
                    className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 z-10"
                    style={{
                      background:
                        'linear-gradient(to bottom, transparent, #c6ff3d, transparent)',
                    }}
                  />

                  {/* Hover icon */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 bg-accent text-bg rounded-full flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-glow">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M8 3L4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4" />
                    </svg>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5">
                  <h3 className="font-display font-semibold text-xl tracking-tight">
                    {story.clientName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted font-medium">
                      {story.goal}
                    </span>
                    <span className="text-text-dim">·</span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-accent font-bold">
                      {story.durationWeeks} weeks
                    </span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border-soft grid grid-cols-3 gap-2">
                    {story.stats.map((stat) => (
                      <div key={stat.label}>
                        <div className="font-display font-bold text-base text-accent leading-none tracking-tight">
                          {stat.value}
                        </div>
                        <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-text-muted mt-1 font-medium">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/90 backdrop-blur-xl"
          onClick={() => setSelected(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-w-2xl w-full bg-bg-card border border-border rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-bg-elevated border border-border hover:border-accent hover:text-accent transition-colors z-10"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <div className="p-8 md:p-10">
              <div className="eyebrow-accent">
                {selected.goal} · {selected.durationWeeks} weeks
              </div>
              <h3 className="mt-3 font-display font-bold text-3xl md:text-4xl tracking-tight leading-tight">
                {selected.clientName}
              </h3>
              <p className="mt-4 text-lg text-text leading-relaxed">
                {selected.headline}
              </p>
              <div className="mt-8 pt-8 border-t border-border grid grid-cols-3 gap-4">
                {selected.stats.map((stat) => (
                  <div key={stat.label}>
                    <div className="font-display font-bold text-2xl md:text-3xl text-accent tracking-tight">
                      {stat.value}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted mt-2 font-medium">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/book"
                className="mt-8 inline-flex items-center gap-2 bg-accent text-bg font-semibold px-6 py-3 rounded-full hover:bg-accent-hover transition-colors"
              >
                Start your transformation
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
