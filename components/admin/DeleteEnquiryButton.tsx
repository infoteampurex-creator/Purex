'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { deleteEnquiry } from '@/lib/actions/enquiries';

interface Props {
  enquiryId: string;
  applicantName: string;
}

/**
 * Two-step delete affordance. First click reveals a confirmation
 * panel with the applicant's name (so admins don't accidentally
 * nuke the wrong record). Second click performs the destructive
 * action and redirects back to the inbox.
 */
export function DeleteEnquiryButton({ enquiryId, applicantName }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onDelete = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const r = await deleteEnquiry({ enquiryId });
      if (!r.ok) {
        setErrorMsg(r.error);
        return;
      }
      // Force a fresh navigation back to inbox — bypasses route cache.
      router.push('/admin/applications');
      router.refresh();
    });
  };

  if (!confirming) {
    return (
      <div className="rounded-2xl bg-bg-card border border-border p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold mb-2">
          Danger zone
        </div>
        <p className="text-xs text-text-muted leading-relaxed mb-3">
          Permanently remove this application. Use this for spam, duplicates,
          or test entries. This cannot be undone.
        </p>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full border border-danger/40 bg-danger/5 text-danger text-xs font-mono uppercase tracking-[0.14em] font-bold hover:bg-danger/10 hover:border-danger/60 transition-colors"
        >
          <Trash2 size={11} strokeWidth={2.5} />
          Delete application
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-danger/5 border border-danger/40 p-5">
      <div className="flex items-start gap-2 mb-3">
        <AlertTriangle size={16} className="text-danger flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-danger font-bold mb-1.5">
            Delete this application?
          </div>
          <p className="text-xs text-text leading-relaxed">
            This will permanently remove{' '}
            <span className="font-semibold text-text">{applicantName}</span>{' '}
            and all admin data captured for them. There is no undo.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-3 rounded-lg bg-danger/10 border border-danger/30 px-3 py-2 text-danger text-xs">
          {errorMsg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            setErrorMsg(null);
          }}
          disabled={isPending}
          className="flex-1 inline-flex items-center justify-center h-10 px-4 rounded-full border border-border-soft text-xs font-mono uppercase tracking-[0.14em] font-bold text-text-muted hover:text-text hover:border-text-muted transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={isPending}
          className="flex-1 inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full bg-danger text-white text-xs font-mono uppercase tracking-[0.14em] font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 size={11} className="animate-spin" />
          ) : (
            <Trash2 size={11} strokeWidth={2.5} />
          )}
          Yes, delete forever
        </button>
      </div>
    </div>
  );
}
