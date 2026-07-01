/**
 * Health Passport — pure types + display helpers.
 *
 * Manual-entry model (v3, post-#77): lab reports are structured
 * records of marker readings, entered by admin or client against a
 * pre-seeded catalog of Indian-lab panels. No PDF uploads, no AI
 * extraction. Values, units, and reference ranges come from the
 * catalog — the user only enters the numeric value.
 *
 * Legal posture unchanged (data custodian, no medical advice).
 */

// ─── Catalog types ──────────────────────────────────────────────

export interface LabPanel {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  displayOrder: number;
}

export interface LabMarker {
  id: string;
  panelId: string;
  slug: string;
  name: string;
  shortName: string | null;
  unit: string | null;
  refLow: number | null;
  refHigh: number | null;
  refLowFemale: number | null;
  refHighFemale: number | null;
  higherIsBetter: boolean;
  displayOrder: number;
}

export interface LabPanelWithMarkers extends LabPanel {
  markers: LabMarker[];
}

// ─── Report + reading types ─────────────────────────────────────

export interface MarkerReading {
  id: string;
  markerId: string;
  markerSlug: string;
  markerName: string;
  markerShortName: string | null;
  panelSlug: string;
  panelName: string;
  unit: string | null;
  refLow: number | null;
  refHigh: number | null;
  higherIsBetter: boolean;
  value: number;
  notes: string | null;
  enteredBy: string | null;
  enteredAt: string;
}

export interface HealthReport {
  id: string;
  clientId: string;
  reportLabel: string | null;
  reportDate: string | null; // YYYY-MM-DD
  coachReviewNote: string | null;
  coachReviewedAt: string | null;
  coachReviewedBy: string | null;
  enteredBy: string | null;
  createdAt: string;
}

export interface HealthReportWithReadings extends HealthReport {
  readings: MarkerReading[];
}

// ─── Status computation ─────────────────────────────────────────

export type MarkerStatus = 'normal' | 'low' | 'high' | 'critical' | 'unknown';

/**
 * Decide status for a single reading, respecting gender-adjusted
 * ranges and the higher-is-better flip (HDL, Vitamin D, eGFR — high
 * values are GOOD, so we don't flag them red).
 */
export function statusForReading(
  value: number,
  marker: {
    refLow: number | null;
    refHigh: number | null;
    refLowFemale?: number | null;
    refHighFemale?: number | null;
    higherIsBetter: boolean;
  },
  gender: 'male' | 'female' | null = null
): MarkerStatus {
  const low =
    gender === 'female' && marker.refLowFemale != null
      ? marker.refLowFemale
      : marker.refLow;
  const high =
    gender === 'female' && marker.refHighFemale != null
      ? marker.refHighFemale
      : marker.refHigh;

  if (low == null && high == null) return 'unknown';

  const belowLow = low != null && value < low;
  const aboveHigh = high != null && value > high;

  if (marker.higherIsBetter) {
    if (belowLow) return 'low';
    return 'normal';
  }

  if (belowLow) return 'low';
  if (aboveHigh) {
    // 50% over the upper bound → critical (rough heuristic)
    if (high != null && value > high * 1.5) return 'critical';
    return 'high';
  }
  return 'normal';
}

/** Human-readable range for the marker card. */
export function formatRange(marker: {
  refLow: number | null;
  refHigh: number | null;
  unit: string | null;
}): string {
  const u = marker.unit ? ` ${marker.unit}` : '';
  if (marker.refLow != null && marker.refHigh != null) {
    return `${marker.refLow}–${marker.refHigh}${u}`;
  }
  if (marker.refHigh != null) return `<${marker.refHigh}${u}`;
  if (marker.refLow != null) return `>${marker.refLow}${u}`;
  return 'no range';
}

// ─── Report-level helpers ───────────────────────────────────────

/** "Lab report · 15 Nov 2026" or the user-supplied label. */
export function reportDisplayName(report: HealthReport): string {
  if (report.reportLabel) return report.reportLabel;
  const date = report.reportDate ?? report.createdAt.slice(0, 10);
  const d = new Date(date);
  return `Lab report · ${d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
}

/** % of a report's readings that landed in-range (or higher-is-better). */
export function reportInRangePct(
  report: HealthReportWithReadings,
  gender: 'male' | 'female' | null = null
): number {
  if (!report.readings.length) return 0;
  const inRange = report.readings.filter((r) => {
    const status = statusForReading(
      r.value,
      {
        refLow: r.refLow,
        refHigh: r.refHigh,
        higherIsBetter: r.higherIsBetter,
      },
      gender
    );
    return status === 'normal' || status === 'unknown';
  }).length;
  return Math.round((inRange / report.readings.length) * 100);
}

// ─── Safety disclaimer copy (shown wherever reports are listed) ─

export const HEALTH_PASSPORT_DISCLAIMER =
  'PureX Health Passport stores your lab marker readings and shows ' +
  'each value alongside the standard reference range. It does NOT ' +
  'provide medical diagnosis or treatment advice. Always consult a ' +
  'qualified medical professional before making decisions about your ' +
  'health, medication, or treatment.';
