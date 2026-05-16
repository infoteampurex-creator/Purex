import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Clock, ShieldX } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/lib/actions/auth';
import { BRAND } from '@/lib/constants';

export const metadata = { title: 'Application under review · PURE X' };

export default async function PendingApprovalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not signed in → middleware would normally handle this, but as a
  // belt-and-braces measure, bounce to login.
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('signup_status, first_name, full_name, email')
    .eq('id', user.id)
    .single();

  const status: 'pending_approval' | 'approved' | 'rejected' =
    (profile?.signup_status as
      | 'pending_approval'
      | 'approved'
      | 'rejected') ?? 'pending_approval';

  // If somehow an approved user lands here directly, hop them onto
  // their dashboard. (Middleware should already handle this; this is
  // a fail-safe for server-rendered direct loads.)
  if (status === 'approved') redirect('/client/dashboard');

  const firstName =
    profile?.first_name ??
    profile?.full_name?.split(/\s+/)[0] ??
    'there';

  return (
    <main className="min-h-screen bg-bg text-text flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-bg-card p-8 md:p-10 text-center">
        {status === 'rejected' ? (
          <RejectedView firstName={firstName} email={profile?.email ?? ''} />
        ) : (
          <PendingView firstName={firstName} />
        )}

        <form action={signOut} className="mt-8 pt-6 border-t border-border-soft">
          <button
            type="submit"
            className="text-xs font-mono uppercase tracking-[0.18em] text-text-muted hover:text-accent font-bold transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}

// ─── Pending ───────────────────────────────────────────────────────

function PendingView({ firstName }: { firstName: string }) {
  return (
    <>
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent/10 text-accent border border-accent/30 mb-6">
        <Clock size={22} />
      </div>

      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-3">
        Under Review
      </div>

      <h1 className="font-display font-semibold text-2xl md:text-3xl tracking-tight leading-tight mb-3">
        Hi {firstName} — your application is being reviewed.
      </h1>

      <p className="text-sm md:text-base text-text-muted leading-relaxed mb-6">
        We&rsquo;ve received your sign-up. A member of the PURE X team will
        review your application and reach out shortly.
      </p>

      <div className="rounded-lg bg-bg-elevated/40 border border-border-soft p-4 text-left">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={16} className="text-accent flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium">What happens next</div>
            <ul className="mt-2 space-y-1 text-xs text-text-muted leading-relaxed list-disc pl-4">
              <li>
                We&rsquo;ll email you the moment your account is approved.
              </li>
              <li>
                The same email walks you through your first kickoff call.
              </li>
              <li>
                Reviews usually complete within 24–48 hours during the week.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <p className="text-xs text-text-muted mt-6 leading-relaxed">
        In a hurry? Reach us on{' '}
        <Link
          href={`https://wa.me/${BRAND.whatsapp.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline font-medium"
        >
          WhatsApp
        </Link>{' '}
        or email{' '}
        <a
          href="mailto:hello@teampurex.com"
          className="text-accent hover:underline font-medium"
        >
          hello@teampurex.com
        </a>
        .
      </p>
    </>
  );
}

// ─── Rejected ──────────────────────────────────────────────────────

function RejectedView({
  firstName,
  email,
}: {
  firstName: string;
  email: string;
}) {
  return (
    <>
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-text-muted/10 text-text-muted border border-border mb-6">
        <ShieldX size={22} />
      </div>

      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted font-bold mb-3">
        Application Closed
      </div>

      <h1 className="font-display font-semibold text-2xl md:text-3xl tracking-tight leading-tight mb-3">
        Hi {firstName} — we&rsquo;re not the right fit right now.
      </h1>

      <p className="text-sm md:text-base text-text-muted leading-relaxed mb-6">
        Thanks for applying to PURE X. After reviewing your application, we
        don&rsquo;t think we&rsquo;re the right fit for you at this stage.
        This is rarely about you — it&rsquo;s usually about timing, capacity,
        or alignment with the kind of commitment our program requires.
      </p>

      <div className="rounded-lg bg-bg-elevated/40 border border-border-soft p-4 text-left mb-4">
        <p className="text-xs text-text-muted leading-relaxed m-0">
          We re-open applications quarterly. If anything changes — timing,
          goals, region — please reach out. We remember every conversation.
        </p>
      </div>

      <p className="text-xs text-text-muted leading-relaxed">
        Reply to the email we sent to{' '}
        <span className="font-mono text-text">{email}</span> or contact us at{' '}
        <a
          href="mailto:hello@teampurex.com"
          className="text-accent hover:underline font-medium"
        >
          hello@teampurex.com
        </a>
        .
      </p>
    </>
  );
}
