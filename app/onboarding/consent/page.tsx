import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/lib/actions/auth';
import { ConsentSigningForm } from '@/components/client/ConsentSigningForm';
import { getActiveConsent } from '@/lib/data/consent-server';

export const metadata = {
  title: 'Consent · TEAM Team Purex',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function ConsentPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // If they've already signed the current version, send them on.
  const active = await getActiveConsent(user.id);
  const { redirect: redirectParam } = await searchParams;
  if (active) {
    const target =
      redirectParam && redirectParam.startsWith('/')
        ? redirectParam
        : '/client/dashboard';
    redirect(target);
  }

  // Profile name for the signature prefill.
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, first_name, email')
    .eq('id', user.id)
    .single();
  const initialName =
    (profile?.full_name as string | null) ??
    (profile?.first_name as string | null) ??
    '';

  return (
    <main className="min-h-screen bg-bg text-text">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% -10%, rgba(198, 255, 61, 0.08) 0%, transparent 55%)',
        }}
      />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-12 md:pt-16 pb-20">
        {/* Brand strip + sign-out */}
        <header className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-display font-black tracking-tight"
            style={{ fontSize: 22, letterSpacing: '-0.5px' }}
          >
            <span className="text-text">PURE</span>
            <span className="text-accent">X</span>
          </Link>

          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full border border-border-soft text-text-muted text-xs font-mono uppercase tracking-[0.14em] font-bold hover:border-text-muted hover:text-text transition-colors"
            >
              <LogOut size={11} />
              Sign out
            </button>
          </form>
        </header>

        {/* Intro */}
        <div className="mb-8 text-center">
          <div className="inline-flex w-12 h-12 items-center justify-center rounded-full bg-accent/10 text-accent mb-4">
            <ShieldCheck size={22} />
          </div>
          <div
            className="font-mono uppercase tracking-[0.22em] text-accent font-bold mb-2"
            style={{ fontSize: 12 }}
          >
            One-time setup
          </div>
          <h1
            className="font-display font-semibold tracking-tight leading-tight"
            style={{ fontSize: 30 }}
          >
            Before we begin
          </h1>
          <p
            className="text-text-muted leading-relaxed mt-3 max-w-xl mx-auto"
            style={{ fontSize: 15 }}
          >
            Please review and sign our coaching agreement and privacy notice.
            This is required so we can deliver coaching responsibly and handle
            your data the right way. You can withdraw or change optional
            consents any time from your Account page.
          </p>
        </div>

        <ConsentSigningForm
          initialName={initialName}
          redirectTo={
            redirectParam && redirectParam.startsWith('/')
              ? redirectParam
              : '/client/dashboard'
          }
        />
      </div>
    </main>
  );
}
