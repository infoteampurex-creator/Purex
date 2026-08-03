'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { GreetingName } from './GreetingName';

/**
 * Renders the current date + time-of-day greeting from the user's
 * DEVICE clock, not the server. Prevents timezone drift where the
 * Vercel region (UTC-ish) showed "SATURDAY 25 JUL / Good afternoon"
 * to a user whose phone said 10 pm on Friday.
 *
 * SSR pass: renders the parent's server-computed strings so first
 * paint is never blank. useEffect fires immediately on hydrate and
 * overwrites with the browser's local values — same paint frame on
 * warm caches, one extra paint on cold caches.
 */
export function LocalDateGreeting({
  initialDate,
  initialGreeting,
  firstName,
}: {
  initialDate: string;
  initialGreeting: string;
  firstName: string | null;
}) {
  const [date, setDate] = useState(initialDate);
  const [greeting, setGreeting] = useState(initialGreeting);

  useEffect(() => {
    const now = new Date();
    setDate(
      now.toLocaleDateString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
      })
    );
    const h = now.getHours();
    setGreeting(
      h < 5
        ? 'Late night'
        : h < 12
        ? 'Good morning'
        : h < 17
        ? 'Good afternoon'
        : h < 21
        ? 'Good evening'
        : 'Evening'
    );
  }, []);

  return (
    <header className="flex items-start justify-between gap-4 mb-6">
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-medium mb-1">
          {date}
        </div>
        <h1 className="font-display font-semibold text-2xl md:text-3xl tracking-tight leading-tight">
          {firstName ? (
            <>
              {greeting},{' '}
              <GreetingName raw={firstName} />.
            </>
          ) : (
            <>{greeting}.</>
          )}
        </h1>
      </div>

      <button
        className="w-10 h-10 flex items-center justify-center rounded-full border border-border hover:border-accent transition-colors flex-shrink-0"
        aria-label="Notifications"
      >
        <Bell size={16} />
      </button>
    </header>
  );
}
