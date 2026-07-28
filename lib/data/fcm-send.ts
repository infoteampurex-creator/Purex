import 'server-only';
import { deletePushToken } from './push-tokens';

/**
 * FCM (Firebase Cloud Messaging) HTTP v1 Send API wrapper.
 *
 * FCM v1 requires OAuth2 access-token auth (unlike the legacy
 * "server key" API, which was retired). Flow:
 *
 *   1. Read the service-account JSON from env
 *      (FIREBASE_SERVICE_ACCOUNT_B64 — base64-encoded to fit in a
 *      single Vercel env var).
 *   2. Build a JWT signed with the service account's private key,
 *      scoped to the FCM Send API.
 *   3. Exchange the JWT for an OAuth access token from Google's
 *      token endpoint.
 *   4. POST the FCM message to
 *      https://fcm.googleapis.com/v1/projects/{projectId}/messages:send
 *      with the access token in the Authorization header.
 *
 * Tokens are cached in-memory for 55 minutes (FCM tokens are valid
 * for 60 min) so we don't sign a fresh JWT on every send.
 *
 * On FCM UNREGISTERED response, the stale token is deleted from
 * Supabase — that user's device uninstalled the app or the token
 * rotated out of validity.
 */

interface ServiceAccount {
  project_id: string;
  private_key: string;
  client_email: string;
  token_uri: string;
}

interface CachedAccessToken {
  token: string;
  expiresAt: number;
}

let cachedToken: CachedAccessToken | null = null;

/**
 * Send an FCM notification to one device token. Returns success or
 * error details. On FCM UNREGISTERED / INVALID_ARGUMENT the caller
 * should stop retrying and let the delete-on-fail logic clean up.
 */
export async function sendFcmToToken(
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ ok: true; messageId: string } | { ok: false; error: string; unregistered?: boolean }> {
  const sa = readServiceAccount();
  if (!sa) {
    return {
      ok: false,
      error: 'FIREBASE_SERVICE_ACCOUNT_B64 not set. Add the base64-encoded service-account JSON to your Vercel env.',
    };
  }

  let accessToken: string;
  try {
    accessToken = await getAccessToken(sa);
  } catch (err) {
    return {
      ok: false,
      error: `Failed to get FCM access token: ${err instanceof Error ? err.message : 'Unknown'}`,
    };
  }

  const url = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;
  const message = {
    message: {
      token: fcmToken,
      notification: { title, body },
      data: data ?? {},
      android: {
        priority: 'HIGH' as const,
        notification: {
          sound: 'default',
          channel_id: 'default',
        },
      },
      apns: {
        payload: {
          aps: { sound: 'default', badge: 1 },
        },
      },
    },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (res.ok) {
      const json = (await res.json()) as { name: string };
      return { ok: true, messageId: json.name };
    }

    const errText = await res.text();
    const unregistered =
      errText.includes('UNREGISTERED') || errText.includes('NOT_FOUND');
    if (unregistered) {
      // Best-effort: clean up the stale token so future sends skip it
      await deletePushToken(fcmToken).catch(() => {
        // ignore — the delete is best-effort
      });
    }
    return { ok: false, error: errText, unregistered };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'FCM send failed',
    };
  }
}

/**
 * Fan-out: send the same notification to every token belonging to
 * one user. Runs the sends in parallel. Reports per-token results
 * for observability in the admin UI.
 */
export async function sendFcmToUser(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ sent: number; failed: number; details: Array<{ token: string; ok: boolean; error?: string }> }> {
  const results = await Promise.all(
    tokens.map(async (t) => {
      const r = await sendFcmToToken(t, title, body, data);
      return {
        token: `${t.slice(0, 12)}…`,
        ok: r.ok,
        error: r.ok ? undefined : r.error,
      };
    })
  );
  return {
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    details: results,
  };
}

function readServiceAccount(): ServiceAccount | null {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (!b64) return null;
  try {
    const jsonStr = Buffer.from(b64, 'base64').toString('utf-8');
    const parsed = JSON.parse(jsonStr) as ServiceAccount;
    if (!parsed.project_id || !parsed.private_key || !parsed.client_email) {
      console.warn('[fcm-send] service-account JSON missing required fields');
      return null;
    }
    return parsed;
  } catch (err) {
    console.warn('[fcm-send] failed to decode FIREBASE_SERVICE_ACCOUNT_B64', err);
    return null;
  }
}

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const now = Math.floor(Date.now() / 1000);
  const jwt = await signJwt(
    {
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: sa.token_uri || 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    },
    sa.private_key
  );

  const tokenRes = await fetch(sa.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }).toString(),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Google OAuth token exchange failed: ${err}`);
  }

  const tokenJson = (await tokenRes.json()) as {
    access_token: string;
    expires_in: number;
  };
  cachedToken = {
    token: tokenJson.access_token,
    expiresAt: Date.now() + tokenJson.expires_in * 1000,
  };
  return tokenJson.access_token;
}

/**
 * Sign a Google service-account JWT using the private key (RS256).
 * Node's built-in crypto module handles both the PEM parsing and the
 * signing — no dependency on jsonwebtoken or google-auth-library.
 */
async function signJwt(
  claims: Record<string, string | number>,
  privateKeyPem: string
): Promise<string> {
  const crypto = await import('node:crypto');
  const header = { alg: 'RS256', typ: 'JWT' };
  const encHeader = base64UrlEncode(JSON.stringify(header));
  const encClaims = base64UrlEncode(JSON.stringify(claims));
  const signingInput = `${encHeader}.${encClaims}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();

  // Normalise PEM line endings — service-account JSONs frequently
  // arrive with literal \n sequences that need converting.
  const pem = privateKeyPem.replace(/\\n/g, '\n');
  const signature = signer.sign(pem);
  const encSignature = base64UrlEncodeBuf(signature);
  return `${signingInput}.${encSignature}`;
}

function base64UrlEncode(s: string): string {
  return base64UrlEncodeBuf(Buffer.from(s, 'utf-8'));
}

function base64UrlEncodeBuf(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
