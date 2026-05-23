'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { MilestoneRail } from './MilestoneRail';
import { ProjectedMetrics } from './ProjectedMetrics';
import {
  isTwinEmpty,
  projectStats,
  twinOverallScore,
  FUTURE_STAGES,
  TWIN_PREVIEW_STATS,
  type TwinStats,
} from '@/lib/data/twin';
import { deriveProjectedDeltas, MILESTONE_RAIL } from '@/lib/data/twin-game';

interface Props {
  stats: TwinStats;
  workoutDoneToday: boolean;
  streakDays: number;
}

/**
 * Future Clone — the aspirational card.
 *
 * Hero visual is two glowing score circles (Today + Day 90) with a
 * trajectory line chart underneath showing the slope across the
 * 90-day window with milestone markers. No human silhouettes —
 * users responded poorly to the abstract stick figures; charts +
 * scores feel like Whoop / Strava / Garmin (premium fitness).
 */
export function FutureCloneDashboardCardApp({
  stats,
  workoutDoneToday: _workoutDoneToday,
  streakDays,
}: Props) {
  const showPreview = isTwinEmpty(stats);
  const sourceStats = showPreview ? TWIN_PREVIEW_STATS : stats;

  const future = FUTURE_STAGES.find((s) => s.key === '90d')!;
  const projected = projectStats(sourceStats, future);
  const projectedOverall = twinOverallScore(projected);
  const todayOverall = twinOverallScore(sourceStats);
  const lift = Math.max(0, projectedOverall - todayOverall);

  const deltas = deriveProjectedDeltas(sourceStats, projected);

  return (
    <div
      className="relative rounded-3xl overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 50% -20%, rgba(212,160,80,0.18) 0%, transparent 55%),
          linear-gradient(180deg, #15110a 0%, #0a0c09 100%)
        `,
        border: '1px solid rgba(212,160,80,0.30)',
        boxShadow:
          '0 0 0 1px rgba(212,160,80,0.18), 0 24px 48px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Ambient gold glow */}
      <div
        className="absolute -top-32 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(255,210,77,0.22), transparent 65%)',
          filter: 'blur(20px)',
        }}
      />

      {/* ─── Header ─── */}
      <div className="relative px-5 pt-5 pb-3">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <div
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] font-bold"
            style={{ color: '#d4a050' }}
          >
            <Sparkles size={11} />
            PureX Future Clone
          </div>
          <span
            className="font-mono uppercase tracking-[0.18em] px-1.5 py-0.5 rounded"
            style={{
              fontSize: 9,
              color: '#ffd24d',
              backgroundColor: 'rgba(255,210,77,0.10)',
              border: '1px solid rgba(255,210,77,0.18)',
            }}
          >
            90-day projection
          </span>
          {showPreview && (
            <span
              className="font-mono uppercase tracking-[0.18em] px-1.5 py-0.5 rounded"
              style={{
                fontSize: 8,
                color: '#d4a050',
                backgroundColor: 'rgba(212,160,80,0.18)',
              }}
            >
              Preview
            </span>
          )}
        </div>
        <h3
          className="font-display font-bold tracking-tight"
          style={{ fontSize: 20 }}
        >
          <span
            style={{
              background:
                'linear-gradient(135deg, #ffffff 0%, #ffe69a 50%, #d4a050 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Your upgraded self in 90 days
          </span>
        </h3>
      </div>

      {/* ─── Hero: Today ⟶ Day 90 score circles ─── */}
      <div className="relative px-5 pb-2 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <ScoreCircle
          score={todayOverall}
          label="Today"
          sublabel="Rookie"
          color="#a0a69a"
        />
        <LiftBeam lift={lift} />
        <ScoreCircle
          score={projectedOverall}
          label="Day 90"
          sublabel="Prime"
          color="#ffd24d"
          glow
        />
      </div>

      {/* ─── Trajectory line chart ─── */}
      <div className="relative px-5 pb-4">
        <div
          className="font-mono uppercase tracking-[0.18em] font-bold mb-2"
          style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}
        >
          Trajectory
        </div>
        <TrajectoryChart
          startScore={todayOverall}
          endScore={projectedOverall}
          streakDays={streakDays}
        />
      </div>

      {/* ─── Milestone rail ─── */}
      <div className="relative px-5 pb-4">
        <MilestoneRail streakDays={streakDays} />
      </div>

      {/* ─── Projected metrics ─── */}
      <div className="relative px-5 pb-4">
        <div
          className="font-mono uppercase tracking-[0.18em] font-bold mb-2"
          style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}
        >
          Projected lift
        </div>
        <ProjectedMetrics deltas={deltas} />
      </div>

      {/* ─── CTA ─── */}
      <Link
        href="/client/future-clone"
        className="relative flex items-center justify-between px-5 py-3.5 border-t font-mono uppercase tracking-[0.20em] font-bold transition-opacity hover:opacity-90"
        style={{
          fontSize: 11,
          color: '#ffd24d',
          borderColor: 'rgba(212,160,80,0.15)',
          backgroundColor: 'rgba(212,160,80,0.04)',
        }}
      >
        Reveal my Day 90 self
        <ArrowRight size={13} />
      </Link>
    </div>
  );
}

// ─── Score circle ───────────────────────────────────────────────────

function ScoreCircle({
  score,
  label,
  sublabel,
  color,
  glow = false,
}: {
  score: number;
  label: string;
  sublabel: string;
  color: string;
  glow?: boolean;
}) {
  const size = 96;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = c - (c * clamped) / 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col items-center"
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={stroke}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ filter: glow ? `drop-shadow(0 0 8px ${color})` : undefined }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-display font-bold tabular-nums leading-none"
            style={{
              fontSize: 28,
              color: glow ? color : 'rgba(245,245,240,0.92)',
              textShadow: glow ? `0 0 12px ${color}55` : undefined,
            }}
          >
            {Math.round(clamped)}
          </span>
        </div>
      </div>
      <div
        className="font-mono uppercase tracking-[0.18em] font-bold mt-2"
        style={{ fontSize: 9, color: glow ? color : 'rgba(255,255,255,0.55)' }}
      >
        {label}
      </div>
      <div
        className="font-mono uppercase tracking-[0.16em] font-bold mt-0.5"
        style={{ fontSize: 8, color: 'rgba(255,255,255,0.40)' }}
      >
        {sublabel}
      </div>
    </motion.div>
  );
}

// ─── Lift beam between the two circles ──────────────────────────────

function LiftBeam({ lift }: { lift: number }) {
  return (
    <div className="flex flex-col items-center px-1">
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
        className="font-display font-bold tabular-nums leading-none"
        style={{
          fontSize: 22,
          color: '#ffd24d',
          textShadow: '0 0 12px rgba(255,210,77,0.45)',
        }}
      >
        +{lift}
      </motion.div>
      <div
        className="font-mono uppercase tracking-[0.18em] font-bold mt-1"
        style={{ fontSize: 8, color: 'rgba(255,210,77,0.7)' }}
      >
        Lift
      </div>
      <div className="relative w-full h-0.5 mt-3 rounded-full" style={{ backgroundColor: 'rgba(255,210,77,0.15)' }}>
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: 'linear-gradient(90deg, transparent, #ffd24d, transparent)',
            width: '60%',
          }}
          animate={{ x: ['-50%', '120%'] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <motion.div
        animate={{ x: [0, 3, 0], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        className="mt-2"
        style={{ color: '#ffd24d', filter: 'drop-shadow(0 0 4px #ffd24d)' }}
      >
        <ArrowRight size={14} />
      </motion.div>
    </div>
  );
}

// ─── Trajectory chart ───────────────────────────────────────────────

function TrajectoryChart({
  startScore,
  endScore,
  streakDays,
}: {
  startScore: number;
  endScore: number;
  streakDays: number;
}) {
  const W = 320;
  const H = 90;
  const PAD = 16;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;

  // Score range across the chart — use [0, 100] for stable y-axis
  const yFor = (score: number) => PAD + innerH - (score / 100) * innerH;
  const xFor = (day: number) => PAD + (day / 90) * innerW;

  // Smooth curve from today's score to projected
  const path = `M ${xFor(0)} ${yFor(startScore)} Q ${xFor(45)} ${yFor(
    startScore + (endScore - startScore) * 0.55
  )}, ${xFor(90)} ${yFor(endScore)}`;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: 'block', height: 'auto', overflow: 'visible' }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="traj-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffd24d" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#ffd24d" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="traj-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#a0a69a" />
            <stop offset="100%" stopColor="#ffd24d" />
          </linearGradient>
        </defs>

        {/* Gridlines (3 horizontal) */}
        {[25, 50, 75].map((v) => (
          <line
            key={v}
            x1={PAD}
            x2={W - PAD}
            y1={yFor(v)}
            y2={yFor(v)}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
          />
        ))}

        {/* Area under curve */}
        <motion.path
          d={`${path} L ${xFor(90)} ${H - PAD} L ${xFor(0)} ${H - PAD} Z`}
          fill="url(#traj-fill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        />
        {/* Curve */}
        <motion.path
          d={path}
          fill="none"
          stroke="url(#traj-stroke)"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          style={{ filter: 'drop-shadow(0 0 4px rgba(255,210,77,0.4))' }}
        />

        {/* Milestone dots */}
        {MILESTONE_RAIL.map((m, i) => {
          const cx = xFor(m.day);
          const t = m.day / 90;
          const cy = yFor(startScore + (endScore - startScore) * t);
          const unlocked = streakDays >= m.day;
          return (
            <g key={m.day}>
              <motion.circle
                cx={cx}
                cy={cy}
                r={unlocked ? 5 : 3.5}
                fill={unlocked ? m.color : 'rgba(255,255,255,0.12)'}
                stroke={unlocked ? m.color : 'rgba(255,255,255,0.20)'}
                strokeWidth={unlocked ? 1.5 : 1}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
                style={{ filter: unlocked ? `drop-shadow(0 0 4px ${m.color})` : undefined }}
              />
            </g>
          );
        })}

        {/* Today marker (always present at x=0) */}
        <motion.circle
          cx={xFor(0)}
          cy={yFor(startScore)}
          r={4}
          fill="#a0a69a"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        />
      </svg>

      {/* X-axis labels */}
      <div className="flex justify-between mt-1 px-1">
        {MILESTONE_RAIL.map((m) => (
          <div
            key={m.day}
            className="font-mono uppercase tracking-[0.14em]"
            style={{
              fontSize: 8,
              color: streakDays >= m.day ? m.color : 'rgba(255,255,255,0.35)',
            }}
          >
            D{m.day}
          </div>
        ))}
      </div>
    </div>
  );
}
