'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, MessageCircle } from 'lucide-react';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary for /apply. When the route or any server action it
 * calls throws an unhandled exception, this renders instead of the
 * Vercel 5xx page. Keeps the visitor inside our branding and gives
 * them an alternative path forward (WhatsApp).
 */
export default function ApplyError({ error, reset }: Props) {
  useEffect(() => {
    // Surface the error in the browser console for support / debugging.
    // eslint-disable-next-line no-console
    console.error('[apply] route error', error);
  }, [error]);

  return (
    <main className="relative bg-bg text-text min-h-screen">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(198, 255, 61, 0.08) 0%, transparent 55%)',
        }}
      />
      <div className="relative container-safe pt-24 md:pt-28 pb-16 max-w-xl mx-auto">
        <div className="rounded-2xl border border-amber/40 bg-bg-card p-6 md:p-8 text-center space-y-5">
          <div className="inline-flex w-14 h-14 items-center justify-center rounded-full bg-amber/10 text-amber">
            <AlertTriangle size={26} />
          </div>

          <div>
            <div
              className="font-mono uppercase tracking-[0.22em] text-amber font-bold mb-2"
              style={{ fontSize: 12 }}
            >
              Something went sideways
            </div>
            <h1
              className="font-display font-semibold tracking-tight leading-tight"
              style={{ fontSize: 26 }}
            >
              We couldn&apos;t process your application right now.
            </h1>
            <p
              className="text-text-muted leading-relaxed mt-3"
              style={{ fontSize: 15 }}
            >
              This is on us. Your details weren&apos;t saved — please try
              again, or just send us a WhatsApp message and we&apos;ll take
              it from there.
            </p>
          </div>

          {error.digest && (
            <div
              className="rounded-lg bg-bg-elevated border border-border-soft px-3 py-2 font-mono text-text-muted"
              style={{ fontSize: 11, letterSpacing: '0.05em' }}
            >
              ref · {error.digest}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <button
              type="button"
              onClick={reset}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 rounded-full bg-accent text-bg font-semibold hover:bg-accent-hover transition-colors"
              style={{ height: 48, minHeight: 48, fontSize: 15 }}
            >
              <RefreshCw size={14} strokeWidth={2.5} />
              Try again
            </button>
            <a
              href="https://wa.me/447778899345"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 rounded-full bg-[#25D366] text-white font-semibold hover:opacity-90 transition-opacity"
              style={{ height: 48, minHeight: 48, fontSize: 15 }}
            >
              <MessageCircle size={14} strokeWidth={2.5} />
              WhatsApp us
            </a>
          </div>

          <Link
            href="/"
            className="inline-block text-text-muted hover:text-accent transition-colors font-mono uppercase tracking-[0.14em] font-bold"
            style={{ fontSize: 11 }}
          >
            ← back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
