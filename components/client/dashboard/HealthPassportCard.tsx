'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldPlus,
  FileText,
  Image as ImageIcon,
  Upload,
  Trash2,
  AlertTriangle,
  Eye,
  Sparkles,
} from 'lucide-react';
import {
  uploadHealthReport,
  deleteHealthReport,
  getReportViewUrl,
} from '@/lib/actions/health-reports';
import {
  HEALTH_PASSPORT_DISCLAIMER,
  isPdfReport,
  reportDisplayName,
  reportFileSize,
  type HealthReport,
} from '@/lib/data/health-reports';

interface Props {
  initialReports: HealthReport[];
}

/**
 * HealthPassportCard — Phase 1 upload-only Health Passport UI.
 *
 * What it does:
 *   • Lists the user's uploaded lab reports (newest first)
 *   • Upload button opens a file picker (PDF/JPG/PNG, max 10 MB)
 *   • Optional label + report date prompt before upload
 *   • Tap a report → opens signed URL in new tab (5-min expiry)
 *   • Delete with confirm
 *   • Safety disclaimer always visible
 *
 * What it deliberately does NOT do (per docs/product-vision.md §4):
 *   • No AI extraction
 *   • No biomarker parsing
 *   • No "health score" / "biomarker balance" derivation
 *   • No interpretation copy beyond what the user / coach wrote
 *
 * Coach review notes (from admin) show up read-only when present.
 */
export function HealthPassportCard({ initialReports }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reports, setReports] = useState<HealthReport[]>(initialReports);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [reportLabel, setReportLabel] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  // ─── File pick → show metadata form before upload ──────────────

  const handlePickFile = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(
        `File too large — ${(file.size / 1024 / 1024).toFixed(1)} MB. Max 10 MB.`
      );
      e.target.value = '';
      return;
    }
    setPendingFile(file);
    e.target.value = ''; // allow re-pick of the same file
  };

  // ─── Submit upload ─────────────────────────────────────────────

  const handleUpload = async () => {
    if (!pendingFile || busy) return;
    setBusy(true);
    setUploadError(null);
    try {
      const base64 = await fileToBase64(pendingFile);
      const result = await uploadHealthReport({
        filename: pendingFile.name,
        mimeType: pendingFile.type || 'application/octet-stream',
        base64,
        reportLabel: reportLabel.trim() || null,
        reportDate: reportDate || null,
      });
      if (!result.ok) {
        setUploadError(result.error);
        return;
      }
      setReports((prev) => [result.report, ...prev]);
      setPendingFile(null);
      setReportLabel('');
      setReportDate('');
      router.refresh();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const handleCancelUpload = () => {
    setPendingFile(null);
    setReportLabel('');
    setReportDate('');
    setUploadError(null);
  };

  // ─── View report ───────────────────────────────────────────────

  const handleView = async (report: HealthReport) => {
    const result = await getReportViewUrl(report.id);
    if (!result.ok) {
      // eslint-disable-next-line no-console
      console.warn('Could not get view URL:', result.error);
      return;
    }
    window.open(result.url, '_blank', 'noopener');
  };

  // ─── Delete report ─────────────────────────────────────────────

  const handleDelete = (report: HealthReport) => {
    if (!confirm(`Delete "${reportDisplayName(report)}"? This cannot be undone.`))
      return;
    startTransition(async () => {
      const result = await deleteHealthReport(report.id);
      if (!result.ok) {
        // eslint-disable-next-line no-console
        console.warn('Delete failed:', result.error);
        return;
      }
      setReports((prev) => prev.filter((r) => r.id !== report.id));
      router.refresh();
    });
  };

  const latest = reports[0] ?? null;

  return (
    <div
      className="relative rounded-3xl overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 50% 0%, rgba(125, 211, 255, 0.10) 0%, transparent 60%),
          linear-gradient(180deg, #0f1316 0%, #0a0c09 100%)
        `,
        border: '1px solid rgba(125, 211, 255, 0.22)',
        boxShadow:
          '0 0 0 1px rgba(125, 211, 255, 0.10), 0 24px 48px -12px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* ─── Header ─── */}
      <div className="relative px-5 pt-5 pb-3 flex items-center justify-between gap-2 flex-wrap">
        <div
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] font-bold"
          style={{ color: '#7dd3ff' }}
        >
          <Sparkles size={11} />
          Health Passport
        </div>
        <span
          className="font-mono uppercase tracking-[0.18em] font-bold"
          style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)' }}
        >
          {reports.length} {reports.length === 1 ? 'report' : 'reports'}
        </span>
      </div>

      {/* ─── Hero copy ─── */}
      <div className="relative px-5 pb-3">
        {latest ? (
          <>
            <h3
              className="font-display font-bold tracking-tight leading-tight"
              style={{ fontSize: 18, color: 'rgba(245,245,240,0.95)' }}
            >
              Latest: {reportDisplayName(latest)}
            </h3>
            <p
              className="mt-1 leading-snug"
              style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}
            >
              Uploaded{' '}
              {new Date(latest.uploadedAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
              {latest.coachReviewNote && (
                <>
                  {' · '}
                  <span style={{ color: '#c6ff3d' }}>Coach reviewed</span>
                </>
              )}
            </p>
          </>
        ) : (
          <>
            <h3
              className="font-display font-bold tracking-tight leading-tight"
              style={{ fontSize: 18, color: 'rgba(245,245,240,0.95)' }}
            >
              Upload your first lab report
            </h3>
            <p
              className="mt-1 leading-snug"
              style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}
            >
              PDF or photo. Your coach reviews it and adjusts your plan.
            </p>
          </>
        )}
      </div>

      {/* ─── Upload action ─── */}
      <div className="relative px-5 pb-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
          onChange={handleFileChange}
          className="hidden"
        />
        <AnimatePresence mode="wait">
          {!pendingFile ? (
            <motion.button
              key="pick"
              type="button"
              onClick={handlePickFile}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-mono uppercase tracking-[0.20em] font-bold transition-opacity hover:opacity-90"
              style={{
                fontSize: 11,
                color: '#0a0c09',
                background:
                  'linear-gradient(135deg, #7dd3ff 0%, #c6ff3d 100%)',
                boxShadow: '0 0 18px rgba(125,211,255,0.32)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ShieldPlus size={14} />
              Upload report
            </motion.button>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div
                className="rounded-xl p-3 space-y-3"
                style={{
                  background: 'rgba(125,211,255,0.06)',
                  border: '1px solid rgba(125,211,255,0.25)',
                }}
              >
                <div className="flex items-center gap-2">
                  <FileText size={14} style={{ color: '#7dd3ff' }} />
                  <span
                    className="text-sm truncate"
                    style={{ color: 'rgba(255,255,255,0.90)' }}
                  >
                    {pendingFile.name}
                  </span>
                  <span
                    className="font-mono"
                    style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}
                  >
                    {reportFileSize(pendingFile.size)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Label (e.g. March bloodwork)"
                    value={reportLabel}
                    onChange={(e) => setReportLabel(e.target.value.slice(0, 120))}
                    className="rounded-md bg-bg-elevated border border-border-soft px-2 py-1.5 text-xs focus:border-accent/50 focus:outline-none"
                  />
                  <input
                    type="date"
                    placeholder="Report date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="rounded-md bg-bg-elevated border border-border-soft px-2 py-1.5 text-xs focus:border-accent/50 focus:outline-none"
                  />
                </div>
                {uploadError && (
                  <div
                    className="flex items-start gap-2 rounded-md px-2 py-1.5"
                    style={{
                      background: 'rgba(255,107,107,0.10)',
                      border: '1px solid rgba(255,107,107,0.30)',
                    }}
                  >
                    <AlertTriangle
                      size={12}
                      style={{ color: '#ff6b6b', flexShrink: 0, marginTop: 1 }}
                    />
                    <span
                      style={{ fontSize: 11, color: '#ff9999' }}
                    >
                      {uploadError}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono uppercase tracking-[0.16em] font-bold disabled:opacity-50"
                    style={{
                      fontSize: 10,
                      color: '#0a0c09',
                      background:
                        'linear-gradient(135deg, #7dd3ff 0%, #c6ff3d 100%)',
                    }}
                  >
                    <Upload size={11} />
                    {busy ? 'Uploading…' : 'Upload'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelUpload}
                    disabled={busy}
                    className="font-mono uppercase tracking-[0.16em] font-bold transition-opacity hover:opacity-80"
                    style={{ fontSize: 10, color: 'rgba(255,255,255,0.50)' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Report list ─── */}
      {reports.length > 0 && (
        <div className="relative px-5 pb-4 space-y-2">
          {reports.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border px-3 py-2.5 flex items-start gap-3"
              style={{
                background: 'rgba(255,255,255,0.02)',
                borderColor: 'rgba(255,255,255,0.06)',
              }}
            >
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'rgba(125,211,255,0.14)',
                  color: '#7dd3ff',
                }}
              >
                {isPdfReport(r) ? <FileText size={14} /> : <ImageIcon size={14} />}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className="font-semibold text-sm leading-tight truncate"
                  style={{ color: 'rgba(245,245,240,0.92)' }}
                >
                  {reportDisplayName(r)}
                </div>
                <div
                  className="font-mono mt-0.5"
                  style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)' }}
                >
                  {reportFileSize(r.fileSizeBytes)}
                  {' · '}
                  {new Date(r.uploadedAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
                {r.coachReviewNote && (
                  <div
                    className="mt-2 rounded-md px-2 py-1.5"
                    style={{
                      background: 'rgba(198,255,61,0.08)',
                      border: '1px solid rgba(198,255,61,0.25)',
                    }}
                  >
                    <div
                      className="font-mono uppercase tracking-[0.14em] font-bold mb-0.5"
                      style={{ fontSize: 9, color: '#c6ff3d' }}
                    >
                      Coach note
                    </div>
                    <div
                      className="leading-snug"
                      style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}
                    >
                      {r.coachReviewNote}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleView(r)}
                  aria-label="View report"
                  className="w-7 h-7 rounded-md border border-border-soft text-text-muted hover:border-accent hover:text-accent transition-colors flex items-center justify-center"
                >
                  <Eye size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(r)}
                  aria-label="Delete report"
                  className="w-7 h-7 rounded-md border border-border-soft text-text-muted hover:border-danger/50 hover:text-danger transition-colors flex items-center justify-center"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Disclaimer ─── */}
      <div
        className="relative px-5 py-3 border-t"
        style={{ borderColor: 'rgba(255,255,255,0.05)' }}
      >
        <p
          className="leading-relaxed"
          style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)' }}
        >
          {HEALTH_PASSPORT_DISCLAIMER}
        </p>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────

/**
 * Read a File into base64. Used so we can hand the file to a JSON
 * server action instead of dealing with multipart parsing on the
 * server. 10 MB cap means base64 inflation (~33%) tops out around
 * ~14 MB string payload — well within Next's body limits.
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('FileReader returned non-string'));
        return;
      }
      // result is "data:<mime>;base64,<payload>" — strip prefix
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
    reader.readAsDataURL(file);
  });
}
