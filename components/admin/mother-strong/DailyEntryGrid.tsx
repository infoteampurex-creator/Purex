'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Clipboard, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  upsertDailyEntry,
  bulkPasteEntries,
} from '@/lib/actions/mother-strong';
import { type AdminGridRow } from '@/lib/data/mother-strong';
import { CHALLENGE_DURATION_DAYS } from '@/lib/data/mother-strong-types';

const TOTAL_DAYS = CHALLENGE_DURATION_DAYS;

interface Props {
  rows: AdminGridRow[];
  dailyGoal: number;
}

export function DailyEntryGrid({ rows, dailyGoal }: Props) {
  const [savingCell, setSavingCell] = useState<string | null>(null);
  const [savedCell, setSavedCell] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const today = useMemo(() => new Date(), []);

  const saveCell = async (
    participantId: string,
    dayNumber: number,
    rawValue: string
  ) => {
    const trimmed = rawValue.trim();
    if (!trimmed) return; // empty cell is a no-op (use clear button if we add one later)
    const value = parseInt(trimmed, 10);
    if (!Number.isFinite(value) || value < 0) {
      setErrorMsg(`Day ${dayNumber}: please enter a number (0 or more).`);
      return;
    }
    const cellKey = `${participantId}:${dayNumber}`;
    setSavingCell(cellKey);
    setErrorMsg(null);
    try {
      const r = await upsertDailyEntry({
        participantId,
        dayNumber,
        stepCount: value,
      });
      setSavingCell(null);
      if (!r.ok) {
        setErrorMsg(r.error);
        return;
      }
      setSavedCell(cellKey);
      setTimeout(() => setSavedCell((c) => (c === cellKey ? null : c)), 900);
      router.refresh();
    } catch (err) {
      setSavingCell(null);
      setErrorMsg(err instanceof Error ? err.message : 'Save failed');
    }
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl bg-bg-card border border-border p-10 text-center text-text-muted">
        No participants yet — daily entry will appear once mothers register.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {errorMsg && (
        <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-xs">
          {errorMsg}
        </div>
      )}

      <Legend dailyGoal={dailyGoal} />

      <div className="rounded-2xl bg-bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="border-collapse text-xs">
            <thead className="sticky top-0 bg-bg-card z-10">
              <tr>
                <th className="sticky left-0 z-20 bg-bg-card border-b border-r border-border px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold min-w-[180px]">
                  Participant
                </th>
                {Array.from({ length: TOTAL_DAYS }, (_, i) => {
                  const day = i + 1;
                  return (
                    <th
                      key={day}
                      className="border-b border-border px-1 py-2 font-mono text-[10px] font-bold text-text-muted min-w-[60px] text-center"
                    >
                      {day}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <ParticipantRow
                  key={row.participant.id}
                  row={row}
                  today={today}
                  dailyGoal={dailyGoal}
                  savingCell={savingCell}
                  savedCell={savedCell}
                  onSave={saveCell}
                  onError={setErrorMsg}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Single participant row ───────────────────────────────────────

function ParticipantRow({
  row,
  today,
  dailyGoal,
  savingCell,
  savedCell,
  onSave,
  onError,
}: {
  row: AdminGridRow;
  today: Date;
  dailyGoal: number;
  savingCell: string | null;
  savedCell: string | null;
  onSave: (participantId: string, dayNumber: number, raw: string) => Promise<void>;
  onError: (msg: string | null) => void;
}) {
  const [bulkOpen, setBulkOpen] = useState(false);
  const start = new Date(row.participant.startDate + 'T00:00:00');

  return (
    <tr className="hover:bg-bg-elevated/30 transition-colors">
      {/* Sticky participant cell */}
      <td className="sticky left-0 z-10 bg-bg-card border-b border-r border-border px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="font-mono text-[10px] font-bold text-accent">
              {row.participant.displayId}
            </div>
            <div className="text-xs font-medium truncate max-w-[120px]">
              {row.participant.fullName}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBulkOpen(true)}
            title="Bulk paste step counts"
            className="w-7 h-7 rounded-md border border-border-soft text-text-muted hover:border-accent hover:text-accent transition-colors flex items-center justify-center"
          >
            <Clipboard size={11} />
          </button>
        </div>
      </td>

      {/* 60 day cells */}
      {Array.from({ length: TOTAL_DAYS }, (_, i) => {
        const dayNumber = i + 1;
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        const isFuture = date > today;
        const value = row.entries[dayNumber];
        const cellKey = `${row.participant.id}:${dayNumber}`;
        return (
          <DayCellEditor
            key={dayNumber}
            cellKey={cellKey}
            dayNumber={dayNumber}
            participantId={row.participant.id}
            initialValue={value}
            dailyGoal={dailyGoal}
            isFuture={isFuture}
            saving={savingCell === cellKey}
            justSaved={savedCell === cellKey}
            onSave={onSave}
          />
        );
      })}

      {bulkOpen && (
        <td className="hidden">
          <BulkPasteDialog
            participantId={row.participant.id}
            participantName={row.participant.fullName}
            onClose={() => setBulkOpen(false)}
            onError={onError}
          />
        </td>
      )}
    </tr>
  );
}

// ─── Day cell input ───────────────────────────────────────────────
// Uncontrolled (defaultValue + onBlur) so React never re-renders the
// input on each keystroke. We track only outer save/saved state.

function DayCellEditor({
  cellKey,
  dayNumber,
  participantId,
  initialValue,
  dailyGoal,
  isFuture,
  saving,
  justSaved,
  onSave,
}: {
  cellKey: string;
  dayNumber: number;
  participantId: string;
  initialValue: number | undefined;
  dailyGoal: number;
  isFuture: boolean;
  saving: boolean;
  justSaved: boolean;
  onSave: (
    participantId: string,
    dayNumber: number,
    raw: string
  ) => Promise<void>;
}) {
  // Cell colour based on the currently saved value.
  const tone =
    initialValue == null
      ? isFuture
        ? 'future'
        : 'empty'
      : initialValue >= dailyGoal
        ? 'green'
        : initialValue >= dailyGoal / 2
          ? 'yellow'
          : 'red';

  const bg = {
    green: 'bg-accent/15',
    yellow: 'bg-amber/15',
    red: 'bg-danger/15',
    empty: 'bg-danger/5',
    future: 'bg-bg-elevated/40',
  }[tone];

  return (
    <td
      className={cn(
        'border-b border-r border-border-soft p-0 relative min-w-[60px]',
        bg
      )}
    >
      <input
        type="number"
        inputMode="numeric"
        defaultValue={initialValue ?? ''}
        disabled={isFuture}
        title={isFuture ? 'Future day — not editable yet' : `Day ${dayNumber}`}
        onBlur={(e) => {
          // Only save if the value actually changed.
          const v = e.target.value.trim();
          const same =
            (initialValue == null && v === '') ||
            (initialValue != null && Number(v) === initialValue);
          if (!same && v !== '') onSave(participantId, dayNumber, v);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
          }
        }}
        className={cn(
          'w-full h-9 px-1.5 bg-transparent text-center text-xs tabular-nums focus:bg-bg-elevated/80 focus:outline-none focus:ring-1 focus:ring-accent',
          isFuture && 'cursor-not-allowed text-text-dim'
        )}
        data-cell={cellKey}
      />
      {saving && (
        <Loader2
          size={9}
          className="absolute top-1 right-1 animate-spin text-text-muted"
        />
      )}
      {justSaved && (
        <span className="absolute top-1 right-1 text-[9px] text-accent font-bold">
          ✓
        </span>
      )}
    </td>
  );
}

// ─── Bulk paste dialog ────────────────────────────────────────────

function BulkPasteDialog({
  participantId,
  participantName,
  onClose,
  onError,
}: {
  participantId: string;
  participantName: string;
  onClose: () => void;
  onError: (msg: string | null) => void;
}) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [startDay, setStartDay] = useState(1);
  const [isPending, startTransition] = useTransition();

  const parseCounts = (raw: string): number[] => {
    return raw
      .split(/\r?\n|,|\t/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => parseInt(s.replace(/[,\s]/g, ''), 10))
      .filter((n) => Number.isFinite(n) && n >= 0);
  };

  const counts = parseCounts(text);

  const submit = () => {
    if (counts.length === 0) {
      onError('Paste at least one number.');
      return;
    }
    if (startDay + counts.length - 1 > TOTAL_DAYS) {
      onError(`That would write past Day ${TOTAL_DAYS}.`);
      return;
    }
    onError(null);
    startTransition(async () => {
      const r = await bulkPasteEntries({
        participantId,
        startDay,
        counts,
      });
      if (!r.ok) {
        onError(r.error);
        return;
      }
      onClose();
      router.refresh();
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-bg-card border border-border rounded-2xl p-6"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 rounded-full border border-border-soft text-text-muted hover:border-accent hover:text-accent transition-colors flex items-center justify-center"
        >
          <X size={14} />
        </button>

        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold mb-1.5">
          Bulk paste
        </div>
        <h3 className="font-display font-semibold text-lg tracking-tight">
          {participantName}
        </h3>
        <p className="text-xs text-text-muted mt-1">
          Paste a column of step counts. Each line is one day, starting from
          the day below.
        </p>

        <div className="mt-5 space-y-3">
          <label className="block">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold mb-1.5">
              Start day
            </div>
            <input
              type="number"
              min={1}
              max={TOTAL_DAYS}
              value={startDay}
              onChange={(e) => setStartDay(parseInt(e.target.value, 10) || 1)}
              className="w-full h-10 px-3 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent focus:outline-none"
            />
          </label>

          <label className="block">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold mb-1.5">
              Step counts
            </div>
            <textarea
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={'10245\n8901\n12000\n…'}
              className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border-soft text-sm font-mono focus:border-accent focus:outline-none"
            />
            <div className="text-[10px] text-text-muted font-mono mt-1">
              {counts.length > 0
                ? `${counts.length} values · would fill Day ${startDay} → Day ${startDay + counts.length - 1}`
                : 'Paste numbers — one per line, comma, or tab.'}
            </div>
          </label>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-full border border-border text-sm font-medium hover:border-text-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={isPending || counts.length === 0}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-accent text-bg text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Saving…
              </>
            ) : (
              `Save ${counts.length} ${counts.length === 1 ? 'value' : 'values'}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Legend({ dailyGoal }: { dailyGoal: number }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono uppercase tracking-[0.14em] text-text-muted">
      <LegendSwatch color="accent" label={`≥ ${dailyGoal.toLocaleString()}`} />
      <LegendSwatch color="amber" label={`${(dailyGoal / 2).toLocaleString()}–${(dailyGoal - 1).toLocaleString()}`} />
      <LegendSwatch color="danger" label={`< ${(dailyGoal / 2).toLocaleString()}`} />
      <LegendSwatch color="empty" label="Empty (past day)" />
      <LegendSwatch color="future" label="Upcoming" />
    </div>
  );
}

function LegendSwatch({
  color,
  label,
}: {
  color: 'accent' | 'amber' | 'danger' | 'empty' | 'future';
  label: string;
}) {
  const bg = {
    accent: 'bg-accent/30',
    amber: 'bg-amber/30',
    danger: 'bg-danger/30',
    empty: 'bg-danger/5 border border-border-soft',
    future: 'bg-bg-elevated/60 border border-border-soft',
  }[color];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('w-3 h-3 rounded-sm', bg)} />
      {label}
    </span>
  );
}
