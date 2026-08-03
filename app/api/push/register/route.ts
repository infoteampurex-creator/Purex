import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import {
  upsertPushToken,
  type PushPlatform,
} from '@/lib/data/push-tokens';

/**
 * POST /api/push/register
 *
 * Called from the client app when the Capacitor push-notifications
 * plugin fires its `registration` event with a fresh FCM device
 * token. We upsert on token so a rotated token from the same device
 * doesn't create a stale duplicate.
 *
 * Body: { token: string, platform: 'android'|'ios'|'web', deviceLabel?: string }
 * Auth: session cookie — client must be signed in.
 */
export async function POST(req: Request) {
  try {
    const sb = await createSupabaseClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Not signed in.' }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as
      | { token?: string; platform?: string; deviceLabel?: string | null }
      | null;
    if (!body?.token || !body.platform) {
      return NextResponse.json(
        { ok: false, error: 'token and platform are required.' },
        { status: 400 }
      );
    }
    if (!isValidPlatform(body.platform)) {
      return NextResponse.json(
        { ok: false, error: 'platform must be android, ios, or web.' },
        { status: 400 }
      );
    }

    const result = await upsertPushToken(
      user.id,
      body.token,
      body.platform,
      body.deviceLabel ?? null
    );
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function isValidPlatform(p: string): p is PushPlatform {
  return p === 'android' || p === 'ios' || p === 'web';
}
