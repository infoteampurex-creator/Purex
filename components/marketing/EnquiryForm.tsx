'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Loader2,
  MessageCircle,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { submitEnquiry } from '@/lib/actions/enquiries';
import {
  PRIMARY_GOAL_OPTIONS,
  START_TIMING_OPTIONS,
} from '@/lib/data/enquiries-types';

const LOCAL_STORAGE_KEY = 'purex.apply.v1';

interface FormState {
  fullName: string;
  whatsapp: string;
  email: string;
  primaryGoal: string;
  startTiming: string;
  message: string;
  consent: boolean;
}

const EMPTY: FormState = {
  fullName: '',
  whatsapp: '',
  email: '',
  primaryGoal: '',
  startTiming: '',
  message: '',
  consent: false,
};

export function EnquiryForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [success, setSuccess] = useState<{ id: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  // localStorage autosave — survives page reloads. Consent never persists.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<FormState>;
      setForm((prev) => ({ ...prev, ...parsed, consent: false }));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      try {
        const { consent: _c, ...rest } = form;
        void _c;
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(rest));
      } catch {
        /* ignore */
      }
    });
    return () => window.cancelAnimationFrame(id);
  }, [form]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key as string]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key as string];
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await submitEnquiry(formData);
      if (!r.ok) {
        setErrorMsg(r.error);
        setFieldErrors(r.fieldErrors ?? {});
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      try {
        window.localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch {
        /* ignore */
      }
      setSuccess({ id: r.id });
    });
  };

  if (success) {
    return <SuccessScreen referenceId={success.id} />;
  }

  return (
    <form
      ref={formRef}
      action="javascript:void(0)"
      onSubmit={handleSubmit}
      className="space-y-6 md:space-y-7"
      noValidate
    >
      {errorMsg && (
        <div
          role="alert"
          className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-danger"
          style={{ fontSize: 14 }}
        >
          {errorMsg}
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
          Your website (leave blank)
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value=""
            onChange={() => {}}
          />
        </label>
      </div>

      {/* Hidden source attribution */}
      <input
        type="hidden"
        name="source"
        value={
          typeof window !== 'undefined' ? document.referrer || 'direct' : ''
        }
      />

      <Section title="About you">
        <Field
          label="Full name"
          error={fieldErrors.fullName}
          required
        >
          <input
            type="text"
            name="fullName"
            autoComplete="name"
            value={form.fullName}
            onChange={(e) => update('fullName', e.target.value)}
            required
            className={inputClass(!!fieldErrors.fullName)}
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          <Field
            label="WhatsApp number"
            help="Ten digits, no +91 needed."
            error={fieldErrors.whatsapp}
            required
          >
            <input
              type="tel"
              name="whatsapp"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="9876543210"
              value={form.whatsapp}
              onChange={(e) => update('whatsapp', e.target.value)}
              required
              className={inputClass(!!fieldErrors.whatsapp)}
            />
          </Field>
          <Field
            label="Email"
            error={fieldErrors.email}
            required
          >
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              required
              className={inputClass(!!fieldErrors.email)}
            />
          </Field>
        </div>
      </Section>

      <Section title="What you're after">
        <Field
          label="Primary goal"
          help="The one outcome that matters most right now."
          error={fieldErrors.primaryGoal}
          required
        >
          <select
            name="primaryGoal"
            value={form.primaryGoal}
            onChange={(e) => update('primaryGoal', e.target.value)}
            required
            className={cn(inputClass(!!fieldErrors.primaryGoal), 'pr-10')}
          >
            <option value="" disabled>
              Choose one
            </option>
            {PRIMARY_GOAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="When can you start?"
          error={fieldErrors.startTiming}
          required
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {START_TIMING_OPTIONS.map((o) => {
              const selected = form.startTiming === o.value;
              return (
                <label
                  key={o.value}
                  className={cn(
                    'cursor-pointer rounded-xl border px-3 py-2.5 transition-all',
                    selected
                      ? 'border-accent bg-accent/10'
                      : 'border-border-soft bg-bg-card/40 hover:border-text-muted'
                  )}
                >
                  <input
                    type="radio"
                    name="startTiming"
                    value={o.value}
                    checked={selected}
                    onChange={(e) => update('startTiming', e.target.value)}
                    className="sr-only"
                    required
                  />
                  <div
                    className={cn(
                      'font-display font-semibold',
                      selected ? 'text-accent' : 'text-text'
                    )}
                    style={{ fontSize: 14 }}
                  >
                    {o.label}
                  </div>
                  <div
                    className="text-text-muted leading-tight mt-0.5"
                    style={{ fontSize: 11.5 }}
                  >
                    {o.help}
                  </div>
                </label>
              );
            })}
          </div>
        </Field>

        <Field
          label="Anything you'd like us to know? (optional)"
          help="Injuries, schedule constraints, past coaches, why now."
        >
          <textarea
            name="message"
            rows={4}
            value={form.message}
            onChange={(e) => update('message', e.target.value)}
            className={cn(inputClass(false), 'resize-none')}
            style={{ minHeight: 110 }}
          />
        </Field>
      </Section>

      <Section title="Consent">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="consent"
            checked={form.consent}
            onChange={(e) => update('consent', e.target.checked)}
            required
            className="w-5 h-5 mt-0.5 accent-accent flex-shrink-0"
          />
          <span
            className="text-text leading-relaxed"
            style={{ fontSize: 14 }}
          >
            I&apos;m at least 18 years old and consent to PURE X reaching me on
            WhatsApp and email about my application. My details stay private.
          </span>
        </label>
        {fieldErrors.consent && (
          <div
            role="alert"
            className="text-danger mt-1 ml-8 leading-relaxed"
            style={{ fontSize: 13 }}
          >
            {fieldErrors.consent}
          </div>
        )}
      </Section>

      <button
        type="submit"
        disabled={isPending}
        className="w-full inline-flex items-center justify-center gap-3 rounded-full bg-accent text-bg font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ height: 56, minHeight: 56, fontSize: 17 }}
      >
        {isPending ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Sending your application…
          </>
        ) : (
          <>
            Submit application
            <ArrowRight size={17} strokeWidth={2.5} />
          </>
        )}
      </button>

      <div
        className="text-text-dim text-center leading-relaxed"
        style={{ fontSize: 12 }}
      >
        Prefer to skip the form? You can{' '}
        <Link
          href="/book"
          className="text-text-muted hover:text-accent underline transition-colors"
        >
          book a discovery call directly
        </Link>
        .
      </div>
    </form>
  );
}

// ─── Sub-components ───────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-4 md:space-y-5">
      <legend
        className="font-display font-semibold tracking-tight"
        style={{ fontSize: 20 }}
      >
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  help,
  error,
  required,
  children,
}: {
  label: string;
  help?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="font-medium text-text mb-1.5" style={{ fontSize: 14 }}>
        {label}
        {required && <span className="text-accent ml-1">*</span>}
      </div>
      {children}
      {help && !error && (
        <div
          className="text-text-muted leading-relaxed mt-1.5"
          style={{ fontSize: 12.5 }}
        >
          {help}
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="text-danger mt-1.5 leading-relaxed"
          style={{ fontSize: 12.5 }}
        >
          {error}
        </div>
      )}
    </label>
  );
}

function inputClass(invalid: boolean): string {
  return cn(
    'w-full h-12 px-4 rounded-lg bg-bg-elevated border text-text transition-colors',
    'focus:outline-none focus:ring-4 focus:ring-accent/20',
    invalid
      ? 'border-danger focus:border-danger focus:ring-danger/20'
      : 'border-border focus:border-accent'
  );
}

// ─── Success screen ──────────────────────────────────────────────

function SuccessScreen({ referenceId }: { referenceId: string }) {
  const shortRef = referenceId.slice(0, 8).toUpperCase();
  return (
    <div className="rounded-2xl border border-accent/40 bg-bg-card p-6 md:p-10 text-center space-y-6">
      <div className="inline-flex w-14 h-14 items-center justify-center rounded-full bg-accent/10 text-accent">
        <CheckCircle2 size={28} />
      </div>

      <div>
        <div
          className="font-mono uppercase tracking-[0.22em] text-accent font-bold mb-2"
          style={{ fontSize: 13 }}
        >
          Application received
        </div>
        <h2
          className="font-display font-semibold tracking-tight leading-tight"
          style={{ fontSize: 28 }}
        >
          We&apos;ll reach out within 24 hours.
        </h2>
      </div>

      <div className="rounded-xl bg-bg-elevated border border-border-soft px-6 py-5">
        <div
          className="font-mono uppercase tracking-[0.18em] text-text-muted font-bold mb-1.5"
          style={{ fontSize: 11 }}
        >
          Reference
        </div>
        <div
          className="font-display font-bold text-accent tracking-tight"
          style={{ fontSize: 40, letterSpacing: '-0.02em' }}
        >
          {shortRef}
        </div>
        <div
          className="text-text-muted mt-1 font-mono"
          style={{ fontSize: 11 }}
        >
          Keep this for your records.
        </div>
      </div>

      <p
        className="text-text-muted leading-relaxed max-w-md mx-auto"
        style={{ fontSize: 15 }}
      >
        A coach from our team will message you on WhatsApp within the next
        24 hours. We read every application personally — no chatbots.
      </p>

      <div className="space-y-3 max-w-sm mx-auto">
        <a
          href="https://wa.me/447778899345"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full px-4 rounded-full bg-[#25D366] text-white font-semibold transition-opacity hover:opacity-90"
          style={{
            height: 52,
            minHeight: 52,
            fontSize: 16,
            lineHeight: '52px',
          }}
        >
          <span className="inline-flex items-center gap-2 align-middle">
            <MessageCircle size={15} strokeWidth={2.5} />
            Or message us directly
          </span>
        </a>
        <Link
          href="/"
          className="block w-full px-4 rounded-full border border-border bg-bg-elevated text-text font-semibold hover:border-text-muted transition-colors"
          style={{
            height: 52,
            minHeight: 52,
            fontSize: 16,
            lineHeight: '52px',
          }}
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
