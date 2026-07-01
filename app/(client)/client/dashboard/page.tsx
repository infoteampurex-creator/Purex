import { WelcomeHeader } from '@/components/client/dashboard/WelcomeHeader';
import { PureXScoreHero } from '@/components/client/dashboard/PureXScoreHero';
import { DashboardTodayPanel } from '@/components/client/dashboard/DashboardTodayPanel';
import { HealthSyncCard } from '@/components/client/dashboard/HealthSyncCard';
import { TaskChecklist } from '@/components/client/dashboard/TaskChecklist';
import { TodaysPlanCard } from '@/components/client/dashboard/TodaysPlanCard';
import { TwinCloneTeaser } from '@/components/client/dashboard/TwinCloneTeaser';
import { computePureXScore } from '@/lib/data/purex-score';
import { getCurrentUserId, getClientTasksLive } from '@/lib/data/client-live';
import { getDailyPlan } from '@/lib/data/daily-plan';
import { EMPTY_DAILY_PLAN } from '@/lib/data/daily-plan-types';
import {
  EMPTY_NUTRITION_SNAPSHOT,
  type DailyInputs,
  type NutritionSnapshot,
  deriveTwinStats,
  deriveVisualState,
  twinOverallScore,
  dailyTwinMessage,
  computeCurrentStreak,
} from '@/lib/data/twin';
import { getTwinDailyInputs, getStreakHistory } from '@/lib/data/twin-server';
import { getTodaysMeals, type MealRow } from '@/lib/data/meals';
import { getDailyWeight, type DailyWeight } from '@/lib/data/daily-weight';
import {
  getLatestMeasurements,
  getProfileBodySettings,
  EMPTY_PROFILE_BODY_SETTINGS,
} from '@/lib/data/body-measurements';
import { deriveBodyProportions } from '@/lib/data/body-proportions';
import { avatarFor } from '@/lib/data/avatar-asset';

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Redesigned client dashboard (v2 — Whoop × Google Fit hybrid).
 *
 * What lives here:
 *   1. Greeting (small)
 *   2. PureX Score hero — big circular gauge, the ONE number the
 *      client should return to daily
 *   3. Today panel — 4 activity rings (Move / Fuel / Sleep / Water)
 *      + a single "Log today" button (weight / steps / sleep /
 *      water / meal in one picker)
 *   4. Today's workout plan
 *   5. Today's tasks
 *
 * Everything else lives in its dedicated bottom-nav route:
 *   • Mood / Smart Alerts / Twin → /client/twin
 *   • Healthy Streak → /client/progress
 *   • Plan from Coach banner → /client/plan
 *   • Commitment → /client/commitment
 *   • Health Connect auto-sync card → /client/health
 *
 * The dashboard is now genuinely a dashboard: a single page that
 * answers "how am I doing today, what's next" — not a content
 * shelf for the whole app.
 */
export default async function ClientDashboardPage({ searchParams }: PageProps) {
  const userId = await getCurrentUserId();
  const today = new Date().toISOString().slice(0, 10);

  // ?date=YYYY-MM-DD lets the client view (and log to) past days. Reject
  // anything that isn't a valid YYYY-MM-DD; default to today.
  const params = await searchParams;
  const requestedDate = params.date;
  const selectedDate =
    requestedDate && DATE_PATTERN.test(requestedDate) ? requestedDate : today;

  // ─── Data fetch (all parallel) ──────────────────────────────────
  let tasks: Awaited<ReturnType<typeof getClientTasksLive>>['rows'] = [];
  let dailyPlan = EMPTY_DAILY_PLAN;
  let twinInputs: DailyInputs = emptyTwinInputs();
  let streakHistory: Awaited<ReturnType<typeof getStreakHistory>> = [];
  let nutritionSnapshot: NutritionSnapshot = EMPTY_NUTRITION_SNAPSHOT;
  let todaysMeals: MealRow[] = [];
  let dailyWeight: DailyWeight = {
    todayKg: null,
    previousKg: null,
    previousDate: null,
  };

  let latestMeas: Awaited<ReturnType<typeof getLatestMeasurements>> = null;
  let bodySettings = EMPTY_PROFILE_BODY_SETTINGS;

  if (userId) {
    const [
      tasksRes,
      plan,
      inputsResult,
      history,
      meals,
      weight,
      meas,
      bodyProfile,
    ] = await Promise.all([
      getClientTasksLive(userId, selectedDate),
      getDailyPlan(userId, selectedDate),
      getTwinDailyInputs(userId, today),
      getStreakHistory(userId, 7),
      getTodaysMeals(userId, today),
      getDailyWeight(userId, today),
      getLatestMeasurements(userId),
      getProfileBodySettings(userId),
    ]);
    tasks = tasksRes.source === 'supabase' ? tasksRes.rows : [];
    dailyPlan = plan;
    twinInputs = inputsResult.inputs;
    streakHistory = history;
    nutritionSnapshot = inputsResult.nutrition;
    todaysMeals = meals;
    dailyWeight = weight;
    latestMeas = meas;
    bodySettings = bodyProfile;
  }

  // Twin teaser data — small derived block, no DB hits beyond the
  // ones already in the Promise.all above.
  const twinStats = deriveTwinStats(twinInputs);
  const twinState = deriveVisualState(twinStats, twinInputs.workoutCompletedToday);
  const twinOverall = twinOverallScore(twinStats);
  const twinMessage = dailyTwinMessage(twinState, today);
  const proportions = deriveBodyProportions(
    latestMeas,
    bodySettings.heightCm,
    bodySettings.gender
  );
  const avatarSrc = avatarFor(bodySettings.gender, proportions.bodyType);

  const currentStreakDays = computeCurrentStreak(streakHistory);
  const pureXScore = computePureXScore(twinInputs, currentStreakDays);
  const pureXScoreEmpty = !userId || pureXScore.isEmpty;

  // 7-day delta for the hero trend chip. Average over days that have
  // ANY data (avoids burying a real number under days the client
  // didn't open the app).
  const recentScored = streakHistory.filter((h) => h.hasData);
  const weeklyAvg =
    recentScored.length > 0
      ? recentScored.reduce((s, h) => s + h.score, 0) / recentScored.length
      : null;
  const weeklyDelta = weeklyAvg == null ? null : pureXScore.total - weeklyAvg;

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Greeting (small, identity) */}
      <WelcomeHeader />

      {/* Hero — single colossal score gauge */}
      <PureXScoreHero
        score={pureXScore}
        weeklyDelta={weeklyDelta}
        showPreview={pureXScoreEmpty}
      />

      {/* Health Connect auto-sync banner — app-only (renders null on
          web). When the user hasn't connected yet it surfaces a
          "Connect Health Connect" CTA so the rings below populate
          automatically from the phone's step / sleep / water sensors
          instead of forcing manual logging. */}
      <HealthSyncCard />

      {/* 4 activity rings + unified Log button. All log surfaces
          (weight / steps / sleep / water / meal) live behind ONE
          tap from here, replacing the old DailyWeightCard +
          AppFitnessTiles + scattered chips. */}
      <DashboardTodayPanel
        inputs={twinInputs}
        nutrition={nutritionSnapshot}
        todaysMeals={todaysMeals}
        todaysWeightKg={dailyWeight.todayKg}
      />

      {/* Twin + Future Clone teaser — brings the gamified avatar
          "feel" back to the dashboard without dragging the full
          200+-line TwinSection into the home view. Tap → drills
          into /client/twin (full immersive page) or /client/future-clone. */}
      {userId && (
        <TwinCloneTeaser
          avatarSrc={avatarSrc}
          state={twinState}
          overall={twinOverall}
          message={twinMessage}
        />
      )}

      {/* Today's workout — full plan card. */}
      {userId && (
        <TodaysPlanCard
          plan={dailyPlan}
          selectedDate={selectedDate}
          today={today}
        />
      )}

      {/* Today's tasks — coach-assigned checklist. */}
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
