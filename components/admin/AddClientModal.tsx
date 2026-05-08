'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Copy, MessageCircle, UserPlus, X } from 'lucide-react';
import { FALLBACK_EXPERTS, FALLBACK_PROGRAMS, BRAND } from '@/lib/constants';
import { cn } from '@/lib/cn';

interface AddClientModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Stub "Add Client" flow — no email infrastructure required.
 *
 * Trainer enters: email, first name, plan, assigned coach.
 * Modal generates a shareable signup link with those values pre-filled,
 * and an opinionated WhatsApp message for the trainer to send.
 *
 * When the client clicks the signup link, our existing /signup form
 * picks up the query params and pre-fills the email + sets up
 * the assignment AFTER they confirm their account.
 *
 * NOTE: This is the now-version. When Resend SMTP is configured and the
 * SUPABASE_SERVICE_ROLE_KEY is in Vercel, this will be replaced with a
 * proper auth.admin.inviteUserByEmail() flow that sends a real invite.
 */
export function AddClientModal({ open, onClose }: AddClientModalProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [planSlug, setPlanSlug] = useState<string>(FALLBACK_PROGRAMS[1]?.slug ?? '');
  const [coachSlug, setCoachSlug] = useState<string>(FALLBACK_EXPERTS[0]?.slug ?? '');
  const [step, setStep] = useState<'form' | 'share'>('form');
  const [copied, setCopied] = useState<'link' | 'message' | null>(null);

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setEmail('');
      setFirstName('');
      setPlanSlug(FALLBACK_PROGRAMS[1]?.slug ?? '');
      setCoachSlug(FALLBACK_EXPERTS[0]?.slug ?? '');
      setStep('form');
      setCopied(null);
    }
  }, [open]);

  // Esc + scroll lock
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  // Build the prefilled signup URL + message
  const baseUrl =
    typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.host}`
      : '';

  const params = new URLSearchParams();
  if (email) params.set('email', email);
  if (firstName) params.set('name', firstName);
  if (planSlug) params.set('plan', planSlug);
  if (coachSlug) params.set('coach', coachSlug);

  const signupLink = `${baseUrl}/signup${params.toString() ? '?' + params.toString() : ''}`;

  const selectedProgram = FALLBACK_PROGRAMS.find((p) => p.slug === planSlug);
  const selectedExpert = FALLBACK_EXPERTS.find((e) => e.slug === coachSlug);

  const whatsappMessage =
    `Hi ${firstName || 'there'}, welcome to PURE X.\n\n` +
    `I've set up your account on the ${selectedProgram?.name ?? 'PURE X'} plan ` +
    `with ${selectedExpert?.name ?? 'your coach'} as your assigned coach.\n\n` +
    `To activate your dashboard, just sign up here using your email — ` +
    `your details are already pre-filled:\n\n${signupLink}`;

  const whatsappShare = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  const canContinue = email.trim().length > 3 && firstName.trim().length > 0;

  const copyToClipboard = async (text: string, kind: 'link' | 'message') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // ignore clipboard failures
    }
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
            className="relative w-full max-w-lg bg-bg-card border-t md:border md:rounded-2xl border-border shadow-2xl overflow-hidden"
          >
            {/* Close button */}
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
                {step === 'form' ? 'Step 1 of 2' : 'Step 2 of 2'}
              </div>
              <h2 className="font-display font-semibold text-2xl tracking-tight">
                {step === 'form' ? 'Add a new client' : 'Send the invite'}
              </h2>
              <p className="text-sm text-text-muted mt-1.5">
                {step === 'form'
                  ? 'Enter their details. We’ll generate a signup link to share via WhatsApp.'
                  : `Share this with ${firstName} so they can activate their account.`}
              </p>
            </div>

            {/* Body */}
            {step === 'form' && (
              <div className="px-6 md:px-8 py-6 space-y-5 max-h-[60vh] overflow-y-auto">
                {/* Email */}
                <Field label="Email *">
                  <input
                    type="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alice@example.com"
                    className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-sm placeholder:text-text-dim focus:border-accent focus:outline-none transition-colors"
                  />
                </Field>

                {/* First name */}
                <Field label="First name *">
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Alice"
                    className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-sm placeholder:text-text-dim focus:border-accent focus:outline-none transition-colors"
                  />
                </Field>

                {/* Plan */}
                <Field label="Plan tier">
                  <select
                    value={planSlug}
                    onChange={(e) => setPlanSlug(e.target.value)}
                    className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-sm focus:border-accent focus:outline-none transition-colors"
                  >
                    {FALLBACK_PROGRAMS.map((p) => (
                      <option key={p.slug} value={p.slug}>
                        {p.name} — {p.priceDisplay}
                      </option>
                    ))}
                  </select>
                </Field>

                {/* Coach */}
                <Field label="Assigned coach">
                  <select
                    value={coachSlug}
                    onChange={(e) => setCoachSlug(e.target.value)}
                    className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-sm focus:border-accent focus:outline-none transition-colors"
                  >
                    {FALLBACK_EXPERTS.map((expert) => (
                      <option key={expert.slug} value={expert.slug}>
                        {expert.name} — {expert.shortRole}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="pt-2 text-xs text-text-dim leading-relaxed">
                  <strong className="text-text-muted">Note:</strong> This generates a signup
                  link with details pre-filled. The client signs up themselves — no email is
                  sent automatically yet. (Auto-invite emails will be enabled once SMTP is
                  configured.)
                </div>
              </div>
            )}

            {step === 'share' && (
              <div className="px-6 md:px-8 py-6 space-y-5 max-h-[60vh] overflow-y-auto">
                {/* Summary */}
                <div className="rounded-lg bg-bg-elevated border border-border p-4 space-y-1.5">
                  <SummaryRow label="Name" value={firstName} />
                  <SummaryRow label="Email" value={email} />
                  <SummaryRow
                    label="Plan"
                    value={selectedProgram?.name ?? planSlug}
                  />
                  <SummaryRow
                    label="Coach"
                    value={selectedExpert?.name ?? coachSlug}
                  />
                </div>

                {/* Signup link */}
                <Field label="Signup link">
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={signupLink}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      className="flex-1 bg-bg-elevated border border-border rounded-lg px-3 py-2.5 text-xs font-mono focus:border-accent focus:outline-none"
                    />
                    <button
                      onClick={() => copyToClipboard(signupLink, 'link')}
                      className={cn(
                        'flex-shrink-0 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-medium border transition-colors',
                        copied === 'link'
                          ? 'bg-accent text-bg border-accent'
                          : 'bg-bg-elevated border-border hover:border-accent text-text'
                      )}
                    >
                      {copied === 'link' ? (
                        <Check size={12} strokeWidth={2.5} />
                      ) : (
                        <Copy size={12} strokeWidth={2.5} />
                      )}
                      {copied === 'link' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </Field>

                {/* WhatsApp share */}
                <div className="space-y-2">
                  <a
                    href={whatsappShare}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-full bg-accent text-bg font-semibold text-sm hover:bg-accent-hover transition-colors"
                  >
                    <MessageCircle size={14} strokeWidth={2.5} />
                    Open WhatsApp with message
                  </a>

                  <button
                    onClick={() => copyToClipboard(whatsappMessage, 'message')}
                    className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-full bg-bg-elevated border border-border text-sm hover:border-accent/40 transition-colors"
                  >
                    {copied === 'message' ? (
                      <>
                        <Check size={12} strokeWidth={2.5} />
                        Message copied
                      </>
                    ) : (
                      <>
                        <Copy size={12} strokeWidth={2.5} />
                        Copy message text
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-6 md:px-8 py-4 border-t border-border-soft flex items-center justify-between gap-3">
              {step === 'form' ? (
                <>
                  <button
                    onClick={onClose}
                    className="text-sm text-text-muted hover:text-text transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!canContinue}
                    onClick={() => setStep('share')}
                    className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-accent text-bg text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <UserPlus size={13} strokeWidth={2.5} />
                    Generate invite
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setStep('form')}
                    className="text-sm text-text-muted hover:text-text transition-colors"
                  >
                    ← Edit details
                  </button>
                  <button
                    onClick={onClose}
                    className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-bg-elevated border border-border text-sm font-semibold hover:border-accent transition-colors"
                  >
                    Done
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Helpers ──────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted font-bold mb-1.5">
        {label}
      </div>
      {children}
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="font-mono uppercase tracking-[0.14em] text-text-dim">
        {label}
      </span>
      <span className="text-text font-medium truncate">{value}</span>
    </div>
  );
}

// Suppress lint warning for BRAND being unused — kept for future variants
void BRAND;
