'use client';

import { Shield, ShieldAlert, ShieldCheck, Trophy, Target } from 'lucide-react';
import {
  STREAK_THRESHOLD,
  computeBestStreak,
  computeCurrentStreak,
  type DayScoreEntry,
} from '@/lib/data/twin';
import { useIsApp } from '@/lib/hooks/useIsApp';

interface Props {
  /** Last N days, most-recent first. Typically 7. */
  history: DayScoreEntry[];
  /** Today's overall health score (0..100). */
  todayScore: number;
}

/**
 * Streak Shield — gamified streak tracker.
 *
 * Replaces the previous "Healthy Streak" framing with a defensive
 * "shield you protect daily" mental model:
 *   • Current Shield = current consecutive streak days
 *   • Best Shield    = longest run in lookback window
 *   • Shield Goal    = daily score threshold (≥70%)
 *   • Save action    = when streak is alive but today's score is
 *     below threshold, surface a CTA to push the day over the line
 *
 * Same underlying math as before (computeCurrentStreak /
 * computeBestStreak / STREAK_THRESHOLD); only the copy + CTA layer
 * is new. The 7-day calendar grid is unchanged.
 */
export function HealthyStreakCard({ history, todayScore }: Props) {
  const current = computeCurrentStreak(history);
  const best = computeBestStreak(history);
  const hitToday = todayScore >= STREAK_THRESHOLD;
  const isApp = useIsApp();

  // Risk states:
  //   - shieldAtRisk : has an active streak, today's score below
  //     threshold — they could break the streak today
  //   - buildingFirst: no current streak — they're at zero, action
  //     copy nudges them to START rather than SAVE
  const shieldAtRisk = current > 0 && !hitToday;
  const buildingFirst = current === 0 && !hitToday;

  // Title + shield icon mood
  let heading: string;
  let HeadIcon = Shield;
  let headColor = '#a0a69a';

  if (hitToday && current > 0) {
    heading = `Shield active · ${current} day${current === 1 ? '' : 's'}`;
    HeadIcon = ShieldCheck;
    headColor = '#c6ff3d';
  } else if (hitToday && current === 0) {
    heading = 'Shield raised today';
    HeadIcon = ShieldCheck;
    headColor = '#c6ff3d';
  } else if (shieldAtRisk) {
    heading = `${current}-day shield at risk`;
    HeadIcon = ShieldAlert;
    headColor = '#ff8a4d';
  } else {
    heading = 'Raise your first shield';
    HeadIcon = Shield;
    headColor = '#7dd3ff';
  }

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 50% 0%, ${headColor}14 0%, transparent 60%),
          var(--color-bg-card, #11140f)
        `,
        borderColor: `${headColor}30`,
      }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-baseline justify-between gap-3">
        <div>
          <div
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] font-bold mb-2"
            style={{ color: headColor }}
          >
            <HeadIcon size={11} />
            Streak Shield
          </div>
          <h3 className="font-display font-semibold text-lg tracking-tight">
            {heading}
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
          icon={<Shield size={12} />}
          label="Shield"
          value={current}
          suffix={current === 1 ? 'day' : 'days'}
          color={current > 0 ? '#c6ff3d' : '#a0a69a'}
        />
        <Stat
          icon={<Trophy size={12} />}
          label="Best shield"
          value={best}
          suffix={best === 1 ? 'day' : 'days'}
          color="#ffd24d"
        />
        <Stat
          icon={<Target size={12} />}
          label={isApp ? 'Shield goal' : 'Goal'}
          value={STREAK_THRESHOLD}
          suffix={isApp ? '%' : '% +'}
          color="#7dd3ff"
        />
      </div>

      {/* Save your shield — visible only when shield is at risk */}
      {shieldAtRisk && (
        <div className="px-5 pb-4">
          <div
            className="flex items-start gap-3 rounded-xl px-3 py-2.5"
            style={{
              background: 'rgba(255,138,77,0.10)',
              border: '1px solid rgba(255,138,77,0.30)',
            }}
          >
            <ShieldAlert
              size={16}
              style={{ color: '#ff8a4d', flexShrink: 0, marginTop: 2 }}
            />
            <div className="min-w-0">
              <div
                className="font-mono uppercase tracking-[0.18em] font-bold"
                style={{ fontSize: 9, color: '#ff8a4d' }}
              >
                Save your shield
              </div>
              <div
                className="mt-1 leading-snug"
                style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}
              >
                You&apos;re at {todayScore}% — need {STREAK_THRESHOLD}%.
                Drink 500ml water + take a 12-minute walk before bed to
                push the score over the line.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* First-shield nudge — visible when no active streak AND below threshold */}
      {buildingFirst && (
        <div className="px-5 pb-4">
          <div
            className="flex items-start gap-3 rounded-xl px-3 py-2.5"
            style={{
              background: 'rgba(125,211,255,0.08)',
              border: '1px solid rgba(125,211,255,0.25)',
            }}
          >
            <Shield
              size={16}
              style={{ color: '#7dd3ff', flexShrink: 0, marginTop: 2 }}
            />
            <div className="min-w-0">
              <div
                className="font-mono uppercase tracking-[0.18em] font-bold"
                style={{ fontSize: 9, color: '#7dd3ff' }}
              >
                Start your first shield
              </div>
              <div
                className="mt-1 leading-snug"
                style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}
              >
                Hit {STREAK_THRESHOLD}% today and your first shield is up.
                Log steps, sleep, water, a workout, or a meal — every input
                counts toward the score.
              </div>
            </div>
          </div>
        </div>
      )}

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
    ? `${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · score ${day.score}%${day.hitGoal ? ' (shield day)' : ''}`
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
