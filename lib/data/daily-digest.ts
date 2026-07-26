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

  // Every branch below returns an insight-style callToAction —
  // specific, data-referencing, actionable — rather than a
  // self-referential "Open your Twin" CTA. The DailyDigest UI
  // component labels the whole card as "AI Coach Insight" so users
  // read the message as coaching, not navigation.

  // ─── Empty-account path — warm invitation ─────────────────────
  if (!hasAnyData) {
    return {
      greeting,
      observation:
        'Baseline mode. Your first three logs unlock personalised insights: which habits move your score most, when to push, when to rest.',
      callToAction:
        'Start with any one: log a meal, this morning\'s steps, or last night\'s sleep.',
      tone: 'warm',
    };
  }

  // ─── Streak celebration ───────────────────────────────────────
  if (currentStreakDays >= 14) {
    return {
      greeting,
      observation: `Signal: ${currentStreakDays} straight days of consistency. Your endurance vector should be climbing — check the Progress tab for the shift.`,
      callToAction:
        'Ride the momentum. Today is a chance to lift your baseline, not just maintain.',
      tone: 'celebrate',
    };
  }
  if (currentStreakDays >= 7 && !todayWorkoutCompleted) {
    return {
      greeting,
      observation: `${currentStreakDays} days on the streak — the discipline is compounding.`,
      callToAction:
        'Keep the streak alive today. Even a short session counts as a full input.',
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
        observation: `Sleep flag: ${sleepHours.toFixed(1)}h last night — ${(sleepGoalHours - sleepHours).toFixed(1)}h under your target. Recovery score will read low today.`,
        callToAction:
          'Ease in. A lighter session or an extra walk beats pushing through a deficit.',
        tone: 'recover',
      };
    }
    if (sleepHours >= sleepGoalHours) {
      // Only mention it if the workout hasn't happened — otherwise it
      // feels retrospective on a productive day.
      if (!todayWorkoutCompleted) {
        return {
          greeting,
          observation: `${sleepHours.toFixed(1)}h of sleep last night — recovery is on your side. Nervous system is primed.`,
          callToAction:
            "Today's the day to push. Load progression should feel earned, not forced.",
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
        observation: `Movement flag: ${yesterday.steps.toLocaleString()} steps yesterday, ${Math.round(stepsPct * 100)}% of goal. Cardio load is trending soft this week.`,
        callToAction:
          'A 20-minute walk today recovers the balance. Small, consistent inputs beat sprints.',
        tone: 'push',
      };
    }
    if (stepsPct >= 1) {
      return {
        greeting,
        observation: `${yesterday.steps.toLocaleString()} steps yesterday — target cleared. Endurance vector is trending up.`,
        callToAction: 'Keep the rhythm going. Today\'s plan is queued below.',
        tone: 'celebrate',
      };
    }
  }

  // ─── Fallback — logged today, not much to say yet ─────────────
  return {
    greeting,
    observation:
      "You're building a rhythm. Two or three more days of logs and I'll surface specific trends — which habits move your score, which don't.",
    callToAction:
      'Log this morning\'s inputs when you can — steps, sleep, water, or your first meal.',
    tone: 'warm',
  };
}
