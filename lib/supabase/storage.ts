import { createClient } from '@/lib/supabase/server';

const SIGNED_URL_EXPIRY_SECONDS = 60 * 60; // 1 hour

/**
 * Get a short-lived signed URL for a private storage object.
 * Returns null if the path is invalid or access is denied by RLS.
 *
 * Use this in server components that need to render private images.
 * Call per-image — Supabase handles caching internally.
 */
export async function getSignedPhotoUrl(
  bucket: 'client-avatars' | 'client-progress',
  path: string | null | undefined
): Promise<string | null> {
  if (!path) return null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS);

    if (error) {
      console.error(`Failed to sign URL for ${bucket}/${path}:`, error.message);
      return null;
    }

    return data?.signedUrl ?? null;
  } catch (err) {
    console.error('getSignedPhotoUrl exception:', err);
    return null;
  }
}

/**
 * Batch version: sign multiple paths at once.
 */
export async function getSignedPhotoUrls(
  bucket: 'client-avatars' | 'client-progress',
  paths: (string | null | undefined)[]
): Promise<(string | null)[]> {
  const supabase = await createClient();
  const validPaths = paths.filter((p): p is string => Boolean(p));
  if (validPaths.length === 0) return paths.map(() => null);

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrls(validPaths, SIGNED_URL_EXPIRY_SECONDS);

    if (error || !data) {
      console.error('Batch signing failed:', error?.message);
      return paths.map(() => null);
    }

    // Map results back to original array positions
    const urlMap = new Map<string, string>();
    data.forEach((item) => {
      if (item.path && item.signedUrl) urlMap.set(item.path, item.signedUrl);
    });

    return paths.map((p) => (p ? urlMap.get(p) ?? null : null));
  } catch (err) {
    console.error('getSignedPhotoUrls exception:', err);
    return paths.map(() => null);
  }
}
