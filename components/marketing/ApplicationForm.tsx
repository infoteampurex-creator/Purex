'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { submitApplication } from '@/lib/actions/applications';
import {
  APPLICATION_SECTIONS,
  isFieldFilled,
  type Field,
} from '@/lib/data/application-sections';

interface Props {
  enquiryId?: string | null;
  prefillEmail?: string;
}

const LOCAL_STORAGE_KEY = 'purex.application.v1';

type Payload = Record<string, Record<string, unknown>>;

export function ApplicationForm({ enquiryId, prefillEmail }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [payload, setPayload] = useState<Payload>({});
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(prefillEmail ?? '');
  const [whatsapp, setWhatsapp] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<{ id: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentSection = APPLICATION_SECTIONS[stepIndex];
  const totalSections = APPLICATION_SECTIONS.length;
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === totalSections - 1;
  const progressPct = ((stepIndex + 1) / totalSections) * 100;

  // localStorage autosave — survives reloads + section navigation
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        payload?: Payload;
        fullName?: string;
        email?: string;
        whatsapp?: string;
        stepIndex?: number;
      };
      if (parsed.payload) setPayload(parsed.payload);
      if (parsed.fullName) setFullName(parsed.fullName);
      if (parsed.email && !prefillEmail) setEmail(parsed.email);
      if (parsed.whatsapp) setWhatsapp(parsed.whatsapp);
      if (typeof parsed.stepIndex === 'number') {
        setStepIndex(Math.max(0, Math.min(totalSections - 1, parsed.stepIndex)));
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      try {
        window.localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify({ payload, fullName, email, whatsapp, stepIndex })
        );
      } catch {
        /* ignore */
      }
    });
    return () => window.cancelAnimationFrame(id);
  }, [payload, fullName, email, whatsapp, stepIndex]);

  // Helpers to read/write section data
  const sectionData = useMemo<Record<string, unknown>>(
    () => payload[currentSection.key] ?? {},
    [payload, currentSection.key]
  );

  const updateField = (fieldKey: string, value: unknown) => {
    setPayload((prev) => ({
      ...prev,
      [currentSection.key]: {
        ...(prev[currentSection.key] ?? {}),
        [fieldKey]: value,
      },
    }));
    const errKey = `${currentSection.key}.${fieldKey}`;
    if (fieldErrors[errKey]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[errKey];
        return next;
      });
    }
  };

  // Capture identity fields from Section 1/2 into the top-level
  // submission shape so the server gets clean separate columns.
  useEffect(() => {
    const welcomeEmail = (
      (payload.welcome as Record<string, unknown>)?.email as string | undefined
    )?.trim();
    if (welcomeEmail && welcomeEmail !== email) setEmail(welcomeEmail);

    const personal = payload.personal_info as Record<string, unknown> | undefined;
    if (personal) {
      const fn = personal.full_name as string | undefined;
      if (fn && fn !== fullName) setFullName(fn);
      const ph = personal.phone as string | undefined;
      if (ph && ph !== whatsapp) setWhatsapp(ph);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload]);

  const validateCurrentSection = (): boolean => {
    const errors: Record<string, string> = {};
    for (const field of currentSection.fields) {
      if (!field.required) continue;
      if (!isFieldFilled(field, sectionData[field.key])) {
        errors[`${currentSection.key}.${field.key}`] = `${field.label} is required.`;
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const goNext = () => {
    if (!validateCurrentSection()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setStepIndex((i) => Math.min(totalSections - 1, i + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setStepIndex((i) => Math.max(0, i - 1));
    setFieldErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateCurrentSection()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setErrorMsg(null);
    startTransition(async () => {
      const fd = new FormData(e.currentTarget);
      const r = await submitApplication({
        email,
        fullName,
        whatsapp: whatsapp.replace(/\D/g, '') || null,
        enquiryId: enquiryId ?? null,
        payload,
        website: fd.get('website')?.toString() ?? '',
      });
      if (!r.ok) {
        setErrorMsg(r.error);
        if (r.fieldErrors) {
          setFieldErrors(r.fieldErrors);
          // Jump to the first section with an error
          const firstErrKey = Object.keys(r.fieldErrors)[0];
          if (firstErrKey) {
            const [sectionKey] = firstErrKey.split('.');
            const idx = APPLICATION_SECTIONS.findIndex((s) => s.key === sectionKey);
            if (idx >= 0) setStepIndex(idx);
          }
        }
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
      className="space-y-7"
      noValidate
    >
      {/* Progress bar + step label */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold">
            Step {stepIndex + 1} of {totalSections}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted font-bold">
            {Math.round(progressPct)}% complete
          </div>
        </div>
        <div className="relative w-full h-1 rounded-full overflow-hidden bg-bg-elevated">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
            style={{
              width: `${progressPct}%`,
              background: '#c6ff3d',
              boxShadow: '0 0 8px rgba(198, 255, 61, 0.4)',
            }}
          />
        </div>
      </div>

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
          Your website
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

      {/* Current section */}
      <section
        key={currentSection.key}
        className="rounded-3xl border border-border bg-bg-card p-6 md:p-8"
      >
        <h2 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">
          {currentSection.title}
        </h2>
        {currentSection.intro && (
          <p
            className="text-text-muted leading-relaxed mt-2 mb-6"
            style={{ fontSize: 15 }}
          >
            {currentSection.intro}
          </p>
        )}

        <div className="space-y-5">
          {currentSection.fields.length === 0 && (
            <div className="rounded-xl border border-border-soft bg-bg-elevated/40 px-4 py-3 text-text-muted text-sm italic">
              This section&apos;s questions are coming soon. Click {isLastStep ? 'Submit' : 'Next'} to continue.
            </div>
          )}
          {currentSection.fields.map((field) => (
            <FieldRenderer
              key={field.key}
              field={field}
              value={sectionData[field.key]}
              onChange={(v) => updateField(field.key, v)}
              error={fieldErrors[`${currentSection.key}.${field.key}`]}
            />
          ))}
        </div>
      </section>

      {/* Footer nav */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={goBack}
          disabled={isFirstStep || isPending}
          className="inline-flex items-center gap-1.5 h-12 px-5 rounded-full border border-border text-sm font-semibold text-text-muted hover:text-text hover:border-text-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-text-dim flex items-center gap-1.5">
          <Save size={11} />
          Auto-saved
        </div>

        {isLastStep ? (
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-accent text-bg text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                Submit application
                <ArrowRight size={14} strokeWidth={2.5} />
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 h-12 px-6 rounded-full bg-accent text-bg text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            Next
            <ArrowRight size={14} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </form>
  );
}

// ─── Field renderer — switches on field.type ────────────────────

function FieldRenderer({
  field,
  value,
  onChange,
  error,
}: {
  field: Field;
  value: unknown;
  onChange: (v: unknown) => void;
  error?: string;
}) {
  const base = cn(
    'w-full h-12 px-4 rounded-lg bg-bg-elevated border text-text transition-colors',
    'focus:outline-none focus:ring-4 focus:ring-accent/20',
    error
      ? 'border-danger focus:border-danger focus:ring-danger/20'
      : 'border-border focus:border-accent'
  );

  const labelBlock = (
    <div className="font-medium text-text mb-1.5" style={{ fontSize: 14 }}>
      {field.label}
      {field.required && <span className="text-accent ml-1">*</span>}
    </div>
  );

  const helpBlock = field.help && !error && (
    <div
      className="text-text-muted leading-relaxed mt-1.5"
      style={{ fontSize: 12.5 }}
    >
      {field.help}
    </div>
  );

  const errorBlock = error && (
    <div
      role="alert"
      className="text-danger mt-1.5 leading-relaxed"
      style={{ fontSize: 12.5 }}
    >
      {error}
    </div>
  );

  switch (field.type) {
    case 'short_text':
    case 'email':
    case 'tel':
      return (
        <label className="block">
          {labelBlock}
          <input
            type={field.type === 'short_text' ? 'text' : field.type}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={base}
            required={field.required}
          />
          {helpBlock}
          {errorBlock}
        </label>
      );

    case 'number':
      return (
        <label className="block">
          {labelBlock}
          <input
            type="number"
            inputMode="numeric"
            value={(value as number | string) ?? ''}
            onChange={(e) => {
              const n = e.target.value === '' ? '' : Number(e.target.value);
              onChange(n);
            }}
            min={field.min}
            max={field.max}
            placeholder={field.placeholder}
            className={cn(base, 'max-w-[200px]')}
            required={field.required}
          />
          {helpBlock}
          {errorBlock}
        </label>
      );

    case 'long_text':
      return (
        <label className="block">
          {labelBlock}
          <textarea
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            placeholder={field.placeholder}
            className={cn(base, 'h-auto py-3 resize-none')}
            style={{ minHeight: 110 }}
            required={field.required}
          />
          {helpBlock}
          {errorBlock}
        </label>
      );

    case 'radio': {
      const selected = value as string | undefined;
      return (
        <fieldset>
          {labelBlock}
          <div className="space-y-2">
            {field.options?.map((opt) => {
              const isOn = selected === opt.value;
              return (
                <label
                  key={opt.value}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all',
                    isOn
                      ? 'border-accent bg-accent/10'
                      : 'border-border-soft hover:border-text-muted'
                  )}
                >
                  <input
                    type="radio"
                    name={field.key}
                    value={opt.value}
                    checked={isOn}
                    onChange={() => onChange(opt.value)}
                    className="sr-only"
                    required={field.required}
                  />
                  <span
                    className={cn(
                      'w-4 h-4 rounded-full border-2 flex-shrink-0',
                      isOn ? 'border-accent' : 'border-border'
                    )}
                  >
                    {isOn && (
                      <span className="block w-2 h-2 rounded-full bg-accent m-0.5" />
                    )}
                  </span>
                  <span
                    className={cn('text-text font-medium', isOn && 'text-accent')}
                    style={{ fontSize: 14 }}
                  >
                    {opt.label}
                  </span>
                </label>
              );
            })}
          </div>
          {helpBlock}
          {errorBlock}
        </fieldset>
      );
    }

    case 'multi_select': {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      const toggle = (v: string) => {
        const set = new Set(selected);
        if (set.has(v)) set.delete(v);
        else set.add(v);
        onChange(Array.from(set));
      };
      return (
        <fieldset>
          {labelBlock}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {field.options?.map((opt) => {
              const isOn = selected.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-all',
                    isOn
                      ? 'border-accent bg-accent/10'
                      : 'border-border-soft hover:border-text-muted'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isOn}
                    onChange={() => toggle(opt.value)}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      'w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center',
                      isOn ? 'bg-accent border-accent' : 'border-border'
                    )}
                  >
                    {isOn && (
                      <CheckCircle2 size={12} className="text-bg" strokeWidth={3} />
                    )}
                  </span>
                  <span
                    className={cn('text-text font-medium', isOn && 'text-accent')}
                    style={{ fontSize: 14 }}
                  >
                    {opt.label}
                  </span>
                </label>
              );
            })}
          </div>
          {helpBlock}
          {errorBlock}
        </fieldset>
      );
    }

    case 'select':
      return (
        <label className="block">
          {labelBlock}
          <select
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={base}
            required={field.required}
          >
            <option value="" disabled>
              Choose one
            </option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {helpBlock}
          {errorBlock}
        </label>
      );

    case 'checkbox':
      return (
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={(value as boolean) ?? false}
            onChange={(e) => onChange(e.target.checked)}
            required={field.required}
            className="w-5 h-5 mt-0.5 accent-accent flex-shrink-0"
          />
          <div className="min-w-0">
            <div className="text-text leading-relaxed" style={{ fontSize: 14 }}>
              {field.label}
              {field.required && <span className="text-accent ml-1">*</span>}
            </div>
            {helpBlock}
            {errorBlock}
          </div>
        </label>
      );

    default:
      return null;
  }
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
          Application submitted
        </div>
        <h2
          className="font-display font-semibold tracking-tight leading-tight"
          style={{ fontSize: 28 }}
        >
          Your coach is reviewing it now.
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
      </div>
      <p
        className="text-text-muted leading-relaxed max-w-md mx-auto"
        style={{ fontSize: 15 }}
      >
        Your coach will reach out on WhatsApp within 48 hours with the next
        step — plan structure, payment, and Day 1 timing.
      </p>
      <Link
        href="/"
        className="inline-block px-6 rounded-full border border-border bg-bg-elevated text-text font-semibold hover:border-text-muted transition-colors"
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
  );
}
