'use client';

import { useState, useTransition } from 'react';
import { Loader2, Send, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { sendTestEmail } from '@/lib/actions/diagnostic';

interface Props {
  defaultRecipient: string;
}

type Outcome =
  | null
  | { kind: 'ok'; recipient: string; id: string }
  | { kind: 'err'; error: string };

export function DiagnosticTester({ defaultRecipient }: Props) {
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOutcome(null);
    startTransition(async () => {
      const r = await sendTestEmail({ to: recipient });
      if (r.ok) {
        setOutcome({ kind: 'ok', recipient: r.recipient, id: r.id });
      } else {
        setOutcome({ kind: 'err', error: r.error });
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3 max-w-xl">
      <label className="block">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold mb-1.5">
          Recipient
        </div>
        <input
          type="email"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          required
          className="w-full h-11 px-3 rounded-lg bg-bg-elevated border border-border-soft text-sm font-mono focus:border-accent focus:outline-none"
        />
      </label>

      <button
        type="submit"
        disabled={isPending || !recipient}
        className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-accent text-bg text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <Loader2 size={12} className="animate-spin" />
            Sending…
          </>
        ) : (
          <>
            <Send size={13} strokeWidth={2.5} />
            Send test email
          </>
        )}
      </button>

      {outcome && outcome.kind === 'ok' && (
        <div
          role="status"
          className={cn(
            'flex items-start gap-3 p-4 rounded-xl border',
            'bg-accent/10 border-accent/30 text-accent'
          )}
        >
          <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="text-sm font-semibold">
              Sent to {outcome.recipient}.
            </div>
            <div className="text-[11px] font-mono text-text-muted mt-1 break-all">
              Resend message id: {outcome.id}
            </div>
            <div className="text-[11px] text-text-muted mt-1 leading-relaxed">
              Check the recipient&apos;s inbox (and Spam folder). Also confirm
              the matching row in Resend Dashboard → Emails — it will say
              Delivered, Bounced, or Failed there.
            </div>
          </div>
        </div>
      )}

      {outcome && outcome.kind === 'err' && (
        <div
          role="alert"
          className={cn(
            'flex items-start gap-3 p-4 rounded-xl border',
            'bg-danger/10 border-danger/40 text-danger'
          )}
        >
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="text-sm font-semibold">Send failed.</div>
            <div className="text-[11px] font-mono text-text-muted mt-1 break-words">
              {outcome.error}
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
