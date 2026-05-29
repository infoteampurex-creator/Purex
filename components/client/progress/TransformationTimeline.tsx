'use client';

import { motion } from 'framer-motion';
import {
  Footprints,
  Flame,
  Dumbbell,
  Heart,
  Sparkles,
  CheckCircle2,
  Lock,
  Award,
} from 'lucide-react';
import type { ProgressData } from '@/lib/data/progress';

interface Props {
  data: ProgressData;
}

/**
 * TransformationTimeline — visual 12-week journey.
 *
 * Whoop has "Strain history" — we adapt that to a coaching narrative:
 * 12 weeks, broken into 3 phases (Foundation / Build / Push), with
 * milestones unlocked as the user accumulates logged days, workouts,
 * and consistency points.
 *
 * Phases:
 *   Weeks 1-4   Foundation        consistency & habits
 *   Weeks 5-8   Strength build    workout volume & progressive load
 *   Weeks 9-12  Fat loss push     caloric + cardio focus
 *
 * Milestones (auto-unlocked from existing data):
 *   • First week logged          — any day in week 1 has data
 *   • 7-day streak               — currentStreak >= 7
 *   • 10 workouts                — sum of byCategory >= 10 (lifetime
 *     proxy: we use 90-day; close enough for v1)
 *   • Consistency 50% × 30d      — 15+ days hit threshold in last 30
 *   • 14-day streak              — currentStreak >= 14
 *   • Consistency 70% × 30d      — 21+ days hit threshold in last 30
 *   • 30-day weight movement     — weightHistory has ≥2 points
 *     spanning 30+ days
 *
 * Locked milestones still show — gives the user a visible target.
 */
export function TransformationTimeline({ data }: Props) {
  // ─── Compute milestones ────────────────────────────────────────
  // ProgressData doesn't carry by-category workout split; we have
  // 14-day totals via thisWeek + lastWeek. Treat that as our proxy
  // for "lifetime workouts" — good enough for early-stage unlocks.
  const totalWorkouts14d =
    data.thisWeek.workouts + data.lastWeek.workouts;
  const consistencyPct =
    data.consistency30.total > 0
      ? (data.consistency30.hit / data.consistency30.total) * 100
      : 0;

  const streakDays = (() => {
    // We don't have it directly here — infer from scoreTrend30
    // (trailing days hit), same logic as Streak Shield.
    let s = 0;
    for (let i = data.scoreTrend30.length - 1; i >= 0; i--) {
      if (data.scoreTrend30[i].hit) s++;
      else break;
    }
    return s;
  })();

  const milestones: Milestone[] = [
    {
      key: 'first_log',
      label: 'First logged day',
      sub: 'You\'re on the board',
      week: 1,
      icon: Sparkles,
      color: '#7dd3ff',
      unlocked: data.scoreTrend30.some((d) => d.score !== null),
    },
    {
      key: 'streak_7',
      label: '7-day streak',
      sub: 'A full week at threshold',
      week: 2,
      icon: Flame,
      color: '#c6ff3d',
      unlocked: streakDays >= 7,
    },
    {
      key: 'workouts_10',
      label: '10 workouts',
      sub: 'Habit forming',
      week: 4,
      icon: Dumbbell,
      color: '#ff8a4d',
      unlocked: totalWorkouts14d >= 10,
    },
    {
      key: 'consistency_50',
      label: 'Consistency 50%',
      sub: '15+ shield days in 30',
      week: 6,
      icon: CheckCircle2,
      color: '#ffd24d',
      unlocked: consistencyPct >= 50,
    },
    {
      key: 'streak_14',
      label: '14-day streak',
      sub: 'Discipline is the engine',
      week: 8,
      icon: Flame,
      color: '#c6ff3d',
      unlocked: streakDays >= 14,
    },
    {
      key: 'consistency_70',
      label: 'Consistency 70%',
      sub: '21+ shield days in 30',
      week: 10,
      icon: Award,
      color: '#ff8a4d',
      unlocked: consistencyPct >= 70,
    },
    {
      key: 'weight_arc',
      label: '30-day weight arc',
      sub: 'Two measurements 30d apart',
      week: 12,
      icon: Heart,
      color: '#a78bfa',
      unlocked:
        data.weightHistory.length >= 2 &&
        spansAtLeast(data.weightHistory[0].date, data.weightHistory[data.weightHistory.length - 1].date, 30),
    },
  ];

  const unlockedCount = milestones.filter((m) => m.unlocked).length;

  const phases: Phase[] = [
    {
      key: 'foundation',
      title: 'Foundation',
      sub: 'Weeks 1-4 · habits + logging',
      weekRange: [1, 4],
      color: '#7dd3ff',
      icon: Footprints,
    },
    {
      key: 'build',
      title: 'Strength build',
      sub: 'Weeks 5-8 · volume + load',
      weekRange: [5, 8],
      color: '#ff8a4d',
      icon: Dumbbell,
    },
    {
      key: 'push',
      title: 'Fat-loss push',
      sub: 'Weeks 9-12 · cardio + nutrition focus',
      weekRange: [9, 12],
      color: '#c6ff3d',
      icon: Flame,
    },
  ];

  return (
    <section
      className="rounded-3xl border p-5"
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h2
            className="font-display font-bold tracking-tight"
            style={{ fontSize: 18 }}
          >
            Transformation timeline
          </h2>
          <p
            className="leading-snug mt-0.5"
            style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)' }}
          >
            12-week journey · 3 phases · {unlockedCount}/{milestones.length}{' '}
            milestones
          </p>
        </div>
        <Award size={18} style={{ color: '#ffd24d' }} />
      </div>

      {/* ─── Phase bands ─── */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {phases.map((p) => {
          const inPhase = milestones.filter(
            (m) => m.week >= p.weekRange[0] && m.week <= p.weekRange[1]
          );
          const unlockedInPhase = inPhase.filter((m) => m.unlocked).length;
          const PIcon = p.icon;
          return (
            <div
              key={p.key}
              className="rounded-xl border p-3"
              style={{
                background: `${p.color}0A`,
                borderColor: `${p.color}33`,
              }}
            >
              <div
                className="inline-flex items-center gap-1 font-mono uppercase tracking-[0.14em] font-bold"
                style={{ fontSize: 9, color: p.color }}
              >
                <PIcon size={11} />
                {p.title}
              </div>
              <div
                className="font-display font-bold tabular-nums leading-none mt-1.5"
                style={{ fontSize: 18, color: 'rgba(245,245,240,0.95)' }}
              >
                {unlockedInPhase}
                <span
                  className="font-mono ml-1"
                  style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}
                >
                  / {inPhase.length}
                </span>
              </div>
              <div
                className="font-mono mt-0.5 leading-snug"
                style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)' }}
              >
                {p.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Vertical milestone list ─── */}
      <ol className="relative">
        {milestones.map((m, idx) => {
          const MIcon = m.icon;
          const isLast = idx === milestones.length - 1;
          return (
            <li key={m.key} className="relative pl-9 pb-4 last:pb-0">
              {/* Connector line */}
              {!isLast && (
                <span
                  className="absolute left-3 top-7 bottom-0 w-px"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                />
              )}
              {/* Node */}
              <span
                className="absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center"
                style={{
                  background: m.unlocked ? `${m.color}1F` : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${m.unlocked ? m.color : 'rgba(255,255,255,0.10)'}`,
                  color: m.unlocked ? m.color : 'rgba(255,255,255,0.30)',
                }}
              >
                {m.unlocked ? (
                  <MIcon size={11} />
                ) : (
                  <Lock size={9} strokeWidth={2.5} />
                )}
              </span>
              {/* Body */}
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.03 }}
              >
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span
                    className="font-display font-semibold leading-tight"
                    style={{
                      fontSize: 13,
                      color: m.unlocked
                        ? 'rgba(245,245,240,0.95)'
                        : 'rgba(255,255,255,0.55)',
                    }}
                  >
                    {m.label}
                  </span>
                  <span
                    className="font-mono uppercase tracking-[0.14em] font-bold"
                    style={{
                      fontSize: 8,
                      color: m.unlocked ? m.color : 'rgba(255,255,255,0.30)',
                    }}
                  >
                    Week {m.week}
                  </span>
                  {m.unlocked && (
                    <span
                      className="inline-flex items-center gap-0.5 font-mono uppercase tracking-[0.14em] font-bold px-1 py-0.5 rounded"
                      style={{
                        fontSize: 8,
                        color: '#0a0c09',
                        background: m.color,
                      }}
                    >
                      <CheckCircle2 size={8} strokeWidth={3} />
                      Unlocked
                    </span>
                  )}
                </div>
                <div
                  className="leading-snug mt-0.5"
                  style={{
                    fontSize: 11,
                    color: m.unlocked
                      ? 'rgba(255,255,255,0.65)'
                      : 'rgba(255,255,255,0.40)',
                  }}
                >
                  {m.sub}
                </div>
              </motion.div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// ─── Types + helpers ────────────────────────────────────────────

interface Milestone {
  key: string;
  label: string;
  sub: string;
  week: number;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  color: string;
  unlocked: boolean;
}

interface Phase {
  key: string;
  title: string;
  sub: string;
  weekRange: [number, number];
  color: string;
  icon: React.ComponentType<{ size?: number }>;
}

function spansAtLeast(fromIso: string, toIso: string, days: number): boolean {
  const [fy, fm, fd] = fromIso.split('-').map(Number);
  const [ty, tm, td] = toIso.split('-').map(Number);
  const a = Date.UTC(fy, fm - 1, fd);
  const b = Date.UTC(ty, tm - 1, td);
  return Math.round((b - a) / (1000 * 60 * 60 * 24)) >= days;
}
