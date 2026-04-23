'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Play, ArrowRight } from 'lucide-react';
import { ProgressRing } from './ProgressRing';
import { MOCK_DAILY_PLAN } from '@/lib/data/client-mock';

export function DailyPlanCard() {
  const { title, subtitle, tasksCompleted, tasksTotal, motivationalCopy } = MOCK_DAILY_PLAN;
  const progress = Math.round((tasksCompleted / tasksTotal) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      className="relative overflow-hidden rounded-3xl p-6 md:p-8"
      style={{
        background: `
          radial-gradient(ellipse 80% 120% at 20% 0%, rgba(198, 255, 61, 0.18), transparent 60%),
          radial-gradient(ellipse 60% 80% at 90% 100%, rgba(178, 108, 255, 0.15), transparent 55%),
          linear-gradient(135deg, #1a2014 0%, #161a16 50%, #141412 100%)
        `,
        border: '1px solid rgba(198, 255, 61, 0.25)',
        boxShadow:
          '0 20px 60px -20px rgba(0,0,0,0.6), 0 0 80px rgba(198, 255, 61, 0.06) inset',
      }}
    >
      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #c6ff3d 1px, transparent 1px), linear-gradient(to bottom, #c6ff3d 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Ambient corner glow */}
      <div
        className="absolute -top-24 -left-24 w-64 h-64 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(198, 255, 61, 0.25), transparent 70%)',
        }}
      />

      <div className="relative flex flex-col md:flex-row md:items-center gap-6">
        {/* Progress ring */}
        <div className="flex items-center justify-center md:justify-start gap-5 md:gap-6">
          <ProgressRing progress={progress} size={112} strokeWidth={8}>
            <div className="font-display font-bold text-2xl text-accent tracking-tight leading-none">
              {progress}%
            </div>
            <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted font-bold mt-1">
              {tasksCompleted}/{tasksTotal}
            </div>
          </ProgressRing>

          <div className="md:hidden flex-1 min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent font-bold mb-1">
              My Plan Today
            </div>
            <h2 className="font-display font-bold text-xl tracking-tight leading-tight">
              {title}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="hidden md:block">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold mb-2">
              My Plan for Today
            </div>
            <h2 className="font-display font-bold text-3xl tracking-tight leading-tight mb-1">
              {title}
            </h2>
            <div className="text-sm text-text-muted mb-3">{subtitle}</div>
          </div>

          <div className="md:hidden text-xs text-text-muted mb-3">{subtitle}</div>

          <p className="text-sm md:text-base text-text/90 italic leading-relaxed mb-5 max-w-md">
            &ldquo;{motivationalCopy}&rdquo;
          </p>

          <div className="flex gap-3">
            <button className="inline-flex items-center gap-2 bg-accent text-bg font-semibold text-sm px-5 h-11 rounded-full hover:bg-accent-hover active:scale-[0.98] transition-all">
              <Play size={14} fill="currentColor" />
              Start Workout
            </button>
            <Link
              href="/client/plan"
              className="inline-flex items-center gap-1.5 text-sm text-text hover:text-accent font-medium px-3 h-11 rounded-full transition-colors"
            >
              View plan
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
