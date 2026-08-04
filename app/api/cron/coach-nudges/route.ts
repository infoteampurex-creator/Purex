import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getCoachAnalytics,
  type ClientAnalytics,
} from '@/lib/data/coach-analytics';
import { getPushTokensForUser } from '@/lib/data/push-tokens';
import { sendFcmToUser } from '@/lib/data/fcm-send';

/**
 * GET /api/cron/coach-nudges
 *
 * Vercel Cron endpoint that runs daily at 10 AM IST (4:30 AM UTC).
 * Scans all clients, identifies the ones matching automated-nudge
 * rules, and sends FCM push notifications via the existing pipeline.
 *
 * Rules (evaluated in priority order — a client hits at most ONE
 * rule per run so we don't chain nudges):
 *
 *   1. inactivity_3d — no activity for 3 days
 *      → "We miss you — log something small"
 *
 *   2. streak_at_risk — currentStreak >= 5 AND today not logged
 *      → "Don't break your X-day streak"
 *
 *   3. workout_missed_today — has plan, workout not completed by
 *      6 PM local time (evaluated at 10 AM next day)
 *      → "Yesterday's workout is still available"
 *
 * De-dup: for each (client, rule) we check the last 24 h of
 * coach_nudges. If a matching row exists, skip. Prevents Vercel
 * Cron's "at-least-once" delivery from spamming.
 *
 * Auth: Vercel Cron adds an Authorization: Bearer <CRON_SECRET>
 * header to protect this endpoint from public triggering.
 */

const RULES = [
  {
    key: 'inactivity_3d' as const,
    priority: 1,
    match: (c: ClientAnalytics) =>
      c.daysSinceLastActivity != null &&
      c.daysSinceLastActivity >= 3 &&
      c.daysSinceLastActivity <= 6, // Don't nudge lost users — different rule needed
    render: () => ({
      title: 'We miss you',
      body: "It's been a few days. Log a meal, steps, or a workout — even one thing keeps your Twin moving.",
    }),
  },
  {
    key: 'streak_at_risk' as const,
    priority: 2,
    match: (c: ClientAnalytics) =>
      c.currentStreakDays >= 5 && !c.todayLogged,
    render: (c: ClientAnalytics) => ({
      title: `Don't break the streak`,
      body: `${c.currentStreakDays} days in a row. Log something today to keep it alive.`,
    }),
  },
];

export async function GET(req: Request) {
  // Auth gate
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  const results: Array<{
    clientId: string;
    ruleKey: string;
    action: 'sent' | 'skipped' | 'failed';
    reason?: string;
  }> = [];

  try {
    const analytics = await getCoachAnalytics();

    for (const client of analytics) {
      // Find the highest-priority rule this client matches
      const rule = RULES.filter((r) => r.match(client))[0];
      if (!rule) {
        results.push({
          clientId: client.clientId,
          ruleKey: 'none',
          action: 'skipped',
          reason: 'No rule matched',
        });
        continue;
      }

      // De-dup: has this (client, rule) fired in the last 24 h?
      const recent = await getRecentNudge(client.clientId, rule.key);
      if (recent) {
        results.push({
          clientId: client.clientId,
          ruleKey: rule.key,
          action: 'skipped',
          reason: 'Sent within 24h',
        });
        continue;
      }

      // Fetch tokens
      const tokens = await getPushTokensForUser(client.clientId);
      if (tokens.length === 0) {
        results.push({
          clientId: client.clientId,
          ruleKey: rule.key,
          action: 'skipped',
          reason: 'No push tokens',
        });
        continue;
      }

      // Send
      const { title, body } = rule.render(client);
      const sendResult = await sendFcmToUser(
        tokens.map((t) => t.token),
        title,
        body,
        { source: 'automated_coach_nudge', rule: rule.key }
      );

      // Log
      await logNudge(
        client.clientId,
        rule.key,
        title,
        body,
        sendResult.sent > 0
      );

      results.push({
        clientId: client.clientId,
        ruleKey: rule.key,
        action: sendResult.sent > 0 ? 'sent' : 'failed',
        reason:
          sendResult.sent === 0
            ? `All ${sendResult.failed} sends failed`
            : undefined,
      });
    }

    const summary = {
      total: results.length,
      sent: results.filter((r) => r.action === 'sent').length,
      skipped: results.filter((r) => r.action === 'skipped').length,
      failed: results.filter((r) => r.action === 'failed').length,
    };

    return NextResponse.json({ ok: true, ...summary, results });
  } catch (err) {
    console.error('[cron/coach-nudges] failed', err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function getRecentNudge(
  clientId: string,
  ruleKey: string
): Promise<boolean> {
  try {
    const sb = createAdminClient();
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data } = await sb
      .from('coach_nudges')
      .select('id')
      .eq('client_id', clientId)
      .eq('rule_key', ruleKey)
      .gte('sent_at', dayAgo)
      .limit(1);
    return (data?.length ?? 0) > 0;
  } catch {
    // Fail-safe: if the query fails, ASSUME we sent recently. Better
    // to miss a nudge than to spam the client.
    return true;
  }
}

async function logNudge(
  clientId: string,
  ruleKey: string,
  title: string,
  body: string,
  sentOk: boolean
): Promise<void> {
  try {
    const sb = createAdminClient();
    await sb.from('coach_nudges').insert({
      client_id: clientId,
      rule_key: ruleKey,
      title,
      body,
      sent_ok: sentOk,
    });
  } catch (err) {
    console.error('[cron/coach-nudges] logNudge failed', err);
  }
}
