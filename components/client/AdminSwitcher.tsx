import Link from 'next/link';
import { Shield, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

/**
 * A subtle banner that appears on the client dashboard when the logged-in
 * user has the admin role. Gives admins a one-click jump to the admin
 * panel without forcing them to type /admin/dashboard manually.
 *
 * Returns null for non-admin users, so it's invisible in the normal case.
 */
export async function AdminSwitcher() {
  // If Supabase isn't configured, show nothing
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin =
      profile?.role === 'admin' || profile?.role === 'super_admin';

    if (!isAdmin) return null;

    return (
      <Link
        href="/admin/dashboard"
        className="group flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-bg-card border border-accent/25 hover:border-accent/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
            style={{
              background: 'rgba(198, 255, 61, 0.1)',
              border: '1px solid rgba(198, 255, 61, 0.3)',
              color: '#c6ff3d',
            }}
          >
            <Shield size={14} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold leading-tight">
              Admin Account
            </div>
            <div className="text-xs text-text-muted leading-tight mt-0.5">
              You&apos;re viewing the client dashboard. Switch to the admin panel?
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold group-hover:gap-2 transition-all whitespace-nowrap">
          Admin Panel
          <ArrowRight size={11} strokeWidth={2.5} />
        </div>
      </Link>
    );
  } catch {
    return null;
  }
}
