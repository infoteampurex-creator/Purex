'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  ShieldX,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  Loader2,
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

export function PendingSignupsBanner({ pending }: PendingSignupsBannerProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (pending.length === 0) return null;

  const onApprove = (id: string) => {
    setErrorMsg(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await approveSignup({ userId: id });
      setPendingId(null);
      if (!result.ok) {
        setErrorMsg(result.error);
        return;
      }
      router.refresh();
    });
  };

  const onReject = (id: string) => {
    setErrorMsg(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await rejectSignup({ userId: id });
      setPendingId(null);
      if (!result.ok) {
        setErrorMsg(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="mb-6 rounded-xl bg-amber/5 border border-amber/30 overflow-hidden">
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
