'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarClock,
  Loader2,
  Save,
  Trash2,
  Pause,
  Play,
  Repeat,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  setClientFeedbackSchedule,
  clearClientFeedbackSchedule,
  pauseClientFeedbackSchedule,
} from '@/lib/actions/feedback-schedule';

const DAYS = [
  { value: 0, short: 'MON', long: 'Monday' },
  { value: 1, short: 'TUE', long: 'Tuesday' },
  { value: 2, short: 'WED', long: 'Wednesday' },
  { value: 3, short: 'THU', long: 'Thursday' },
  { value: 4, short: 'FRI', long: 'Friday' },
  { value: 5, short: 'SAT', long: 'Saturday' },
  { value: 6, short: 'SUN', long: 'Sunday' },
] as const;

interface ExistingSlot {
  dayOfWeek: number;
  timeOfDay: string; // 'HH:MM'
  durationMin: number;
  notes: string | null;
  paused: boolean;
}

interface Props {
  clientId: string;
  clientFirstName: string;
  initial: ExistingSlot | null;
}

function formatTime12(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  const h = parseInt(hStr, 10);
  const am = h < 12;
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:${mStr ?? '00'} ${am ? 'AM' : 'PM'}`;
}

/**
 * Sits on the client detail page. Lets the coach lock in the
 * client's weekly feedback-call slot in one click. The slot recurs
 * every week until the coach pauses or clears it.
 */
export function ClientFeedbackScheduleCard({
  clientId,
  clientFirstName,
  initial,
}: Props) {
  const router = useRouter();
  const [day, setDay] = useState<number | null>(initial?.dayOfWeek ?? null);
  const [time, setTime] = useState<string>(initial?.timeOfDay ?? '16:00');
  const [duration, setDuration] = useState<number>(initial?.durationMin ?? 30);
  const [notes, setNotes] = useState<string>(initial?.notes ?? '');
  const [paused, setPaused] = useState<boolean>(initial?.paused ?? false);

  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const hasExisting = initial !== null;

  const dirty = useMemo(() => {
    if (!hasExisting) return day !== null;
    return (
      day !== initial.dayOfWeek ||
      time !== initial.timeOfDay ||
      duration !== initial.durationMin ||
      (notes ?? '') !== (initial.notes ?? '')
    );
  }, [hasExisting, day, time, duration, notes, initial]);

  const summary =
    day != null && time
      ? `${DAYS[day].long} · ${formatTime12(time)} · ${duration} min`
      : null;

  const onSave = () => {
    if (day == null) {
      setErrorMsg('Pick a day of the week first.');
      return;
    }
    setErrorMsg(null);
    startTransition(async () => {
      const r = await setClientFeedbackSchedule({
        clientId,
        dayOfWeek: day,
        timeOfDay: time,
        durationMin: duration,
        notes: notes.trim() || undefined,
      });
      if (!r.ok) {
        setErrorMsg(r.error);
        return;
      }
      setSavedAt(Date.now());
      setPaused(false);
      router.refresh();
    });
  };

  const onClear = () => {
    if (!hasExisting) return;
    if (
      !window.confirm(
        `Clear the weekly feedback call for ${clientFirstName}? You can always set a new one.`
      )
    )
      return;
    setErrorMsg(null);
    startTransition(async () => {
      const r = await clearClientFeedbackSchedule({ clientId });
      if (!r.ok) {
        setErrorMsg(r.error);
        return;
      }
      setDay(null);
      setTime('16:00');
      setDuration(30);
      setNotes('');
      setSavedAt(Date.now());
      router.refresh();
    });
  };

  const onTogglePause = () => {
    if (!hasExisting) return;
    setErrorMsg(null);
    const next = !paused;
    setPaused(next);
    startTransition(async () => {
      const r = await pauseClientFeedbackSchedule({
        clientId,
        paused: next,
      });
      if (!r.ok) {
        setErrorMsg(r.error);
        setPaused(!next);
        return;
      }
      setSavedAt(Date.now());
      router.refresh();
    });
  };

  return (
    <div className="rounded-2xl bg-bg-card border border-border p-5 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <CalendarClock size={18} className="text-accent" strokeWidth={2.5} />
          <h2 className="font-display font-semibold text-lg tracking-tight">
            Weekly feedback call
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold">
          <Repeat size={11} />
          Recurs every week
        </span>
      </div>

      {/* Current summary banner */}
      {hasExisting && summary && (
        <div
          className={cn(
            'rounded-xl border px-4 py-3 mb-4 flex items-center justify-between gap-3 flex-wrap',
            paused
              ? 'border-amber/30 bg-amber/5'
              : 'border-accent/30 bg-accent/5'
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={cn(
                'w-1.5 h-1.5 rounded-full flex-shrink-0',
                paused ? 'bg-amber' : 'bg-accent'
              )}
              style={
                paused
                  ? {}
                  : { boxShadow: '0 0 6px rgba(198, 255, 61, 0.6)' }
              }
            />
            <div className="min-w-0">
              <div
                className="font-mono text-[10px] uppercase tracking-[0.18em] font-bold mb-0.5"
                style={{ color: paused ? '#ffb84d' : '#c6ff3d' }}
              >
                {paused ? 'Paused' : 'Active'} · current slot
              </div>
              <div className="text-text font-semibold text-sm truncate">
                {summary}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onTogglePause}
            disabled={isPending}
            className={cn(
              'inline-flex items-center gap-1.5 h-9 px-3 rounded-full border font-mono text-[11px] uppercase tracking-[0.12em] font-bold transition-colors disabled:opacity-50',
              paused
                ? 'border-accent/50 text-accent bg-accent/10 hover:bg-accent/20'
                : 'border-amber/40 text-amber bg-amber/5 hover:bg-amber/10'
            )}
          >
            {paused ? <Play size={11} /> : <Pause size={11} />}
            {paused ? 'Resume' : 'Pause'}
          </button>
        </div>
      )}

      {/* Day picker */}
      <div className="mb-4">
        <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold mb-2 block">
          Day of the week
        </label>
        <div className="flex flex-wrap gap-1.5">
          {DAYS.map((d) => {
            const on = day === d.value;
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => setDay(on ? null : d.value)}
                className={cn(
                  'min-w-[58px] h-11 px-3 rounded-lg border font-mono text-xs font-bold uppercase tracking-[0.12em] transition-all',
                  on
                    ? 'border-accent bg-accent text-bg'
                    : 'border-border-soft text-text-muted hover:border-text-muted hover:text-text'
                )}
                aria-pressed={on}
              >
                {d.short}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time + duration */}
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold mb-1.5 block">
            Time
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full h-11 px-3 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent focus:outline-none"
          />
          <div className="text-text-muted mt-1.5 font-mono text-[11px]">
            {time ? formatTime12(time) : '—'}
          </div>
        </div>
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold mb-1.5 block">
            Duration
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full h-11 px-3 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent focus:outline-none"
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>60 minutes</option>
            <option value={90}>90 minutes</option>
          </select>
        </div>
      </div>

      {/* Notes */}
      <div className="mb-4">
        <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold mb-1.5 block">
          Notes (internal)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="e.g. prefers Google Meet · check macros first · partner sometimes joins"
          className="w-full px-3 py-2.5 rounded-lg bg-bg-elevated border border-border-soft text-sm focus:border-accent focus:outline-none resize-none"
          style={{ fontSize: 13 }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 flex-wrap pt-3 border-t border-border-soft">
        <div className="text-xs text-text-muted min-h-[20px]">
          {errorMsg && <span className="text-danger">{errorMsg}</span>}
          {!errorMsg &&
            savedAt &&
            Date.now() - savedAt < 2500 &&
            !isPending && (
              <span className="text-accent font-mono uppercase tracking-[0.16em] font-bold">
                ✓ Saved
              </span>
            )}
          {!errorMsg && !savedAt && dirty && !isPending && (
            <span className="font-mono uppercase tracking-[0.16em] font-bold text-amber">
              · Unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasExisting && (
            <button
              type="button"
              onClick={onClear}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 h-10 px-3 rounded-full border border-danger/40 text-danger text-xs font-mono uppercase tracking-[0.14em] font-bold hover:bg-danger/5 transition-colors disabled:opacity-50"
            >
              <Trash2 size={11} strokeWidth={2.5} />
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={isPending || (hasExisting && !dirty)}
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-accent text-bg text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Save size={13} strokeWidth={2.5} />
            )}
            {hasExisting ? 'Save changes' : 'Set weekly call'}
          </button>
        </div>
      </div>
    </div>
  );
}
