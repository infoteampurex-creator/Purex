import 'server-only';
import { Resend } from 'resend';

/**
 * Resend client + send helper.
 *
 * Two failure modes we surface (instead of silently no-op'ing):
 *   1. RESEND_API_KEY missing → `Resend not configured.`
 *   2. Resend API rejected the send (e.g. unverified sender domain,
 *      malformed recipient) → the verbatim message from Resend.
 *
 * Env vars are read lazily inside the function so a freshly-set
 * Vercel env-var value picks up on the next request, not after a
 * cold start.
 */

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

function readConfig(): { apiKey: string | null; fromAddress: string } {
  const apiKey = process.env.RESEND_API_KEY?.trim() || null;
  const fromAddress =
    process.env.EMAIL_FROM?.trim() || 'PURE X <hello@teampurex.com>';
  return { apiKey, fromAddress };
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  /** Optional plain-text fallback. Resend auto-generates if omitted. */
  text?: string;
  /** Override the From: header for this single send. */
  from?: string;
}): Promise<SendEmailResult> {
  const { apiKey, fromAddress } = readConfig();

  if (!apiKey) {
    console.warn(
      '[PURE X] Resend not configured — RESEND_API_KEY missing. Skipping email send for:',
      input.subject
    );
    return {
      ok: false,
      error:
        'Resend not configured (RESEND_API_KEY is missing on the server). Set it in Vercel → Project Settings → Environment Variables.',
    };
  }

  const client = new Resend(apiKey);

  try {
    const { data, error } = await client.emails.send({
      from: input.from ?? fromAddress,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    if (error || !data) {
      console.error('[PURE X] Resend send failed:', error);
      return {
        ok: false,
        error: error?.message ?? 'Resend rejected the send (no error returned).',
      };
    }

    return { ok: true, id: data.id };
  } catch (err) {
    console.error('[PURE X] Resend threw:', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

export function isResendConfigured(): boolean {
  return readConfig().apiKey !== null;
}
