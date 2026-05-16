import Image from 'next/image';
import Link from 'next/link';
import { Trophy, Flame, Footprints, CheckCircle2, ArrowRight } from 'lucide-react';
import { type PersonalProgress, type DayCell } from '@/lib/data/mother-strong-types';

interface Props {
  progress: PersonalProgress;
  dailyGoal: number;
  whatsappGroupLink: string | null;
}

/**
 * Server component rendering one participant's 60-day window.
 *
 * Public-safe — receives only the `PersonalProgress` shape, which
 * never includes phone numbers or emergency contacts.
 */
export function PersonalProgressView({
  progress,
  dailyGoal,
  whatsappGroupLink,
}: Props) {
  const {
    displayId,
    fullName,
    publicPhotoUrl,
    city,
    status,
    rank,
    totalParticipants,
    daysElapsed,
    daysHitGoal,
    totalSteps,
    currentStreak,
    consistencyPct,
    startDate,
    endDate,
    calendar,
  } = progress;

  const endDateFormatted = new Date(endDate + 'T00:00:00').toLocaleDateString(
    'en-GB',
    { day: 'numeric', month: 'long', year: 'numeric' }
  );
  const startDateFormatted = new Date(startDate + 'T00:00:00').toLocaleDateString(
    'en-GB',
    { day: 'numeric', month: 'long' }
  );

  return (
    <div className="space-y-8 md:space-y-10">
      {/* Identity bar */}
      <div className="rounded-2xl bg-bg-card border border-border p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-5">
        <Avatar name={fullName} url={publicPhotoUrl} size={80} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent font-bold">
              {displayId}
            </span>
            <StatusPill status={status} />
          </div>
          <div className="font-display font-semibold text-2xl md:text-3xl tracking-tight leading-tight">
            {fullName}
          </div>
          <div className="text-sm text-text-muted mt-1">{city}</div>
        </div>
        {rank !== null && rank > 0 && (
          <div className="md:text-right">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold mb-1">
              Cohort rank
            </div>
            <div className="font-display font-bold text-accent tabular-nums" style={{ fontSize: 40, lineHeight: 1 }}>
              #{rank}
            </div>
            <div className="text-xs text-text-muted font-mono mt-1">
              of {totalParticipants}
            </div>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <BigStat
          icon={<Trophy size={14} />}
          label="Days hit 10K"
          value={`${daysHitGoal}`}
          sub={`of ${daysElapsed} so far`}
        />
        <BigStat
          icon={<Flame size={14} />}
          label="Current streak"
          value={`${currentStreak}`}
          sub={currentStreak === 1 ? 'day' : 'days'}
        />
        <BigStat
          icon={<Footprints size={14} />}
          label="Total steps"
          value={totalSteps.toLocaleString('en-IN')}
          sub={`avg ${daysElapsed > 0 ? Math.round(totalSteps / daysElapsed).toLocaleString('en-IN') : '—'} / day`}
        />
        <BigStat
          icon={<CheckCircle2 size={14} />}
          label="Consistency"
          value={`${consistencyPct.toFixed(0)}%`}
          sub={`goal: ${dailyGoal.toLocaleString('en-IN')} steps`}
        />
      </div>

      {/* Calendar */}
      <div>
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold">
              60-day window
            </div>
            <h2 className="font-display font-semibold text-xl md:text-2xl tracking-tight mt-1">
              Day by day
            </h2>
          </div>
          <div className="text-xs text-text-muted font-mono text-right">
            <div>{startDateFormatted} → {endDateFormatted}</div>
          </div>
        </div>

        <CalendarGrid cells={calendar} dailyGoal={dailyGoal} />

        <CalendarLegend dailyGoal={dailyGoal} />
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
        <Link
          href="/mother-strong/leaderboard"
          className="inline-flex items-center justify-center gap-2 px-5 rounded-full border border-accent/40 bg-accent/5 text-accent font-semibold hover:bg-accent/10 transition-colors"
          style={{ height: 48, minHeight: 48, fontSize: 15 }}
        >
          See the full leaderboard
          <ArrowRight size={14} />
        </Link>
        {whatsappGroupLink && (
          <a
            href={whatsappGroupLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-5 rounded-full bg-[#25D366] text-white font-semibold hover:opacity-90 transition-opacity"
            style={{ height: 48, minHeight: 48, fontSize: 15 }}
          >
            Open WhatsApp group
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────

function BigStat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl bg-bg-card border border-border p-4 md:p-5">
      <div className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold mb-2">
        <span className="text-accent">{icon}</span>
        {label}
      </div>
      <div
        className="font-display font-bold tracking-tight tabular-nums leading-none"
        style={{ fontSize: 36 }}
      >
        {value}
      </div>
      <div className="text-xs text-text-muted font-mono mt-2">{sub}</div>
    </div>
  );
}

function StatusPill({ status }: { status: PersonalProgress['status'] }) {
  const map = {
    active: { label: 'Active', bg: 'rgba(198, 255, 61, 0.10)', fg: '#c6ff3d', border: 'rgba(198, 255, 61, 0.30)' },
    completed: { label: 'Completed', bg: 'rgba(125, 211, 255, 0.10)', fg: '#7dd3ff', border: 'rgba(125, 211, 255, 0.30)' },
    dropped: { label: 'Paused', bg: 'rgba(160, 166, 154, 0.08)', fg: '#a0a69a', border: 'rgba(200, 200, 200, 0.20)' },
  }[status];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-[0.12em] font-bold border"
      style={{ background: map.bg, color: map.fg, borderColor: map.border }}
    >
      {map.label}
    </span>
  );
}

function Avatar({
  name,
  url,
  size,
}: {
  name: string;
  url: string | null;
  size: number;
}) {
  if (url) {
    return (
      <div
        className="relative rounded-full overflow-hidden bg-bg-elevated flex-shrink-0 border border-border-soft"
        style={{ width: size, height: size }}
      >
        <Image
          src={url}
          alt=""
          fill
          sizes={`${size}px`}
          className="object-cover"
          unoptimized
        />
      </div>
    );
  }
  const initials = name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div
      className="rounded-full bg-bg-elevated flex items-center justify-center font-mono font-bold text-text-muted flex-shrink-0 border border-border-soft"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}

// ─── Calendar ──────────────────────────────────────────────────────

function CalendarGrid({ cells, dailyGoal }: { cells: DayCell[]; dailyGoal: number }) {
  return (
    <div className="rounded-2xl bg-bg-card border border-border p-3 md:p-4">
      <div className="grid grid-cols-10 gap-1.5 md:gap-2">
        {cells.map((cell) => (
          <CalendarCell key={cell.dayNumber} cell={cell} dailyGoal={dailyGoal} />
        ))}
      </div>
    </div>
  );
}

function CalendarCell({
  cell,
  dailyGoal,
}: {
  cell: DayCell;
  dailyGoal: number;
}) {
  const tone = (() => {
    if (cell.isFuture) return 'future';
    if (cell.stepCount == null) return 'empty';
    if (cell.stepCount >= dailyGoal) return 'green';
    if (cell.stepCount >= dailyGoal / 2) return 'yellow';
    return 'red';
  })();

  const bg = {
    green: 'bg-accent/20 border-accent/40',
    yellow: 'bg-amber/20 border-amber/40',
    red: 'bg-danger/20 border-danger/40',
    empty: 'bg-bg-elevated border-border-soft',
    future: 'bg-bg-elevated/40 border-border-soft/50',
  }[tone];

  const fg = {
    green: 'text-accent',
    yellow: 'text-amber',
    red: 'text-danger',
    empty: 'text-text-muted',
    future: 'text-text-dim',
  }[tone];

  const tooltip = (() => {
    const dateLabel = new Date(cell.date + 'T00:00:00').toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
    if (cell.isFuture) return `Day ${cell.dayNumber} · ${dateLabel} · upcoming`;
    if (cell.stepCount == null) return `Day ${cell.dayNumber} · ${dateLabel} · no entry`;
    return `Day ${cell.dayNumber} · ${dateLabel} · ${cell.stepCount.toLocaleString('en-IN')} steps${cell.hitGoal ? ' (goal hit!)' : ''}`;
  })();

  return (
    <div
      className={`relative aspect-square rounded-md border ${bg} flex flex-col items-center justify-center p-0.5 md:p-1`}
      title={tooltip}
    >
      <div
        className={`font-mono text-[8px] md:text-[9px] font-bold uppercase ${fg} opacity-70`}
      >
        {cell.dayNumber}
      </div>
      {cell.stepCount != null && !cell.isFuture && (
        <div
          className={`font-mono font-bold tabular-nums ${fg} leading-none mt-0.5`}
          style={{ fontSize: '9px' }}
        >
          {formatStepsShort(cell.stepCount)}
        </div>
      )}
    </div>
  );
}

function CalendarLegend({ dailyGoal }: { dailyGoal: number }) {
  const half = Math.floor(dailyGoal / 2);
  return (
    <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-4 text-[10px] md:text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted">
      <Swatch color="green" label={`≥ ${dailyGoal.toLocaleString('en-IN')}`} />
      <Swatch color="yellow" label={`${half.toLocaleString('en-IN')}–${(dailyGoal - 1).toLocaleString('en-IN')}`} />
      <Swatch color="red" label={`< ${half.toLocaleString('en-IN')}`} />
      <Swatch color="empty" label="No entry" />
      <Swatch color="future" label="Upcoming" />
    </div>
  );
}

function Swatch({
  color,
  label,
}: {
  color: 'green' | 'yellow' | 'red' | 'empty' | 'future';
  label: string;
}) {
  const bg = {
    green: 'bg-accent/40',
    yellow: 'bg-amber/40',
    red: 'bg-danger/40',
    empty: 'bg-bg-elevated border border-border-soft',
    future: 'bg-bg-elevated/40 border border-border-soft/50',
  }[color];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-3 h-3 rounded-sm ${bg}`} />
      {label}
    </span>
  );
}

function formatStepsShort(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return String(n);
}
