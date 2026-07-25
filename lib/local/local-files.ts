/**
 * Per-device persistent storage for files the user uploaded.
 *
 * Background — the "file stays on device" privacy refactor (PR #60)
 * stopped persisting uploaded PDFs / images to Supabase Storage; only
 * the extracted markers / macros now live on the server.
 *
 * This module is the OTHER half of that promise: when the user
 * uploads (or AI-analyses) a file, we save a copy locally on their
 * device using @capacitor/filesystem so they can re-open it from the
 * coaching app even though our backend doesn't keep it.
 *
 * Platform behaviour:
 *   - Capacitor (iOS + Android) — writes into the app's private Data
 *     directory (Directory.Data). Survives app updates, gone if the
 *     user uninstalls. Inaccessible to other apps.
 *   - Web (regular browser, signed-in at teampurex.com) — no
 *     persistent storage. saveLocalFile returns ok:false and the UI
 *     gracefully hides the "Open file" affordance.
 *
 * All exports are async-safe to call from a client component without
 * worrying about whether the Capacitor plugin is registered — they
 * detect the platform at call time and bail out cleanly on web.
 */

import { Capacitor } from '@capacitor/core';

export type LocalFileScope = 'health-reports' | 'meal-photos';

interface SaveArgs {
  scope: LocalFileScope;
  /** Stable row id from the DB — used as the local filename root. */
  id: string;
  /** base64 file body (no `data:` prefix). */
  base64: string;
  /** Extension without the leading dot — 'pdf', 'jpg', 'png', etc. */
  ext: string;
}

type Result<T = void> =
  | (T extends void ? { ok: true } : { ok: true } & T)
  | { ok: false; error: string };

/** Convenience — is the current runtime able to persist files? */
export function canPersistLocally(): boolean {
  // Capacitor.isNativePlatform() returns true inside the iOS/Android
  // WebView wrapper, false in regular browsers and SSR.
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

function buildRelativePath(scope: LocalFileScope, id: string, ext: string) {
  // Path inside the app's Data directory:
  //   purex/<scope>/<id>.<ext>
  // Namespaced under `purex/` so we never collide with anything else
  // a future plugin might write to Data.
  const clean = ext.replace(/^\.+/, '').toLowerCase() || 'bin';
  return `purex/${scope}/${id}.${clean}`;
}

/**
 * Persist a file to the user's device. Returns a usable URI on
 * success — that URI is what `openLocalFile` will reopen.
 *
 * Cheap on the happy path. Failures log to console + surface a
 * structured error; callers should treat this as best-effort (the
 * server-side flow already succeeded by the time we get here).
 */
export async function saveLocalFile(
  args: SaveArgs
): Promise<Result<{ uri: string }>> {
  if (!canPersistLocally()) {
    return { ok: false, error: 'Local file storage requires the mobile app.' };
  }
  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const path = buildRelativePath(args.scope, args.id, args.ext);
    await Filesystem.writeFile({
      path,
      data: args.base64,
      directory: Directory.Data,
      recursive: true,
    });
    const { uri } = await Filesystem.getUri({
      path,
      directory: Directory.Data,
    });
    return { ok: true, uri };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Save failed';
    // eslint-disable-next-line no-console
    console.warn('[local-files] saveLocalFile failed', {
      scope: args.scope,
      id: args.id,
      error: msg,
    });
    return { ok: false, error: msg };
  }
}

/**
 * Look up the local URI for a previously-saved file. Returns null
 * when the file isn't present (web, or never saved on this device).
 */
export async function getLocalFileUri(
  scope: LocalFileScope,
  id: string,
  ext: string
): Promise<string | null> {
  if (!canPersistLocally()) return null;
  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const path = buildRelativePath(scope, id, ext);
    // stat throws if the file doesn't exist — use that as the
    // existence check rather than introducing a separate Filesystem.stat
    // dance.
    const { uri } = await Filesystem.getUri({ path, directory: Directory.Data });
    // getUri returns a path-shaped string even when the file isn't
    // there, so confirm with a cheap stat.
    await Filesystem.stat({ path, directory: Directory.Data });
    return uri;
  } catch {
    return null;
  }
}

/**
 * Open the saved local file with the device's default viewer.
 * Uses Capacitor.convertFileSrc() so the WebView can handle file://
 * URIs without security errors.
 *
 * For PDFs this typically opens an in-WebView preview on iOS and
 * an external viewer on Android (depends on the device's defaults).
 */
export async function openLocalFile(
  scope: LocalFileScope,
  id: string,
  ext: string
): Promise<Result> {
  const uri = await getLocalFileUri(scope, id, ext);
  if (!uri) {
    return { ok: false, error: 'No local copy on this device.' };
  }
  try {
    const webUri = Capacitor.convertFileSrc(uri);
    window.open(webUri, '_blank', 'noopener');
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not open file.',
    };
  }
}

/** Delete the local copy. Used when the row is deleted server-side. */
export async function deleteLocalFile(
  scope: LocalFileScope,
  id: string,
  ext: string
): Promise<void> {
  if (!canPersistLocally()) return;
  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const path = buildRelativePath(scope, id, ext);
    await Filesystem.deleteFile({ path, directory: Directory.Data });
  } catch {
    // Best-effort — missing file is a no-op success.
  }
}

/**
 * Map a MIME type back to a sensible extension. Matches the server-
 * side mapping in uploadHealthReport pre-PR-60 so the same file
 * lands with the same .ext whether it's saved server- or client-side.
 */
export function extFromMime(mime: string): string {
  const m = mime.toLowerCase();
  if (m === 'application/pdf') return 'pdf';
  if (m === 'image/jpeg' || m === 'image/jpg') return 'jpg';
  if (m === 'image/png') return 'png';
  if (m === 'image/webp') return 'webp';
  if (m === 'image/heic') return 'heic';
  if (m === 'image/heif') return 'heif';
  return 'bin';
}
