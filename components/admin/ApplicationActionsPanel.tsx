'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, MessageCircle, UserPlus } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  updateEnquiryStatus,
  assignEnquirySpecialist,
  updateEnquiryNotes,
} from '@/lib/actions/enquiries';
import {
  ENQUIRY_STATUS_LABEL,
  ENQUIRY_STATUS_COLOR,
  type AdminEnquiry,
  type EnquiryStatus,
} from '@/lib/data/enquiries-types';

interface Props {
  enquiry: AdminEnquiry;
  specialists: Array<{ id: string; name: string; email: string }>;
}

const STATUS_FLOW: EnquiryStatus[] = [
  'new',
  'contacted',
  'qualified',
  'converted',
  'rejected',
];

export function ApplicationActionsPanel({ enquiry, specialists }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<EnquiryStatus>(enquiry.status);
  const [specialistId, setSpecialistId] = useState<string | null>(
    enquiry.assignedSpecialistId
  );
  const [notes, setNotes] = useState(enquiry.adminNotes ?? '');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onStatusChange = (next: EnquiryStatus) => {
    if (next === status) return;
    setStatus(next);
    setErrorMsg(null);
    startTransition(async () => {
      const r = await updateEnquiryStatus({
        enquiryId: enquiry.id,
        status: next,
      });
      if (!r.ok) {
        setErrorMsg(r.error);
        setStatus(enquiry.status);
        return;
      }
      setSavedAt(Date.now());
      router.refresh();
    });
  };

  const onAssignChange = (next: string | null) => {
    setSpecialistId(next);
    setErrorMsg(null);
    startTransition(async () => {
      const r = await assignEnquirySpecialist({
        enquiryId: enquiry.id,
        specialistId: next,
      });
      if (!r.ok) {
        setErrorMsg(r.error);
        setSpecialistId(enquiry.assignedSpecialistId);
        return;
      }
      setSavedAt(Date.now());
      router.refresh();
    });
  };

  const onSaveNotes = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const r = await updateEnquiryNotes({
        enquiryId: enquiry.id,
        notes,
      });
      if (!r.ok) {
        setErrorMsg(r.error);
        return;
      }
      setSavedAt(Date.now());
      router.refresh();
    });
  };

  return (
    <aside className="space-y-5 md:sticky md:top-24 self-start">
      {errorMsg && (
        <div className="rounded-lg bg-danger/10 border border-danger/30 px-3 py-2.5 text-danger text-xs">
          {errorMsg}
        </div>
      )}
      {savedAt && Date.now() - savedAt < 2500 && !errorMsg && !isPending && (
        <div className="rounded-lg bg-accent/10 border border-accent/30 px-3 py-2 text-accent text-xs font-mono uppercase tracking-[0.16em] font-bold">
          ✓ Saved
        </div>
      )}

      {/* Quick contact */}
      <div className="rounded-2xl bg-bg-card border border-border p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold mb-3">
          Reach out
        </div>
        <a
          href={`https://wa.me/91${enquiry.whatsapp}?text=${encodeURIComponent(
            `Hi ${enquiry.fullName.split(/\s+/)[0]} — thanks for applying to Team Purex. I'm reaching out about your application.`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-full bg-[#25D366] text-white font-semibold hover:opacity-90 transition-opacity"
          style={{ fontSize: 14 }}
        >
          <MessageCircle size={15} strokeWidth={2.5} />
          WhatsApp {enquiry.fullName.split(/\s+/)[0]}
        </a>
      </div>

      {/* Status workflow */}
      <div className="rounded-2xl bg-bg-card border border-border p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold mb-3">
          Status
        </div>
        <div className="space-y-1.5">
          {STATUS_FLOW.map((s) => {
            const active = status === s;
            return (
              <button
                key={s}
                type="button"
                disabled={isPending}
                onClick={() => onStatusChange(s)}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-lg border transition-all flex items-center gap-2.5 font-mono text-[12px] uppercase tracking-[0.14em] font-bold disabled:opacity-60',
                  active
                    ? 'border-current'
                    : 'border-border-soft text-text-muted hover:text-text hover:border-text-muted'
                )}
                style={
                  active
                    ? {
                        color: ENQUIRY_STATUS_COLOR[s],
                        background: ENQUIRY_STATUS_COLOR[s] + '10',
                      }
                    : {}
                }
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    background: active ? ENQUIRY_STATUS_COLOR[s] : '#3a4438',
                    boxShadow: active
                      ? `0 0 6px ${ENQUIRY_STATUS_COLOR[s]}`
                      : 'none',
                  }}
                />
                {ENQUIRY_STATUS_LABEL[s]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Assign specialist */}
      <div className="rounded-2xl bg-bg-card border border-border p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold mb-3 flex items-center gap-1.5">
          <UserPlus size={11} />
          Assigned specialist
        </div>
        <select
          value={specialistId ?? ''}
          onChange={(e) => onAssignChange(e.target.value || null)}
          disabled={isPending}
          className="w-full h-11 px-3 rounded-lg bg-bg-elevated border border-border text-sm focus:border-accent focus:outline-none disabled:opacity-60"
        >
          <option value="">— Unassigned —</option>
          {specialists.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Internal notes */}
      <div className="rounded-2xl bg-bg-card border border-border p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold mb-3">
          Internal notes
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder="Conversation notes, follow-up reminders, qualification details…"
          className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent focus:outline-none resize-none"
          style={{ minHeight: 110, fontSize: 13 }}
        />
        <button
          type="button"
          onClick={onSaveNotes}
          disabled={isPending}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 h-10 rounded-full bg-accent text-bg text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Save size={13} strokeWidth={2.5} />
          )}
          Save notes
        </button>
      </div>
    </aside>
  );
}
