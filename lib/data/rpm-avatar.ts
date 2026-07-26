import { createClient as createSupabaseClient } from '@/lib/supabase/server';

/**
 * Ready Player Me avatar-URL data helpers. Small module — just two
 * read helpers used by the dashboard and Twin pages, plus a save
 * helper called from the RPM setup completion callback.
 */

/**
 * Read the user's 3D avatar URL. Returns null if they haven't
 * created one, or on any error (safe fallback since callers pair
 * this with the PNG default).
 */
export async function getRpmAvatarUrl(
  userId: string
): Promise<string | null> {
  try {
    const sb = await createSupabaseClient();
    const { data } = await sb
      .from('profiles')
      .select('rpm_avatar_url')
      .eq('id', userId)
      .maybeSingle();
    return (data?.rpm_avatar_url ?? null) as string | null;
  } catch {
    return null;
  }
}

/**
 * Save a Ready Player Me .glb URL for the user. Called from the
 * setup flow after the RPM iframe posts its `v1.avatar.exported`
 * message with the final URL.
 *
 * Validates the URL is on the RPM domain — defence-in-depth against
 * a malicious client trying to inject a URL from an untrusted host
 * (which would get fetched by every other user's browser).
 */
export async function saveRpmAvatarUrl(
  userId: string,
  glbUrl: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isValidRpmUrl(glbUrl)) {
    return { ok: false, error: 'Invalid Ready Player Me URL.' };
  }
  try {
    const sb = await createSupabaseClient();
    const { error } = await sb
      .from('profiles')
      .update({ rpm_avatar_url: glbUrl })
      .eq('id', userId);
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
 * Validate that a URL is a Ready Player Me .glb URL. Prevents
 * arbitrary URL injection.
 */
function isValidRpmUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return false;
    // RPM CDN hostnames
    const okHost =
      u.hostname === 'models.readyplayer.me' ||
      u.hostname.endsWith('.readyplayer.me');
    if (!okHost) return false;
    if (!u.pathname.endsWith('.glb')) return false;
    return true;
  } catch {
    return false;
  }
}
