'use client';

import { motion } from 'framer-motion';
import {
  Activity,
  Flame,
  Footprints,
  Moon,
  TrendingUp,
  TrendingDown,
  Minus,
  Scale,
  Dumbbell,
  Sparkles,
} from 'lucide-react';
import { TrendLineChart } from './TrendLineChart';
import { ConsistencyRing } from './ConsistencyRing';
import { TransformationTimeline } from './TransformationTimeline';
import {
  transformationScore,
  weightDelta,
  type ProgressData,
  type StrengthPR,
} from '@/lib/data/progress';

interface Props {
  data: ProgressData;
  strengthPRs: StrengthPR[];
}

/**
 * ProgressPageView — Whoop-style transformation hub.
 *
 * Layout:
 *   1. Hero — single big "Transformation Score" with band label
 *   2. Two consistency rings (30-day, 90-day) side by side
 *   3. 30-day Health Score trend line chart
 *   4. Weight trend chart (when ≥2 measurements exist)
 *   5. This-week-vs-last-week deltas grid
 *   6. Empty state when no data
 *
 * No chart libraries — all SVG so the bundle stays small and the
 * styling matches the rest of the PureX premium dark UI.
 */
export function ProgressPageView({ data, strengthPRs }: Props) {
  const tScore = transformationScore(data);
  const wDelta = weightDelta(data.weightHistory);
  const tBand = transformationBand(tScore);

  if (data.isEmpty) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-5">
      {/* ─── Hero: Transformation Score ─── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-3xl border overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, ${tBand.color}1F 0%, transparent 60%),
            linear-gradient(180deg, #11140f 0%, #0a0c09 100%)
          `,
          borderColor: `${tBand.color}30`,
          boxShadow: `0 0 0 1px ${tBand.color}14, 0 24px 48px -12px rgba(0,0,0,0.55)`,
        }}
      >
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <div
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] font-bold"
            style={{ color: tBand.color }}
          >
            <Sparkles size={11} />
            Transformation Score
          </div>
          <span
            className="font-mono uppercase tracking-[0.16em] font-bold"
            style={{ fontSize: 9, color: 'rgba(255,255,255,0.50)' }}
          >
            Last 30 days
          </span>
        </div>
        <div className="px-5 pb-5 flex items-baseline gap-3">
          <motion.div
            key={tScore}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-display font-bold tabular-nums leading-none"
            style={{
              fontSize: 72,
              color: tBand.color,
              textShadow: `0 0 24px ${tBand.color}55`,
            }}
          >
            {tScore}
          </motion.div>
          <div className="pb-2 min-w-0">
            <div
              className="font-display font-bold leading-none"
              style={{ fontSize: 18, color: 'rgba(245,245,240,0.95)' }}
            >
              {tBand.label}
            </div>
            <div
              className="font-mono uppercase tracking-[0.14em] mt-1"
              style={{ fontSize: 9, color: 'rgba(255,255,255,0.50)' }}
            >
              out of 100
            </div>
            <p
              className="mt-2 leading-snug"
              style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}
            >
              {tBand.tagline}
            </p>
          </div>
        </div>
      </motion.section>

      {/* ─── Consistency rings (30 + 90 day) ─── */}
      <section
        className="rounded-3xl border p-5"
        style={{
          background: 'rgba(255,255,255,0.02)',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display font-bold tracking-tight" style={{ fontSize: 18 }}>
            Consistency
          </h2>
          <span
            className="font-mono uppercase tracking-[0.16em] font-bold"
            style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}
          >
            % days ≥ 70
          </span>
        </div>
        <div className="flex items-center justify-around gap-4 flex-wrap">
          <ConsistencyRing
            hit={data.consistency30.hit}
            total={data.consistency30.total}
            label="30 days"
            color="#c6ff3d"
          />
          <ConsistencyRing
            hit={data.consistency90.hit}
            total={data.consistency90.total}
            label="90 days"
            color="#7dd3ff"
          />
        </div>
      </section>

      {/* ─── 30-day Health Score trend ─── */}
      <section
        className="rounded-3xl border p-5"
        style={{
          background: 'rgba(255,255,255,0.02)',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <h2 className="font-display font-bold tracking-tight" style={{ fontSize: 18 }}>
              Daily score trend
            </h2>
            <p
              className="leading-snug mt-0.5"
              style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)' }}
            >
              Last 30 days · dashed line = shield-day threshold
            </p>
          </div>
        </div>
        <TrendLineChart
          data={data.scoreTrend30.map((p) => ({
            date: p.date,
            value: p.score,
          }))}
          height={140}
        />
      </section>

      {/* ─── Weight trend ─── */}
      {data.weightHistory.length >= 2 && (
        <section
          className="rounded-3xl border p-5"
          style={{
            background: 'rgba(255,255,255,0.02)',
            borderColor: 'rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <h2 className="font-display font-bold tracking-tight" style={{ fontSize: 18 }}>
                Weight
              </h2>
              <p
                className="leading-snug mt-0.5"
                style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)' }}
              >
                {data.weightHistory.length} measurement
                {data.weightHistory.length === 1 ? '' : 's'} over the window
              </p>
            </div>
            {wDelta != null && <DeltaPill delta={wDelta} unit="kg" inverse />}
          </div>
          <WeightChart history={data.weightHistory} />
        </section>
      )}

      {/* ─── Strength PRs — top lifts ever ─── */}
      {strengthPRs.length > 0 && (
        <section
          className="rounded-3xl border p-5"
          style={{
            background: 'rgba(255,255,255,0.02)',
            borderColor: 'rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <h2
                className="font-display font-bold tracking-tight"
                style={{ fontSize: 18 }}
              >
                Strength PRs
              </h2>
              <p
                className="leading-snug mt-0.5"
                style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)' }}
              >
                Heaviest set ever per exercise
              </p>
            </div>
            <span
              className="font-mono uppercase tracking-[0.16em] font-bold"
              style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}
            >
              top {strengthPRs.length}
            </span>
          </div>
          <ul className="space-y-2">
            {strengthPRs.map((pr) => (
              <li key={pr.exerciseName}>
                <StrengthPRRow pr={pr} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ─── Weekly vs last week deltas ─── */}
      <section
        className="rounded-3xl border p-5"
        style={{
          background: 'rgba(255,255,255,0.02)',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display font-bold tracking-tight" style={{ fontSize: 18 }}>
            This week vs last
          </h2>
          <span
            className="font-mono uppercase tracking-[0.16em] font-bold"
            style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}
          >
            7-day deltas
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <DeltaCard
            icon={Footprints}
            label="Steps/day"
            thisWeek={data.thisWeek.steps}
            lastWeek={data.lastWeek.steps}
            unit=""
            color="#c6ff3d"
            formatter={(v) => Math.round(v).toLocaleString()}
          />
          <DeltaCard
            icon={Moon}
            label="Sleep/night"
            thisWeek={data.thisWeek.sleepMinutes}
            lastWeek={data.lastWeek.sleepMinutes}
            unit="h"
            color="#a78bfa"
            formatter={(v) => (v / 60).toFixed(1)}
          />
          <DeltaCard
            icon={Dumbbell}
            label="Workouts"
            thisWeek={data.thisWeek.workouts}
            lastWeek={data.lastWeek.workouts}
            unit=""
            color="#ff8a4d"
            formatter={(v) => String(v)}
          />
          <DeltaCard
            icon={Flame}
            label="Meal-logged days"
            thisWeek={data.thisWeek.mealsLoggedDays}
            lastWeek={data.lastWeek.mealsLoggedDays}
            unit="/7"
            color="#ffd24d"
            formatter={(v) => String(v)}
          />
        </div>
      </section>

      {/* ─── Transformation Timeline ─── */}
      <TransformationTimeline data={data} />
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────

function transformationBand(score: number):
  | { label: string; tagline: string; color: string } {
  if (score >= 80) {
    return {
      label: 'Compounding',
      tagline:
        'Consistency + workout volume both strong. Stay this rhythm and the curve continues.',
      color: '#ff8a4d',
    };
  }
  if (score >= 65) {
    return {
      label: 'Building',
      tagline:
        'Momentum is real. One more workout or 2 more logged days lifts you into Compounding.',
      color: '#ffd24d',
    };
  }
  if (score >= 50) {
    return {
      label: 'On track',
      tagline: 'Steady. Add one habit — water, sleep, or a 15-min walk — to climb.',
      color: '#c6ff3d',
    };
  }
  if (score >= 30) {
    return {
      label: 'Foundation',
      tagline: 'Early days. Focus on logging meals + sleep — those alone move 30 points.',
      color: '#7dd3ff',
    };
  }
  return {
    label: 'Starting',
    tagline: 'No score yet — log one full day to start your transformation curve.',
    color: '#a78bfa',
  };
}

function DeltaPill({
  delta,
  unit,
  inverse = false,
}: {
  delta: number;
  unit: string;
  /** When true, a negative delta is treated as GOOD (used for weight loss). */
  inverse?: boolean;
}) {
  const positive = delta > 0;
  const meaningfullyPositive = inverse ? !positive : positive;
  const Icon =
    Math.abs(delta) < 0.05 ? Minus : positive ? TrendingUp : TrendingDown;
  const color = meaningfullyPositive ? '#c6ff3d' : delta === 0 ? '#a0a69a' : '#ff8a4d';
  return (
    <span
      className="inline-flex items-center gap-1 font-mono uppercase tracking-[0.14em] font-bold px-2 py-1 rounded-full"
      style={{
        fontSize: 10,
        color,
        background: `${color}14`,
        border: `1px solid ${color}33`,
      }}
    >
      <Icon size={11} strokeWidth={2.5} />
      {positive ? '+' : ''}
      {delta.toFixed(1)}
      {unit}
    </span>
  );
}

function DeltaCard({
  icon: Icon,
  label,
  thisWeek,
  lastWeek,
  unit,
  color,
  formatter,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  thisWeek: number;
  lastWeek: number;
  unit: string;
  color: string;
  formatter: (v: number) => string;
}) {
  const delta = thisWeek - lastWeek;
  const pct =
    lastWeek > 0 ? Math.round((delta / lastWeek) * 100) : thisWeek > 0 ? 100 : 0;
  const positive = delta > 0;
  const TrendIcon = Math.abs(delta) < 0.001 ? Minus : positive ? TrendingUp : TrendingDown;

  return (
    <div
      className="rounded-xl border px-3 py-3"
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div
          className="inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.14em] font-bold"
          style={{ fontSize: 9, color }}
        >
          <Icon size={11} />
          {label}
        </div>
        <span
          className="inline-flex items-center gap-0.5 font-mono font-bold"
          style={{
            fontSize: 10,
            color: positive ? '#c6ff3d' : delta < 0 ? '#ff8a4d' : 'rgba(255,255,255,0.45)',
          }}
        >
          <TrendIcon size={10} strokeWidth={2.5} />
          {pct > 0 ? '+' : ''}
          {pct}%
        </span>
      </div>
      <div
        className="font-display font-bold tabular-nums leading-none"
        style={{ fontSize: 22, color: 'rgba(245,245,240,0.95)' }}
      >
        {formatter(thisWeek)}
        {unit && (
          <span
            className="font-mono"
            style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginLeft: 3 }}
          >
            {unit}
          </span>
        )}
      </div>
      <div
        className="font-mono mt-0.5"
        style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}
      >
        last week: {formatter(lastWeek)}
        {unit}
      </div>
    </div>
  );
}

function WeightChart({ history }: { history: Array<{ date: string; weightKg: number }> }) {
  const width = 600;
  const height = 100;
  const padding = { top: 8, right: 8, bottom: 16, left: 8 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const min = Math.min(...history.map((h) => h.weightKg));
  const max = Math.max(...history.map((h) => h.weightKg));
  const range = Math.max(1, max - min);

  const xFor = (i: number) =>
    padding.left + (i / Math.max(1, history.length - 1)) * innerW;
  const yFor = (w: number) =>
    padding.top + innerH - ((w - min) / range) * innerH;

  const pts = history.map((h, i) => ({ x: xFor(i), y: yFor(h.weightKg) }));
  let d = pts.length ? `M ${pts[0].x} ${pts[0].y}` : '';
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const cur = pts[i];
    const midX = (prev.x + cur.x) / 2;
    d += ` C ${midX} ${prev.y}, ${midX} ${cur.y}, ${cur.x} ${cur.y}`;
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      <defs>
        <linearGradient id="weightArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7dd3ff" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#7dd3ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {pts.length > 0 && (
        <>
          <path
            d={`${d} L ${pts[pts.length - 1].x} ${padding.top + innerH} L ${pts[0].x} ${padding.top + innerH} Z`}
            fill="url(#weightArea)"
          />
          <path
            d={d}
            fill="none"
            stroke="#7dd3ff"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 4px rgba(125,211,255,0.45))' }}
          />
          {pts.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="#7dd3ff" stroke="#0a0c09" strokeWidth={1.5} />
          ))}
          <text
            x={padding.left}
            y={height - 2}
            fontSize={9}
            fill="rgba(255,255,255,0.40)"
            fontFamily="ui-monospace, monospace"
          >
            {history[0].weightKg.toFixed(1)} kg
          </text>
          <text
            x={padding.left + innerW}
            y={height - 2}
            textAnchor="end"
            fontSize={9}
            fill="rgba(255,255,255,0.40)"
            fontFamily="ui-monospace, monospace"
          >
            {history[history.length - 1].weightKg.toFixed(1)} kg
          </text>
        </>
      )}
    </svg>
  );
}

function StrengthPRRow({ pr }: { pr: StrengthPR }) {
  const dt = pr.achievedAt ? new Date(pr.achievedAt) : null;
  return (
    <div
      className="rounded-xl border px-3 py-3 flex items-center gap-3"
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      <div className="min-w-0 flex-1">
        <div
          className="font-semibold leading-tight"
          style={{ fontSize: 14, color: 'rgba(245,245,240,0.92)' }}
        >
          {pr.exerciseName}
        </div>
        <div
          className="flex flex-wrap items-center gap-x-2 gap-y-0 mt-1 font-mono"
          style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}
        >
          {pr.targetMuscle && (
            <span className="uppercase tracking-[0.10em]">
              {pr.targetMuscle}
            </span>
          )}
          {pr.bestReps && <span>· {pr.bestReps} reps</span>}
          {dt && (
            <span>
              · {dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
          )}
          <span>· logged {pr.attemptsLogged}×</span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div
          className="font-display font-bold tabular-nums leading-none"
          style={{ fontSize: 22, color: '#ff8a4d' }}
        >
          {pr.bestWeightKg}
          <span
            className="font-mono ml-1"
            style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}
          >
            kg
          </span>
        </div>
        <div
          className="font-mono uppercase tracking-[0.14em] font-bold mt-0.5"
          style={{ fontSize: 8, color: '#ff8a4d' }}
        >
          PR
        </div>
      </div>
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
          background: 'rgba(125,211,255,0.08)',
          border: '1px solid rgba(125,211,255,0.25)',
          color: '#7dd3ff',
        }}
      >
        <Scale size={20} />
      </div>
      <h2 className="font-display font-semibold text-xl tracking-tight mb-2">
        Your transformation begins here
      </h2>
      <p
        className="max-w-md mx-auto leading-relaxed"
        style={{ fontSize: 13, color: 'rgba(255,255,255,0.60)' }}
      >
        Log a meal, sleep, steps, or body measurement — anything to start.
        The Progress page builds itself from your daily logs.
      </p>
    </div>
  );
}

// Used at the top for the Activity icon import — keeps lint happy.
void Activity;
