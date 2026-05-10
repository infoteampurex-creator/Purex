'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { GymScene } from './GymScene';

interface AuthShellProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;

  /**
   * Reserved for legacy variant compatibility — currently both 'enter' and
   * 'calm' render identically. Variant prop kept so existing call-sites
   * compile without modification.
   */
  variant?: 'enter' | 'calm';
}

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  variant: _variant = 'enter',
}: AuthShellProps) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.1fr_1fr]">
      {/* ════════════════════════════════════════════════════
           LEFT — Gym scene (deadlift animation centerpiece)
           Hidden on mobile to keep auth fast + focused.
      ════════════════════════════════════════════════════ */}
      <div className="hidden lg:block relative h-screen overflow-hidden">
        <GymScene />
      </div>

      {/* Mobile-only mini-banner so the brand is still present */}
      <div className="lg:hidden h-32 bg-bg relative overflow-hidden border-b border-border-soft">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 100%, rgba(198, 255, 61, 0.12) 0%, transparent 60%)',
          }}
        />
        <div className="relative h-full flex flex-col items-center justify-center px-6">
          <div className="flex items-center gap-1">
            <span
              className="font-display font-bold text-xl tracking-tight"
              style={{ animation: 'pureX-white-breathe 6s ease-in-out infinite' }}
            >
              PURE
            </span>
            <span
              className="font-display font-bold text-xl text-accent tracking-tight"
              style={{ animation: 'pureX-wordmark-breath 6s ease-in-out infinite' }}
            >
              X
            </span>
          </div>
          <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.22em] text-accent font-bold">
            Train for Life. Not Just Aesthetics.
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
           RIGHT — Auth form
      ════════════════════════════════════════════════════ */}
      <div className="relative flex items-center justify-center p-5 md:p-8 lg:p-12 min-h-[calc(100vh-128px)] lg:min-h-screen bg-bg">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="relative bg-bg-card border border-accent/40 rounded-2xl p-6 md:p-8 shadow-[0_0_60px_rgba(198,255,61,0.15),0_20px_50px_-20px_rgba(0,0,0,0.6)]">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] font-bold mb-2 text-accent">
              {eyebrow}
            </div>
            <h1 className="font-display font-semibold text-2xl md:text-3xl tracking-tight leading-tight mb-2">
              {title}
            </h1>
            <p className="text-sm text-text-muted mb-8">{subtitle}</p>

            <div>{children}</div>

            {footer && (
              <div className="mt-6 pt-6 border-t border-border-soft text-center">
                {footer}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
