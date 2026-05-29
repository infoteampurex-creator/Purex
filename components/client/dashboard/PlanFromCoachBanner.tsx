import Link from 'next/link';
import {
  Sparkles,
  CalendarDays,
  Utensils,
  ArrowRight,
} from 'lucide-react';
import type { CoachPlanFreshness } from '@/lib/data/plan-updates-server';

interface Props {
  freshness: CoachPlanFreshness;
}

/**
 * PlanFromCoachBanner — visible on the client dashboard, surfaces the
 * coach's most recent edits to the weekly schedule and diet plan. Two
 * jobs:
 *
 *   1. Tells the user "Coach updated your plan Xh ago" so they don't
 *      have to discover it by accident.
 *   2. Tells US that the materialization step actually wrote rows
 *      (`upcomingWorkouts > 0`). When a coach reports "client doesn't
 *      see workouts," we look at this banner first.
 *
 * Hides itself when there's nothing to show (no schedule, no diet,
 * zero upcoming workouts) — keeps the dashboard clean for new clients.
 */
export function PlanFromCoachBanner({ freshness }: Props) {
  const hasSchedule = freshness.scheduleUpdatedAt !== null;
  const hasDiet = freshness.dietUpdatedAt !== null;
  const hasWorkouts = freshness.upcomingWorkouts > 0;

  // Nothing to surface — render nothing rather than an awkward placeholder.
  if (!hasSchedule && !hasDiet && !hasWorkouts) return null;

  return (
    <section
      className="rounded-2xl border overflow-hidden mb-4"
      style={{
        borderColor: 'rgba(198,255,61,0.25)',
        background: `
          radial-gradient(ellipse at 30% 0%, rgba(198,255,61,0.10) 0%, transparent 55%),
          linear-gradient(180deg, #121408 0%, #0a0c09 100%)
        `,
        boxShadow: '0 0 0 1px rgba(198,255,61,0.10)',
      }}
    >
      <div className="px-4 py-3 flex items-center gap-2 border-b border-border-soft">
        <Sparkles size={12} style={{ color: '#c6ff3d' }} />
        <span
          className="font-mono uppercase tracking-[0.18em] font-bold"
          style={{ fontSize: 10, color: '#c6ff3d' }}
        >
          Plan from your coach
        </span>
      </div>

      <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Schedule tile */}
        <Link
          href="/client/plan"
          className="group rounded-xl border px-3 py-2.5 flex items-start gap-2.5 transition-colors hover:bg-white/[0.03]"
          style={{
            borderColor: 'rgba(198,255,61,0.18)',
            background: 'rgba(198,255,61,0.03)',
          }}
        >
          <CalendarDays
            size={16}
            style={{ color: '#c6ff3d', flexShrink: 0, marginTop: 2 }}
          />
          <div className="min-w-0 flex-1">
            <div
              className="font-mono uppercase tracking-[0.14em] font-bold"
              style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)' }}
            >
              Training schedule
            </div>
            <div
              className="font-display font-semibold mt-0.5"
              style={{ fontSize: 13, color: 'rgba(255,255,255,0.90)' }}
            >
              {hasWorkouts
                ? `${freshness.upcomingWorkouts} workout${
                    freshness.upcomingWorkouts === 1 ? '' : 's'
                  } this week`
                : hasSchedule
                  ? 'Schedule set'
                  : 'Not set yet'}
            </div>
            {hasSchedule && freshness.scheduleUpdatedAt && (
              <div
                style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)' }}
              >
                Updated {formatRelative(freshness.scheduleUpdatedAt)}
              </div>
            )}
          </div>
          <ArrowRight
            size={13}
            style={{
              color: 'rgba(255,255,255,0.30)',
              flexShrink: 0,
              marginTop: 4,
            }}
            className="group-hover:translate-x-0.5 transition-transform"
          />
        </Link>

        {/* Diet tile */}
        <Link
          href="/client/nutrition"
          className="group rounded-xl border px-3 py-2.5 flex items-start gap-2.5 transition-colors hover:bg-white/[0.03]"
          style={{
            borderColor: 'rgba(125,211,255,0.18)',
            background: 'rgba(125,211,255,0.03)',
          }}
        >
          <Utensils
            size={16}
            style={{ color: '#7dd3ff', flexShrink: 0, marginTop: 2 }}
          />
          <div className="min-w-0 flex-1">
            <div
              className="font-mono uppercase tracking-[0.14em] font-bold"
              style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)' }}
            >
              Diet plan
            </div>
            <div
              className="font-display font-semibold mt-0.5"
              style={{ fontSize: 13, color: 'rgba(255,255,255,0.90)' }}
            >
              {hasDiet ? 'Active' : 'Not set yet'}
            </div>
            {hasDiet && freshness.dietUpdatedAt && (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)' }}>
                Updated {formatRelative(freshness.dietUpdatedAt)}
              </div>
            )}
          </div>
          <ArrowRight
            size={13}
            style={{
              color: 'rgba(255,255,255,0.30)',
              flexShrink: 0,
              marginTop: 4,
            }}
            className="group-hover:translate-x-0.5 transition-transform"
          />
        </Link>
      </div>
    </section>
  );
}

/** "5 min ago" / "3 h ago" / "2 d ago". Same helper as MealPlanCard
 *  — duplicated here to keep the component bundle-independent and avoid
 *  importing a client-only utils file from a server component path. */
function formatRelative(iso: string): string {
  const t = new Date(iso).getTime();
  if (isNaN(t)) return '';
  const diffMs = Date.now() - t;
  const min = Math.round(diffMs / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} h ago`;
  const days = Math.round(hr / 24);
  if (days < 14) return `${days} d ago`;
  return new Date(iso).toLocaleDateString();
}
