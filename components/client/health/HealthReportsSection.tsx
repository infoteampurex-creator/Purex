'use client';

import { useMemo, useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ClipboardList,
  ChevronDown,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { deleteHealthReport } from '@/lib/actions/health-reports';
import {
  statusForReading,
  formatRange,
  reportDisplayName,
  reportInRangePct,
  HEALTH_PASSPORT_DISCLAIMER,
  type HealthReportWithReadings,
  type LabPanelWithMarkers,
  type MarkerStatus,
} from '@/lib/data/health-reports';
import {
  AddReportModal,
  AddReportButton,
} from './AddReportModal';

interface Props {
  reports: HealthReportWithReadings[];
  catalog: LabPanelWithMarkers[];
  targetClientId?: string;
  gender?: 'male' | 'female' | null;
}

const STATUS_COLOR: Record<MarkerStatus, string> = {
  normal: '#c6ff3d',
  low: '#ffd24d',
  high: '#ff8a4d',
  critical: '#ff6b6b',
  unknown: 'rgba(255,255,255,0.45)',
};

export function HealthReportsSection({
  reports,
  catalog,
  targetClientId,
  gender = null,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  return (
    <section
      className="rounded-3xl border overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 50% 0%, rgba(198,255,61,0.10) 0%, transparent 60%),
          linear-gradient(180deg, #0f130d 0%, #0a0c09 100%)
        `,
        borderColor: 'rgba(198,255,61,0.22)',
      }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
        <div>
          <div
            className="inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.22em] font-bold"
            style={{ fontSize: 10, color: '#c6ff3d' }}
          >
            <ClipboardList size={11} />
            Health Passport
          </div>
          <h3
            className="font-display font-bold tracking-tight leading-tight mt-1"
            style={{ fontSize: 18, color: 'rgba(245,245,240,0.95)' }}
          >
            {reports.length} report{reports.length === 1 ? '' : 's'} on file
          </h3>
        </div>
        <AddReportButton onClick={() => setModalOpen(true)} />
      </div>

      {/* Empty state */}
      {reports.length === 0 && (
        <div
          className="mx-5 mb-5 rounded-2xl border border-dashed px-4 py-6"
          style={{ borderColor: 'rgba(255,255,255,0.15)' }}
        >
          <p
            className="text-center leading-snug"
            style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}
          >
            No lab reports yet. Tap <span style={{ color: '#c6ff3d', fontWeight: 700 }}>+ Add report</span> to enter values from your bloodwork.
            You&apos;ll see progress and comparisons here after the second report.
          </p>
        </div>
      )}

      {/* Report list */}
      {reports.length > 0 && (
        <div className="px-5 pb-3 space-y-2">
          {reports.map((r) => (
            <ReportRow
              key={r.id}
              report={r}
              gender={gender}
              onDeleted={() => router.refresh()}
            />
          ))}
        </div>
      )}

      {/* Disclaimer footer */}
      <div
        className="px-5 py-3 border-t flex items-start gap-2"
        style={{ borderColor: 'rgba(255,255,255,0.05)' }}
      >
        <AlertCircle
          size={12}
          style={{
            color: 'rgba(255,255,255,0.40)',
            flexShrink: 0,
            marginTop: 2,
          }}
        />
        <p
          className="leading-relaxed"
          style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)' }}
        >
          {HEALTH_PASSPORT_DISCLAIMER}
        </p>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <AddReportModal
            catalog={catalog}
            targetClientId={targetClientId}
            gender={gender}
            onClose={() => setModalOpen(false)}
            onSaved={() => {
              setModalOpen(false);
              router.refresh();
            }}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

// ─── One report row (expandable) ────────────────────────────────

function ReportRow({
  report,
  gender,
  onDeleted,
}: {
  report: HealthReportWithReadings;
  gender: 'male' | 'female' | null;
  onDeleted: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, startDelete] = useTransition();
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  const inRange = useMemo(() => reportInRangePct(report, gender), [report, gender]);

  // Group readings by panel for display
  const grouped = useMemo(() => {
    const map = new Map<string, typeof report.readings>();
    for (const r of report.readings) {
      const list = map.get(r.panelSlug) ?? [];
      list.push(r);
      map.set(r.panelSlug, list);
    }
    return Array.from(map.entries()).map(([slug, readings]) => ({
      slug,
      name: readings[0]?.panelName ?? slug,
      readings,
    }));
  }, [report.readings]);

  const dateStr = report.reportDate
    ? new Date(report.reportDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : new Date(report.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

  const ringColor =
    inRange >= 80
      ? '#c6ff3d'
      : inRange >= 60
        ? '#ffd24d'
        : inRange >= 40
          ? '#ff8a4d'
          : '#ff6b6b';

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-3 py-3 flex items-center gap-3"
      >
        {/* Score ring */}
        <div
          className="relative flex items-center justify-center"
          style={{ width: 40, height: 40 }}
        >
          <svg width={40} height={40}>
            <circle
              cx={20}
              cy={20}
              r={16}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={3}
              fill="none"
            />
            <circle
              cx={20}
              cy={20}
              r={16}
              stroke={ringColor}
              strokeWidth={3}
              fill="none"
              strokeDasharray={2 * Math.PI * 16}
              strokeDashoffset={2 * Math.PI * 16 * (1 - inRange / 100)}
              strokeLinecap="round"
              transform="rotate(-90 20 20)"
            />
          </svg>
          <span
            className="absolute font-mono font-bold tabular-nums"
            style={{ fontSize: 10, color: ringColor }}
          >
            {inRange}
          </span>
        </div>

        {/* Meta */}
        <div className="flex-1 text-left min-w-0">
          <div
            className="font-display font-bold tracking-tight leading-tight truncate"
            style={{ fontSize: 14, color: 'rgba(245,245,240,0.95)' }}
          >
            {reportDisplayName(report)}
          </div>
          <div
            className="font-mono mt-0.5"
            style={{ fontSize: 10, color: 'rgba(255,255,255,0.50)' }}
          >
            {dateStr} · {report.readings.length} marker
            {report.readings.length === 1 ? '' : 's'} · {inRange}% in range
          </div>
        </div>

        <ChevronDown
          size={16}
          style={{
            color: 'rgba(255,255,255,0.50)',
            transform: expanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 150ms',
          }}
        />
      </button>

      {expanded && (
        <div
          className="border-t"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          {grouped.map((g) => (
            <div key={g.slug}>
              <div
                className="px-3 py-1.5 font-mono uppercase tracking-[0.14em] font-bold"
                style={{
                  fontSize: 9,
                  color: 'rgba(255,255,255,0.45)',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                {g.name}
              </div>
              {g.readings.map((r) => {
                const status = statusForReading(
                  r.value,
                  {
                    refLow: r.refLow,
                    refHigh: r.refHigh,
                    higherIsBetter: r.higherIsBetter,
                  },
                  gender
                );
                return (
                  <div
                    key={r.id}
                    className="px-3 py-2 flex items-center gap-3 border-t"
                    style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-display font-bold tracking-tight leading-tight"
                        style={{
                          fontSize: 13,
                          color: 'rgba(245,245,240,0.95)',
                        }}
                      >
                        {r.markerName}
                      </div>
                      <div
                        className="font-mono"
                        style={{
                          fontSize: 10,
                          color: 'rgba(255,255,255,0.45)',
                        }}
                      >
                        Ref: {formatRange(r)}
                      </div>
                    </div>
                    <div
                      className="font-mono font-bold tabular-nums text-right"
                      style={{
                        fontSize: 14,
                        color: STATUS_COLOR[status],
                      }}
                    >
                      {r.value}
                      {r.unit ? (
                        <span
                          className="ml-1"
                          style={{
                            fontSize: 10,
                            color: 'rgba(255,255,255,0.45)',
                          }}
                        >
                          {r.unit}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Delete row */}
          <motion.div
            initial={false}
            animate={{ opacity: deleteErr ? 1 : 1 }}
            className="border-t px-3 py-2 flex items-center justify-between gap-2"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            {deleteErr ? (
              <span className="text-sm" style={{ color: '#ff6b6b' }}>
                {deleteErr}
              </span>
            ) : (
              <span
                className="font-mono"
                style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}
              >
                Delete removes all values from this report.
              </span>
            )}
            <button
              onClick={() => {
                if (!confirm('Delete this report and all its values?')) return;
                setDeleteErr(null);
                startDelete(async () => {
                  const res = await deleteHealthReport(report.id);
                  if (!res.ok) setDeleteErr(res.error);
                  else onDeleted();
                });
              }}
              disabled={deleting}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 font-mono uppercase tracking-[0.14em] font-bold transition-opacity"
              style={{
                fontSize: 9,
                color: '#ff6b6b',
                background: 'rgba(255,107,107,0.10)',
                border: '1px solid rgba(255,107,107,0.30)',
                opacity: deleting ? 0.5 : 1,
              }}
            >
              <Trash2 size={10} />
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
