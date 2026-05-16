'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { Camera, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { registerParticipant } from '@/lib/actions/mother-strong';
import {
  GOAL_OPTIONS,
  type PreferredLanguage,
} from '@/lib/data/mother-strong-types';
import { ms } from '@/lib/i18n/mother-strong';

const LOCAL_STORAGE_KEY = 'purex.mother-strong.registration.v1';

interface Props {
  lang: PreferredLanguage;
  whatsappGroupLink: string | null;
}

interface FormState {
  fullName: string;
  whatsapp: string;
  age: string;
  city: string;
  state: string;
  showPhotoPublicly: boolean;
  heightCm: string;
  weightKg: string;
  goal: string;
  healthCondition: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  preferredLanguage: PreferredLanguage;
  consent: boolean;
}

const EMPTY: FormState = {
  fullName: '',
  whatsapp: '',
  age: '',
  city: '',
  state: '',
  showPhotoPublicly: true,
  heightCm: '',
  weightKg: '',
  goal: '',
  healthCondition: '',
  emergencyContactName: '',
  emergencyContactNumber: '',
  preferredLanguage: 'en',
  consent: false,
};

// ─── Component ────────────────────────────────────────────────────

export function RegistrationForm({ lang, whatsappGroupLink }: Props) {
  const t = ms(lang);
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY, preferredLanguage: lang });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState<{
    displayId: string;
    endDate: string;
    whatsappGroupLink: string | null;
  } | null>(null);
  const [duplicate, setDuplicate] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ─── localStorage autosave so a dropped connection doesn't wipe inputs ───
  // Restore on mount.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<FormState>;
      setForm((prev) => ({ ...prev, ...parsed, preferredLanguage: lang }));
    } catch {
      // ignore
    }
  }, [lang]);

  // Persist on change (debounced via rAF).
  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      try {
        // Don't persist the consent box — the user must always re-affirm.
        const { consent: _consent, ...rest } = form;
        void _consent;
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(rest));
      } catch {
        // ignore
      }
    });
    return () => window.cancelAnimationFrame(id);
  }, [form]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear that field's error as soon as the user changes it.
    if (fieldErrors[key as string]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key as string];
        return next;
      });
    }
  };

  const onPhotoChange = (file: File | null) => {
    if (!file) {
      setPhotoPreview(null);
      setPhotoName(null);
      return;
    }
    setPhotoName(file.name);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setDuplicate(false);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const r = await registerParticipant(formData);
      if (!r.ok) {
        if (r.duplicate) {
          setDuplicate(true);
          return;
        }
        setErrorMsg(r.error);
        setFieldErrors(r.fieldErrors ?? {});
        // Scroll to top of form so user sees the error.
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      // Success: clear autosave and show success screen.
      try {
        window.localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch {
        // ignore
      }
      setSuccess({
        displayId: r.displayId,
        endDate: r.endDate,
        whatsappGroupLink: r.whatsappGroupLink,
      });
    });
  };

  // Senior warning shown when age >= 60.
  const ageNum = parseInt(form.age, 10);
  const isSenior = Number.isFinite(ageNum) && ageNum >= 60;

  // ─── Render: success state ───
  if (success) {
    return (
      <SuccessScreen
        t={t}
        displayId={success.displayId}
        endDate={success.endDate}
        whatsappGroupLink={success.whatsappGroupLink ?? whatsappGroupLink}
      />
    );
  }

  // ─── Render: duplicate (friendly redirect to leaderboard / progress) ───
  if (duplicate) {
    return (
      <DuplicateScreen
        t={t}
        whatsapp={form.whatsapp.replace(/\D/g, '')}
        onReset={() => {
          setDuplicate(false);
          setForm((p) => ({ ...p, whatsapp: '' }));
        }}
      />
    );
  }

  // ─── Render: form ───
  return (
    <form
      ref={formRef}
      action="javascript:void(0)"
      onSubmit={handleSubmit}
      className="space-y-6 md:space-y-8"
      noValidate
    >
      {errorMsg && (
        <div
          role="alert"
          className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-danger"
          style={{ fontSize: 15 }}
        >
          {errorMsg}
        </div>
      )}

      {/* Honeypot — hidden from users + assistive tech, but bots fill anything */}
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

      {/* Hidden language field so the action records the user's locale */}
      <input
        type="hidden"
        name="preferredLanguage"
        value={form.preferredLanguage}
      />

      {/* ─── Section 1: Identity ─── */}
      <Section title="About you">
        <Field
          label={t.register.fullName}
          help={t.register.fullNameHelp}
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

        <Field
          label={t.register.whatsapp}
          help={t.register.whatsappHelp}
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
          label={t.register.age}
          help={t.register.ageHelp}
          error={fieldErrors.age}
          required
        >
          <input
            type="number"
            name="age"
            inputMode="numeric"
            min={18}
            max={110}
            value={form.age}
            onChange={(e) => update('age', e.target.value)}
            required
            className={inputClass(!!fieldErrors.age)}
            style={{ maxWidth: 160 }}
          />
        </Field>

        {isSenior && (
          <div
            role="note"
            className="rounded-xl border border-amber/40 bg-amber/10 px-4 py-3 text-amber leading-relaxed"
            style={{ fontSize: 15 }}
          >
            {t.register.seniorWarning}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          <Field label={t.register.city} error={fieldErrors.city} required>
            <input
              type="text"
              name="city"
              autoComplete="address-level2"
              value={form.city}
              onChange={(e) => update('city', e.target.value)}
              required
              className={inputClass(!!fieldErrors.city)}
            />
          </Field>
          <Field label={t.register.state} error={fieldErrors.state} required>
            <input
              type="text"
              name="state"
              autoComplete="address-level1"
              value={form.state}
              onChange={(e) => update('state', e.target.value)}
              required
              className={inputClass(!!fieldErrors.state)}
            />
          </Field>
        </div>
      </Section>

      {/* ─── Section 2: Photo ─── */}
      <Section title={t.register.photo}>
        <p className="text-text-muted leading-relaxed" style={{ fontSize: 15 }}>
          {t.register.photoHelp}
        </p>

        <div className="flex items-start gap-4">
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoPreview}
              alt="Preview"
              className="w-24 h-24 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-text-muted">
              <Camera size={28} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <label
              className="inline-flex items-center gap-2 px-4 rounded-full bg-accent text-bg font-semibold cursor-pointer hover:bg-accent-hover transition-colors"
              style={{ height: 48, minHeight: 48, fontSize: 15 }}
            >
              {photoName ? 'Change photo' : 'Choose photo'}
              <input
                type="file"
                name="photo"
                accept="image/*"
                className="sr-only"
                onChange={(e) => onPhotoChange(e.target.files?.[0] ?? null)}
              />
            </label>
            {photoName && (
              <div className="text-xs text-text-muted mt-2 truncate max-w-[260px]">
                {photoName}
              </div>
            )}
          </div>
        </div>

        <Checkbox
          label={t.register.showPhoto}
          help={t.register.showPhotoHelp}
          name="showPhotoPublicly"
          checked={form.showPhotoPublicly}
          onChange={(v) => update('showPhotoPublicly', v)}
        />
      </Section>

      {/* ─── Section 3: Vitals + goal ─── */}
      <Section title="Goal and basics">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          <Field label={t.register.height}>
            <input
              type="number"
              name="heightCm"
              inputMode="numeric"
              min={100}
              max={250}
              value={form.heightCm}
              onChange={(e) => update('heightCm', e.target.value)}
              className={inputClass(false)}
              style={{ maxWidth: 220 }}
            />
          </Field>
          <Field label={t.register.weight}>
            <input
              type="number"
              name="weightKg"
              inputMode="decimal"
              min={25}
              max={250}
              step={0.1}
              value={form.weightKg}
              onChange={(e) => update('weightKg', e.target.value)}
              className={inputClass(false)}
              style={{ maxWidth: 220 }}
            />
          </Field>
        </div>

        <Field
          label={t.register.goal}
          help={t.register.goalHelp}
          error={fieldErrors.goal}
          required
        >
          <select
            name="goal"
            value={form.goal}
            onChange={(e) => update('goal', e.target.value)}
            required
            className={inputClass(!!fieldErrors.goal)}
          >
            <option value="" disabled>
              {t.register.goal}
            </option>
            {GOAL_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>
                {t.goal[g.value]}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label={t.register.healthCondition}
          help={t.register.healthConditionHelp}
        >
          <textarea
            name="healthCondition"
            rows={3}
            value={form.healthCondition}
            onChange={(e) => update('healthCondition', e.target.value)}
            className={inputClass(false) + ' resize-none'}
          />
        </Field>
      </Section>

      {/* ─── Section 4: Emergency contact ─── */}
      <Section title="Emergency contact">
        <p className="text-text-muted leading-relaxed" style={{ fontSize: 15 }}>
          Someone we can call only if there is a real emergency.
        </p>

        <Field
          label={t.register.emergencyName}
          error={fieldErrors.emergencyContactName}
          required
        >
          <input
            type="text"
            name="emergencyContactName"
            value={form.emergencyContactName}
            onChange={(e) => update('emergencyContactName', e.target.value)}
            required
            className={inputClass(!!fieldErrors.emergencyContactName)}
          />
        </Field>

        <Field
          label={t.register.emergencyNumber}
          help={t.register.emergencyNumberHelp}
          error={fieldErrors.emergencyContactNumber}
          required
        >
          <input
            type="tel"
            name="emergencyContactNumber"
            inputMode="numeric"
            value={form.emergencyContactNumber}
            onChange={(e) => update('emergencyContactNumber', e.target.value)}
            required
            className={inputClass(!!fieldErrors.emergencyContactNumber)}
          />
        </Field>
      </Section>

      {/* ─── Section 5: Consent ─── */}
      <Section title="Consent">
        <Checkbox
          label={t.register.consent}
          name="consent"
          required
          checked={form.consent}
          onChange={(v) => update('consent', v)}
          error={fieldErrors.consent}
        />
      </Section>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full inline-flex items-center justify-center gap-3 rounded-full bg-accent text-bg font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ height: 56, minHeight: 56, fontSize: 18 }}
      >
        {isPending ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            {t.register.submitting}
          </>
        ) : (
          t.register.submit
        )}
      </button>
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
    <fieldset className="space-y-5 md:space-y-6 pt-2">
      <legend
        className="font-display font-semibold tracking-tight"
        style={{ fontSize: 22 }}
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
      <div
        className="font-medium text-text mb-2"
        style={{ fontSize: 16 }}
      >
        {label}
        {required && <span className="text-accent ml-1">*</span>}
      </div>
      {children}
      {help && (
        <div
          className="text-text-muted leading-relaxed mt-2"
          style={{ fontSize: 14 }}
        >
          {help}
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="text-danger mt-2 leading-relaxed"
          style={{ fontSize: 14 }}
        >
          {error}
        </div>
      )}
    </label>
  );
}

function Checkbox({
  label,
  help,
  name,
  checked,
  onChange,
  required,
  error,
}: {
  label: string;
  help?: string;
  name: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  required?: boolean;
  error?: string;
}) {
  return (
    <div>
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          required={required}
          className="w-6 h-6 mt-1 accent-accent flex-shrink-0"
        />
        <span
          className="text-text leading-relaxed"
          style={{ fontSize: 16 }}
        >
          {label}
        </span>
      </label>
      {help && (
        <div
          className="text-text-muted leading-relaxed mt-1 pl-9"
          style={{ fontSize: 14 }}
        >
          {help}
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="text-danger mt-1 pl-9 leading-relaxed"
          style={{ fontSize: 14 }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

function inputClass(invalid: boolean): string {
  return cn(
    'w-full px-4 rounded-lg bg-bg-elevated border text-text transition-colors',
    'focus:outline-none focus:ring-4 focus:ring-accent/20',
    invalid
      ? 'border-danger focus:border-danger focus:ring-danger/20'
      : 'border-border focus:border-accent'
  );
}

// SuccessScreen + DuplicateScreen are rendered in place of the form on
// the same component, so they live alongside RegistrationForm.

function SuccessScreen({
  t,
  displayId,
  endDate,
  whatsappGroupLink,
}: {
  t: ReturnType<typeof ms>;
  displayId: string;
  endDate: string;
  whatsappGroupLink: string | null;
}) {
  const endDateFormatted = new Date(endDate + 'T00:00:00').toLocaleDateString(
    'en-GB',
    { day: 'numeric', month: 'long', year: 'numeric' }
  );

  const copyId = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(displayId).catch(() => {});
    }
  };

  return (
    <div className="rounded-2xl border border-accent/40 bg-bg-card p-6 md:p-10 text-center space-y-6">
      <div className="inline-flex w-14 h-14 items-center justify-center rounded-full bg-accent/10 text-accent">
        <CheckCircle2 size={28} />
      </div>

      <div>
        <div
          className="font-mono uppercase tracking-[0.22em] text-accent font-bold mb-2"
          style={{ fontSize: 14 }}
        >
          {t.register.successTitle}
        </div>
        <h2
          className="font-display font-semibold tracking-tight leading-tight"
          style={{ fontSize: 26 }}
        >
          Welcome to PUREX Mother Strong.
        </h2>
      </div>

      <div className="rounded-xl bg-bg-elevated border border-border-soft px-6 py-6">
        <div
          className="font-mono uppercase tracking-[0.18em] text-text-muted font-bold mb-2"
          style={{ fontSize: 13 }}
        >
          {t.register.successId}
        </div>
        <div
          className="font-display font-bold text-accent tracking-tight"
          style={{ fontSize: 56, letterSpacing: '-0.02em' }}
        >
          {displayId}
        </div>
        <button
          type="button"
          onClick={copyId}
          className="mt-2 text-text-muted hover:text-accent transition-colors font-mono uppercase tracking-[0.14em] font-bold"
          style={{ fontSize: 12, minHeight: 44 }}
        >
          Tap to copy
        </button>
      </div>

      <p
        className="text-text-muted leading-relaxed max-w-md mx-auto"
        style={{ fontSize: 16 }}
      >
        {t.register.successSave}
      </p>

      <div className="space-y-3 max-w-sm mx-auto">
        {whatsappGroupLink && (
          <a
            href={whatsappGroupLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full px-4 rounded-full bg-[#25D366] text-white font-semibold transition-opacity hover:opacity-90"
            style={{
              height: 56,
              minHeight: 56,
              fontSize: 17,
              lineHeight: '56px',
            }}
          >
            {t.register.successJoin}
          </a>
        )}
        <Link
          href={`/mother-strong/my-progress?id=${displayId}`}
          className="block w-full px-4 rounded-full border border-accent/40 bg-accent/5 text-accent font-semibold hover:bg-accent/10 transition-colors"
          style={{
            height: 56,
            minHeight: 56,
            fontSize: 17,
            lineHeight: '56px',
          }}
        >
          {t.register.successProgressLink}
        </Link>
      </div>

      <div
        className="pt-4 border-t border-border-soft text-text-muted"
        style={{ fontSize: 14 }}
      >
        {t.register.successEnd}:{' '}
        <span className="text-text font-medium">{endDateFormatted}</span>
      </div>
    </div>
  );
}

function DuplicateScreen({
  t,
  whatsapp,
  onReset,
}: {
  t: ReturnType<typeof ms>;
  whatsapp: string;
  onReset: () => void;
}) {
  return (
    <div className="rounded-2xl border border-amber/40 bg-amber/5 p-6 md:p-8 text-center space-y-5">
      <h2
        className="font-display font-semibold tracking-tight"
        style={{ fontSize: 22 }}
      >
        {t.register.duplicateTitle}
      </h2>
      <p
        className="text-text-muted leading-relaxed max-w-md mx-auto"
        style={{ fontSize: 16 }}
      >
        {t.register.duplicateBody}
      </p>
      <div className="flex flex-col md:flex-row items-center justify-center gap-3 max-w-md mx-auto">
        <Link
          href={`/mother-strong/my-progress?id=${whatsapp}`}
          className="inline-flex items-center justify-center gap-2 w-full md:w-auto px-5 rounded-full bg-accent text-bg font-semibold"
          style={{ height: 48, minHeight: 48, fontSize: 15 }}
        >
          {t.register.duplicateProgress}
        </Link>
        <Link
          href="/mother-strong/leaderboard"
          className="inline-flex items-center justify-center gap-2 w-full md:w-auto px-5 rounded-full border border-border bg-bg-elevated text-text font-semibold"
          style={{ height: 48, minHeight: 48, fontSize: 15 }}
        >
          {t.register.duplicateLeaderboard}
        </Link>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="text-text-muted hover:text-text font-mono uppercase tracking-[0.14em] font-bold"
        style={{ fontSize: 12, minHeight: 44 }}
      >
        Use a different number
      </button>
    </div>
  );
}
