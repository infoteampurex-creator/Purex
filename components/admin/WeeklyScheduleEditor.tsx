'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  Save,
  AlertCircle,
  Check,
  Sparkles,
  ClipboardPaste,
  X,
  ChevronRight,
} from 'lucide-react';
import { setClientWeeklyPlan } from '@/lib/actions/weekly-plan';
import {
  previewPastedWeeklyPlan,
  importPastedWeeklyPlan,
} from '@/lib/actions/weekly-plan-import';
import {
  DAY_LABELS_LONG,
  DAY_LABELS_SHORT,
  type WeeklyPlan,
} from '@/lib/data/weekly-plan';
import type { MatchedWeek } from '@/lib/data/weekly-plan-paste';

interface TemplateOption {
  id: string;
  name: string;
  category: string | null;
  targetMuscleGroup?: string | null;
}

interface Props {
  clientId: string;
  clientName: string;
  initial: WeeklyPlan;
  templates: TemplateOption[];
}

/**
 * WeeklyScheduleEditor — coach UI for setting a client's repeating
 * weekly schedule. Drops into /admin/clients/[id].
 *
 * Coach picks a template per day (or leaves as Rest). On Save:
 *   - The weekly plan rows persist (client_weekly_plan +
 *     client_weekly_plan_days)
 *   - The next N weeks of client_workouts auto-materialize
 *   - Past + today are NEVER touched
 *   - Future days with logged actuals are SKIPPED (logged data stays)
 *
 * Result summary appears after save: "12 days scheduled · 2 days
 * preserved (already logged)".
 */
export function WeeklyScheduleEditor({
  clientId,
  clientName,
  initial,
  templates,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial.name ?? '');
  const [materializeWeeks, setMaterializeWeeks] = useState(initial.materializeWeeks);
  const [days, setDays] = useState(initial.days);
  // Local copy so the dropdown can show templates we just created via
  // the paste-import path BEFORE router.refresh propagates.
  const [localTemplates, setLocalTemplates] = useState(templates);
  const [saving, startSave] = useTransition();
  const [result, setResult] = useState<
    | { ok: true; written: number; skipped: number }
    | { ok: false; error: string }
    | null
  >(null);
  const [pasteOpen, setPasteOpen] = useState(false);

  const handleDayChange = (
    dayOfWeek: number,
    templateId: string | null
  ) => {
    setDays((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? { ...d, workoutTemplateId: templateId }
          : d
      )
    );
  };

  const handleNotesChange = (dayOfWeek: number, notes: string) => {
    setDays((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? { ...d, overrideNotes: notes.slice(0, 500) || null }
          : d
      )
    );
  };

  const handleSave = () => {
    setResult(null);
    startSave(async () => {
      const res = await setClientWeeklyPlan({
        clientId,
        name: name.trim() || null,
        materializeWeeks,
        days,
      });
      if (!res.ok) {
        setResult({ ok: false, error: res.error });
        return;
      }
      setResult({
        ok: true,
        written: res.rowsWritten,
        skipped: res.rowsSkipped,
      });
      router.refresh();
    });
  };

  const assignedCount = days.filter((d) => d.workoutTemplateId).length;

  return (
    <section
      className="rounded-2xl border bg-bg-card p-5 md:p-6"
      style={{ borderColor: 'rgba(198,255,61,0.25)' }}
    >
      <div className="flex items-center gap-2 mb-1">
        <CalendarDays size={14} style={{ color: '#c6ff3d' }} />
        <h2 className="font-display font-semibold text-lg tracking-tight">
          Weekly schedule
        </h2>
      </div>
      <p className="text-sm text-text-muted mb-1">
        Set {clientName.split(/\s+/)[0]}&apos;s recurring weekly plan once
        — the system auto-fills their calendar each week. Update here when
        they progress.
      </p>
      <p
        className="leading-snug mb-5"
        style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)' }}
      >
        Edits apply <strong>from tomorrow</strong>. Today&apos;s already-
        loaded workout stays — preserves any in-progress session.
      </p>

      {/* ─── Plan name + weeks ahead ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="sm:col-span-2">
          <div
            className="font-mono uppercase tracking-[0.18em] font-bold mb-1.5"
            style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}
          >
            Plan name
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 120))}
            placeholder="e.g. Strength Block 1"
            className="w-full rounded-lg bg-bg-elevated border border-border-soft px-3 py-2 text-sm focus:border-accent/50 focus:outline-none"
          />
        </div>
        <div>
          <div
            className="font-mono uppercase tracking-[0.18em] font-bold mb-1.5"
            style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}
          >
            Weeks ahead
          </div>
          <select
            value={materializeWeeks}
            onChange={(e) => setMaterializeWeeks(Number(e.target.value))}
            className="w-full rounded-lg bg-bg-elevated border border-border-soft px-3 py-2 text-sm focus:border-accent/50 focus:outline-none"
          >
            {[1, 2, 4, 6, 8, 12].map((n) => (
              <option key={n} value={n}>
                {n} week{n === 1 ? '' : 's'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── Paste-to-extract shortcut ─── */}
      <div className="mb-4">
        {!pasteOpen ? (
          <button
            type="button"
            onClick={() => setPasteOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono uppercase tracking-[0.14em] font-bold border transition-colors hover:bg-accent/10"
            style={{
              fontSize: 10,
              color: '#7dd3ff',
              borderColor: 'rgba(125,211,255,0.30)',
              background: 'rgba(125,211,255,0.05)',
            }}
          >
            <ClipboardPaste size={11} />
            Paste plan text — extract days &amp; exercises
          </button>
        ) : (
          <PastePlanBox
            clientId={clientId}
            onClose={() => setPasteOpen(false)}
            onImported={(dayToTemplateId, newTemplates) => {
              setLocalTemplates((prev) => [...prev, ...newTemplates]);
              setDays((prev) =>
                prev.map((d) => {
                  const newId = dayToTemplateId[d.dayOfWeek];
                  // null means rest day — explicitly clear; undefined means
                  // import didn't address this day (preserve current).
                  if (newId === undefined) return d;
                  return { ...d, workoutTemplateId: newId };
                })
              );
              setPasteOpen(false);
              router.refresh();
            }}
          />
        )}
      </div>

      {/* ─── 7 day-slot editors ─── */}
      <div className="space-y-2 mb-5">
        {days.map((d) => (
          <DayRow
            key={d.dayOfWeek}
            dayOfWeek={d.dayOfWeek}
            templateId={d.workoutTemplateId}
            notes={d.overrideNotes}
            templates={localTemplates}
            onTemplateChange={(id) => handleDayChange(d.dayOfWeek, id)}
            onNotesChange={(n) => handleNotesChange(d.dayOfWeek, n)}
          />
        ))}
      </div>

      {/* ─── Save row + result ─── */}
      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border-soft">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-mono uppercase tracking-[0.18em] font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{
            fontSize: 11,
            color: '#0a0c09',
            background: 'linear-gradient(135deg, #c6ff3d 0%, #ffd24d 100%)',
          }}
        >
          <Save size={12} />
          {saving
            ? 'Saving…'
            : `Save & apply ${materializeWeeks} week${materializeWeeks === 1 ? '' : 's'} forward`}
        </button>
        <span
          className="font-mono uppercase tracking-[0.14em] font-bold"
          style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}
        >
          {assignedCount}/7 days assigned
        </span>
      </div>

      {result && (
        <div className="mt-3">
          {result.ok ? (
            <div
              className="rounded-lg px-3 py-2 flex items-start gap-2"
              style={{
                background: 'rgba(198,255,61,0.08)',
                border: '1px solid rgba(198,255,61,0.30)',
              }}
            >
              <Check
                size={14}
                strokeWidth={3}
                style={{ color: '#c6ff3d', flexShrink: 0, marginTop: 2 }}
              />
              <div>
                <div
                  className="font-mono uppercase tracking-[0.18em] font-bold"
                  style={{ fontSize: 10, color: '#c6ff3d' }}
                >
                  Saved
                </div>
                <div
                  className="leading-snug mt-0.5"
                  style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}
                >
                  {result.written} workout{result.written === 1 ? '' : 's'}{' '}
                  scheduled
                  {result.skipped > 0
                    ? ` · ${result.skipped} preserved (already logged)`
                    : ''}
                  .
                </div>
              </div>
            </div>
          ) : (
            <div
              className="rounded-lg px-3 py-2 flex items-start gap-2"
              style={{
                background: 'rgba(255,107,107,0.08)',
                border: '1px solid rgba(255,107,107,0.30)',
              }}
            >
              <AlertCircle
                size={14}
                style={{ color: '#ff9999', flexShrink: 0, marginTop: 2 }}
              />
              <span style={{ fontSize: 12, color: '#ff9999' }}>
                {result.error}
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ─── Day row primitive ──────────────────────────────────────────

function DayRow({
  dayOfWeek,
  templateId,
  notes,
  templates,
  onTemplateChange,
  onNotesChange,
}: {
  dayOfWeek: number;
  templateId: string | null;
  notes: string | null;
  templates: TemplateOption[];
  onTemplateChange: (id: string | null) => void;
  onNotesChange: (n: string) => void;
}) {
  const [showNotes, setShowNotes] = useState(!!notes);
  const isRest = templateId === null;

  return (
    <div
      className="rounded-xl border px-3 py-2.5"
      style={{
        background: isRest
          ? 'rgba(255,255,255,0.02)'
          : 'rgba(198,255,61,0.04)',
        borderColor: isRest
          ? 'rgba(255,255,255,0.06)'
          : 'rgba(198,255,61,0.20)',
      }}
    >
      <div className="flex items-center gap-3 flex-wrap">
        {/* Day label */}
        <div className="w-14 flex-shrink-0">
          <div
            className="font-mono uppercase tracking-[0.16em] font-bold leading-none"
            style={{ fontSize: 11, color: isRest ? 'rgba(255,255,255,0.55)' : '#c6ff3d' }}
          >
            {DAY_LABELS_SHORT[dayOfWeek]}
          </div>
          <div
            className="font-mono leading-none mt-0.5"
            style={{ fontSize: 9, color: 'rgba(255,255,255,0.40)' }}
          >
            {DAY_LABELS_LONG[dayOfWeek]}
          </div>
        </div>

        {/* Template selector */}
        <select
          value={templateId ?? ''}
          onChange={(e) =>
            onTemplateChange(e.target.value === '' ? null : e.target.value)
          }
          className="flex-1 min-w-[180px] rounded-lg bg-bg-elevated border border-border-soft px-3 py-1.5 text-sm focus:border-accent/50 focus:outline-none"
        >
          <option value="">— Rest day —</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
              {t.category ? ` (${t.category})` : ''}
            </option>
          ))}
        </select>

        {/* Notes toggle */}
        {!isRest && (
          <button
            type="button"
            onClick={() => setShowNotes((x) => !x)}
            className="font-mono uppercase tracking-[0.14em] font-bold transition-opacity hover:opacity-80"
            style={{ fontSize: 9, color: '#7dd3ff' }}
          >
            {showNotes ? '− Hide note' : '+ Note'}
          </button>
        )}
      </div>

      {showNotes && !isRest && (
        <div className="mt-2 pl-14">
          <input
            type="text"
            value={notes ?? ''}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Per-day cue (e.g. lighter weights, RPE 7 max)"
            className="w-full rounded-md bg-bg-elevated border border-border-soft px-2.5 py-1.5 text-xs focus:border-accent/50 focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}

// Silence unused-import lint warning for Sparkles (kept around for
// the next iteration when we add a "Suggest schedule" affordance).
void Sparkles;

// ─── PastePlanBox ───────────────────────────────────────────────
//
// Coach drops a whole weekly plan (the WhatsApp-style block coaches
// already write — see weekly-plan-paste.ts for the expected format)
// and the app:
//   1. Parses it into 7 days
//   2. Fuzzy-matches each exercise line against the library
//   3. Shows a preview with green/red flagging
//   4. On approval, creates per-day workout_templates and assigns
//      them to the weekly plan (pre-fills the day-row selectors)
//
// Two-step on purpose — coach gets to see "did the app read my text
// correctly" before any DB writes happen.

function PastePlanBox({
  clientId,
  onClose,
  onImported,
}: {
  clientId: string;
  onClose: () => void;
  onImported: (
    dayToTemplateId: Record<number, string | null>,
    newTemplates: TemplateOption[]
  ) => void;
}) {
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<'edit' | 'preview'>('edit');
  const [busy, startBusy] = useTransition();
  const [preview, setPreview] = useState<MatchedWeek | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Coach can rename the suggested template for each day before commit
  const [templateNames, setTemplateNames] = useState<Record<number, string>>({});

  const handleExtract = () => {
    setError(null);
    startBusy(async () => {
      const res = await previewPastedWeeklyPlan(text);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setPreview(res.week);
      // Seed the coach-editable template names from suggestions
      const seeds: Record<number, string> = {};
      for (const d of res.week.days) {
        seeds[d.dayOfWeek] = d.suggestedTemplateName;
      }
      setTemplateNames(seeds);
      setPhase('preview');
    });
  };

  const handleApply = () => {
    if (!preview) return;
    setError(null);
    startBusy(async () => {
      const res = await importPastedWeeklyPlan({
        clientId,
        days: preview.days.map((d) => ({
          dayOfWeek: d.dayOfWeek,
          isRest: d.isRest,
          templateName: templateNames[d.dayOfWeek] ?? d.suggestedTemplateName,
          exercises: d.exercises.map((e) => ({
            libraryId: e.libraryId,
            exerciseName: e.exerciseName,
            targetMuscle: e.targetMuscle,
            defaultSets: e.defaultSets,
            defaultReps: e.defaultReps,
            defaultRestSeconds: e.defaultRestSeconds,
          })),
        })),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onImported(res.dayToTemplateId, res.newTemplates);
    });
  };

  return (
    <div
      className="rounded-xl border p-4"
      style={{
        borderColor: 'rgba(125,211,255,0.30)',
        background: 'rgba(125,211,255,0.04)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ClipboardPaste size={14} style={{ color: '#7dd3ff' }} />
          <h3
            className="font-mono uppercase tracking-[0.18em] font-bold"
            style={{ fontSize: 11, color: '#7dd3ff' }}
          >
            {phase === 'edit' ? 'Paste plan' : 'Preview & confirm'}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-white/5 transition-colors"
          aria-label="Close paste box"
        >
          <X size={14} style={{ color: 'rgba(255,255,255,0.55)' }} />
        </button>
      </div>

      {phase === 'edit' && (
        <>
          <p
            className="leading-snug mb-3"
            style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}
          >
            Paste a weekly block in coach format — day headers (Monday,
            Tuesday…), one exercise per line. Rest days like
            &quot;Thursday rest walking must&quot; are detected.
            Subheadings like *Abs* fold into the parent day.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              '*Monday*\nInclined chest press\nCable cross over\n…\n\n*Tuesday*\nPull ups\nLat pull down\n…'
            }
            rows={10}
            className="w-full rounded-lg bg-bg-elevated border border-border-soft px-3 py-2 text-sm font-mono leading-relaxed focus:border-accent/50 focus:outline-none"
            style={{ resize: 'vertical' }}
          />
          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={handleExtract}
              disabled={busy || !text.trim()}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-mono uppercase tracking-[0.18em] font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{
                fontSize: 10,
                color: '#0a0c09',
                background: '#7dd3ff',
              }}
            >
              <ChevronRight size={11} />
              {busy ? 'Extracting…' : 'Extract & preview'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="font-mono uppercase tracking-[0.14em] font-bold transition-opacity hover:opacity-80"
              style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}
            >
              Cancel
            </button>
          </div>
        </>
      )}

      {phase === 'preview' && preview && (
        <>
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span
              className="font-mono uppercase tracking-[0.14em] font-bold"
              style={{ fontSize: 10, color: '#c6ff3d' }}
            >
              ✓ {preview.totalMatched} matched
            </span>
            {preview.totalUnmatched > 0 && (
              <span
                className="font-mono uppercase tracking-[0.14em] font-bold"
                style={{ fontSize: 10, color: '#ff9999' }}
              >
                ⚠ {preview.totalUnmatched} flagged
              </span>
            )}
          </div>

          {preview.totalUnmatched > 0 && (
            <div
              className="rounded-lg px-3 py-2 mb-3 flex items-start gap-2"
              style={{
                background: 'rgba(255,107,107,0.06)',
                border: '1px solid rgba(255,107,107,0.25)',
              }}
            >
              <AlertCircle
                size={12}
                style={{ color: '#ff9999', flexShrink: 0, marginTop: 2 }}
              />
              <span style={{ fontSize: 11, color: 'rgba(255,200,200,0.85)' }}>
                Flagged lines couldn&apos;t be matched to the exercise
                library. They&apos;ll be added with the name you typed but
                with blank sets/reps — fill those in the template editor
                later, or go back and fix the typo.
              </span>
            </div>
          )}

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {preview.days.map((day) => (
              <PreviewDayCard
                key={day.dayOfWeek}
                day={day}
                templateName={
                  templateNames[day.dayOfWeek] ?? day.suggestedTemplateName
                }
                onTemplateNameChange={(name) =>
                  setTemplateNames((prev) => ({
                    ...prev,
                    [day.dayOfWeek]: name,
                  }))
                }
              />
            ))}
          </div>

          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border-soft">
            <button
              type="button"
              onClick={handleApply}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-mono uppercase tracking-[0.18em] font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{
                fontSize: 10,
                color: '#0a0c09',
                background: '#c6ff3d',
              }}
            >
              <Check size={11} strokeWidth={3} />
              {busy ? 'Creating templates…' : 'Looks good — create & assign'}
            </button>
            <button
              type="button"
              onClick={() => setPhase('edit')}
              disabled={busy}
              className="font-mono uppercase tracking-[0.14em] font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ fontSize: 10, color: '#7dd3ff' }}
            >
              ← Edit text
            </button>
          </div>
        </>
      )}

      {error && (
        <div
          className="mt-3 rounded-lg px-3 py-2 flex items-start gap-2"
          style={{
            background: 'rgba(255,107,107,0.08)',
            border: '1px solid rgba(255,107,107,0.30)',
          }}
        >
          <AlertCircle
            size={12}
            style={{ color: '#ff9999', flexShrink: 0, marginTop: 2 }}
          />
          <span style={{ fontSize: 11, color: '#ff9999' }}>{error}</span>
        </div>
      )}
    </div>
  );
}

// ─── PreviewDayCard ─────────────────────────────────────────────

function PreviewDayCard({
  day,
  templateName,
  onTemplateNameChange,
}: {
  day: MatchedWeek['days'][number];
  templateName: string;
  onTemplateNameChange: (name: string) => void;
}) {
  const isRest = day.isRest || day.exercises.length === 0;

  return (
    <div
      className="rounded-lg border px-3 py-2"
      style={{
        borderColor: isRest
          ? 'rgba(255,255,255,0.08)'
          : 'rgba(198,255,61,0.18)',
        background: isRest
          ? 'rgba(255,255,255,0.02)'
          : 'rgba(198,255,61,0.03)',
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div
          className="font-mono uppercase tracking-[0.18em] font-bold"
          style={{
            fontSize: 11,
            color: isRest ? 'rgba(255,255,255,0.55)' : '#c6ff3d',
          }}
        >
          {DAY_LABELS_LONG[day.dayOfWeek]}
          {isRest ? ' · Rest' : ''}
        </div>
        {!isRest && (
          <input
            type="text"
            value={templateName}
            onChange={(e) => onTemplateNameChange(e.target.value.slice(0, 120))}
            className="rounded bg-bg-elevated border border-border-soft px-2 py-1 text-xs font-mono w-48"
            placeholder="Template name"
          />
        )}
      </div>

      {isRest ? (
        day.restNote && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)' }}>
            Note: {day.restNote}
          </div>
        )
      ) : (
        <ul className="space-y-1">
          {day.exercises.map((ex, idx) => {
            const matched = ex.libraryId !== null;
            return (
              <li
                key={idx}
                className="flex items-center gap-2"
                style={{ fontSize: 12 }}
              >
                {matched ? (
                  <Check
                    size={11}
                    strokeWidth={3}
                    style={{ color: '#c6ff3d', flexShrink: 0 }}
                  />
                ) : (
                  <AlertCircle
                    size={11}
                    style={{ color: '#ff9999', flexShrink: 0 }}
                  />
                )}
                <span
                  style={{
                    color: matched ? 'rgba(255,255,255,0.85)' : '#ff9999',
                  }}
                >
                  {matched ? ex.exerciseName : ex.rawText}
                </span>
                {matched && ex.rawText !== ex.exerciseName && (
                  <span
                    style={{
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.40)',
                    }}
                  >
                    (you typed &ldquo;{ex.rawText}&rdquo;)
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
