'use client';

import { useState, useEffect, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { GymScene } from './GymScene';
import { NeonPureXSign } from './NeonPureXSign';
import { TreadmillStart } from './TreadmillStart';
import { DeadliftAnimation } from './DeadliftAnimation';
import { cn } from '@/lib/cn';

interface AuthShellProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;

  /**
   * 'enter' — login/signup: dark scene, treadmill activation ritual
   * 'calm'  — forgot/reset: scene already lit, no interaction, just ambient mood
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
  const [activated, setActivated] = useState(variant === 'calm');

  // Enter variant: mobile auto-activates after 400ms; desktop waits for treadmill click.
  // Calm variant: always activated (no gating)
  useEffect(() => {
    if (variant === 'calm') return;
    if (typeof window === 'undefined') return;
    if (window.innerWidth >= 1024) return;

    const timeout = setTimeout(() => setActivated(true), 400);
    return () => clearTimeout(timeout);
  }, [variant]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.1fr_1fr]">
      {/* LEFT — Gym scene */}
      <div className="relative h-64 lg:h-screen overflow-hidden">
        <GymScene activated={activated} />

        {/* Neon sign */}
        <div className="absolute inset-x-0 top-0 lg:top-[18%] flex items-center justify-center px-8 h-full lg:h-auto">
          <div className="w-full max-w-md lg:max-w-lg">
            <NeonPureXSign activated={activated} />

            {activated && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: variant === 'calm' ? 0.3 : 0.8, duration: 0.6 }}
                className="mt-6 text-center"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent font-bold">
                  Train for Life. Not Just Aesthetics.
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Treadmill + deadlift only on 'enter' variant (desktop) */}
        {variant === 'enter' && (
          <>
            <div className="hidden lg:block">
              <TreadmillStart activated={activated} onActivate={() => setActivated(true)} />
            </div>
            <div className="hidden lg:block">
              <DeadliftAnimation activated={activated} />
            </div>
          </>
        )}
      </div>

      {/* RIGHT — Auth card */}
      <div className="relative flex items-center justify-center p-5 md:p-8 lg:p-12 min-h-[60vh] lg:min-h-screen bg-bg">
        <motion.div
          animate={{
            opacity: activated ? 1 : 0.4,
            scale: activated ? 1 : 0.98,
          }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div
            className={cn(
              'relative bg-bg-card border rounded-2xl p-6 md:p-8 transition-all duration-700',
              activated
                ? 'border-accent/40 shadow-[0_0_60px_rgba(198,255,61,0.15),0_20px_50px_-20px_rgba(0,0,0,0.6)]'
                : 'border-border'
            )}
          >
            <div
              className={cn(
                'font-mono text-[10px] uppercase tracking-[0.22em] font-bold mb-2 transition-colors duration-700',
                activated ? 'text-accent' : 'text-text-dim'
              )}
            >
              {eyebrow}
            </div>
            <h1 className="font-display font-semibold text-2xl md:text-3xl tracking-tight leading-tight mb-2">
              {title}
            </h1>
            <p className="text-sm text-text-muted mb-8">{subtitle}</p>

            <div
              className={cn(
                'transition-opacity duration-700',
                activated ? 'opacity-100' : 'opacity-60 pointer-events-none'
              )}
            >
              {children}
            </div>

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
