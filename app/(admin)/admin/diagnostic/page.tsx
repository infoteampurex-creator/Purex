import { redirect } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { requireAuth } from '@/lib/supabase/server';
import { getEnvSnapshot } from '@/lib/actions/diagnostic';
import { DiagnosticTester } from '@/components/admin/DiagnosticTester';

export const metadata = { title: 'Admin · Diagnostic' };
export const dynamic = 'force-dynamic';

export default async function DiagnosticPage() {
  const user = await requireAuth({ adminOnly: true });
  if (!user) redirect('/login?next=/admin/diagnostic');

  const result = await getEnvSnapshot();
  if (!result.ok || !result.snapshot) {
    return (
      <div className="p-8 text-danger">
        Could not load environment snapshot: {result.error ?? 'unknown error'}
      </div>
    );
  }

  const s = result.snapshot;

  return (
    <>
      <AdminPageHeader
        eyebrow="System"
        title="Diagnostic"
        subtitle="Live snapshot of what the server actually sees at request time. Use this to confirm whether an env var change has propagated to the current deployment."
      />

      {/* Resend / email block */}
      <Section title="Email (Resend)">
        <Row
          label="RESEND_API_KEY"
          value={
            s.resendApiKey.present
              ? `present · ${s.resendApiKey.length} chars · ${s.resendApiKey.prefix}…${s.resendApiKey.suffix}`
              : 'MISSING'
          }
          tone={s.resendApiKey.present ? 'ok' : 'bad'}
        />
        <Row
          label="EMAIL_FROM"
          value={s.emailFrom}
          tone={s.emailFrom.includes('@') ? 'ok' : 'bad'}
        />
        <Row
          label="EMAIL_ADMIN_INBOX"
          value={s.emailAdminInbox}
          tone="neutral"
        />
      </Section>

      {/* Test send */}
      <Section title="Send a test email">
        <p className="text-sm text-text-muted mb-4">
          Fires a one-off Resend send with the current env values. The
          verbatim response is shown below so you can tell apart key /
          domain / recipient errors.
        </p>
        <DiagnosticTester defaultRecipient={user.email ?? ''} />
      </Section>

      {/* Supabase block */}
      <Section title="Supabase">
        <Row label="NEXT_PUBLIC_SUPABASE_URL" value={s.supabaseUrl} />
        <Row
          label="NEXT_PUBLIC_SUPABASE_ANON_KEY"
          value={
            s.supabaseAnonKey.present
              ? `present · ${s.supabaseAnonKey.length} chars`
              : 'MISSING'
          }
          tone={s.supabaseAnonKey.present ? 'ok' : 'bad'}
        />
        <Row
          label="SUPABASE_SERVICE_ROLE_KEY"
          value={
            s.supabaseServiceRoleKey.present
              ? `present · ${s.supabaseServiceRoleKey.length} chars`
              : 'MISSING'
          }
          tone={s.supabaseServiceRoleKey.present ? 'ok' : 'bad'}
        />
      </Section>

      {/* Deployment block */}
      <Section title="Deployment">
        <Row label="NODE_ENV" value={s.nodeEnv} />
        <Row label="VERCEL_ENV" value={s.vercelEnv} />
        <Row label="VERCEL_URL" value={s.vercelUrl} />
        <Row
          label="VERCEL_GIT_COMMIT_SHA"
          value={s.vercelGitCommitSha}
          tone="neutral"
        />
        <Row
          label="NEXT_PUBLIC_SITE_URL"
          value={s.siteUrl}
          tone={s.siteUrl.startsWith('http') ? 'ok' : 'bad'}
        />
      </Section>

      <div className="rounded-xl border border-border-soft bg-bg-card p-4 text-xs text-text-muted leading-relaxed">
        <strong className="text-text">If something says MISSING:</strong>
        <ol className="list-decimal pl-5 mt-2 space-y-1">
          <li>
            Vercel → Project → Settings → Environment Variables. Confirm the
            variable exists, the value is non-empty, and the <em>Production</em>{' '}
            checkbox is on.
          </li>
          <li>
            Vercel → Deployments. Confirm the latest deployment marked
            &quot;Current&quot; is newer than the env-var change. If not,
            click the deployment&apos;s … menu → <em>Redeploy</em> with
            &quot;Use existing build cache&quot; unchecked.
          </li>
          <li>
            Reload this page. The values are read fresh from{' '}
            <code>process.env</code> on every request.
          </li>
        </ol>
      </div>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="font-display font-semibold text-lg tracking-tight mb-3">
        {title}
      </h2>
      <div className="rounded-xl bg-bg-card border border-border divide-y divide-border-soft">
        {children}
      </div>
    </section>
  );
}

function Row({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'ok' | 'bad' | 'neutral';
}) {
  const valueClass =
    tone === 'ok'
      ? 'text-accent'
      : tone === 'bad'
        ? 'text-danger'
        : 'text-text';
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 px-4 py-3">
      <div className="md:w-72 flex-shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted font-bold">
        {label}
      </div>
      <div className={`font-mono text-xs break-all ${valueClass}`}>{value}</div>
    </div>
  );
}
