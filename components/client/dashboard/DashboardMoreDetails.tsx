'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/cn';

const STORAGE_KEY = 'purex.dashboard.moreOpen.v1';

interface Props {
  children: React.ReactNode;
}

/**
 * Collapsible wrapper for the secondary dashboard cards.
 *
 * The redesigned home leads with only the four essential cards (Tasks,
 * Meals / Water / Steps via AppFitnessTiles, Workout). Everything else
 * lives behind a "Show more" toggle so the first viewport stays clean.
 *
 * Choice persists per device in localStorage — a client who opens the
 * extra cards once shouldn't have to do it again on every visit.
 *
 * Hidden subtree is conditionally rendered (not just CSS-hidden) so the
 * heavier secondary components don't run any client-side work until the
 * user expands. Compounds with the lazy-loaded sheets shipped in PR #54.
 */
export function DashboardMoreDetails({ children }: Props) {
  // Default closed for the cleanest first-paint. Read persisted choice
  // in an effect so we don't get hydration mismatch.
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === 'true') setOpen(true);
    } catch {
      /* localStorage blocked — fine */
    }
  }, []);

  const onToggle = () => {
    setOpen((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? 'true' : 'false');
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <section className="space-y-6 md:space-y-7">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="dashboard-more-content"
        className={cn(
          'w-full rounded-2xl border border-border-soft bg-bg-card/40 px-4 py-3.5',
          'flex items-center justify-between gap-3',
          'hover:border-text-muted hover:bg-bg-card transition-colors',
          'text-text-muted hover:text-text'
        )}
      >
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] font-bold">
          {open ? 'Hide extra details' : 'More on your day'}
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] font-bold',
            open ? 'text-accent' : ''
          )}
        >
          {open ? (
            <>
              Less <ChevronUp size={12} />
            </>
          ) : (
            <>
              Show <ChevronDown size={12} />
            </>
          )}
        </span>
      </button>

      {open && (
        <div id="dashboard-more-content" className="space-y-6 md:space-y-7">
          {children}
        </div>
      )}
    </section>
  );
}
