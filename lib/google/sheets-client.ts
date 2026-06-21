import 'server-only';
import { google, type sheets_v4 } from 'googleapis';
import { unstable_cache as nextCache } from 'next/cache';

/**
 * Google Sheets read helper.
 *
 * Auth: service account (single JSON key, no per-user OAuth dance).
 * The account email + private key live in env vars; the actual Sheet
 * must be shared with the service-account email as Viewer.
 *
 * Cache: 5-minute revalidate via Next's unstable_cache. With ~5
 * Sheets at 5 min each we burn ~60 reads/hour against the 100/100s
 * Sheets API quota — comfortably within the free tier.
 *
 * Returns the raw 2-D array of cell values. Per-dataset adapters
 * (e.g. lib/data/food-sources-from-sheet.ts) parse rows into typed
 * shapes. Adapters fall back gracefully when the env vars aren't set
 * so the app keeps working in dev / on PRs without Sheet access.
 */

const REVALIDATE_SECONDS = 5 * 60;

interface FetchSheetArgs {
  /** Spreadsheet ID — the long string in the Sheet's URL between /d/ and /edit. */
  spreadsheetId: string;
  /** A1 range, e.g. "Foods!A2:K1000" or "Pricing!A:E". */
  range: string;
}

/** Lower-level: returns the raw cell matrix. */
async function fetchSheetUncached(
  args: FetchSheetArgs
): Promise<string[][]> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !key) {
    throw new Error(
      'Sheets sync not configured (set GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)'
    );
  }

  // Vercel stores the private key with literal "\n" escapes when you
  // paste a JSON key into an env var box. Convert back to real newlines
  // or the JWT signing crypto fails with cryptic errors.
  const privateKey = key.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets: sheets_v4.Sheets = google.sheets({ version: 'v4', auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: args.spreadsheetId,
    range: args.range,
    // Important: get formatted (display) values so dates / numbers
    // come through as the user types them in the Sheet, not as
    // serial values.
    valueRenderOption: 'FORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',
  });

  return (res.data.values as string[][] | undefined) ?? [];
}

/**
 * Cached wrapper. The cache key is the spreadsheetId + range so the
 * same Sheet read from multiple call sites de-duplicates within the
 * revalidation window.
 */
export function fetchSheet(
  args: FetchSheetArgs
): Promise<string[][]> {
  const cached = nextCache(
    () => fetchSheetUncached(args),
    ['sheet', args.spreadsheetId, args.range],
    { revalidate: REVALIDATE_SECONDS }
  );
  return cached();
}

/** True when Sheets credentials are present. Cheap branch for callers
 *  that want to skip the network round-trip entirely when the integration
 *  isn't configured (PR previews, local dev without the JSON key). */
export function isSheetsConfigured(): boolean {
  return !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  );
}
