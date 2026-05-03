'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { GymScene } from './GymScene';
import { NeonPureXSign } from './NeonPureXSign';
import { DeadliftAnimation } from './DeadliftAnimation';

interface AuthShellProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;

  /**
   * 'enter' — login/signup: dark scene, deadlift animation visible
   * 'calm'  — forgot/reset: scene already lit, ambient mood
   */
  variant?: 'enter' | 'calm';
}

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  variant = 'enter',
}: AuthShellProps) {
  // Form is always active. The previous "treadmill power button"
  // gate was removed — users can log in immediately.
  const activated = true;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.1fr_1fr]">
      {/* LEFT — Gym scene */}
      <div className="relative h-64 lg:h-screen overflow-hidden">
        <GymScene activated={activated} />

        {/* Neon sign */}
        <div className="absolute inset-x-0 top-0 lg:top-[18%] flex items-center justify-center px-8 h-full lg:h-auto">
          <div className="w-full max-w-md lg:max-w-lg">
            <NeonPureXSign activated={activated} />

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-6 text-center"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent font-bold">
                Train for Life. Not Just Aesthetics.
              </div>
            </motion.div>
          </div>
        </div>

        {/* Deadlift animation stays — pure ambient flavour, not interactive */}
        {variant === 'enter' && (
          <div className="hidden lg:block">
            <DeadliftAnimation activated={activated} />
          </div>
        )}
      </div>

      {/* RIGHT — Auth card (always interactive) */}
      <div className="relative flex items-center justify-center p-5 md:p-8 lg:p-12 min-h-[60vh] lg:min-h-screen bg-bg">
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
