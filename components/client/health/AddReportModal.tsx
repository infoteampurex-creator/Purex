'use client';

import { useMemo, useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, ChevronDown, Loader2, CheckCircle2 } from 'lucide-react';
import { saveHealthReport } from '@/lib/actions/health-reports';
import {
  statusForReading,
  formatRange,
  type LabPanelWithMarkers,
  type LabMarker,
  type MarkerStatus,
} from '@/lib/data/health-reports';

interface Props {
  catalog: LabPanelWithMarkers[];
  /** When set (admin flow), submits on behalf of that client. */
  targetClientId?: string;
  /** Client's gender — drives which reference range applies. */
  gender?: 'male' | 'female' | null;
  onClose: () => void;
  onSaved: () => void;
}

interface DraftEntry {
  markerId: string;
  raw: string; // What the user typed — preserved so blank ≠ 0
}

/** Colored status pill for a marker's current value. */
function StatusPill({ status }: { status: MarkerStatus }) {
  const map: Record<
    MarkerStatus,
    { label: string; fg: string; bg: string; border: string }
  > = {
    normal: {
      label: 'In range',
      fg: '#c6ff3d',
      bg: 'rgba(198,255,61,0.10)',
      border: 'rgba(198,255,61,0.30)',
    },
    low: {
      label: 'Low',
      fg: '#ffd24d',
      bg: 'rgba(255,210,77,0.10)',
      border: 'rgba(255,210,77,0.30)',
    },
    high: {
      label: 'High',
      fg: '#ff8a4d',
      bg: 'rgba(255,138,77,0.12)',
      border: 'rgba(255,138,77,0.30)',
    },
    critical: {
      label: 'Critical',
      fg: '#ff6b6b',
      bg: 'rgba(255,107,107,0.12)',
      border: 'rgba(255,107,107,0.35)',
    },
    unknown: {
      label: 'No range',
      fg: 'rgba(255,255,255,0.55)',
      bg: 'rgba(255,255,255,0.04)',
      border: 'rgba(255,255,255,0.10)',
    },
  };
  const s = map[status];
  return (
    <span
      className="font-mono uppercase tracking-[0.14em] font-bold px-2 py-0.5 rounded"
      style={{
        fontSize: 9,
        color: s.fg,
        background: s.bg,
        border: `1px solid ${s.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {s.label}
    </span>
  );
}

function markerVisibleForGender(
  marker: LabMarker,
  gender: 'male' | 'female' | null | undefined
): boolean {
  // If the marker has no default range but has a female range, hide it
  // for male clients (Estradiol, LH, FSH, AMH, Progesterone).
  const hasDefault = marker.refLow != null || marker.refHigh != null;
  const hasFemale =
    marker.refLowFemale != null || marker.refHighFemale != null;
  if (!hasDefault && hasFemale && gender === 'male') return false;
  return true;
}

export function AddReportModal({
  catalog,
  targetClientId,
  gender,
  onClose,
  onSaved,
}: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [reportDate, setReportDate] = useState(today);
  const [reportLabel, setReportLabel] = useState('');
  const [selectedPanels, setSelectedPanels] = useState<Set<string>>(new Set());
  const [openPanels, setOpenPanels] = useState<Set<string>>(new Set());
  const [entries, setEntries] = useState<Record<string, DraftEntry>>({});
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredPanels = useMemo(() => {
    if (!search.trim()) return catalog;
    const q = search.toLowerCase();
    return catalog.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.markers.some(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.slug.toLowerCase().includes(q)
        )
    );
  }, [catalog, search]);

  const togglePanel = (panelId: string) => {
    setSelectedPanels((prev) => {
      const next = new Set(prev);
      if (next.has(panelId)) {
        next.delete(panelId);
        setOpenPanels((op) => {
          const nop = new Set(op);
          nop.delete(panelId);
          return nop;
        });
      } else {
        next.add(panelId);
        setOpenPanels((op) => new Set(op).add(panelId));
      }
      return next;
    });
  };

  const toggleOpen = (panelId: string) => {
    setOpenPanels((prev) => {
      const next = new Set(prev);
      if (next.has(panelId)) next.delete(panelId);
      else next.add(panelId);
      return next;
    });
  };

  const readingCount = useMemo(
    () =>
      Object.values(entries).filter((e) => e.raw.trim() !== '').length,
    [entries]
  );

  const handleSave = () => {
    setError(null);
    // Collect entries that have a real value.
    const readings = Object.values(entries)
      .filter((e) => e.raw.trim() !== '')
      .map((e) => ({
        markerId: e.markerId,
        value: Number(e.raw),
      }))
      .filter((r) => Number.isFinite(r.value));

    if (readings.length === 0) {
      setError('Enter at least one marker value.');
      return;
    }

    startTransition(async () => {
      const result = await saveHealthReport({
        targetClientId: targetClientId ?? null,
        reportDate,
        reportLabel: reportLabel.trim() || null,
        readings,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSaved();
    });
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl border overflow-hidden flex flex-col"
        style={{
          background: 'linear-gradient(180deg, #14161a 0%, #0a0c09 100%)',
          borderColor: 'rgba(198,255,61,0.20)',
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 border-b flex items-center justify-between"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div>
            <div
              className="font-mono uppercase tracking-[0.20em] font-bold"
              style={{ fontSize: 10, color: '#c6ff3d' }}
            >
              Add lab report
            </div>
            <div
              className="font-display font-bold tracking-tight mt-0.5"
              style={{ fontSize: 20, color: 'rgba(245,245,240,0.95)' }}
            >
              {readingCount} value{readingCount === 1 ? '' : 's'} entered
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/5"
            aria-label="Close"
          >
            <X size={18} style={{ color: 'rgba(255,255,255,0.65)' }} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Report meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span
                className="font-mono uppercase tracking-[0.14em] font-bold"
                style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)' }}
              >
                Report date
              </span>
              <input
                type="date"
                value={reportDate}
                max={today}
                onChange={(e) => setReportDate(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 font-mono tabular-nums"
                style={{
                  fontSize: 14,
                  color: 'rgba(245,245,240,0.95)',
                  background: 'rgba(255,255,255,0.04)',
                  borderColor: 'rgba(255,255,255,0.10)',
                }}
              />
            </label>
            <label className="block">
              <span
                className="font-mono uppercase tracking-[0.14em] font-bold"
                style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)' }}
              >
                Label (optional)
              </span>
              <input
                type="text"
                value={reportLabel}
                onChange={(e) => setReportLabel(e.target.value)}
                placeholder='e.g. "Annual checkup"'
                maxLength={120}
                className="mt-1 w-full rounded-lg border px-3 py-2"
                style={{
                  fontSize: 14,
                  color: 'rgba(245,245,240,0.95)',
                  background: 'rgba(255,255,255,0.04)',
                  borderColor: 'rgba(255,255,255,0.10)',
                }}
              />
            </label>
          </div>

          {/* Search */}
          <div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search panels or markers…"
              className="w-full rounded-lg border px-3 py-2"
              style={{
                fontSize: 14,
                color: 'rgba(245,245,240,0.95)',
                background: 'rgba(255,255,255,0.04)',
                borderColor: 'rgba(255,255,255,0.10)',
              }}
            />
          </div>

          {/* Panel picker grid */}
          <div>
            <div
              className="font-mono uppercase tracking-[0.14em] font-bold mb-2"
              style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)' }}
            >
              Pick panels · {selectedPanels.size} selected
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filteredPanels.map((panel) => {
                const active = selectedPanels.has(panel.id);
                return (
                  <button
                    key={panel.id}
                    onClick={() => togglePanel(panel.id)}
                    className="text-left rounded-xl border px-3 py-2 transition-colors"
                    style={{
                      background: active
                        ? 'rgba(198,255,61,0.10)'
                        : 'rgba(255,255,255,0.02)',
                      borderColor: active
                        ? 'rgba(198,255,61,0.45)'
                        : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <div
                      className="font-display font-bold tracking-tight leading-tight"
                      style={{
                        fontSize: 13,
                        color: active
                          ? '#c6ff3d'
                          : 'rgba(245,245,240,0.92)',
                      }}
                    >
                      {panel.name}
                    </div>
                    <div
                      className="font-mono mt-0.5"
                      style={{
                        fontSize: 10,
                        color: 'rgba(255,255,255,0.50)',
                      }}
                    >
                      {panel.markers.length} marker
                      {panel.markers.length === 1 ? '' : 's'}
                    </div>
                  </button>
                );
              })}
            </div>
            {filteredPanels.length === 0 && (
              <p
                className="text-center py-3"
                style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)' }}
              >
                No panels match &ldquo;{search}&rdquo;.
              </p>
            )}
          </div>

          {/* Marker entry — one collapsible section per selected panel */}
          <AnimatePresence>
            {catalog
              .filter((p) => selectedPanels.has(p.id))
              .map((panel) => {
                const isOpen = openPanels.has(panel.id);
                const visibleMarkers = panel.markers.filter((m) =>
                  markerVisibleForGender(m, gender)
                );
                const filledInPanel = visibleMarkers.filter(
                  (m) => (entries[m.id]?.raw ?? '').trim() !== ''
                ).length;

                return (
                  <motion.div
                    key={panel.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl border overflow-hidden"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      borderColor: 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <button
                      onClick={() => toggleOpen(panel.id)}
                      className="w-full px-3 py-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="font-display font-bold tracking-tight"
                          style={{
                            fontSize: 14,
                            color: 'rgba(245,245,240,0.95)',
                          }}
                        >
                          {panel.name}
                        </div>
                        <span
                          className="font-mono uppercase tracking-[0.14em] font-bold"
                          style={{
                            fontSize: 9,
                            color: 'rgba(198,255,61,0.9)',
                          }}
                        >
                          {filledInPanel}/{visibleMarkers.length}
                        </span>
                      </div>
                      <ChevronDown
                        size={16}
                        style={{
                          color: 'rgba(255,255,255,0.50)',
                          transform: isOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 150ms',
                        }}
                      />
                    </button>
                    {isOpen && (
                      <div
                        className="border-t"
                        style={{
                          borderColor: 'rgba(255,255,255,0.06)',
                        }}
                      >
                        {visibleMarkers.map((m) => {
                          const raw = entries[m.id]?.raw ?? '';
                          const parsed = raw.trim() === '' ? null : Number(raw);
                          const status: MarkerStatus =
                            parsed != null && Number.isFinite(parsed)
                              ? statusForReading(parsed, m, gender ?? null)
                              : 'unknown';
                          const range = formatRange({
                            refLow:
                              gender === 'female' && m.refLowFemale != null
                                ? m.refLowFemale
                                : m.refLow,
                            refHigh:
                              gender === 'female' && m.refHighFemale != null
                                ? m.refHighFemale
                                : m.refHigh,
                            unit: m.unit,
                          });
                          return (
                            <div
                              key={m.id}
                              className="px-3 py-2 flex items-center gap-2 border-t"
                              style={{
                                borderColor: 'rgba(255,255,255,0.04)',
                              }}
                            >
                              <div className="flex-1 min-w-0">
                                <div
                                  className="font-display font-bold tracking-tight leading-tight"
                                  style={{
                                    fontSize: 13,
                                    color: 'rgba(245,245,240,0.95)',
                                  }}
                                >
                                  {m.name}
                                </div>
                                <div
                                  className="font-mono"
                                  style={{
                                    fontSize: 10,
                                    color: 'rgba(255,255,255,0.45)',
                                  }}
                                >
                                  Ref: {range}
                                </div>
                              </div>
                              <input
                                type="number"
                                step="any"
                                inputMode="decimal"
                                value={raw}
                                onChange={(e) =>
                                  setEntries((prev) => ({
                                    ...prev,
                                    [m.id]: {
                                      markerId: m.id,
                                      raw: e.target.value,
                                    },
                                  }))
                                }
                                placeholder="—"
                                className="w-20 rounded-md border px-2 py-1 font-mono tabular-nums text-right"
                                style={{
                                  fontSize: 13,
                                  color: 'rgba(245,245,240,0.95)',
                                  background: 'rgba(255,255,255,0.04)',
                                  borderColor: 'rgba(255,255,255,0.10)',
                                }}
                              />
                              {m.unit && (
                                <span
                                  className="font-mono w-12"
                                  style={{
                                    fontSize: 10,
                                    color: 'rgba(255,255,255,0.50)',
                                  }}
                                >
                                  {m.unit}
                                </span>
                              )}
                              <div className="w-16 flex justify-end">
                                {raw.trim() !== '' && (
                                  <StatusPill status={status} />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                );
              })}
          </AnimatePresence>

          {selectedPanels.size === 0 && (
            <div
              className="rounded-xl border border-dashed p-4 text-center"
              style={{ borderColor: 'rgba(255,255,255,0.15)' }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.65)',
                }}
              >
                Tap one or more panels above to start entering values.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 border-t flex items-center justify-between gap-3"
          style={{
            borderColor: 'rgba(255,255,255,0.06)',
            background: 'rgba(0,0,0,0.30)',
          }}
        >
          {error ? (
            <p
              className="text-sm flex-1"
              style={{ color: '#ff6b6b' }}
            >
              {error}
            </p>
          ) : (
            <p
              className="font-mono flex-1"
              style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)' }}
            >
              Values as printed on the lab report.
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={isPending || readingCount === 0}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono uppercase tracking-[0.14em] font-bold transition-opacity"
            style={{
              fontSize: 11,
              color: '#0a0c09',
              background: readingCount === 0 || isPending ? '#5a6055' : '#c6ff3d',
              opacity: readingCount === 0 || isPending ? 0.65 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {isPending ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <CheckCircle2 size={12} />
                Save report
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/** Convenience trigger button. */
export function AddReportButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono uppercase tracking-[0.14em] font-bold transition-colors"
      style={{
        fontSize: 10,
        color: '#0a0c09',
        background: '#c6ff3d',
      }}
    >
      <Plus size={12} strokeWidth={2.5} />
      Add report
    </button>
  );
}
