import Link from 'next/link';
import { CalendarClock, MessageCircle, User, Info } from 'lucide-react';
import {
  getAllFeedbackSlots,
  DAY_LABELS,
  HOUR_SLOTS,
  formatTime12,
  bucketSlotsByDayHour,
  type FeedbackSlot,
} from '@/lib/data/feedback-schedule';

export const metadata = { title: 'Admin · Feedback call schedule' };
export const dynamic = 'force-dynamic';

/**
 * Weekly grid of every client's recurring feedback call. Cells are
 * always rendered (even when empty) so the coach can see free time
 * at a glance and pick a slot to offer a new client.
 */
export default async function FeedbackSchedulePage() {
  const slots = await getAllFeedbackSlots();
  const buckets = bucketSlotsByDayHour(slots);

  const activeCount = slots.filter((s) => !s.paused).length;
  const pausedCount = slots.filter((s) => s.paused).length;

  return (
    <>
      <div className="mb-6 flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-1.5">
            Inbox · scheduling
          </div>
          <h1 className="font-display font-semibold text-3xl tracking-tight">
            Weekly feedback calls
          </h1>
          <p
            className="text-text-muted mt-1.5 leading-relaxed"
            style={{ fontSize: 14 }}
          >
            One slot per client, recurring every week. Edit a client&apos;s
            slot from their detail page.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Stat label="Active" value={activeCount} accent="#c6ff3d" />
          <Stat label="Paused" value={pausedCount} accent="#ffb84d" />
        </div>
      </div>

      {/* Legend */}
      <div className="rounded-xl border border-border-soft bg-bg-elevated/40 px-4 py-3 mb-5 flex items-center gap-5 flex-wrap text-xs">
        <LegendDot color="#c6ff3d" label="Booked slot" />
        <LegendDot color="transparent" border="#2a2e23" label="Empty / available" />
        <span className="font-mono uppercase tracking-[0.14em] text-text-muted font-bold flex items-center gap-1.5">
          <Info size={11} />
          Times shown in IST. 06:00 – 22:00.
        </span>
      </div>

      {/* Weekly grid */}
      <div className="rounded-2xl border border-border bg-bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <div
            className="grid"
            style={{
              gridTemplateColumns: '70px repeat(7, minmax(140px, 1fr))',
              minWidth: 980,
            }}
          >
            {/* Top-left blank */}
            <div className="bg-bg-elevated/40 border-b border-r border-border-soft" />
            {/* Day headers */}
            {DAY_LABELS.map((d) => (
              <div
                key={d.value}
                className="bg-bg-elevated/40 border-b border-r border-border-soft px-3 py-3 text-center"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold">
                  {d.short}
                </div>
                <div className="font-display text-sm text-text font-semibold mt-0.5">
                  {d.long}
                </div>
              </div>
            ))}

            {/* Hour rows */}
            {HOUR_SLOTS.map((hour, rowIdx) => (
              <HourRow
                key={hour}
                hour={hour}
                isLast={rowIdx === HOUR_SLOTS.length - 1}
                buckets={buckets}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Paused list (so they don't get forgotten) */}
      {pausedCount > 0 && (
        <div className="mt-6 rounded-2xl border border-amber/30 bg-amber/5 p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber font-bold mb-3">
            Paused
          </div>
          <ul className="space-y-1.5">
            {slots
              .filter((s) => s.paused)
              .map((s) => (
                <li key={s.clientId} className="text-sm flex items-center gap-3 flex-wrap">
                  <Link
                    href={`/admin/clients/${s.clientId}`}
                    className="font-semibold text-text hover:text-accent transition-colors"
                  >
                    {s.clientName}
                  </Link>
                  <span className="text-text-muted font-mono text-xs">
                    {DAY_LABELS[s.dayOfWeek].long} · {formatTime12(s.timeOfDay)}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

function HourRow({
  hour,
  isLast,
  buckets,
}: {
  hour: string;
  isLast: boolean;
  buckets: Map<string, FeedbackSlot[]>;
}) {
  return (
    <>
      {/* Time label */}
      <div
        className={
          'bg-bg-elevated/30 border-r border-border-soft px-2 py-3 text-right ' +
          (isLast ? '' : 'border-b ')
        }
      >
        <div className="font-mono text-[11px] text-text-muted font-bold">
          {formatTime12(hour)}
        </div>
      </div>
      {/* Seven day cells */}
      {DAY_LABELS.map((d) => {
        const key = `${d.value}|${hour}`;
        const cellSlots = buckets.get(key) ?? [];
        return (
          <Cell
            key={key}
            slots={cellSlots}
            isLast={isLast}
          />
        );
      })}
    </>
  );
}

function Cell({ slots, isLast }: { slots: FeedbackSlot[]; isLast: boolean }) {
  const empty = slots.length === 0;
  return (
    <div
      className={
        'border-r border-border-soft px-1.5 py-1.5 min-h-[64px] ' +
        (isLast ? '' : 'border-b ') +
        (empty ? 'bg-bg-elevated/10' : '')
      }
    >
      {empty ? (
        <div className="h-full flex items-center justify-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-dim opacity-50">
            free
          </span>
        </div>
      ) : (
        <div className="space-y-1">
          {slots.map((s) => (
            <SlotChip key={s.clientId} slot={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function SlotChip({ slot }: { slot: FeedbackSlot }) {
  const first = slot.clientName.split(/\s+/)[0];
  return (
    <Link
      href={`/admin/clients/${slot.clientId}`}
      className="block rounded-lg border border-accent/40 bg-accent/10 hover:bg-accent/15 hover:border-accent/60 transition-colors px-2 py-1.5 group"
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <User size={10} className="text-accent flex-shrink-0" />
        <span className="font-semibold text-text text-xs truncate">
          {first}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="font-mono text-[10px] text-text-muted">
          {formatTime12(slot.timeOfDay)} · {slot.durationMin}m
        </span>
        {slot.whatsapp && (
          <a
            href={`https://wa.me/91${slot.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[#25D366] hover:opacity-80 transition-opacity"
            title="WhatsApp"
          >
            <MessageCircle size={11} />
          </a>
        )}
      </div>
    </Link>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-border-soft bg-bg-elevated/30 px-3 py-2">
      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-text-muted font-bold">
        {label}
      </div>
      <div
        className="font-display text-lg font-bold tabular-nums leading-none mt-0.5"
        style={{ color: accent }}
      >
        {value}
      </div>
    </div>
  );
}

function LegendDot({
  color,
  border,
  label,
}: {
  color: string;
  border?: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 font-mono uppercase tracking-[0.14em] text-text-muted font-bold text-[11px]">
      <span
        className="inline-block w-3 h-3 rounded"
        style={{
          background: color,
          border: border ? `1px solid ${border}` : undefined,
          boxShadow:
            color !== 'transparent' ? `0 0 6px ${color}80` : undefined,
        }}
      />
      <CalendarClock size={1} className="hidden" />
      {label}
    </span>
  );
}
