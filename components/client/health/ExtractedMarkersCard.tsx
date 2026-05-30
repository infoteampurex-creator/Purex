'use client';

import { useMemo, useState } from 'react';
import {
  FlaskConical,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Check,
  HelpCircle,
  Sparkles,
  Clock,
} from 'lucide-react';
import type {
  HealthReport,
  ExtractedMarker,
} from '@/lib/data/health-reports';

interface Props {
  reports: HealthReport[];
}

interface LatestMarker extends ExtractedMarker {
  reportId: string;
  reportDate: string | null;
  uploadedAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  blood_sugar: 'Blood sugar',
  lipids: 'Lipids',
  thyroid: 'Thyroid',
  liver: 'Liver',
  kidney: 'Kidney',
  cbc: 'Blood count',
  iron: 'Iron',
  vitamins: 'Vitamins',
  hormones: 'Hormones',
  urine: 'Urine',
  inflammation: 'Inflammation',
  electrolytes: 'Electrolytes',
  other: 'Other',
};

const CATEGORY_ORDER = [
  'blood_sugar',
  'lipids',
  'thyroid',
  'liver',
  'kidney',
  'cbc',
  'iron',
  'vitamins',
  'hormones',
  'inflammation',
  'electrolytes',
  'urine',
  'other',
];

/**
 * ExtractedMarkersCard — surfaces structured lab markers Gemini pulled
 * out of the user's uploaded health reports. Shows the LATEST value
 * per marker across all reports (so a fresh CBC overrides a 3-month-
 * old one), grouped by category, with status pills (high/low/normal).
 *
 * Display:
 *   - "Extracting…" pill while any upload is mid-extraction
 *   - Empty state with friendly nudge ("Upload a lab report and we'll
 *     pull your blood markers into a clean view")
 *   - For each marker: value + unit + lab's reference range + a
 *     coloured status badge (red high, amber low, lime normal, grey
 *     unknown)
 *   - Categories collapsible so the card stays compact
 *
 * Hard rule (legal + UX): we never offer medical advice. The card's
 * subtitle reminds the user this is what THE REPORT says, and to
 * consult their doctor for interpretation.
 */
export function ExtractedMarkersCard({ reports }: Props) {
  const { latest, processing, hasAny } = useMemo(() => {
    const map = new Map<string, LatestMarker>();
    let processing = 0;
    const now = Date.now();
    for (const r of reports) {
      if (r.extractionStatus === 'processing' || r.extractionStatus === 'pending') {
        // Stale gate: a report sitting in 'processing' for >90s is
        // almost certainly a Vercel-killed background job, not a
        // live extraction. Don't show "Reading…" forever — let the
        // HealthPassportCard surface the retry button instead.
        const lastTouch = r.extractedAt ?? r.uploadedAt;
        const ageMs = now - new Date(lastTouch).getTime();
        if (ageMs <= 90 * 1000) processing++;
      }
      if (r.extractionStatus !== 'done' || !r.extractedData) continue;
      for (const m of r.extractedData.markers) {
        const key = m.name.toLowerCase().trim();
        if (!key) continue;
        const candidate: LatestMarker = {
          ...m,
          reportId: r.id,
          reportDate: r.reportDate,
          uploadedAt: r.uploadedAt,
        };
        const existing = map.get(key);
        if (!existing) {
          map.set(key, candidate);
          continue;
        }
        // Keep whichever is newer (report_date wins, fall back to
        // uploaded_at)
        const existingDate = existing.reportDate ?? existing.uploadedAt;
        const candidateDate = candidate.reportDate ?? candidate.uploadedAt;
        if (candidateDate > existingDate) map.set(key, candidate);
      }
    }
    const arr = Array.from(map.values());
    return {
      latest: arr,
      processing,
      hasAny: arr.length > 0,
    };
  }, [reports]);

  // Group by category in stable order
  const byCategory = useMemo(() => {
    const buckets = new Map<string, LatestMarker[]>();
    for (const m of latest) {
      const cat = (m.category || 'other').toLowerCase();
      if (!buckets.has(cat)) buckets.set(cat, []);
      buckets.get(cat)!.push(m);
    }
    return CATEGORY_ORDER.filter((c) => buckets.has(c)).map((c) => ({
      category: c,
      markers: buckets.get(c)!,
    }));
  }, [latest]);

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (c: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  };

  const counts = useMemo(() => {
    let high = 0, low = 0, normal = 0;
    for (const m of latest) {
      if (m.status === 'high') high++;
      else if (m.status === 'low') low++;
      else if (m.status === 'normal') normal++;
    }
    return { high, low, normal };
  }, [latest]);

  return (
    <section
      className="rounded-2xl border overflow-hidden mb-4"
      style={{
        borderColor: 'rgba(255,107,107,0.20)',
        background: `
          radial-gradient(ellipse at 80% 0%, rgba(255,107,107,0.06) 0%, transparent 55%),
          linear-gradient(180deg, #14100f 0%, #0a0c09 100%)
        `,
        boxShadow: '0 0 0 1px rgba(255,107,107,0.10)',
      }}
    >
      <div className="px-4 py-3 flex items-center justify-between border-b border-border-soft">
        <div className="flex items-center gap-2">
          <FlaskConical size={13} style={{ color: '#ff9999' }} />
          <span
            className="font-mono uppercase tracking-[0.18em] font-bold"
            style={{ fontSize: 10, color: '#ff9999' }}
          >
            From your reports
          </span>
        </div>
        {hasAny && (
          <div className="flex items-center gap-2">
            {counts.high > 0 && (
              <Badge color="#ff9999" label={`${counts.high} high`} />
            )}
            {counts.low > 0 && (
              <Badge color="#ffb84d" label={`${counts.low} low`} />
            )}
            {counts.normal > 0 && (
              <Badge color="#c6ff3d" label={`${counts.normal} normal`} />
            )}
          </div>
        )}
      </div>

      {processing > 0 && (
        <div
          className="px-4 py-2 flex items-center gap-2"
          style={{
            background: 'rgba(125,211,255,0.06)',
            borderBottom: '1px solid rgba(125,211,255,0.15)',
          }}
        >
          <Clock size={12} style={{ color: '#7dd3ff' }} />
          <span style={{ fontSize: 11, color: 'rgba(125,211,255,0.90)' }}>
            Reading {processing} report{processing === 1 ? '' : 's'} —
            results appear here in a moment.
          </span>
        </div>
      )}

      <div className="px-4 py-4">
        {!hasAny ? (
          <div
            className="rounded-xl border border-dashed px-4 py-6 text-center"
            style={{
              borderColor: 'rgba(255,255,255,0.10)',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <Sparkles
              size={18}
              style={{
                color: 'rgba(255,153,153,0.50)',
                margin: '0 auto 8px',
              }}
            />
            <div
              className="font-display font-semibold mb-1"
              style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}
            >
              No extracted markers yet
            </div>
            <div
              className="leading-snug mx-auto max-w-sm"
              style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}
            >
              Upload a lab report below — we&apos;ll pull your blood
              markers and show them here in a clean view. Values appear
              exactly as your lab printed them.
            </div>
          </div>
        ) : (
          <>
            <p
              className="leading-snug mb-3"
              style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)' }}
            >
              Latest reading per marker across your reports. Values are
              shown as printed — please consult your doctor for
              interpretation.
            </p>
            <div className="space-y-2">
              {byCategory.map(({ category, markers }) => {
                const open = !collapsed.has(category);
                return (
                  <div
                    key={category}
                    className="rounded-xl border overflow-hidden"
                    style={{
                      borderColor: 'rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(category)}
                      className="w-full px-3 py-2 flex items-center justify-between gap-2 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="font-mono uppercase tracking-[0.16em] font-bold"
                          style={{
                            fontSize: 10,
                            color: 'rgba(255,255,255,0.75)',
                          }}
                        >
                          {CATEGORY_LABELS[category] ?? category}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            color: 'rgba(255,255,255,0.45)',
                          }}
                        >
                          · {markers.length}
                        </span>
                      </div>
                      {open ? (
                        <ChevronUp
                          size={12}
                          style={{ color: 'rgba(255,255,255,0.50)' }}
                        />
                      ) : (
                        <ChevronDown
                          size={12}
                          style={{ color: 'rgba(255,255,255,0.50)' }}
                        />
                      )}
                    </button>

                    {open && (
                      <ul className="border-t border-border-soft">
                        {markers.map((m, i) => (
                          <MarkerRow key={i} marker={m} />
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// ─── helpers ────────────────────────────────────────────────────

function MarkerRow({ marker }: { marker: LatestMarker }) {
  const statusStyle = STATUS_STYLES[marker.status];
  return (
    <li
      className="px-3 py-2 grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 border-b last:border-b-0"
      style={{ borderColor: 'rgba(255,255,255,0.04)' }}
    >
      <div className="min-w-0">
        <div
          className="font-display font-semibold truncate"
          style={{ fontSize: 13, color: 'rgba(255,255,255,0.90)' }}
        >
          {marker.name}
        </div>
        {(marker.reference_range || marker.unit) && (
          <div
            style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}
          >
            {marker.reference_range
              ? `Range: ${marker.reference_range}${marker.unit ? ' ' + marker.unit : ''}`
              : marker.unit
                ? `Unit: ${marker.unit}`
                : ''}
          </div>
        )}
      </div>
      <div className="text-right flex flex-col items-end gap-0.5">
        <div className="flex items-baseline gap-1">
          <span
            className="font-display font-bold"
            style={{ fontSize: 14, color: statusStyle.color }}
          >
            {marker.value}
          </span>
          {marker.unit && (
            <span
              style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}
            >
              {marker.unit}
            </span>
          )}
        </div>
        <span
          className="inline-flex items-center gap-0.5 font-mono uppercase tracking-[0.14em] font-bold rounded-full px-1.5 py-0.5"
          style={{
            fontSize: 8,
            color: statusStyle.color,
            background: statusStyle.bg,
            border: '1px solid ' + statusStyle.border,
          }}
        >
          {statusStyle.icon}
          {statusStyle.label}
        </span>
      </div>
    </li>
  );
}

const STATUS_STYLES: Record<
  'high' | 'low' | 'normal' | 'unknown',
  {
    color: string;
    bg: string;
    border: string;
    label: string;
    icon: React.ReactNode;
  }
> = {
  high: {
    color: '#ff9999',
    bg: 'rgba(255,107,107,0.10)',
    border: 'rgba(255,107,107,0.30)',
    label: 'High',
    icon: <TrendingUp size={9} />,
  },
  low: {
    color: '#ffb84d',
    bg: 'rgba(255,184,77,0.10)',
    border: 'rgba(255,184,77,0.30)',
    label: 'Low',
    icon: <TrendingDown size={9} />,
  },
  normal: {
    color: '#c6ff3d',
    bg: 'rgba(198,255,61,0.08)',
    border: 'rgba(198,255,61,0.25)',
    label: 'Normal',
    icon: <Check size={9} strokeWidth={3} />,
  },
  unknown: {
    color: 'rgba(255,255,255,0.55)',
    bg: 'rgba(255,255,255,0.04)',
    border: 'rgba(255,255,255,0.15)',
    label: '—',
    icon: <HelpCircle size={9} />,
  },
};

function Badge({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="font-mono uppercase tracking-[0.14em] font-bold"
      style={{ fontSize: 9, color }}
    >
      {label}
    </span>
  );
}

// Silence unused import — `AlertTriangle` reserved for a future
// "low-confidence extraction" warning row.
void AlertTriangle;
