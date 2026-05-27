/**
 * Health Passport — pure types + display helpers.
 *
 * Phase 1: data-custodian only. We hold the file + light metadata,
 * the coach interprets it. No AI extraction, no biomarker parsing
 * (legal posture per docs/product-vision.md §4).
 */

export interface HealthReport {
  id: string;
  clientId: string;
  storagePath: string;
  originalFilename: string | null;
  mimeType: string;
  fileSizeBytes: number;
  reportLabel: string | null;
  reportDate: string | null;           // YYYY-MM-DD
  coachReviewNote: string | null;
  coachReviewedAt: string | null;      // ISO datetime
  coachReviewedBy: string | null;
  uploadedAt: string;                  // ISO datetime
}

/** Friendly display name fallback chain. */
export function reportDisplayName(report: HealthReport): string {
  if (report.reportLabel) return report.reportLabel;
  if (report.originalFilename) return report.originalFilename;
  const d = new Date(report.uploadedAt);
  return `Lab report · ${d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
}

export function reportFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Returns true if mime points to a PDF (different preview UI). */
export function isPdfReport(report: HealthReport): boolean {
  return report.mimeType === 'application/pdf';
}

// ─── Safety disclaimer copy (shown wherever reports are listed) ──

export const HEALTH_PASSPORT_DISCLAIMER =
  'PureX Health Passport stores your uploaded lab reports and presents ' +
  'the values as they appear in your document. It does NOT provide ' +
  'medical diagnosis or treatment advice. Always consult a qualified ' +
  'medical professional before making decisions about your health, ' +
  'medication, or treatment.';
