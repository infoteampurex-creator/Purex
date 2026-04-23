'use client';

import { motion } from 'framer-motion';
import { Bell, Flame } from 'lucide-react';
import { MOCK_CLIENT } from '@/lib/data/client-mock';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function WelcomeHeader() {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-start justify-between gap-4 mb-6"
    >
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-medium mb-1">
          {today}
        </div>
        <h1 className="font-display font-semibold text-2xl md:text-3xl tracking-tight leading-tight">
          {greeting()}, <span className="text-accent">{MOCK_CLIENT.firstName}</span>.
        </h1>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1.5 bg-bg-card border border-border px-2.5 py-1 rounded-full">
            <Flame size={11} className="text-accent" fill="currentColor" />
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text font-bold">
              Day {MOCK_CLIENT.dayNumber}
            </span>
          </div>
          <div className="inline-flex items-center bg-bg-card border border-border px-2.5 py-1 rounded-full">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-medium">
              {MOCK_CLIENT.activePlan}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          aria-label="Notifications"
          className="relative w-10 h-10 md:w-11 md:h-11 rounded-full border border-border bg-bg-card flex items-center justify-center hover:border-accent hover:text-accent transition-colors"
        >
          <Bell size={16} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-accent" />
        </button>

        <button
          aria-label="Profile"
          className="w-10 h-10 md:w-11 md:h-11 rounded-full border-2 border-accent/60 bg-gradient-to-br from-accent/20 to-bg-elevated flex items-center justify-center font-display font-bold text-sm text-accent hover:border-accent transition-colors"
        >
          {MOCK_CLIENT.firstName[0]}
        </button>
      </div>
    </motion.header>
  );
}
