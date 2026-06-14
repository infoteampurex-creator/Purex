import { WelcomeHeader } from '@/components/client/dashboard/WelcomeHeader';
import { AppFitnessTiles } from '@/components/client/dashboard/AppFitnessTiles';
import { HealthSyncCard } from '@/components/client/dashboard/HealthSyncCard';
import { PlanFromCoachBanner } from '@/components/client/dashboard/PlanFromCoachBanner';
import { getCoachPlanFreshness } from '@/lib/data/plan-updates-server';
// AdminSwitcher removed — middleware now redirects admins away from
// /client/* entirely, so the "Switch to admin panel" banner can never
// render. Coaches use /admin for everything; they preview client data
// from the client-detail page, not by visiting /client routes.
import { CommitmentWidget } from '@/components/client/CommitmentWidget';
import { TaskChecklist } from '@/components/client/dashboard/TaskChecklist';
import { TodaysPlanCard } from '@/components/client/dashboard/TodaysPlanCard';
import { TwinSection } from '@/components/client/twin/TwinSection';
import { HealthyStreakCard } from '@/components/client/twin/HealthyStreakCard';
import { PureXScoreCard } from '@/components/client/dashboard/PureXScoreCard';
import { computePureXScore } from '@/lib/data/purex-score';
import { MoodCheckInCard } from '@/components/client/dashboard/MoodCheckInCard';
import type { MoodState } from '@/lib/data/mood';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { SmartAlertsCard } from '@/components/client/dashboard/SmartAlertsCard';
import { computeSmartAlerts } from '@/lib/data/smart-alerts';
import { getMockClientPact } from '@/lib/data/commitment';
import { getCurrentUserId, getClientTasksLive } from '@/lib/data/client-live';
import { getDailyPlan } from '@/lib/data/daily-plan';
import { EMPTY_DAILY_PLAN } from '@/lib/data/daily-plan-types';
import {
  computeHealthScore,
  computeCurrentStreak,
  deriveTwinStats,
  deriveVisualState,
  dailyTwinMessage,
  EMPTY_NUTRITION_SNAPSHOT,
  type DailyInputs,
  type NutritionSnapshot,
} from '@/lib/data/twin';
import {
  deriveLevel,
  deriveXp,
  generateMission,
} from '@/lib/data/twin-game';
import { getTwinDailyInputs, getStreakHistory } from '@/lib/data/twin-server';
import { getTodaysMeals, type MealRow } from '@/lib/data/meals';
import {
  getLatestMeasurements,
  getProfileBodySettings,
  EMPTY_PROFILE_BODY_SETTINGS,
  type BodyMeasurements,
  type ProfileBodySettings,
} from '@/lib/data/body-measurements';
import {
  deriveBodyProportions,
  type BodyProportions,
} from '@/lib/data/body-proportions';

// Bump serverless timeout — the dashboard can host health-report
// uploads via HealthPassportCard, and Gemini extraction runs inline
// inside the upload action. 60s gives multi-page PDFs room to finish.
export const maxDuration = 60;

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default async function ClientDashboardPage({ searchParams }: PageProps) {
  const pact = getMockClientPact();

  const userId = await getCurrentUserId();
  const today = new Date().toISOString().slice(0, 10);

  // ?date=YYYY-MM-DD lets the client view (and log to) past days. Reject
  // anything that isn't a valid YYYY-MM-DD; default to today.
  const params = await searchParams;
  const requestedDate = params.date;
  const selectedDate =
    requestedDate && DATE_PATTERN.test(requestedDate) ? requestedDate : today;

  // ─── All dashboard queries kick off in parallel ───────────────────
  // Previously this page ran TWO sequential Promise.all blocks: the
  // page only started fetching twin/meals/measurements/mood AFTER the
  // tasks/plan/freshness round-trip resolved. Two waves = double the
  // network latency. Now they all fire as one Promise.all so the slowest
  // single query bounds the total wait time, not the sum of two waves.
  let tasks: Awaited<ReturnType<typeof getClientTasksLive>>['rows'] = [];
  let dailyPlan = EMPTY_DAILY_PLAN;
  let coachPlanFreshness: Awaited<
    ReturnType<typeof getCoachPlanFreshness>
  > = {
    scheduleUpdatedAt: null,
    dietUpdatedAt: null,
    upcomingWorkouts: 0,
    nextWorkoutDate: null,
  };

  // Twin + Future Clone + Healthy Streak (Phase 4 — live data).
  // Pull real inputs from client_daily_logs + client_workouts. When the
  // client has no logs yet we fall through to deterministic empty
  // inputs so the Twin renders in 'depleted' state.
  let twinInputs: DailyInputs = emptyTwinInputs();
  let streakHistory: Awaited<ReturnType<typeof getStreakHistory>> = [];
  let nutritionSnapshot: NutritionSnapshot = EMPTY_NUTRITION_SNAPSHOT;
  let todaysMeals: MealRow[] = [];
  let latestMeasurements: BodyMeasurements | null = null;
  let bodySettings: ProfileBodySettings = EMPTY_PROFILE_BODY_SETTINGS;
  let todaysMood: MoodState | null = null;

  if (userId) {
    const [
      tasksRes,
      plan,
      freshness,
      inputsResult,
      history,
      meals,
      meas,
      bodyProfile,
      moodRow,
    ] = await Promise.all([
      getClientTasksLive(userId, selectedDate),
      getDailyPlan(userId, selectedDate),
      getCoachPlanFreshness(userId),
      getTwinDailyInputs(userId, today),
      getStreakHistory(userId, 7),
      getTodaysMeals(userId, today),
      getLatestMeasurements(userId),
      getProfileBodySettings(userId),
      // Fetch today's mood_state directly from client_daily_logs —
      // small enough query that adding it to getTwinDailyInputs would
      // bloat that function's selected columns. Returns null if no
      // log row yet OR mood not set.
      (async () => {
        const sb = await createSupabaseClient();
        const { data } = await sb
          .from('client_daily_logs')
          .select('mood_state')
          .eq('client_id', userId)
          .eq('log_date', today)
          .maybeSingle();
        return (data?.mood_state ?? null) as MoodState | null;
      })(),
    ]);
    tasks = tasksRes.source === 'supabase' ? tasksRes.rows : [];
    dailyPlan = plan;
    coachPlanFreshness = freshness;
    twinInputs = inputsResult.inputs;
    streakHistory = history;
    nutritionSnapshot = inputsResult.nutrition;
    todaysMeals = meals;
    latestMeasurements = meas;
    bodySettings = bodyProfile;
    todaysMood = moodRow;
  }
  const twinStats = deriveTwinStats(twinInputs);
  const twinState = deriveVisualState(twinStats, twinInputs.workoutCompletedToday);
  const twinMessage = dailyTwinMessage(twinState, today);
  const todayScore = computeHealthScore({
    steps: twinInputs.steps,
    stepsGoal: twinInputs.stepsGoal,
    sleepMinutes: twinInputs.sleepMinutes,
    sleepGoalMinutes: twinInputs.sleepGoalMinutes,
    waterMl: twinInputs.waterMl,
    waterGoalMl: twinInputs.waterGoalMl,
    workoutCompletedToday: twinInputs.workoutCompletedToday,
    nutritionAdherencePct: twinInputs.nutritionAdherencePct,
  }).total;

  // ─── Phase 2 — derive live body proportions for the avatar ───
  const proportions: BodyProportions | null = userId
    ? deriveBodyProportions(latestMeasurements, bodySettings.heightCm, bodySettings.gender)
    : null;
  const hasMeasurements = latestMeasurements != null;

  // ─── Gamification overlays (XP / Level / Mission) ───
  // XP is derived from the sum of daily health scores in the history
  // window — no DB changes. Levels are linear (500 XP each).
  const xp = deriveXp(streakHistory);
  const level = deriveLevel(xp);
  const currentStreakDays = computeCurrentStreak(streakHistory);
  const mission = generateMission(twinInputs, currentStreakDays);

  // ─── PureX Score — master daily metric (today's input-derived).
  // Sits at the top of the dashboard so the first thing the user
  // sees is their current standing. Shown on both web AND app; the
  // breakdown sheet works in either surface.
  const pureXScore = computePureXScore(twinInputs, currentStreakDays);
  const pureXScoreEmpty = !userId || pureXScore.isEmpty;

  // ─── Smart Alerts — derived from current inputs + recent history.
  // Server-side compute so the dashboard initial render already has
  // the alerts (no client-side flash). currentHour uses IST since
  // the existing twin-server already keys off IST today.
  const recentScores = streakHistory
    .filter((h) => h.hasData)
    .map((h) => h.score)
    .reverse(); // oldest → newest for trend math
  const smartAlerts = userId
    ? computeSmartAlerts({
        inputs: twinInputs,
        recentScores,
        workouts7d: twinInputs.workoutsLast7,
        moodToday: todaysMood,
        currentHour: new Date().getHours(),
      })
    : [];

  return (
    <div className="space-y-6 md:space-y-7">
      <WelcomeHeader />

      {/* ─── PureX Score (hero) — single 0-100 number with breakdown
          sheet on tap. Placed above all the raw-input cards because
          this is the metric the user *should* return to daily. */}
      <PureXScoreCard score={pureXScore} showPreview={pureXScoreEmpty} />

      {/* ─── Plan from coach — surfaces "Schedule / Diet updated Xh
          ago" + upcoming-workout count. Auto-hides when nothing is
          set yet. Also our first-line debug signal when a client
          reports "I can't see my workouts." */}
      {userId && <PlanFromCoachBanner freshness={coachPlanFreshness} />}

      {/* ─── Morning Mood Check-In — 8-chip "how is your body today?"
          prompt. Sits just below PureX Score because it's a daily
          ritual: open dashboard → see score → log mood → see
          recommendation. Only shown when signed in (no point on a
          signed-out preview). */}
      {userId && <MoodCheckInCard current={todaysMood} />}

      {/* ─── Smart Alerts — context-aware nudges (dehydration, low
          sleep, missed workout, streak save, etc). Computed server-
          side from current inputs + recent history so the first
          render already has the alerts (no client-side flash).
          Only shown when there's at least one active alert. */}
      {userId && smartAlerts.length > 0 && (
        <SmartAlertsCard alerts={smartAlerts} />
      )}

      {/* Health Connect auto-sync card — app-only (returns null on
          web, and dynamic-imported so the plugin's JS never lands in
          the web bundle). Handles install / connect / sync flows and
          pushes readings to client_daily_logs server-side. */}
      <HealthSyncCard />

      {/* Raw fitness numbers — app-only (renders null on web). Sits
          near the top so steps/sleep/water/nutrition are the first
          thing visible after the greeting. */}
      <AppFitnessTiles
        inputs={twinInputs}
        nutrition={nutritionSnapshot}
        todaysMeals={todaysMeals}
      />

      {/* BodyMeasurementsCard moved to /client/health — single source
          of truth for body data. Still imported here only because it
          drives twinProportions for the TwinSection below. */}

      {userId && (
        <TodaysPlanCard
          plan={dailyPlan}
          selectedDate={selectedDate}
          today={today}
        />
      )}

      {/* Healthy Streak — current/best/today + 7-day calendar */}
      <HealthyStreakCard
        history={streakHistory}
        todayScore={todayScore}
      />

      {/* PureX Twin + Future Clone — APP-ONLY. Web visitors see
          nothing here (no silhouette, no skeleton) — by product
          decision the premium gamified body twin is reserved for the
          mobile app surface. */}
      <TwinSection
        stats={twinStats}
        state={twinState}
        message={twinMessage}
        level={level}
        streakDays={currentStreakDays}
        mission={mission}
        workoutDoneToday={twinInputs.workoutCompletedToday}
        proportions={proportions}
        hasMeasurements={hasMeasurements}
        gender={bodySettings.gender}
      />

      <CommitmentWidget pact={pact} />

      {/* HealthPassportCard + BodyMeasurementsCard moved to
          /client/health (Health tab in bottom nav). The dashboard
          now stays focused on "today's actions" while Health is
          "your body's data." */}

      {/* ScoreWidget removed — PureXScoreCard at the top of the
          dashboard now serves as the single hero score. Keeping both
          was redundant (two big-number cards on one screen) and the
          old widget's "Your score will appear here" empty state was
          confusing once the new one was present. */}

      <TaskChecklist tasks={tasks} />
    </div>
  );
}

function emptyTwinInputs(): DailyInputs {
  return {
    steps: 0,
    stepsGoal: 10000,
    sleepMinutes: 0,
    sleepGoalMinutes: 8 * 60,
    waterMl: 0,
    waterGoalMl: 8 * 250,
    workoutCompletedToday: false,
    workoutsLast7: 0,
    nutritionAdherencePct: 0,
    currentStreak: 0,
    bestStreak: 0,
  };
}
