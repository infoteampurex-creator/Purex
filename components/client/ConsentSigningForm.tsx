'use client';

import { useMemo, useState, useTransition } from 'react';
import { Loader2, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/cn';
import { signConsent } from '@/lib/actions/consent';
import {
  CONSENT_DOCUMENT,
  CONSENT_BOXES,
  CURRENT_CONSENT_VERSION,
  type ConsentBoxKey,
} from '@/lib/data/consent-text';

interface Props {
  /** Pre-fill if we already know it (typed by hand counts as e-sign). */
  initialName?: string;
  /** Where to send the client after signing. */
  redirectTo?: string;
}

/**
 * Client-facing consent signing surface. Renders the versioned legal
 * text, granular checkboxes, and a typed-name signature.
 *
 * Compliance shape (UK GDPR / US state / UAE / India DPDP):
 *   • All boxes start UNCHECKED (no pre-ticked consent)
 *   • Mandatory boxes are clearly marked
 *   • Optional boxes are obviously optional
 *   • Signing requires typed name — acts as the e-signature
 *   • Submit only enables when mandatory boxes + name are in
 */
export function ConsentSigningForm({
  initialName = '',
  redirectTo = '/client/dashboard',
}: Props) {
  const [boxes, setBoxes] = useState<Record<ConsentBoxKey, boolean>>(
    () =>
      Object.fromEntries(
        CONSENT_BOXES.map((b) => [b.key, false])
      ) as Record<ConsentBoxKey, boolean>
  );
  const [signedName, setSignedName] = useState(initialName);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const today = useMemo(
    () =>
      new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    []
  );

  const requiredOk = useMemo(
    () =>
      CONSENT_BOXES.filter((b) => b.required).every((b) => boxes[b.key]),
    [boxes]
  );
  const canSubmit = requiredOk && signedName.trim().length >= 2;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;
    setErrorMsg(null);
    startTransition(async () => {
      const fd = new FormData(e.currentTarget);
      const r = await signConsent({
        signedName: signedName.trim(),
        agreedToTerms: boxes.agreed_to_terms,
        agreedToDataCollection: boxes.agreed_to_data_collection,
        agreedToProgressPhotos: boxes.agreed_to_progress_photos,
        agreedToMarketingUse: boxes.agreed_to_marketing_use,
        agreedToWhatsapp: boxes.agreed_to_whatsapp,
        agreedToEmail: boxes.agreed_to_email,
        agreedToPhone: boxes.agreed_to_phone,
        agreedToPush: boxes.agreed_to_push,
        website: fd.get('website')?.toString() ?? '',
        redirectTo,
      });
      // signConsent calls redirect() on success — only reach here if it failed.
      if (r && !r.ok) {
        setErrorMsg(r.error);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {errorMsg && (
        <div
          role="alert"
          className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-danger flex items-start gap-2.5"
          style={{ fontSize: 14 }}
        >
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Honeypot */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        <label>
          Your website
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
          />
        </label>
      </div>

      {/* Versioned legal document */}
      <article className="rounded-2xl border border-border bg-bg-card p-5 md:p-7">
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-accent" strokeWidth={2.5} />
            <h2 className="font-display font-semibold text-xl tracking-tight">
              Client Consent &amp; Privacy Agreement
            </h2>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold">
            {CURRENT_CONSENT_VERSION} · {today}
          </span>
        </div>

        <div
          className="space-y-5 max-h-[480px] overflow-y-auto pr-2"
          style={{ scrollbarGutter: 'stable' }}
        >
          {CONSENT_DOCUMENT.map((section, idx) => (
            <section key={idx}>
              <h3 className="font-display font-semibold text-base mb-2 text-text">
                {section.title}
              </h3>
              {section.paragraphs.map((p, i) => (
                <p
                  key={i}
                  className="text-text-muted leading-relaxed mb-2"
                  style={{ fontSize: 14 }}
                >
                  {p}
                </p>
              ))}
              {section.bullets && (
                <ul
                  className="list-disc pl-5 space-y-1 text-text-muted leading-relaxed"
                  style={{ fontSize: 14 }}
                >
                  {section.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
        <p className="text-xs text-text-muted font-mono uppercase tracking-[0.14em] mt-5 pt-4 border-t border-border-soft">
          Train For Life. Not Just Aesthetics.
        </p>
      </article>

      {/* Granular consent boxes */}
      <fieldset className="rounded-2xl border border-border bg-bg-card p-5 md:p-7">
        <legend className="px-2">
          <span className="font-display font-semibold text-lg tracking-tight">
            10. Your consent
          </span>
        </legend>
        <p className="text-text-muted text-sm mb-4">
          Please tick the boxes that apply. Items marked{' '}
          <span className="text-accent font-semibold">required</span> must be
          ticked to use the coaching app. You can change optional choices any
          time in your Account settings.
        </p>

        <div className="space-y-3">
          {CONSENT_BOXES.map((b) => {
            const on = boxes[b.key as ConsentBoxKey];
            return (
              <label
                key={b.key}
                className={cn(
                  'flex items-start gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all',
                  on
                    ? 'border-accent/50 bg-accent/5'
                    : 'border-border-soft hover:border-text-muted'
                )}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) =>
                    setBoxes((prev) => ({
                      ...prev,
                      [b.key]: e.target.checked,
                    }))
                  }
                  className="sr-only"
                />
                <span
                  className={cn(
                    'w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors',
                    on ? 'bg-accent border-accent' : 'border-border'
                  )}
                >
                  {on && (
                    <CheckCircle2 size={14} className="text-bg" strokeWidth={3} />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="text-text leading-relaxed block" style={{ fontSize: 14 }}>
                    {b.label}
                    {b.required && (
                      <span className="text-accent ml-2 font-mono text-[10px] uppercase tracking-[0.14em] font-bold">
                        required
                      </span>
                    )}
                  </span>
                  {b.help && (
                    <span
                      className="text-text-muted leading-relaxed mt-1 block"
                      style={{ fontSize: 12.5 }}
                    >
                      {b.help}
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Signature */}
      <fieldset className="rounded-2xl border border-border bg-bg-card p-5 md:p-7">
        <legend className="px-2">
          <span className="font-display font-semibold text-lg tracking-tight">
            Sign
          </span>
        </legend>
        <p className="text-text-muted text-sm mb-4">
          Type your full legal name. Your typed name acts as your signature on
          this agreement.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold mb-1.5 block">
              Client name (signature)
            </label>
            <input
              type="text"
              value={signedName}
              onChange={(e) => setSignedName(e.target.value)}
              placeholder="Your full legal name"
              className="w-full h-12 px-4 rounded-lg bg-bg-elevated border border-border text-text focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/20"
              style={{
                fontFamily:
                  "'Brush Script MT', 'Lucida Handwriting', cursive",
                fontSize: 22,
              }}
              autoComplete="name"
              required
            />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold mb-1.5 block">
              Date
            </label>
            <div
              className="w-full h-12 px-4 rounded-lg bg-bg-elevated/40 border border-border-soft text-text-muted flex items-center font-mono"
              style={{ fontSize: 13 }}
            >
              {today}
            </div>
          </div>
        </div>
      </fieldset>

      {/* Submit */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-text-muted leading-relaxed sm:max-w-md">
          By signing, you confirm you have read and understood this agreement
          and consent to the items you ticked above. A copy of this consent —
          including the version, date and time, and your IP address — is
          stored for compliance purposes.
        </p>
        <button
          type="submit"
          disabled={!canSubmit || isPending}
          className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-accent text-bg text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[180px]"
        >
          {isPending ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <CheckCircle2 size={14} strokeWidth={2.5} />
              Sign agreement
            </>
          )}
        </button>
      </div>
    </form>
  );
}
