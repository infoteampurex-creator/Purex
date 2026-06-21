/**
 * Health Passport — pure types + display helpers.
 *
 * Phase 1: data-custodian only. Phase 2 (this version) adds
 * Gemini-powered structured extraction of test markers from the
 * uploaded file. We surface the values AS THEY APPEAR ON THE REPORT —
 * we do not diagnose, recommend medication, or interpret beyond
 * "this number is above/below the lab's reference range." The legal
 * posture (data custodian, no medical advice) is unchanged.
 */

export type ExtractionStatus =
  | 'pending'
  | 'processing'
  | 'done'
  | 'failed'
  | 'skipped';

export interface ExtractedMarker {
  name: string;
  value: string;
  unit: string;
  reference_range: string;
  status: 'high' | 'low' | 'normal' | 'unknown';
  category: string;
}

export interface ExtractedReportPayload {
  report_type: string;
  report_date: string;
  lab_name: string;
  markers: ExtractedMarker[];
  interpretation: string;
  confidence: number;
}

export interface HealthReport {
  id: string;
  clientId: string;
  /**
   * New "file stays on user's device" rows have storage_path === null
   * (and mime / size also null) because we never persisted the file.
   * Legacy rows uploaded before that policy still have it populated.
   */
  storagePath: string | null;
  originalFilename: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  reportLabel: string | null;
  reportDate: string | null;           // YYYY-MM-DD
  coachReviewNote: string | null;
  coachReviewedAt: string | null;      // ISO datetime
  coachReviewedBy: string | null;
  uploadedAt: string;                  // ISO datetime

  // AI extraction (Phase 2 — Gemini vision)
  extractionStatus: ExtractionStatus;
  extractedAt: string | null;
  extractedData: ExtractedReportPayload | null;
  extractedSummary: string | null;
  extractionError: string | null;
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

export function reportFileSize(bytes: number | null): string {
  if (bytes == null) return 'on device';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Returns true if mime points to a PDF (different preview UI). */
export function isPdfReport(report: HealthReport): boolean {
  return report.mimeType === 'application/pdf';
}

/**
 * True for rows uploaded under the "file stays on the user's device"
 * policy — i.e. we never persisted the original file to Storage and
 * only have the structured extraction. The admin "View" + client
 * "Open file" affordances are hidden for these rows.
 */
export function isFileOnDevice(report: HealthReport): boolean {
  return report.storagePath === null;
}

// ─── Safety disclaimer copy (shown wherever reports are listed) ──

export const HEALTH_PASSPORT_DISCLAIMER =
  'PureX Health Passport stores your uploaded lab reports and presents ' +
  'the values as they appear in your document. It does NOT provide ' +
  'medical diagnosis or treatment advice. Always consult a qualified ' +
  'medical professional before making decisions about your health, ' +
  'medication, or treatment.';
