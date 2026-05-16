'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';

interface Props {
  initialQuery: string;
  /** True only if the visitor submitted a query that returned no match. */
  notFound: boolean;
}

/**
 * Lookup form for /mother-strong/my-progress.
 *
 * Accepts either a 10-digit WhatsApp number or a PX-id (PX001 .. PX999999).
 * On submit, navigates to `?id=...` so the server component re-renders
 * with the matching progress.
 */
export function MyProgressLookup({ initialQuery, notFound }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const [busy, setBusy] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    const cleaned = value.trim();
    if (!cleaned) {
      setValidationError('Enter your PX-id or WhatsApp number.');
      return;
    }
    // Quick client-side sanity check — server still validates strictly.
    const looksLikeId = /^PX\d{3,6}$/i.test(cleaned);
    const digitsOnly = cleaned.replace(/\D/g, '');
    const looksLikeWhatsapp = /^\d{10}$/.test(digitsOnly);
    if (!looksLikeId && !looksLikeWhatsapp) {
      setValidationError(
        'That doesn\'t look right. Use PX001 (or similar) or a 10-digit WhatsApp number.'
      );
      return;
    }
    setBusy(true);
    const param = looksLikeId ? cleaned.toUpperCase() : digitsOnly;
    router.push(`/mother-strong/my-progress?id=${encodeURIComponent(param)}`);
  };

  return (
    <div className="max-w-xl">
      <form
        onSubmit={onSubmit}
        className="rounded-2xl bg-bg-card border border-border p-5 md:p-6 space-y-4"
      >
        <label className="block">
          <div
            className="font-medium text-text mb-2"
            style={{ fontSize: 16 }}
          >
            PX-id or WhatsApp number
          </div>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              inputMode="text"
              autoComplete="off"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="PX001 or 9876543210"
              className="w-full pl-11 pr-4 rounded-lg bg-bg-elevated border border-border text-text transition-colors focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/20"
              style={{ height: 48, fontSize: 17 }}
              autoFocus
            />
          </div>
          {validationError && (
            <div
              role="alert"
              className="text-danger mt-2 leading-relaxed"
              style={{ fontSize: 14 }}
            >
              {validationError}
            </div>
          )}
        </label>

        <button
          type="submit"
          disabled={busy}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-accent text-bg font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ height: 48, minHeight: 48, fontSize: 16 }}
        >
          {busy ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Looking up…
            </>
          ) : (
            'Show my progress'
          )}
        </button>
      </form>

      {notFound && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-amber/40 bg-amber/10 px-4 py-3 text-amber leading-relaxed"
          style={{ fontSize: 15 }}
        >
          We couldn&apos;t find a registration matching that ID or number. Make
          sure you typed it exactly as it appeared on your confirmation
          screen — or ask the trainer to double-check the cohort list.
        </div>
      )}

      <div
        className="mt-6 text-text-muted leading-relaxed"
        style={{ fontSize: 14 }}
      >
        Haven&apos;t registered yet?{' '}
        <a href="/mother-strong" className="text-accent hover:underline">
          Join the cohort
        </a>
        .
      </div>
    </div>
  );
}
