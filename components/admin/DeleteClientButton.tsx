'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { deleteClient } from '@/lib/actions/clients';

interface Props {
  clientId: string;
  clientEmail: string;
  clientName: string;
}

/**
 * Destructive delete with a typed-email confirmation. Two-step:
 *   1. "Delete" pill in the header → opens the modal.
 *   2. Modal explains what's being removed + asks the admin to type
 *      the client's email back. The destructive button only enables
 *      when the typed value matches.
 *
 * On success → navigates to /admin/clients (the page is gone).
 */
export function DeleteClientButton({ clientId, clientEmail, clientName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmValue, setConfirmValue] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setOpen(false);
    setConfirmValue('');
    setErrorMsg(null);
  };

  const matches =
    confirmValue.trim().toLowerCase() === clientEmail.trim().toLowerCase();

  const onConfirm = () => {
    if (!matches) return;
    setErrorMsg(null);
    startTransition(async () => {
      const result = await deleteClient({
        clientId,
        confirmEmail: confirmValue,
      });
      if (!result.ok) {
        setErrorMsg(result.error);
        return;
      }
      reset();
      router.push('/admin/clients');
      router.refresh();
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Delete this client"
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-border text-xs font-medium text-text-muted hover:border-danger/50 hover:text-danger transition-colors"
      >
        <Trash2 size={12} />
        Delete
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) reset();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-client-title"
            className="relative w-full max-w-md bg-bg-card border border-border rounded-2xl p-6"
          >
            <button
              onClick={reset}
              aria-label="Close"
              className="absolute top-4 right-4 w-8 h-8 rounded-full border border-border-soft text-text-muted hover:border-accent hover:text-accent transition-colors flex items-center justify-center"
            >
              <X size={14} />
            </button>

            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-danger/15 text-danger mb-4">
              <AlertTriangle size={22} />
            </div>

            <h2
              id="delete-client-title"
              className="font-display font-semibold text-xl tracking-tight"
            >
              Delete {clientName}?
            </h2>
            <p className="text-sm text-text-muted leading-relaxed mt-2">
              This permanently removes the account and every related record —
              profile, plan, daily logs, workouts, and progress photos. It
              cannot be undone.
            </p>

            <div className="mt-5">
              <label className="block">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold mb-1.5">
                  Type the client&apos;s email to confirm
                </div>
                <input
                  type="email"
                  autoComplete="off"
                  autoFocus
                  value={confirmValue}
                  onChange={(e) => {
                    setConfirmValue(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder={clientEmail}
                  className={cn(
                    'w-full h-11 px-3 rounded-lg bg-bg-elevated border text-sm focus:outline-none transition-colors',
                    matches
                      ? 'border-danger/60 focus:border-danger'
                      : 'border-border-soft focus:border-text-muted'
                  )}
                />
              </label>
              <div className="mt-1.5 text-[11px] text-text-dim font-mono">
                Required: <span className="text-text">{clientEmail}</span>
              </div>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="mt-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-xs"
              >
                {errorMsg}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={reset}
                disabled={isPending}
                className="h-10 px-4 rounded-full border border-border text-sm font-medium hover:border-text-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={!matches || isPending}
                className={cn(
                  'inline-flex items-center gap-2 h-10 px-5 rounded-full text-sm font-semibold transition-colors',
                  matches
                    ? 'bg-danger text-white hover:bg-danger/90'
                    : 'bg-bg-elevated text-text-muted cursor-not-allowed'
                )}
              >
                {isPending ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 size={12} />
                    Delete permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
