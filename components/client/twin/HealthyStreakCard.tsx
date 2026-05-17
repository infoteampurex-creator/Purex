import { Flame, Trophy, CheckCircle2 } from 'lucide-react';
import {
  STREAK_THRESHOLD,
  computeBestStreak,
  computeCurrentStreak,
  type DayScoreEntry,
} from '@/lib/data/twin';

interface Props {
  /** Last N days, most-recent first. Typically 7. */
  history: DayScoreEntry[];
  /** Today's overall health score (0..100). */
  todayScore: number;
}

/**
 * Healthy Streak summary — sits on the client dashboard.
 *
 * Shows:
 *   • Current streak (consecutive days at ≥70%)
 *   • Best streak (longest run in the lookback window)
 *   • Today's score with the streak-day badge if applicable
 *   • 7-day calendar grid with colour-coded cells (green/amber/red/grey)
 */
export function HealthyStreakCard({ history, todayScore }: Props) {
  const current = computeCurrentStreak(history);
  const best = computeBestStreak(history);
  const hitToday = todayScore >= STREAK_THRESHOLD;

  return (
    <div className="rounded-2xl border border-border bg-bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-baseline justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-2">
            <Flame size={11} />
            Healthy Streak
          </div>
          <h3 className="font-display font-semibold text-lg tracking-tight">
            {current > 0
              ? `${current}-day streak alive`
              : "Today's the start"}
          </h3>
        </div>
        <div className="text-right tabular-nums flex-shrink-0">
          <div
            className="font-display font-bold leading-none"
            style={{
              fontSize: 28,
              color: hitToday ? '#c6ff3d' : '#a0a69a',
            }}
          >
            {todayScore}%
          </div>
          <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted font-bold mt-0.5">
            Today
          </div>
        </div>
      </div>

      {/* Stat row — current + best + threshold reminder */}
      <div className="px-5 pb-4 grid grid-cols-3 gap-2">
        <Stat
          icon={<Flame size={12} />}
          label="Current"
          value={current}
          suffix={current === 1 ? 'day' : 'days'}
          color={current > 0 ? '#c6ff3d' : '#a0a69a'}
        />
        <Stat
          icon={<Trophy size={12} />}
          label="Best"
          value={best}
          suffix={best === 1 ? 'day' : 'days'}
          color="#ffd24d"
        />
        <Stat
          icon={<CheckCircle2 size={12} />}
          label="Streak day"
          value={STREAK_THRESHOLD}
          suffix="% +"
          color="#7dd3ff"
        />
      </div>

      {/* 7-day calendar */}
      <div className="px-5 pb-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold mb-2">
          Last 7 days
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {[...history]
            .slice(0, 7)
            .reverse() // oldest left, today right
            .map((day, idx) => (
              <CalendarCell
                key={day.date}
                day={day}
                isToday={idx === history.slice(0, 7).length - 1}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────

function Stat({
  icon,
  label,
  value,
  suffix,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix: string;
  color: string;
}) {
  return (
    <div className="rounded-xl bg-bg-elevated/60 border border-border-soft px-2.5 py-2 text-center">
      <div className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted font-bold">
        <span style={{ color }}>{icon}</span>
        {label}
      </div>
      <div
        className="font-display font-bold tabular-nums leading-none mt-1"
        style={{ fontSize: 18, color }}
      >
        {value}
        <span className="text-[10px] font-mono text-text-muted font-bold ml-0.5">
          {suffix}
        </span>
      </div>
    </div>
  );
}

function CalendarCell({
  day,
  isToday,
}: {
  day: DayScoreEntry;
  isToday: boolean;
}) {
  const tone = (() => {
    if (!day.hasData) return 'empty';
    if (day.hitGoal) return 'green';
    if (day.score >= STREAK_THRESHOLD / 2) return 'amber';
    return 'red';
  })();

  const bg = {
    green: 'bg-accent/25 border-accent/50',
    amber: 'bg-amber/20 border-amber/40',
    red: 'bg-danger/15 border-danger/35',
    empty: 'bg-bg-elevated border-border-soft',
  }[tone];

  const fg = {
    green: '#c6ff3d',
    amber: '#ffd24d',
    red: '#ff6b6b',
    empty: '#5a6055',
  }[tone];

  const date = new Date(day.date + 'T00:00:00');
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'short' }).slice(0, 1);
  const dayNum = date.getDate();

  const title = day.hasData
    ? `${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · score ${day.score}%${day.hitGoal ? ' (streak day)' : ''}`
    : `${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · no log`;

  return (
    <div
      title={title}
      className={`aspect-square rounded-md border ${bg} flex flex-col items-center justify-center relative`}
      style={isToday ? { boxShadow: '0 0 0 1.5px rgba(198, 255, 61, 0.35)' } : {}}
    >
      <span
        className="font-mono uppercase font-bold leading-none"
        style={{ fontSize: 9, color: fg, opacity: 0.75 }}
      >
        {weekday}
      </span>
      <span
        className="font-display font-bold tabular-nums leading-none mt-1"
        style={{ fontSize: 13, color: fg }}
      >
        {dayNum}
      </span>
      {day.hasData && day.hitGoal && (
        <span
          className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent"
          style={{ boxShadow: '0 0 4px rgba(198, 255, 61, 0.8)' }}
          aria-hidden
        />
      )}
    </div>
  );
}
