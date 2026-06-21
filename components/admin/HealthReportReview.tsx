'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Image as ImageIcon,
  Eye,
  Save,
  Pencil,
  Check,
  X,
  ClipboardList,
  RefreshCw,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import {
  setCoachReviewNote,
  getReportViewUrl,
  retryHealthReportExtraction,
} from '@/lib/actions/health-reports';
import {
  isFileOnDevice,
  isPdfReport,
  reportDisplayName,
  reportFileSize,
  type HealthReport,
} from '@/lib/data/health-reports';

interface Props {
  reports: HealthReport[];
}

/**
 * HealthReportReview — admin-side coach UI for reviewing a client's
 * uploaded lab reports. Drops into /admin/clients/[id].
 *
 * For each report:
 *   - Filename / size / upload date / type icon
 *   - "View" opens signed URL (5-min expiry) in new tab
 *   - Coach note display (read-only) when set
 *   - "Edit note" button → inline textarea + Save
 *   - "Reviewed" badge when a note exists
 */
export function HealthReportReview({ reports }: Props) {
  if (reports.length === 0) {
    return (
      <section
        className="rounded-2xl border bg-bg-card p-5 md:p-6"
        style={{ borderColor: 'rgba(125,211,255,0.20)' }}
      >
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList size={14} style={{ color: '#7dd3ff' }} />
          <h2 className="font-display font-semibold text-lg tracking-tight">
            Health reports
          </h2>
        </div>
        <p className="text-sm text-text-muted">
          This client hasn&apos;t uploaded any lab reports yet. When they
          do, you&apos;ll see them here with space to add review notes.
        </p>
      </section>
    );
  }

  return (
    <section
      className="rounded-2xl border bg-bg-card p-5 md:p-6"
      style={{ borderColor: 'rgba(125,211,255,0.20)' }}
    >
      <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ClipboardList size={14} style={{ color: '#7dd3ff' }} />
          <h2 className="font-display font-semibold text-lg tracking-tight">
            Health reports
          </h2>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted font-bold">
          {reports.length} uploaded · {reports.filter((r) => r.coachReviewNote?.trim()).length} reviewed
        </span>
      </div>
      <p className="text-sm text-text-muted mb-4">
        Add a review note to flag findings, suggest follow-ups, or
        record plan changes. The client sees your note on their Health tab.
      </p>

      <ul className="space-y-2.5">
        {reports.map((r) => (
          <li key={r.id}>
            <ReportRow report={r} />
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─── Sub-component ──────────────────────────────────────────────

function ReportRow({ report }: { report: HealthReport }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(report.coachReviewNote ?? '');
  const [saving, startSave] = useTransition();
  const [retrying, startRetry] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);

  const reviewed = !!report.coachReviewNote?.trim();

  // ─── Extraction status (admin diagnostic) ──────────────────────
  // Mirrors the client-side ExtractionStatusRow. A processing /
  // pending report that hasn't moved in 90s is treated as Stalled
  // so we surface a Re-extract affordance instead of leaving the
  // admin staring at a frozen spinner.
  const extractionStatus = report.extractionStatus;
  const stale = (() => {
    if (extractionStatus !== 'processing' && extractionStatus !== 'pending')
      return false;
    const last = report.extractedAt ?? report.uploadedAt;
    return Date.now() - new Date(last).getTime() > 90 * 1000;
  })();
  const effectiveStatus: typeof extractionStatus | 'stale' = stale
    ? 'stale'
    : extractionStatus;
  const canRetry = ['failed', 'skipped', 'stale', 'done'].includes(
    effectiveStatus
  );
  const meta = ADMIN_STATUS_META[effectiveStatus] ?? ADMIN_STATUS_META.pending;

  const handleRetry = () => {
    setRetryError(null);
    startRetry(async () => {
      const res = await retryHealthReportExtraction(report.id);
      if (!res.ok) {
        setRetryError(res.error);
        return;
      }
      router.refresh();
    });
  };

  const handleView = async () => {
    const res = await getReportViewUrl(report.id);
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.warn('view URL failed:', res.error);
      return;
    }
    window.open(res.url, '_blank', 'noopener');
  };

  const handleSave = () => {
    setError(null);
    startSave(async () => {
      const res = await setCoachReviewNote({
        reportId: report.id,
        note: draft,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  };

  const handleCancel = () => {
    setDraft(report.coachReviewNote ?? '');
    setEditing(false);
    setError(null);
  };

  return (
    <div
      className="rounded-xl border px-4 py-3"
      style={{
        background: reviewed
          ? 'rgba(198,255,61,0.04)'
          : 'rgba(125,211,255,0.04)',
        borderColor: reviewed
          ? 'rgba(198,255,61,0.25)'
          : 'rgba(125,211,255,0.20)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0"
          style={{
            background: 'rgba(125,211,255,0.14)',
            color: '#7dd3ff',
          }}
        >
          {isPdfReport(report) ? <FileText size={14} /> : <ImageIcon size={14} />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <div className="min-w-0 flex-1">
              <div
                className="font-semibold leading-tight truncate"
                style={{ fontSize: 14, color: 'rgba(245,245,240,0.95)' }}
              >
                {reportDisplayName(report)}
              </div>
              <div className="font-mono text-[10px] text-text-muted mt-0.5">
                {reportFileSize(report.fileSizeBytes)} ·{' '}
                {new Date(report.uploadedAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {reviewed && (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-mono uppercase tracking-[0.14em] font-bold"
                  style={{
                    fontSize: 9,
                    color: '#c6ff3d',
                    background: 'rgba(198,255,61,0.10)',
                  }}
                >
                  <Check size={9} strokeWidth={3} />
                  Reviewed
                </span>
              )}
              {/* "View" is hidden for rows where the original file lives
                  on the client's device — there's nothing on the server
                  to sign a URL for. Markers + summary still render
                  inline so the coach gets the data they need. */}
              {!isFileOnDevice(report) && (
                <button
                  type="button"
                  onClick={handleView}
                  aria-label="View report"
                  className="w-7 h-7 rounded-md border border-border-soft text-text-muted hover:border-accent hover:text-accent transition-colors flex items-center justify-center"
                >
                  <Eye size={11} />
                </button>
              )}
              {isFileOnDevice(report) && (
                <span
                  className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-mono uppercase tracking-[0.14em] font-bold"
                  style={{
                    fontSize: 8.5,
                    color: 'rgba(255,255,255,0.55)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.03)',
                  }}
                  title="Original file stays on the client's device. Only extracted markers are on the server."
                >
                  on device
                </span>
              )}
            </div>
          </div>

          {/* Extraction status pill + Re-extract control */}
          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            <span
              className="inline-flex items-center gap-1 font-mono uppercase tracking-[0.14em] font-bold rounded-full px-1.5 py-0.5"
              style={{
                fontSize: 9,
                color: meta.color,
                background: meta.bg,
                border: '1px solid ' + meta.border,
              }}
            >
              <span
                className={meta.spin ? 'animate-spin inline-flex' : 'inline-flex'}
              >
                {meta.icon}
              </span>
              {effectiveStatus === 'done' && report.extractedSummary
                ? report.extractedSummary
                : meta.label}
            </span>
            {report.extractionError && effectiveStatus === 'failed' && (
              <span
                title={report.extractionError}
                style={{
                  fontSize: 10,
                  color: 'rgba(255,153,153,0.70)',
                }}
              >
                {report.extractionError.slice(0, 90)}
              </span>
            )}
            {canRetry && (
              <button
                type="button"
                onClick={handleRetry}
                disabled={retrying}
                className="inline-flex items-center gap-1 font-mono uppercase tracking-[0.14em] font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{
                  fontSize: 9,
                  color: '#7dd3ff',
                }}
              >
                <RefreshCw
                  size={10}
                  className={retrying ? 'animate-spin' : ''}
                />
                {retrying
                  ? 'Re-reading…'
                  : effectiveStatus === 'done'
                  ? 'Re-extract'
                  : 'Retry extract'}
              </button>
            )}
          </div>
          {retryError && (
            <div
              className="font-mono mt-1"
              style={{ fontSize: 10, color: '#ff9999' }}
            >
              {retryError}
            </div>
          )}

          {/* Note display + edit */}
          {!editing ? (
            <div className="mt-2">
              {report.coachReviewNote?.trim() ? (
                <div
                  className="rounded-md px-2.5 py-2 leading-relaxed whitespace-pre-wrap"
                  style={{
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.85)',
                    background: 'rgba(198,255,61,0.06)',
                    border: '1px solid rgba(198,255,61,0.20)',
                  }}
                >
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <div
                      className="font-mono uppercase tracking-[0.14em] font-bold"
                      style={{ fontSize: 9, color: '#c6ff3d' }}
                    >
                      Your note
                    </div>
                    {report.coachReviewedAt && (
                      <span
                        className="font-mono"
                        style={{ fontSize: 9, color: 'rgba(255,255,255,0.40)' }}
                      >
                        {new Date(report.coachReviewedAt).toLocaleDateString(
                          'en-GB',
                          { day: 'numeric', month: 'short' }
                        )}
                      </span>
                    )}
                  </div>
                  {report.coachReviewNote}
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-1 mt-2 font-mono uppercase tracking-[0.14em] font-bold transition-opacity hover:opacity-80"
                    style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)' }}
                  >
                    <Pencil size={9} />
                    Edit
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 mt-1 font-mono uppercase tracking-[0.16em] font-bold transition-opacity hover:opacity-80"
                  style={{
                    fontSize: 10,
                    color: '#7dd3ff',
                    background: 'rgba(125,211,255,0.10)',
                    border: '1px solid rgba(125,211,255,0.30)',
                  }}
                >
                  <Pencil size={10} />
                  Add review note
                </button>
              )}
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, 4000))}
                placeholder="HbA1c slightly elevated — start post-meal walks. Re-test in 90 days. Will adjust meals to lower-GI."
                rows={4}
                className="w-full rounded-md bg-bg-elevated border border-border-soft px-2.5 py-2 text-sm focus:border-accent/50 focus:outline-none resize-y"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-mono uppercase tracking-[0.16em] font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{
                    fontSize: 10,
                    color: '#0a0c09',
                    background:
                      'linear-gradient(135deg, #7dd3ff 0%, #c6ff3d 100%)',
                  }}
                >
                  <Save size={10} />
                  {saving ? 'Saving…' : 'Save note'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="inline-flex items-center gap-1 font-mono uppercase tracking-[0.16em] font-bold transition-opacity hover:opacity-80"
                  style={{ fontSize: 10, color: 'rgba(255,255,255,0.50)' }}
                >
                  <X size={10} />
                  Cancel
                </button>
                <span
                  className="font-mono ml-auto"
                  style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}
                >
                  {draft.length}/4000
                </span>
              </div>
              {error && (
                <div className="font-mono text-xs" style={{ color: '#ff9999' }}>
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Extraction status meta (admin) ─────────────────────────────
const ADMIN_STATUS_META: Record<
  string,
  {
    label: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
    border: string;
    spin?: boolean;
  }
> = {
  done: {
    label: 'Extracted',
    icon: <Check size={9} strokeWidth={3} />,
    color: '#c6ff3d',
    bg: 'rgba(198,255,61,0.08)',
    border: 'rgba(198,255,61,0.25)',
  },
  processing: {
    label: 'Reading…',
    icon: <RefreshCw size={9} />,
    color: '#7dd3ff',
    bg: 'rgba(125,211,255,0.08)',
    border: 'rgba(125,211,255,0.25)',
    spin: true,
  },
  pending: {
    label: 'Queued',
    icon: <Clock size={9} />,
    color: '#7dd3ff',
    bg: 'rgba(125,211,255,0.08)',
    border: 'rgba(125,211,255,0.25)',
  },
  stale: {
    label: 'Stalled',
    icon: <AlertTriangle size={9} />,
    color: '#ffb84d',
    bg: 'rgba(255,184,77,0.08)',
    border: 'rgba(255,184,77,0.30)',
  },
  failed: {
    label: 'Failed',
    icon: <AlertTriangle size={9} />,
    color: '#ff9999',
    bg: 'rgba(255,107,107,0.08)',
    border: 'rgba(255,107,107,0.30)',
  },
  skipped: {
    label: 'Skipped',
    icon: <AlertTriangle size={9} />,
    color: 'rgba(255,255,255,0.55)',
    bg: 'rgba(255,255,255,0.04)',
    border: 'rgba(255,255,255,0.15)',
  },
};
