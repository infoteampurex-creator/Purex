import 'server-only';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type PushPlatform = 'android' | 'ios' | 'web';

export interface PushTokenRow {
  id: string;
  user_id: string;
  token: string;
  platform: PushPlatform;
  device_label: string | null;
  created_at: string;
  last_seen_at: string;
}

/**
 * Upsert a push token for the currently-authenticated user. Called
 * from POST /api/push/register when the Capacitor push-notifications
 * plugin fires its `registration` event.
 *
 * Uses onConflict on the `token` column so a rotated token doesn't
 * create a stale duplicate — the row is updated in place, refreshing
 * last_seen_at and (if the user is different) reassigning ownership.
 */
export async function upsertPushToken(
  userId: string,
  token: string,
  platform: PushPlatform,
  deviceLabel: string | null = null
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!token || token.length < 20) {
    return { ok: false, error: 'Invalid token.' };
  }
  try {
    const sb = await createSupabaseClient();
    const { error } = await sb.from('push_tokens').upsert(
      {
        user_id: userId,
        token,
        platform,
        device_label: deviceLabel,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'token' }
    );
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Fetch all tokens for a given user. Uses the service-role admin
 * client because the admin push-send path is called by a coach
 * account, not by the client user — RLS would otherwise block it.
 */
export async function getPushTokensForUser(
  userId: string
): Promise<PushTokenRow[]> {
  try {
    const sb = createAdminClient();
    const { data, error } = await sb
      .from('push_tokens')
      .select('*')
      .eq('user_id', userId)
      .order('last_seen_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as PushTokenRow[];
  } catch (err) {
    console.error('[push-tokens] getPushTokensForUser failed', err);
    return [];
  }
}

/**
 * Delete a token — called from the FCM send path when the response
 * indicates UNREGISTERED (the token is stale, app uninstalled, etc.).
 * Prevents pushing to dead tokens on future runs.
 */
export async function deletePushToken(token: string): Promise<void> {
  try {
    const sb = createAdminClient();
    await sb.from('push_tokens').delete().eq('token', token);
  } catch (err) {
    console.error('[push-tokens] deletePushToken failed', err);
  }
}
