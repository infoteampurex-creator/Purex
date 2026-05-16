'use server';

import { z } from 'zod';
import { requireAuth } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/resend';

// ─── Runtime env snapshot ──────────────────────────────────────────

export interface EnvSnapshot {
  resendApiKey: {
    present: boolean;
    length: number;
    prefix: string;
    suffix: string;
  };
  emailFrom: string;
  emailAdminInbox: string;
  siteUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: { present: boolean; length: number };
  supabaseServiceRoleKey: { present: boolean; length: number };
  nodeEnv: string;
  vercelEnv: string;
  vercelUrl: string;
  vercelGitCommitSha: string;
}

/**
 * Snapshot what process.env actually returns at request time on the
 * Vercel server. Values that are themselves secrets (any *_KEY) are
 * shown as length + 3-char prefix + 3-char suffix only, never their
 * full content.
 */
export async function getEnvSnapshot(): Promise<{
  ok: boolean;
  snapshot?: EnvSnapshot;
  error?: string;
}> {
  const user = await requireAuth({ adminOnly: true });
  if (!user) return { ok: false, error: 'Not authorised.' };

  const resendKey = process.env.RESEND_API_KEY ?? '';
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

  return {
    ok: true,
    snapshot: {
      resendApiKey: {
        present: resendKey.length > 0,
        length: resendKey.length,
        prefix: resendKey.slice(0, 3),
        suffix: resendKey.length > 6 ? resendKey.slice(-3) : '',
      },
      emailFrom: process.env.EMAIL_FROM ?? '(not set)',
      emailAdminInbox: process.env.EMAIL_ADMIN_INBOX ?? '(not set)',
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? '(not set)',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '(not set)',
      supabaseAnonKey: {
        present: supabaseAnon.length > 0,
        length: supabaseAnon.length,
      },
      supabaseServiceRoleKey: {
        present: supabaseService.length > 0,
        length: supabaseService.length,
      },
      nodeEnv: process.env.NODE_ENV ?? '(unset)',
      vercelEnv: process.env.VERCEL_ENV ?? '(local)',
      vercelUrl: process.env.VERCEL_URL ?? '(local)',
      vercelGitCommitSha:
        (process.env.VERCEL_GIT_COMMIT_SHA ?? '').slice(0, 7) || '(local)',
    },
  };
}

// ─── Test send ─────────────────────────────────────────────────────

const sendTestSchema = z.object({
  to: z.string().email('Enter a valid email address'),
});

export type SendTestEmailResult =
  | { ok: true; id: string; recipient: string }
  | { ok: false; error: string };

/**
 * Fire a single test send. Surfaces the verbatim Resend response so
 * the admin can tell apart "key missing" / "domain not verified" /
 * "recipient invalid" / etc.
 */
export async function sendTestEmail(
  input: z.input<typeof sendTestSchema>
): Promise<SendTestEmailResult> {
  const user = await requireAuth({ adminOnly: true });
  if (!user) return { ok: false, error: 'Not authorised.' };

  const parsed = sendTestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }

  const result = await sendEmail({
    to: parsed.data.to,
    subject: 'PURE X — diagnostic test send',
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #c6ff3d;">Test send from /admin/diagnostic</h2>
        <p>If you're reading this, Resend is wired up correctly on production.</p>
        <p style="color: #888; font-size: 12px;">
          Sent at ${new Date().toISOString()} from
          ${process.env.VERCEL_URL ?? 'local dev'}
        </p>
      </div>
    `,
    text: `PURE X — diagnostic test send. If you're reading this, Resend is wired up correctly on production. Sent at ${new Date().toISOString()}.`,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, id: result.id, recipient: parsed.data.to };
}
