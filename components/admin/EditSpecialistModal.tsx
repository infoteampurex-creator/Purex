'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { updateSpecialist } from '@/lib/actions/specialists';

interface EditSpecialistModalProps {
  open: boolean;
  onClose: () => void;
  expertId: string;
  initial: {
    name: string;
    title: string;
    shortRole: string;
    location: string;
    calendlyUrl: string;
    photoUrl: string;
    bioShort: string;
    clientsTrained: number;
    isActive: boolean;
  };
}

export function EditSpecialistModal({
  open,
  onClose,
  expertId,
  initial,
}: EditSpecialistModalProps) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm(initial);
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

  const update = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setFieldErrors({});

    const result = await updateSpecialist({
      expertId,
      name: form.name.trim(),
      title: form.title.trim(),
      shortRole: form.shortRole.trim(),
      location: form.location.trim() || null,
      calendlyUrl: form.calendlyUrl.trim() || null,
      photoUrl: form.photoUrl.trim() || null,
      bioShort: form.bioShort.trim() || null,
      clientsTrained: form.clientsTrained,
      isActive: form.isActive,
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
            className="relative w-full max-w-xl bg-bg-card border-t md:border md:rounded-2xl border-border shadow-2xl overflow-hidden"
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-bg/90 border border-border-soft flex items-center justify-center hover:border-accent/40 transition-all"
            >
              <X size={14} strokeWidth={2.5} />
            </button>

            <div className="px-6 md:px-8 pt-7 pb-5 border-b border-border-soft">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-1.5">
                Edit specialist
              </div>
              <h2 className="font-display font-semibold text-2xl tracking-tight">
                {initial.name || 'Specialist'}
              </h2>
              <p className="text-sm text-text-muted mt-1.5">
                Update the specialist&apos;s public-facing profile and Calendly link.
              </p>
            </div>

            <form
              onSubmit={handleSave}
              className="px-6 md:px-8 py-6 space-y-4 max-h-[60vh] overflow-y-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Name *" error={fieldErrors.name}>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2.5 text-sm focus:border-accent focus:outline-none transition-colors"
                  />
                </Field>
                <Field label="Short role *" error={fieldErrors.shortRole}>
                  <input
                    type="text"
                    value={form.shortRole}
                    onChange={(e) => update('shortRole', e.target.value)}
                    placeholder="PT Head"
                    className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2.5 text-sm focus:border-accent focus:outline-none transition-colors"
                  />
                </Field>
              </div>

              <Field label="Title *" error={fieldErrors.title}>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  placeholder="Co-Founder & Personal Training Head"
                  className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2.5 text-sm focus:border-accent focus:outline-none transition-colors"
                />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Location">
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => update('location', e.target.value)}
                    placeholder="Hyderabad"
                    className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2.5 text-sm focus:border-accent focus:outline-none transition-colors"
                  />
                </Field>
                <Field label="Lifetime clients trained" error={fieldErrors.clientsTrained}>
                  <input
                    type="number"
                    min={0}
                    value={form.clientsTrained}
                    onChange={(e) =>
                      update('clientsTrained', parseInt(e.target.value, 10) || 0)
                    }
                    className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2.5 text-sm focus:border-accent focus:outline-none transition-colors"
                  />
                </Field>
              </div>

              <Field label="Calendly URL" error={fieldErrors.calendlyUrl}>
                <input
                  type="url"
                  value={form.calendlyUrl}
                  onChange={(e) => update('calendlyUrl', e.target.value)}
                  placeholder="https://calendly.com/purex-name/30min"
                  className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2.5 text-sm font-mono focus:border-accent focus:outline-none transition-colors"
                />
              </Field>

              <Field label="Photo URL" error={fieldErrors.photoUrl}>
                <input
                  type="url"
                  value={form.photoUrl}
                  onChange={(e) => update('photoUrl', e.target.value)}
                  placeholder="/experts/name.jpg or full URL"
                  className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2.5 text-sm font-mono focus:border-accent focus:outline-none transition-colors"
                />
              </Field>

              <Field label="Short bio">
                <textarea
                  rows={3}
                  value={form.bioShort}
                  onChange={(e) => update('bioShort', e.target.value)}
                  placeholder="One paragraph summary used on cards and the marketing site."
                  className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2.5 text-sm focus:border-accent focus:outline-none transition-colors resize-none"
                />
              </Field>

              <Field label="Status">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => update('isActive', true)}
                    className={cn(
                      'flex-1 h-10 rounded-lg border text-xs font-medium transition-colors',
                      form.isActive
                        ? 'bg-accent text-bg border-accent'
                        : 'bg-bg-elevated border-border text-text hover:border-accent/50'
                    )}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => update('isActive', false)}
                    className={cn(
                      'flex-1 h-10 rounded-lg border text-xs font-medium transition-colors',
                      !form.isActive
                        ? 'bg-text-muted text-bg border-text-muted'
                        : 'bg-bg-elevated border-border text-text hover:border-accent/50'
                    )}
                  >
                    Paused
                  </button>
                </div>
              </Field>

              {errorMsg && (
                <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                  {errorMsg}
                </div>
              )}
            </form>

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
