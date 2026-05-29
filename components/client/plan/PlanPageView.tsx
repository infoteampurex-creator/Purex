'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Flame,
  ArrowRight,
  Dumbbell,
  CalendarDays,
  Check,
} from 'lucide-react';
import {
  CATEGORY_META,
  trainingLoad,
  type PlanData,
  type PlanWorkout,
  type WorkoutCategoryKey,
} from '@/lib/data/plan';

interface Props {
  data: PlanData;
}

/**
 * PlanPageView — Whoop-style training-load view.
 *
 * Layout (top → bottom):
 *   1. Hero "Training Load" with this-week ring + band copy
 *   2. Week strip — Mon-Sun, each day shows assigned workout + tick
 *   3. Stats row — 30-day completed, current streak, by-category split
 *   4. 30-day calendar heat-grid
 *   5. CTA to today's mission on Home
 */
export function PlanPageView({ data }: Props) {
  const today = data.todayIso;
  const { score, band } = trainingLoad(data);

  if (!data.hasAnyData) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-5">
      {/* ─── Hero: Training Load + ring ─── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-3xl border overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, ${band.color}1F 0%, transparent 60%),
            linear-gradient(180deg, #11140f 0%, #0a0c09 100%)
          `,
          borderColor: `${band.color}30`,
        }}
      >
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <div
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] font-bold"
            style={{ color: band.color }}
          >
            <Sparkles size={11} />
            Training Load
          </div>
          <span
            className="font-mono uppercase tracking-[0.16em] font-bold"
            style={{ fontSize: 9, color: 'rgba(255,255,255,0.50)' }}
          >
            This week
          </span>
        </div>

        <div className="px-5 pb-5 flex items-center gap-5">
          <LoadRing score={score} color={band.color} />
          <div className="min-w-0">
            <div
              className="font-display font-bold leading-tight"
              style={{ fontSize: 22, color: band.color }}
            >
              {band.label}
            </div>
            <div
              className="font-mono uppercase tracking-[0.14em] mt-1"
              style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)' }}
            >
              {data.thisWeekCompleted} of {data.thisWeekAssigned} workouts
            </div>
            <p
              className="mt-2 leading-snug"
              style={{ fontSize: 12, color: 'rgba(255,255,255,0.70)' }}
            >
              {band.tagline}
            </p>
          </div>
        </div>
      </motion.section>

      {/* ─── This week strip ─── */}
      <section
        className="rounded-3xl border p-5"
        style={{
          background: 'rgba(255,255,255,0.02)',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display font-bold tracking-tight" style={{ fontSize: 18 }}>
            This week
          </h2>
          <span
            className="font-mono uppercase tracking-[0.16em] font-bold"
            style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}
          >
            Mon — Sun
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {data.weekDays.map((d) => (
            <WeekDayCell
              key={d}
              date={d}
              isToday={d === today}
              workouts={data.workoutsByDate[d] ?? []}
            />
          ))}
        </div>
      </section>

      {/* ─── Stats row ─── */}
      <section
        className="rounded-3xl border p-5"
        style={{
          background: 'rgba(255,255,255,0.02)',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display font-bold tracking-tight" style={{ fontSize: 18 }}>
            Last 30 days
          </h2>
          <span
            className="font-mono uppercase tracking-[0.16em] font-bold"
            style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}
          >
            training breakdown
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <StatTile
            icon={Dumbbell}
            label="Completed"
            value={data.thirtyDayCompleted}
            sub={`of ${data.thirtyDayAssigned} assigned`}
            color="#c6ff3d"
          />
          <StatTile
            icon={Flame}
            label="Streak"
            value={data.streakDays}
            sub={data.streakDays === 1 ? 'day' : 'days'}
            color="#ff8a4d"
          />
          <StatTile
            icon={CalendarDays}
            label="Completion"
            value={
              data.thirtyDayAssigned > 0
                ? Math.round(
                    (data.thirtyDayCompleted / data.thirtyDayAssigned) * 100
                  )
                : 0
            }
            sub="%"
            color="#7dd3ff"
          />
        </div>

        {/* By-category breakdown */}
        <div className="space-y-1.5">
          {(Object.keys(data.byCategory) as WorkoutCategoryKey[])
            .filter((k) => data.byCategory[k] > 0)
            .sort((a, b) => data.byCategory[b] - data.byCategory[a])
            .map((cat) => {
              const meta = CATEGORY_META[cat];
              const n = data.byCategory[cat];
              const total = Math.max(1, data.thirtyDayCompleted);
              const pct = Math.round((n / total) * 100);
              return (
                <div key={cat} className="flex items-center gap-3">
                  <div
                    className="font-mono uppercase tracking-[0.14em] font-bold w-16 flex-shrink-0"
                    style={{ fontSize: 10, color: meta.color }}
                  >
                    {meta.emoji} {meta.label}
                  </div>
                  <div
                    className="relative flex-1 rounded-full overflow-hidden"
                    style={{ height: 6, background: 'rgba(255,255,255,0.05)' }}
                  >
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        background: meta.color,
                        boxShadow: `0 0 6px ${meta.color}55`,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                    />
                  </div>
                  <span
                    className="font-display font-bold tabular-nums w-10 text-right flex-shrink-0"
                    style={{ fontSize: 13, color: 'rgba(245,245,240,0.92)' }}
                  >
                    {n}
                  </span>
                </div>
              );
            })}
        </div>
      </section>

      {/* ─── 30-day completion calendar heat-grid ─── */}
      <section
        className="rounded-3xl border p-5"
        style={{
          background: 'rgba(255,255,255,0.02)',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display font-bold tracking-tight" style={{ fontSize: 18 }}>
            Completion calendar
          </h2>
          <span
            className="font-mono uppercase tracking-[0.16em] font-bold"
            style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}
          >
            30 days
          </span>
        </div>
        <CalendarHeatGrid data={data} />
      </section>

      {/* ─── CTA back to today's mission ─── */}
      <Link
        href="/client/dashboard"
        className="block rounded-3xl border px-5 py-4 transition-colors hover:bg-white/[0.02]"
        style={{
          background: 'rgba(198,255,61,0.06)',
          borderColor: 'rgba(198,255,61,0.28)',
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <div
              className="font-mono uppercase tracking-[0.18em] font-bold"
              style={{ fontSize: 10, color: '#c6ff3d' }}
            >
              Today&apos;s Mission
            </div>
            <div
              className="mt-0.5 leading-snug"
              style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}
            >
              Open today&apos;s workout from Home
            </div>
          </div>
          <ArrowRight size={18} style={{ color: '#c6ff3d' }} />
        </div>
      </Link>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────

function LoadRing({ score, color }: { score: number; color: string }) {
  const size = 120;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - score / 100);

  return (
    <div
      className="relative inline-flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ filter: `drop-shadow(0 0 6px ${color}55)` }}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center font-display font-bold tabular-nums"
        style={{ fontSize: 32, color }}
      >
        {score}
      </div>
    </div>
  );
}

function WeekDayCell({
  date,
  isToday,
  workouts,
}: {
  date: string;
  isToday: boolean;
  workouts: PlanWorkout[];
}) {
  const dt = new Date(date + 'T00:00:00');
  const weekday = dt
    .toLocaleDateString('en-GB', { weekday: 'short' })
    .slice(0, 1);
  const dayNum = dt.getDate();

  // Tappable wrapper — every day links into the dashboard with that date
  // selected, where the TodaysPlanCard renders the full exercise list.
  // Rest days link too so clients can confirm "yep, nothing for today."
  const href = `/client/dashboard?date=${date}`;

  if (workouts.length === 0) {
    return (
      <Link
        href={href}
        prefetch={false}
        title={`${dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · rest`}
        className="aspect-[2/3] rounded-md border flex flex-col items-center justify-center gap-0.5 transition-colors hover:bg-white/[0.05] active:opacity-80"
        style={{
          background: 'rgba(255,255,255,0.02)',
          borderColor: isToday
            ? 'rgba(198,255,61,0.55)'
            : 'rgba(255,255,255,0.06)',
        }}
      >
        <span
          className="font-mono uppercase font-bold leading-none"
          style={{ fontSize: 8, color: 'rgba(255,255,255,0.40)' }}
        >
          {weekday}
        </span>
        <span
          className="font-display font-bold tabular-nums leading-none"
          style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)' }}
        >
          {dayNum}
        </span>
        <span style={{ fontSize: 14 }} aria-hidden>
          💤
        </span>
      </Link>
    );
  }

  // If multiple workouts, use the first one's category for the cell tint
  const primary = workouts[0];
  const meta = CATEGORY_META[primary.category];
  const allDone = workouts.every((w) => w.completed);

  return (
    <Link
      href={href}
      prefetch={false}
      title={`${dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · ${workouts.map((w) => w.name).join(', ')}`}
      className="aspect-[2/3] rounded-md border flex flex-col items-center justify-center gap-0.5 relative transition-transform hover:scale-[1.04] active:scale-100"
      style={{
        background: allDone ? `${meta.color}22` : `${meta.color}0E`,
        borderColor: isToday ? `${meta.color}` : `${meta.color}55`,
      }}
    >
      <span
        className="font-mono uppercase font-bold leading-none"
        style={{ fontSize: 8, color: meta.color, opacity: 0.85 }}
      >
        {weekday}
      </span>
      <span
        className="font-display font-bold tabular-nums leading-none"
        style={{ fontSize: 13, color: meta.color }}
      >
        {dayNum}
      </span>
      <span style={{ fontSize: 14 }} aria-hidden>
        {meta.emoji}
      </span>
      {allDone && (
        <span
          className="absolute top-1 right-1 w-3 h-3 rounded-full flex items-center justify-center"
          style={{ background: meta.color, color: '#0a0c09' }}
        >
          <Check size={8} strokeWidth={3} />
        </span>
      )}
    </Link>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: number;
  sub: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl border px-3 py-3"
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      <div
        className="inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.14em] font-bold"
        style={{ fontSize: 9, color }}
      >
        <Icon size={11} />
        {label}
      </div>
      <div
        className="font-display font-bold tabular-nums leading-none mt-1.5"
        style={{ fontSize: 26, color: 'rgba(245,245,240,0.95)' }}
      >
        {value}
        <span
          className="font-mono ml-1"
          style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}
        >
          {sub}
        </span>
      </div>
    </div>
  );
}

function CalendarHeatGrid({ data }: { data: PlanData }) {
  // Build 30 days, oldest left, today right. Display as 5 rows × 6 cols.
  const days: Array<{
    date: string;
    primary: PlanWorkout | null;
    completed: boolean;
  }> = [];
  for (let i = 29; i >= 0; i--) {
    const dt = new Date(data.todayIso + 'T00:00:00');
    dt.setDate(dt.getDate() - i);
    const iso = dt.toISOString().slice(0, 10);
    const list = data.workoutsByDate[iso] ?? [];
    days.push({
      date: iso,
      primary: list[0] ?? null,
      completed: list.length > 0 && list.every((w) => w.completed),
    });
  }
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {days.map(({ date, primary, completed }, idx) => {
        const dt = new Date(date + 'T00:00:00');
        const isToday = date === data.todayIso;
        const meta = primary ? CATEGORY_META[primary.category] : null;
        return (
          <Link
            key={date}
            href={`/client/dashboard?date=${date}`}
            prefetch={false}
            title={
              primary
                ? `${dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · ${primary.name} ${completed ? '· done' : '· pending'}`
                : `${dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · rest`
            }
            className="aspect-square rounded-md border flex flex-col items-center justify-center gap-0.5 transition-transform hover:scale-[1.06] active:scale-100"
            style={{
              background: meta
                ? completed
                  ? `${meta.color}33`
                  : `${meta.color}10`
                : 'rgba(255,255,255,0.02)',
              borderColor: isToday
                ? 'rgba(255,255,255,0.45)'
                : meta
                  ? `${meta.color}40`
                  : 'rgba(255,255,255,0.05)',
            }}
          >
            <span
              className="font-mono font-bold tabular-nums leading-none"
              style={{
                fontSize: 9,
                color: meta ? meta.color : 'rgba(255,255,255,0.40)',
              }}
            >
              {dt.getDate()}
            </span>
            {meta && (
              <span style={{ fontSize: 10, lineHeight: 1 }} aria-hidden>
                {meta.emoji}
              </span>
            )}
            {idx < 0 && <></>}
          </Link>
        );
      })}
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="rounded-3xl border p-8 text-center"
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      <div
        className="inline-flex w-14 h-14 items-center justify-center rounded-2xl mb-4"
        style={{
          background: 'rgba(198, 255, 61, 0.08)',
          border: '1px solid rgba(198, 255, 61, 0.25)',
          color: '#c6ff3d',
        }}
      >
        <Dumbbell size={20} />
      </div>
      <h2 className="font-display font-semibold text-xl tracking-tight mb-2">
        No training plan yet
      </h2>
      <p
        className="max-w-md mx-auto leading-relaxed mb-4"
        style={{ fontSize: 13, color: 'rgba(255,255,255,0.60)' }}
      >
        Your coach hasn&apos;t assigned workouts in the last 28 days. Open
        Home to start a self-challenge — once your coach activates a plan
        it&apos;ll show up here automatically.
      </p>
      <Link
        href="/client/dashboard"
        className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-mono uppercase tracking-[0.18em] font-bold"
        style={{
          fontSize: 11,
          color: '#0a0c09',
          background: 'linear-gradient(135deg, #c6ff3d 0%, #ffd24d 100%)',
        }}
      >
        Go to Home <ArrowRight size={12} />
      </Link>
    </div>
  );
}
