'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Flame, Users, Calendar, ArrowRight } from 'lucide-react';

/**
 * Live stats strip — shown above or below the hero on the homepage.
 * Displays "active pacts," "graduates," and "days committed" counters
 * to create immediate social proof.
 */
export function PactCounterStrip() {
  const stats = [
    {
      icon: Flame,
      value: 47,
      label: 'Active Pacts',
      color: '#c6ff3d',
    },
    {
      icon: Users,
      value: 23,
      label: '100 Club Graduates',
      color: '#7dd3ff',
    },
    {
      icon: Calendar,
      value: 1147,
      label: 'Total Days Committed',
      color: '#ffb84d',
    },
  ];

  return (
    <section className="relative py-10 md:py-14 border-y border-border-soft">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(198, 255, 61, 0.02) 50%, transparent 100%)',
        }}
      />

      <div className="container-safe relative">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Stats row */}
          <div className="flex flex-wrap gap-x-8 gap-y-4 md:gap-x-14">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="flex items-center gap-3"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `${stat.color}14`,
                    border: `1px solid ${stat.color}40`,
                    color: stat.color,
                  }}
                >
                  <stat.icon size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className="font-display font-bold text-2xl md:text-3xl leading-none"
                      style={{ color: stat.color }}
                    >
                      {stat.value.toLocaleString()}
                    </span>
                    {/* Live pulse */}
                    <span className="relative flex h-1.5 w-1.5">
                      <span
                        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                        style={{ background: stat.color }}
                      />
                      <span
                        className="relative inline-flex rounded-full h-1.5 w-1.5"
                        style={{ background: stat.color }}
                      />
                    </span>
                  </div>
                  <div className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.16em] text-text-muted font-bold mt-1">
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex-shrink-0"
          >
            <Link
              href="/programs"
              className="group inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold border border-accent/30 hover:border-accent hover:bg-accent/5 px-4 h-10 rounded-full transition-all"
            >
              Start Your Pact
              <ArrowRight
                size={13}
                strokeWidth={2.5}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
