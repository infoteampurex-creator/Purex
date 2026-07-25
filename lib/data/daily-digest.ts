import type { DailyInputs } from './twin';

/**
 * Rule-based daily coach message shown at the top of the client
 * dashboard. Whoop / Fitbit both open with a personalised sentence
 * or two — reads as "the app knows you," which is the single biggest
 * emotional hook on a demo.
 *
 * Rule-based rather than LLM-driven because:
 *   - Zero latency: renders on the initial dashboard SSR pass.
 *   - Zero cost: no per-request LLM spend.
 *   - Zero failure surface: no rate-limit / timeout / hallucination.
 *   - Fully deterministic: same inputs, same message. Easy to reason
 *     about + easy to iterate copy on.
 *
 * When a client has richer history (30-day trends, coach-set goals,
 * HR variability), we can layer a Claude Haiku call on top as a
 * "richer coaching insight" second line. Out of scope for v1.
 */

export interface DigestInputs {
  firstName: string;
  todayIso: string;
  yesterday: DailyInputs | null;
  currentStreakDays: number;
  todayWorkoutCompleted: boolean;
  hasAnyData: boolean;
}

export interface DailyDigest {
  greeting: string;
  observation: string;
  callToAction: string;
  tone: 'warm' | 'push' | 'celebrate' | 'recover';
}

function timeOfDayGreeting(isoDate: string, name: string): string {
  // Prefer local Asia/Kolkata for the india-centric roster — falls
  // back to UTC gracefully if Intl doesn't have the tz.
  const now = new Date();
  let hour = now.getHours();
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      hour12: false,
    }).formatToParts(now);
    const h = parts.find((p) => p.type === 'hour')?.value;
    if (h) hour = Number(h);
  } catch {
    // ignore — use local hour
  }
  const time =
    hour < 5
      ? 'Late night'
      : hour < 12
      ? 'Good morning'
      : hour < 17
      ? 'Good afternoon'
      : hour < 21
      ? 'Good evening'
      : 'Evening';
  void isoDate;
  return `${time}, ${name}.`;
}

export function buildDailyDigest(inputs: DigestInputs): DailyDigest {
  const {
    firstName,
    todayIso,
    yesterday,
    currentStreakDays,
    todayWorkoutCompleted,
    hasAnyData,
  } = inputs;

  const greeting = timeOfDayGreeting(todayIso, firstName || 'there');

  // ─── Empty-account path — warm invitation ─────────────────────
  if (!hasAnyData) {
    return {
      greeting,
      observation:
        'A fresh start. Every day you log builds the picture your coaches use to guide you.',
      callToAction: 'Log your first meal or steps to unlock your PureX Score.',
      tone: 'warm',
    };
  }

  // ─── Streak celebration ───────────────────────────────────────
  if (currentStreakDays >= 7 && !todayWorkoutCompleted) {
    return {
      greeting,
      observation: `${currentStreakDays} days on the streak. That consistency is showing.`,
      callToAction:
        "Today's plan is waiting. Keep the streak alive — even a short session counts.",
      tone: 'celebrate',
    };
  }
  if (currentStreakDays >= 14) {
    return {
      greeting,
      observation: `Two-plus weeks of consistent logging. Your body is rewiring itself for this.`,
      callToAction:
        'Ride the momentum — today is a chance to lift your baseline.',
      tone: 'celebrate',
    };
  }

  // ─── Sleep-driven recovery message ────────────────────────────
  if (yesterday) {
    const sleepHours = yesterday.sleepMinutes / 60;
    const sleepGoalHours = yesterday.sleepGoalMinutes / 60;
    if (sleepHours > 0 && sleepHours < sleepGoalHours - 1.5) {
      return {
        greeting,
        observation: `You slept ${sleepHours.toFixed(1)}h last night — well below your ${sleepGoalHours.toFixed(0)}h target.`,
        callToAction:
          'Ease into today. A lighter session or an extra walk is worth more than pushing through.',
        tone: 'recover',
      };
    }
    if (sleepHours >= sleepGoalHours) {
      // Only mention it if the workout hasn't happened — otherwise it
      // feels retrospective on a productive day.
      if (!todayWorkoutCompleted) {
        return {
          greeting,
          observation: `Solid ${sleepHours.toFixed(1)}h of sleep last night. Recovery is on your side.`,
          callToAction:
            "Today's the day to push — you're primed for a strong session.",
          tone: 'push',
        };
      }
    }
  }

  // ─── Steps yesterday — nudge if low ───────────────────────────
  if (yesterday && yesterday.steps > 0) {
    const stepsPct = yesterday.steps / yesterday.stepsGoal;
    if (stepsPct < 0.5) {
      return {
        greeting,
        observation: `Yesterday's steps were ${yesterday.steps.toLocaleString()} — under half your ${yesterday.stepsGoal.toLocaleString()} goal.`,
        callToAction:
          'A 20-minute walk today would recover the balance. No need to sprint.',
        tone: 'push',
      };
    }
    if (stepsPct >= 1) {
      return {
        greeting,
        observation: `You hit ${yesterday.steps.toLocaleString()} steps yesterday — target cleared.`,
        callToAction: "Keep the rhythm going. Today's plan is queued below.",
        tone: 'celebrate',
      };
    }
  }

  // ─── Fallback — logged today, not much to say yet ─────────────
  return {
    greeting,
    observation:
      "You're building a rhythm. Each log makes the next day's coaching sharper.",
    callToAction: 'Open your Twin below to see how today reshapes your score.',
    tone: 'warm',
  };
}
