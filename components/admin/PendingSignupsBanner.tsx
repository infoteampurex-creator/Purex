'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  ShieldX,
  Mail,
  MailWarning,
  Phone,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  approveSignup,
  rejectSignup,
} from '@/lib/actions/signup-approval';
import { type PendingSignup } from '@/lib/data/pending-signups';

interface PendingSignupsBannerProps {
  pending: PendingSignup[];
}

interface FlashMessage {
  kind: 'success' | 'warning';
  title: string;
  detail?: string;
}

export function PendingSignupsBanner({ pending }: PendingSignupsBannerProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [flash, setFlash] = useState<FlashMessage | null>(null);
  const [isPending, startTransition] = useTransition();

  if (pending.length === 0 && !flash) return null;

  // The action took effect — refresh the page to redraw the list, but
  // keep the surfaced flash so the admin can read it. Pending list will
  // be empty after refresh, so the banner stays mounted only for the
  // flash readout (we guard the early-return on `!flash` above).
  const runAction = (
    id: string,
    runner: typeof approveSignup | typeof rejectSignup,
    label: 'Approved' | 'Rejected'
  ) => {
    setErrorMsg(null);
    setFlash(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await runner({ userId: id });
      setPendingId(null);
      if (!result.ok) {
        setErrorMsg(result.error);
        return;
      }
      if (result.emailSent) {
        setFlash({
          kind: 'success',
          title: `${label} — welcome email sent to ${result.recipient}.`,
        });
      } else {
        setFlash({
          kind: 'warning',
          title: `${label} — but the email did NOT send. Reach out to ${result.recipient} via WhatsApp.`,
          detail: result.emailError,
        });
      }
      router.refresh();
    });
  };

  const onApprove = (id: string) =>
    runAction(id, approveSignup, 'Approved');

  const onReject = (id: string) =>
    runAction(id, rejectSignup, 'Rejected');

  // When the list has emptied but the flash is still showing, render
  // a flash-only standalone strip instead of the count banner.
  if (pending.length === 0 && flash) {
    return <FlashStrip flash={flash} onDismiss={() => setFlash(null)} />;
  }

  return (
    <div className="mb-6 rounded-xl bg-amber/5 border border-amber/30 overflow-hidden">
      {/* Flash at the top of the banner (action just ran). */}
      {flash && (
        <FlashStrip
          flash={flash}
          onDismiss={() => setFlash(null)}
          inline
        />
      )}

      {/* Banner header — count + collapse toggle */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-amber/10 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber/15 text-amber font-mono text-xs font-bold flex-shrink-0">
            {pending.length}
          </span>
          <div className="text-left min-w-0">
            <div className="font-display font-semibold text-sm md:text-base text-text">
              {pending.length === 1
                ? '1 signup awaiting approval'
                : `${pending.length} signups awaiting approval`}
            </div>
            <div className="text-[11px] text-text-muted font-mono uppercase tracking-[0.14em] mt-0.5">
              Review each one — approve sends a welcome email, reject sends a polite decline
            </div>
          </div>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-text-muted flex-shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-text-muted flex-shrink-0" />
        )}
      </button>

      {/* Pending rows */}
      {expanded && (
        <div className="border-t border-amber/20 divide-y divide-amber/20">
          {errorMsg && (
            <div className="px-4 py-2 bg-danger/10 text-danger text-xs">
              {errorMsg}
            </div>
          )}
          {pending.map((p) => {
            const isRowPending = pendingId === p.id;
            return (
              <div
                key={p.id}
                className={cn(
                  'px-4 py-3 flex flex-col md:flex-row md:items-center gap-3 md:gap-4',
                  isRowPending && 'opacity-60'
                )}
              >
                {/* Identity */}
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">
                    {p.fullName}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-[11px] text-text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Mail size={10} />
                      {p.email}
                    </span>
                    {p.phone && (
                      <span className="inline-flex items-center gap-1 font-mono">
                        <Phone size={10} />
                        {p.phone}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-text-dim font-mono mt-0.5">
                    signed up {formatRelative(p.createdAt)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onApprove(p.id)}
                    disabled={isPending || isRowPending}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-accent text-bg text-xs font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRowPending ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={11} strokeWidth={2.5} />
                    )}
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject(p.id)}
                    disabled={isPending || isRowPending}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-border text-xs font-medium text-text-muted hover:border-danger/40 hover:text-danger transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShieldX size={11} />
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Flash readout (success / warning) ────────────────────────────

function FlashStrip({
  flash,
  onDismiss,
  inline,
}: {
  flash: FlashMessage;
  onDismiss: () => void;
  inline?: boolean;
}) {
  const isWarning = flash.kind === 'warning';
  const cls = isWarning
    ? 'bg-amber/15 border-amber/40 text-amber'
    : 'bg-accent/10 border-accent/30 text-accent';
  const Icon = isWarning ? MailWarning : Mail;
  return (
    <div
      role={isWarning ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-3 px-4 py-3 border',
        cls,
        inline
          ? 'border-b border-l-0 border-r-0 border-t-0'
          : 'mb-6 rounded-xl'
      )}
    >
      <Icon size={16} className="flex-shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold leading-snug">{flash.title}</div>
        {flash.detail && (
          <div className="text-[11px] font-mono text-text-muted mt-1 break-words">
            {flash.detail}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors"
      >
        <X size={13} />
      </button>
    </div>
  );
}

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
