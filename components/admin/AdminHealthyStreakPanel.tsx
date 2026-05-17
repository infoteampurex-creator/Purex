import {
  Flame,
  Trophy,
  CheckCircle2,
  Activity,
  AlertTriangle,
  Footprints,
  Moon,
  Droplet,
  Dumbbell,
  Apple,
} from 'lucide-react';
import {
  STREAK_THRESHOLD,
  computeBestStreak,
  computeCurrentStreak,
  computeHealthScore,
  TWIN_STAT_META,
  type DayScoreEntry,
  type DailyInputs,
} from '@/lib/data/twin';

interface Props {
  /** Today's raw inputs for the client (used to break down per-component). */
  inputs: DailyInputs;
  /** Last 30 days of scored entries (most recent first). */
  history: DayScoreEntry[];
  /** Client's display name — used in the "needs attention" call-out. */
  clientName: string;
}

/**
 * Admin-side Healthy Streak panel — sits on /admin/clients/[id]
 * between the header and the existing tabs. Designed for trainers
 * scanning their roster in the morning: at a glance they can see
 * (a) whether the streak is alive, (b) what's been logged today,
 * (c) which component is dragging the score down.
 *
 * Differences from the client-facing card:
 *   - 30-day calendar instead of 7-day (trainers want pattern visibility)
 *   - Per-component breakdown row showing today's values + targets
 *   - "Last logged" relative time so trainers see stale data
 *   - "Needs attention" call-out when today's score is below threshold
 */
export function AdminHealthyStreakPanel({
  inputs,
  history,
  clientName,
}: Props) {
  const today = history[0];
  const todayScore = today?.score ?? 0;
  const current = computeCurrentStreak(history);
  const best = computeBestStreak(history);
  const hitToday = todayScore >= STREAK_THRESHOLD;
  const noLogToday = !today?.hasData;

  const breakdown = computeHealthScore({
    steps: inputs.steps,
    stepsGoal: inputs.stepsGoal,
    sleepMinutes: inputs.sleepMinutes,
    sleepGoalMinutes: inputs.sleepGoalMinutes,
    waterMl: inputs.waterMl,
    waterGoalMl: inputs.waterGoalMl,
    workoutCompletedToday: inputs.workoutCompletedToday,
    nutritionAdherencePct: inputs.nutritionAdherencePct,
  });

  const weakest = findWeakestComponent(breakdown);

  return (
    <div className="rounded-2xl border border-border bg-bg-card overflow-hidden mb-6">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-2">
            <Flame size={11} />
            Healthy Streak
          </div>
          <h2 className="font-display font-semibold text-xl tracking-tight">
            {current > 0
              ? `${current}-day streak`
              : noLogToday
                ? 'No log today'
                : 'Streak broken'}
          </h2>
          {weakest && breakdown.total < 100 && (
            <p
              className="text-text-muted mt-1.5 leading-relaxed"
              style={{ fontSize: 13 }}
            >
              {weakest.copy}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <Tile
            icon={<Flame size={11} />}
            label="Current"
            value={current}
            suffix={current === 1 ? 'd' : 'd'}
            color={current > 0 ? '#c6ff3d' : '#a0a69a'}
          />
          <Tile
            icon={<Trophy size={11} />}
            label="Best"
            value={best}
            suffix="d"
            color="#ffd24d"
          />
          <Tile
            icon={<Activity size={11} />}
            label="Today"
            value={todayScore}
            suffix="%"
            color={hitToday ? '#c6ff3d' : noLogToday ? '#a0a69a' : '#ff6b6b'}
            big
          />
        </div>
      </div>

      {/* Attention banner — only when today's score is concerning */}
      {(noLogToday || (!hitToday && today?.hasData)) && (
        <div className="mx-5 mb-4 px-3 py-2.5 rounded-lg bg-amber/10 border border-amber/30 flex items-start gap-2.5">
          <AlertTriangle size={14} className="text-amber flex-shrink-0 mt-0.5" />
          <p className="text-amber leading-relaxed" style={{ fontSize: 13 }}>
            {noLogToday
              ? `${clientName} hasn't logged today yet. WhatsApp nudge?`
              : `${clientName} is below threshold today — ${weakest?.label} is the weak link.`}
          </p>
        </div>
      )}

      {/* Per-component breakdown */}
      <div className="px-5 pb-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold mb-2.5">
          Today's components
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <Component
            icon={<Footprints size={11} />}
            label="Steps"
            color={TWIN_STAT_META.endurance.color}
            score={breakdown.steps}
            display={`${(inputs.steps ?? 0).toLocaleString('en-IN')} / ${inputs.stepsGoal.toLocaleString('en-IN')}`}
            weight={25}
          />
          <Component
            icon={<Moon size={11} />}
            label="Sleep"
            color={TWIN_STAT_META.recovery.color}
            score={breakdown.sleep}
            display={`${(inputs.sleepMinutes / 60).toFixed(1)}h / ${(inputs.sleepGoalMinutes / 60).toFixed(0)}h`}
            weight={20}
          />
          <Component
            icon={<Dumbbell size={11} />}
            label="Workout"
            color={TWIN_STAT_META.strength.color}
            score={breakdown.workout}
            display={inputs.workoutCompletedToday ? 'Done' : 'Pending'}
            weight={25}
          />
          <Component
            icon={<Droplet size={11} />}
            label="Water"
            color={TWIN_STAT_META.energy.color}
            score={breakdown.water}
            display={`${Math.round((inputs.waterMl ?? 0) / 250)} / ${Math.round(inputs.waterGoalMl / 250)} glass`}
            weight={15}
          />
          <Component
            icon={<Apple size={11} />}
            label="Nutrition"
            color={TWIN_STAT_META.discipline.color}
            score={breakdown.nutrition}
            display={
              inputs.nutritionAdherencePct > 0
                ? `${inputs.nutritionAdherencePct}%`
                : 'Not logged'
            }
            weight={15}
          />
        </div>
      </div>

      {/* 30-day calendar */}
      <div className="px-5 pb-5">
        <div className="flex items-baseline justify-between mb-2.5">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold">
            Last 30 days
          </div>
          <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.14em] text-text-dim">
            <LegendDot color="#c6ff3d" label={`≥${STREAK_THRESHOLD}%`} />
            <LegendDot color="#ffd24d" label="partial" />
            <LegendDot color="#ff6b6b" label="missed" />
            <LegendDot color="#3a4438" label="no log" hollow />
          </div>
        </div>
        <Calendar history={history} />
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────

function Tile({
  icon,
  label,
  value,
  suffix,
  color,
  big,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix: string;
  color: string;
  big?: boolean;
}) {
  return (
    <div className="text-right">
      <div className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted font-bold mb-0.5 justify-end w-full">
        <span style={{ color }}>{icon}</span>
        {label}
      </div>
      <div
        className="font-display font-bold tabular-nums leading-none"
        style={{ fontSize: big ? 26 : 22, color }}
      >
        {value}
        <span
          className="text-[10px] font-mono ml-0.5 text-text-muted font-bold"
        >
          {suffix}
        </span>
      </div>
    </div>
  );
}

function Component({
  icon,
  label,
  color,
  score,
  display,
  weight,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  score: number;
  display: string;
  weight: number;
}) {
  return (
    <div className="rounded-xl bg-bg-elevated/60 border border-border-soft p-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <div
          className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.14em] font-bold"
          style={{ color }}
        >
          {icon}
          {label}
        </div>
        <span className="font-mono text-[9px] tabular-nums text-text-dim">
          {weight}%
        </span>
      </div>
      <div
        className="font-display font-bold tabular-nums leading-none"
        style={{ fontSize: 15, color }}
      >
        {score}
        <span className="text-[9px] font-mono text-text-muted font-bold ml-0.5">
          /100
        </span>
      </div>
      <div className="text-[10px] text-text-muted font-mono mt-1 truncate">
        {display}
      </div>
      {/* Mini bar */}
      <div className="mt-1.5 h-1 bg-bg-elevated rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${score}%`,
            background: color,
            boxShadow: `0 0 4px ${color}`,
          }}
        />
      </div>
    </div>
  );
}

function LegendDot({
  color,
  label,
  hollow,
}: {
  color: string;
  label: string;
  hollow?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className="w-1.5 h-1.5 rounded-sm"
        style={
          hollow
            ? { border: `1px solid ${color}`, background: 'transparent' }
            : { background: color, boxShadow: `0 0 3px ${color}` }
        }
      />
      {label}
    </span>
  );
}

function Calendar({ history }: { history: DayScoreEntry[] }) {
  // History is most-recent first. Reverse so the calendar reads
  // left-to-right oldest-to-today.
  const days = [...history].slice(0, 30).reverse();
  return (
    <div className="grid grid-cols-15 gap-1" style={{
      gridTemplateColumns: 'repeat(15, minmax(0, 1fr))',
    }}>
      {days.map((day, idx) => {
        const tone = (() => {
          if (!day.hasData) return 'empty';
          if (day.hitGoal) return 'green';
          if (day.score >= STREAK_THRESHOLD / 2) return 'amber';
          return 'red';
        })();
        const isToday = idx === days.length - 1;
        const bg = {
          green: 'bg-accent/30 border-accent/50',
          amber: 'bg-amber/25 border-amber/45',
          red: 'bg-danger/20 border-danger/40',
          empty: 'bg-bg-elevated border-border-soft',
        }[tone];

        const dt = new Date(day.date + 'T00:00:00');
        const dayNum = dt.getDate();
        const title = day.hasData
          ? `${dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · ${day.score}%${day.hitGoal ? ' · streak day' : ''}`
          : `${dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · no log`;

        return (
          <div
            key={day.date}
            title={title}
            className={`aspect-square rounded-sm border ${bg} relative flex items-center justify-center`}
            style={isToday ? { boxShadow: '0 0 0 1.5px rgba(198, 255, 61, 0.45)' } : {}}
          >
            <span
              className="font-mono tabular-nums leading-none"
              style={{
                fontSize: 9,
                color: tone === 'empty' ? '#5a6055' : 'rgba(0,0,0,0.7)',
                fontWeight: 700,
              }}
            >
              {dayNum}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Component-weakness analyser ──────────────────────────────────

function findWeakestComponent(
  breakdown: ReturnType<typeof computeHealthScore>
): { label: string; copy: string } | null {
  // Find the lowest-scoring component weighted by its importance.
  // A 0 in workout (25% weight) hurts more than a 50 in water (15% weight).
  const candidates: Array<{ label: string; score: number; weight: number; copy: string }> = [
    {
      label: 'Workout',
      score: breakdown.workout,
      weight: 25,
      copy: 'Workout not completed today — biggest swing if she trains.',
    },
    {
      label: 'Steps',
      score: breakdown.steps,
      weight: 25,
      copy: 'Step count low — a 20-minute walk would close the gap.',
    },
    {
      label: 'Sleep',
      score: breakdown.sleep,
      weight: 20,
      copy: 'Sleep is below target. Earlier bedtime, or nap if possible.',
    },
    {
      label: 'Water',
      score: breakdown.water,
      weight: 15,
      copy: 'Hydration low — recommend front-loading water before lunch.',
    },
    {
      label: 'Nutrition',
      score: breakdown.nutrition,
      weight: 15,
      copy: 'Nutrition not logged or off-target. Quick check-in?',
    },
  ];
  const ranked = candidates
    .filter((c) => c.score < 70)
    .sort((a, b) => a.score * a.weight - b.score * b.weight);
  return ranked[0] ?? null;
}
