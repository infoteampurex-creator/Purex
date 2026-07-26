/**
 * Claude Haiku 4.5 enhancement layer for the Daily Digest.
 *
 * The rule-based buildDailyDigest() runs first (deterministic, zero-
 * latency, always renders). This layer takes that digest + the user's
 * signals and rewrites the observation + callToAction as a real
 * AI-generated coach message — referencing the user by first name,
 * calling out concrete patterns the rules missed, and offering a
 * specific action.
 *
 * Design constraints:
 *
 *   1. Called from server components on the golden dashboard path.
 *      Must never block > ~3 s or the initial dashboard render
 *      stalls. Hard-timeout on the API call and fall back to the
 *      rule-based digest on ANY error.
 *
 *   2. Caches per user per day. Same signals → same insight for the
 *      whole day. Currently in-memory (per Node process); when we
 *      have multiple app instances we can promote to Supabase.
 *
 *   3. No PII in the prompt beyond first name + already-shared
 *      fitness data. Never send full profile / email / phone /
 *      address to the LLM.
 *
 *   4. Feature-gated by ANTHROPIC_API_KEY env var. When it's missing
 *      (local dev without the key, or a deploy that hasn't been
 *      configured yet) we quietly return the rule-based digest.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { DailyDigest } from './daily-digest';

export interface AiDigestInputs {
  firstName: string;
  todayIso: string;
  currentStreakDays: number;
  todayWorkoutCompleted: boolean;
  hasAnyData: boolean;
  yesterdaySteps: number | null;
  yesterdayStepsGoal: number | null;
  yesterdaySleepHours: number | null;
  yesterdaySleepGoalHours: number | null;
  weeklyAvgScore: number | null;
  pureXScore: number | null;
}

const CACHE = new Map<string, { digest: DailyDigest; expiresAt: number }>();
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const LLM_TIMEOUT_MS = 3500;

/**
 * Enhance a rule-based digest with a Claude-generated observation +
 * callToAction. On any failure — missing API key, timeout, refusal,
 * schema mismatch — returns the input digest unchanged so the
 * dashboard always has something to show.
 */
export async function enhanceDigestWithClaude(
  ruleDigest: DailyDigest,
  inputs: AiDigestInputs,
  userId: string
): Promise<DailyDigest> {
  if (!process.env.ANTHROPIC_API_KEY) return ruleDigest;

  const cacheKey = `${userId}:${inputs.todayIso}`;
  const cached = CACHE.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.digest;

  try {
    const enhanced = await Promise.race([
      generateInsight(ruleDigest, inputs),
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), LLM_TIMEOUT_MS)
      ),
    ]);

    if (!enhanced) return ruleDigest;

    CACHE.set(cacheKey, {
      digest: enhanced,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    // Occasional cache cleanup — cheap and prevents Map growing
    // unbounded on a long-running process.
    if (CACHE.size > 500) {
      const now = Date.now();
      for (const [k, v] of CACHE.entries()) {
        if (v.expiresAt < now) CACHE.delete(k);
      }
    }

    return enhanced;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[daily-digest-ai] enhancement failed, using rule-based', err);
    return ruleDigest;
  }
}

async function generateInsight(
  ruleDigest: DailyDigest,
  inputs: AiDigestInputs
): Promise<DailyDigest | null> {
  const client = new Anthropic();

  const contextLines: string[] = [];
  contextLines.push(`- Client's first name: ${inputs.firstName}`);
  contextLines.push(`- Today (ISO): ${inputs.todayIso}`);
  contextLines.push(
    `- Current logging streak: ${inputs.currentStreakDays} day(s)`
  );
  contextLines.push(
    `- Today's workout completed: ${inputs.todayWorkoutCompleted ? 'yes' : 'not yet'}`
  );
  contextLines.push(
    `- Has any logged data at all: ${inputs.hasAnyData ? 'yes' : 'no (fresh account)'}`
  );
  if (inputs.yesterdaySteps != null && inputs.yesterdayStepsGoal != null) {
    const pct = Math.round(
      (inputs.yesterdaySteps / Math.max(1, inputs.yesterdayStepsGoal)) * 100
    );
    contextLines.push(
      `- Yesterday's steps: ${inputs.yesterdaySteps.toLocaleString()} / ${inputs.yesterdayStepsGoal.toLocaleString()} (${pct}%)`
    );
  }
  if (
    inputs.yesterdaySleepHours != null &&
    inputs.yesterdaySleepGoalHours != null
  ) {
    contextLines.push(
      `- Yesterday's sleep: ${inputs.yesterdaySleepHours.toFixed(1)}h / ${inputs.yesterdaySleepGoalHours.toFixed(0)}h target`
    );
  }
  if (inputs.pureXScore != null) {
    contextLines.push(`- Today's PureX Score: ${inputs.pureXScore}/100`);
  }
  if (inputs.weeklyAvgScore != null) {
    contextLines.push(
      `- 7-day avg PureX Score: ${inputs.weeklyAvgScore.toFixed(1)}/100`
    );
  }

  const systemPrompt = `You are the Team Purex AI coach. Team Purex is a hybrid coaching platform where a real trainer, doctor, physiotherapist, and mental-health specialist work from one plan for each client. Your voice is warm but data-driven — you reference concrete signals, not vague feelings.

Write ONE morning coach insight for the client, in two parts:

1. observation (~1 sentence, max ~25 words): a specific, data-referencing note about where the client is right now. Prefer concrete numbers ("your endurance vector climbed 6% this week", "sleep was 1.8h under target last night") over generic warmth. If no data is available, acknowledge the fresh start.

2. callToAction (~1 sentence, max ~20 words): ONE specific action for today. Prefixed by "→" is not required — just the action text. No "check your Twin below" self-referential CTAs; instead, coach the user directly.

Match the tone to the situation:
- warm: baseline / low data / gentle
- push: primed for effort / low activity yesterday
- celebrate: streak / target hit / momentum
- recover: low sleep / recovery needed

Never invent data. If you don't have a specific number, don't fabricate one. Never mention the tone name in the output.`;

  const userPrompt = `Client signals:
${contextLines.join('\n')}

Fallback observation (from rule-based system) — you may improve on it or replace it entirely:
"${ruleDigest.observation}"

Fallback CTA:
"${ruleDigest.callToAction}"

Produce a personalised morning insight for ${inputs.firstName}. Use their first name at most once. Speak directly to them ("you").`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 400,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
    output_config: {
      format: {
        type: 'json_schema',
        schema: {
          type: 'object',
          properties: {
            observation: {
              type: 'string',
              description:
                'One-sentence data-referencing morning observation for the client.',
            },
            callToAction: {
              type: 'string',
              description:
                'One-sentence specific action for today. No self-referential CTAs.',
            },
            tone: {
              type: 'string',
              enum: ['warm', 'push', 'celebrate', 'recover'],
              description: 'Emotional tone that best matches the message.',
            },
          },
          required: ['observation', 'callToAction', 'tone'],
          additionalProperties: false,
        },
      },
    },
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') return null;

  const parsed = safeJsonParse(textBlock.text);
  if (!parsed) return null;
  if (
    typeof parsed.observation !== 'string' ||
    typeof parsed.callToAction !== 'string' ||
    !isValidTone(parsed.tone)
  ) {
    return null;
  }

  return {
    greeting: ruleDigest.greeting,
    observation: parsed.observation.trim(),
    callToAction: parsed.callToAction.trim(),
    tone: parsed.tone,
  };
}

function safeJsonParse(s: string): Record<string, unknown> | null {
  try {
    const val = JSON.parse(s);
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return val as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function isValidTone(v: unknown): v is DailyDigest['tone'] {
  return v === 'warm' || v === 'push' || v === 'celebrate' || v === 'recover';
}
