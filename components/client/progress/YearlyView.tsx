'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Footprints,
  Dumbbell,
  Utensils,
  Moon,
  Scale,
  TrendingDown,
  TrendingUp,
  Minus,
  X,
  Sparkles,
} from 'lucide-react';
import type { MonthlyBucket, YearlyProgress } from '@/lib/data/progress';

/**
 * Yearly Progress View — 12 monthly tiles in a 3x4 grid.
 * Asked for on 2026-07-16: "want to see my progress for every month
 * for entire year — diet, exercise, steps, and other details".
 *
 * Layout:
 *   Header ── 12-month totals strip (steps sum, workouts, meals, days
 *              logged) so the user sees the aggregate before the
 *              per-month grid.
 *   Grid   ── 12 tiles, 3 columns x 4 rows on mobile. Each tile shows
 *              month label, consistency ring (days-logged / days-in-
 *              month), workouts count, avg-steps, and (if present)
 *              weight delta. Empty months are greyed with a "—" tag.
 *   Modal  ── Tap a tile → slide-up sheet with detailed month
 *              breakdown: diet (meals), exercise (workouts), steps,
 *              sleep, weight. Empty months show "Nothing logged this
 *              month yet."
 *
 * Pure client component — the server hands us the fully-shaped
 * YearlyProgress and we render. No fetches here.
 */
export function YearlyView({ data }: { data: YearlyProgress }) {
  const [openMonth, setOpenMonth] = useState<MonthlyBucket | null>(null);

  return (
    <>
      {/* ─── Year totals strip ───────────────────────────────── */}
      <section
        className="relative rounded-3xl border p-5 overflow-hidden mb-5"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, rgba(198,255,61,0.12) 0%, transparent 55%),
            linear-gradient(180deg, #11150f 0%, #0a0c09 100%)
          `,
          borderColor: 'rgba(198,255,61,0.28)',
        }}
      >
        <div
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] font-bold mb-3"
          style={{ color: '#c6ff3d' }}
        >
          <Calendar size={11} />
          Last 12 Months
        </div>
        <div className="grid grid-cols-4 gap-2">
          <TotalStat
            icon={<Sparkles size={13} />}
            value={data.totals.daysLogged.toString()}
            label="Days logged"
            color="#c6ff3d"
          />
          <TotalStat
            icon={<Dumbbell size={13} />}
            value={data.totals.workouts.toString()}
            label="Workouts"
            color="#ff8a4d"
          />
          <TotalStat
            icon={<Utensils size={13} />}
            value={data.totals.meals.toString()}
            label="Meals"
            color="#ffd24d"
          />
          <TotalStat
            icon={<Footprints size={13} />}
            value={formatK(data.totals.stepsSum)}
            label="Steps"
            color="#7dd3ff"
          />
        </div>
      </section>

      {/* ─── 12-month grid ───────────────────────────────────── */}
      <section className="grid grid-cols-3 gap-2 mb-5">
        {data.months.map((m) => (
          <MonthTile key={m.monthKey} month={m} onOpen={() => setOpenMonth(m)} />
        ))}
      </section>

      {/* ─── Drill-down sheet ────────────────────────────────── */}
      <AnimatePresence>
        {openMonth && (
          <MonthDetailSheet
            month={openMonth}
            onClose={() => setOpenMonth(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function TotalStat({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl p-2.5 flex flex-col items-center"
      style={{
        background: `${color}12`,
        border: `1px solid ${color}30`,
      }}
    >
      <div style={{ color }}>{icon}</div>
      <div
        className="font-display font-bold tabular-nums leading-none mt-1"
        style={{ fontSize: 17, color: 'rgba(245,245,240,0.95)' }}
      >
        {value}
      </div>
      <div
        className="font-mono uppercase tracking-[0.12em] font-bold text-center mt-0.5"
        style={{ fontSize: 8, color: 'rgba(255,255,255,0.55)' }}
      >
        {label}
      </div>
    </div>
  );
}

function MonthTile({
  month,
  onOpen,
}: {
  month: MonthlyBucket;
  onOpen: () => void;
}) {
  const consistencyPct = Math.round(
    (month.daysLogged / month.daysInMonth) * 100
  );
  const bandColor =
    consistencyPct >= 70
      ? '#c6ff3d'
      : consistencyPct >= 40
        ? '#ffd24d'
        : consistencyPct > 0
          ? '#ff8a4d'
          : 'rgba(255,255,255,0.15)';

  const dim = !month.hasData;

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      whileTap={{ scale: 0.97 }}
      className="relative rounded-2xl p-3 text-left overflow-hidden"
      style={{
        background: dim
          ? 'rgba(255,255,255,0.02)'
          : `radial-gradient(ellipse at 50% 0%, ${bandColor}18 0%, transparent 60%), rgba(255,255,255,0.02)`,
        border: `1px solid ${dim ? 'rgba(255,255,255,0.06)' : bandColor + '40'}`,
        minHeight: 118,
      }}
    >
      <div className="flex items-baseline justify-between">
        <div
          className="font-mono uppercase tracking-[0.16em] font-bold"
          style={{
            fontSize: 10,
            color: dim ? 'rgba(255,255,255,0.45)' : 'rgba(245,245,240,0.95)',
          }}
        >
          {month.monthShortLabel}
        </div>
        <div
          className="font-mono tabular-nums font-bold"
          style={{
            fontSize: 9,
            color: dim ? 'rgba(255,255,255,0.30)' : bandColor,
          }}
        >
          {dim ? '—' : `${consistencyPct}%`}
        </div>
      </div>

      {/* Micro-ring for consistency */}
      <ConsistencyRing pct={dim ? 0 : consistencyPct} color={bandColor} />

      {/* Three tiny stats */}
      <div className="mt-2 space-y-0.5">
        <TinyStat
          value={dim ? '—' : month.workouts.toString()}
          label="W/O"
          color="#ff8a4d"
          dim={dim}
        />
        <TinyStat
          value={dim ? '—' : formatK(month.avgSteps)}
          label="STEP"
          color="#7dd3ff"
          dim={dim}
        />
        <TinyStat
          value={dim ? '—' : month.meals.toString()}
          label="MEALS"
          color="#ffd24d"
          dim={dim}
        />
      </div>
    </motion.button>
  );
}

function TinyStat({
  value,
  label,
  color,
  dim,
}: {
  value: string;
  label: string;
  color: string;
  dim: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className="font-mono uppercase tracking-[0.14em] font-bold"
        style={{
          fontSize: 8,
          color: dim ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.45)',
        }}
      >
        {label}
      </span>
      <span
        className="font-display font-bold tabular-nums"
        style={{
          fontSize: 11,
          color: dim ? 'rgba(255,255,255,0.40)' : color,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function ConsistencyRing({ pct, color }: { pct: number; color: string }) {
  const R = 18;
  const STROKE = 3;
  const C = 2 * Math.PI * R;
  const dash = C * (1 - pct / 100);
  return (
    <div className="flex items-center justify-center my-1">
      <svg width="46" height="46" className="-rotate-90">
        <circle
          cx="23"
          cy="23"
          r={R}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={STROKE}
        />
        <circle
          cx="23"
          cy="23"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={dash}
        />
      </svg>
    </div>
  );
}

function MonthDetailSheet({
  month,
  onClose,
}: {
  month: MonthlyBucket;
  onClose: () => void;
}) {
  const consistency = Math.round(
    (month.daysLogged / month.daysInMonth) * 100
  );
  const sleepH = Math.round((month.avgSleepMinutes / 60) * 10) / 10;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80]"
      style={{ background: 'rgba(6,8,5,0.86)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t p-5 max-h-[85vh] overflow-y-auto"
        style={{
          background:
            'linear-gradient(180deg, #12160f 0%, #0a0c09 100%)',
          borderColor: 'rgba(198,255,61,0.30)',
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div
              className="font-mono uppercase tracking-[0.22em] font-bold"
              style={{ fontSize: 10, color: '#c6ff3d' }}
            >
              Month
            </div>
            <h2
              className="font-display font-semibold tracking-tight mt-1"
              style={{ fontSize: 22, color: 'rgba(245,245,240,0.98)' }}
            >
              {month.monthLongLabel}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: 'rgba(245,245,240,0.75)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {!month.hasData ? (
          <div
            className="rounded-2xl p-6 text-center"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>
              Nothing logged in {month.monthLongLabel} yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <DetailRow
              icon={<Sparkles size={16} />}
              color="#c6ff3d"
              label="Consistency"
              value={`${consistency}%`}
              sub={`${month.daysLogged} of ${month.daysInMonth} days logged`}
            />
            <DetailRow
              icon={<Dumbbell size={16} />}
              color="#ff8a4d"
              label="Exercise"
              value={month.workouts.toString()}
              sub={`workout${month.workouts === 1 ? '' : 's'} completed`}
            />
            <DetailRow
              icon={<Utensils size={16} />}
              color="#ffd24d"
              label="Diet"
              value={month.meals.toString()}
              sub={`meal${month.meals === 1 ? '' : 's'} logged`}
            />
            <DetailRow
              icon={<Footprints size={16} />}
              color="#7dd3ff"
              label="Steps"
              value={formatK(month.avgSteps)}
              sub={`daily average`}
            />
            <DetailRow
              icon={<Moon size={16} />}
              color="#a78bfa"
              label="Sleep"
              value={sleepH > 0 ? `${sleepH}h` : '—'}
              sub={`daily average`}
            />
            <DetailRow
              icon={<Scale size={16} />}
              color="#f8d4c1"
              label="Weight"
              value={
                month.latestWeightKg != null
                  ? `${month.latestWeightKg.toFixed(1)} kg`
                  : '—'
              }
              sub={
                month.weightDeltaKg != null
                  ? `${formatDelta(month.weightDeltaKg)} kg this month`
                  : 'no measurements'
              }
              trend={
                month.weightDeltaKg == null
                  ? undefined
                  : month.weightDeltaKg < -0.1
                    ? 'down'
                    : month.weightDeltaKg > 0.1
                      ? 'up'
                      : 'flat'
              }
            />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function DetailRow({
  icon,
  color,
  label,
  value,
  sub,
  trend,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: string;
  sub: string;
  trend?: 'up' | 'down' | 'flat';
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-3"
      style={{
        background: `${color}0d`,
        border: `1px solid ${color}22`,
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: `${color}18`,
          color,
        }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="font-mono uppercase tracking-[0.18em] font-bold"
          style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)' }}
        >
          {label}
        </div>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span
            className="font-display font-bold tabular-nums"
            style={{ fontSize: 20, color: 'rgba(245,245,240,0.98)' }}
          >
            {value}
          </span>
          {trend && (
            <TrendIcon
              size={14}
              style={{
                color:
                  trend === 'down' ? '#c6ff3d' : trend === 'up' ? '#ff6b6b' : 'rgba(255,255,255,0.35)',
              }}
            />
          )}
        </div>
        <div
          className="font-mono mt-0.5"
          style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)' }}
        >
          {sub}
        </div>
      </div>
    </div>
  );
}

// ─── formatters ─────────────────────────────────────────────────

function formatK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

function formatDelta(kg: number): string {
  const sign = kg > 0 ? '+' : '';
  return `${sign}${kg.toFixed(1)}`;
}
