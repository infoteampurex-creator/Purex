import 'server-only';
import { Resend } from 'resend';

/**
 * Resend client + send helper. Tolerates a missing API key — if the
 * env var isn't set yet, send() resolves with `{ ok: false }` and a
 * console.warn so the rest of the system keeps working (admin can
 * still WhatsApp the client; the email step is non-blocking).
 */

const apiKey = process.env.RESEND_API_KEY;
const fromAddress =
  process.env.EMAIL_FROM ?? 'PURE X <hello@teampurex.com>';

const client = apiKey ? new Resend(apiKey) : null;

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  /** Optional plain-text fallback. Resend auto-generates if omitted. */
  text?: string;
  /** Override the From: header for this single send. */
  from?: string;
}): Promise<SendEmailResult> {
  if (!client) {
    console.warn(
      '[PURE X] Resend not configured — RESEND_API_KEY missing. Skipping email send for:',
      input.subject
    );
    return { ok: false, error: 'Resend not configured.' };
  }

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
      return { ok: false, error: error?.message ?? 'Send failed' };
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
  return client !== null;
}
