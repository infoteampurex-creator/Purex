import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { getPushTokensForUser } from '@/lib/data/push-tokens';
import { sendFcmToUser } from '@/lib/data/fcm-send';

/**
 * POST /api/admin/push/send
 *
 * Admin-only route. Sends an FCM push notification to every device
 * registered for the target client.
 *
 * Body: { clientId: string, title: string, body: string,
 *         data?: Record<string,string> }
 * Auth: session cookie + profiles.role === 'admin' | 'super_admin'.
 *
 * Response:
 *   { ok: true, sent: N, failed: M, details: [...] }
 *   { ok: false, error: string }
 */
export async function POST(req: Request) {
  try {
    const sb = await createSupabaseClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Not signed in.' },
        { status: 401 }
      );
    }

    const { data: roleRow } = await sb
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    const role = roleRow?.role ?? 'user';
    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.json(
        { ok: false, error: 'Only coaches can send nudges.' },
        { status: 403 }
      );
    }

    const body = (await req.json().catch(() => null)) as
      | {
          clientId?: string;
          title?: string;
          body?: string;
          data?: Record<string, string>;
        }
      | null;
    if (!body?.clientId || !body?.title || !body?.body) {
      return NextResponse.json(
        {
          ok: false,
          error: 'clientId, title, and body are required.',
        },
        { status: 400 }
      );
    }

    const tokens = await getPushTokensForUser(body.clientId);
    if (tokens.length === 0) {
      return NextResponse.json({
        ok: true,
        sent: 0,
        failed: 0,
        details: [],
        message:
          'No push tokens registered for this client. They need to enable notifications on their device first.',
      });
    }

    const result = await sendFcmToUser(
      tokens.map((t) => t.token),
      body.title,
      body.body,
      body.data
    );
    return NextResponse.json({ ok: true, ...result });
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
