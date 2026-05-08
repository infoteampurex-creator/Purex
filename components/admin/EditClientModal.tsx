'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, X } from 'lucide-react';
import { FALLBACK_EXPERTS, FALLBACK_PROGRAMS } from '@/lib/constants';
import { cn } from '@/lib/cn';
import { updateClient } from '@/lib/actions/clients';

interface EditClientModalProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  initial: {
    fullName: string;
    phone?: string | null;
    planSlug?: string | null;
    coachSlug?: string | null;
    status: 'active' | 'paused' | 'completed' | 'cancelled' | 'onboarding';
  };
}

const STATUS_OPTIONS: Array<{
  value: 'active' | 'onboarding' | 'paused' | 'completed' | 'cancelled';
  label: string;
}> = [
  { value: 'active', label: 'Active' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function EditClientModal({
  open,
  onClose,
  clientId,
  initial,
}: EditClientModalProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initial.fullName);
  const [phone, setPhone] = useState(initial.phone ?? '');
  const [planSlug, setPlanSlug] = useState(initial.planSlug ?? '');
  const [coachSlug, setCoachSlug] = useState(initial.coachSlug ?? '');
  const [status, setStatus] = useState<typeof initial.status>(initial.status);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setFullName(initial.fullName);
      setPhone(initial.phone ?? '');
      setPlanSlug(initial.planSlug ?? '');
      setCoachSlug(initial.coachSlug ?? '');
      setStatus(initial.status);
      setSubmitting(false);
      setSuccess(false);
      setErrorMsg(null);
      setFieldErrors({});
    }
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setFieldErrors({});

    const result = await updateClient({
      clientId,
      fullName: fullName.trim() || undefined,
      phone: phone.trim() === '' ? null : phone.trim(),
      planSlug: planSlug || null,
      coachSlug: coachSlug || null,
      status,
    });

    setSubmitting(false);

    if (!result.ok) {
      setErrorMsg(result.error);
      setFieldErrors(result.fieldErrors ?? {});
      return;
    }

    setSuccess(true);
    router.refresh();
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1100);
  };

  const statusValueIfActive = status === 'active';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6"
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-bg-card border-t md:border md:rounded-2xl border-border shadow-2xl overflow-hidden"
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-bg/90 border border-border-soft flex items-center justify-center hover:border-accent/40 transition-all"
            >
              <X size={14} strokeWidth={2.5} />
            </button>

            {/* Header */}
            <div className="px-6 md:px-8 pt-7 pb-5 border-b border-border-soft">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-1.5">
                Edit client
              </div>
              <h2 className="font-display font-semibold text-2xl tracking-tight">
                {initial.fullName}
              </h2>
              <p className="text-sm text-text-muted mt-1.5">
                Update profile, plan, coach, and onboarding status.
              </p>
            </div>

            {/* Body */}
            <form
              onSubmit={handleSave}
              className="px-6 md:px-8 py-6 space-y-5 max-h-[60vh] overflow-y-auto"
            >
              <Field label="Full name *" error={fieldErrors.fullName}>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={cn(
                    'w-full bg-bg-elevated border rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-colors',
                    fieldErrors.fullName
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-border focus:border-accent'
                  )}
                />
              </Field>

              <Field label="Phone">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-sm placeholder:text-text-dim focus:border-accent focus:outline-none transition-colors"
                />
              </Field>

              <Field label="Plan tier">
                <select
                  value={planSlug}
                  onChange={(e) => setPlanSlug(e.target.value)}
                  className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-sm focus:border-accent focus:outline-none transition-colors"
                >
                  <option value="">— No plan —</option>
                  {FALLBACK_PROGRAMS.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name} — {p.priceDisplay}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Assigned coach">
                <select
                  value={coachSlug}
                  onChange={(e) => setCoachSlug(e.target.value)}
                  className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-sm focus:border-accent focus:outline-none transition-colors"
                >
                  <option value="">— Unassigned —</option>
                  {FALLBACK_EXPERTS.map((expert) => (
                    <option key={expert.slug} value={expert.slug}>
                      {expert.name} — {expert.shortRole}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Status">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {STATUS_OPTIONS.map((opt) => {
                    const selected = status === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setStatus(opt.value)}
                        className={cn(
                          'h-10 rounded-lg border text-xs font-medium transition-colors',
                          selected
                            ? 'bg-accent text-bg border-accent'
                            : 'bg-bg-elevated border-border text-text hover:border-accent/50'
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                {statusValueIfActive && !planSlug && (
                  <div className="text-[10px] text-amber font-mono mt-2">
                    Tip: pick a plan above before saving as active, or the
                    client will show as active without an assigned programme.
                  </div>
                )}
              </Field>

              {errorMsg && (
                <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                  {errorMsg}
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="px-6 md:px-8 py-4 border-t border-border-soft flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="text-sm text-text-muted hover:text-text transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSave}
                disabled={submitting || success}
                className={cn(
                  'inline-flex items-center gap-2 h-10 px-5 rounded-full text-sm font-semibold transition-colors',
                  success
                    ? 'bg-success text-bg'
                    : 'bg-accent text-bg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {success ? (
                  <>✓ Saved</>
                ) : submitting ? (
                  <>Saving…</>
                ) : (
                  <>
                    <Save size={13} strokeWidth={2.5} />
                    Save changes
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted font-bold mb-1.5">
        {label}
      </div>
      {children}
      {error && (
        <div className="text-[10px] text-rose-400 font-mono mt-1.5">{error}</div>
      )}
    </label>
  );
}
