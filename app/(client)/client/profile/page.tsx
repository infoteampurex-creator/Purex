import { redirect } from 'next/navigation';
import { User } from 'lucide-react';
import { ProfilePageView } from '@/components/client/profile/ProfilePageView';
import { createClient } from '@/lib/supabase/server';
import {
  getLatestMeasurements,
  getProfileBodySettings,
} from '@/lib/data/body-measurements';
import { deriveBodyProportions } from '@/lib/data/body-proportions';

export const metadata = {
  title: 'PureX Profile · Account, goal, settings',
};
export const dynamic = 'force-dynamic';

/**
 * Profile page — real user data + account actions + Sign Out.
 *
 * Fix for the "no logout option in app" bug. Builds the Profile page
 * around an avatar header, account info, goal/body summary, plan info,
 * and an explicit Sign Out button (also surfaces a small banner with
 * Sign Out on mobile dashboards in a future pass).
 */
export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Pull profile + body settings + latest measurement in parallel
  const [{ data: profileRow }, bodySettings, latestMeas] = await Promise.all([
    supabase
      .from('profiles')
      .select('email, full_name, phone, role, avatar_url, created_at')
      .eq('id', user.id)
      .maybeSingle(),
    getProfileBodySettings(user.id),
    getLatestMeasurements(user.id),
  ]);

  const proportions = deriveBodyProportions(
    latestMeas,
    bodySettings.heightCm,
    bodySettings.gender
  );

  return (
    <main className="relative bg-bg text-text min-h-screen">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 80% 0%, rgba(125, 211, 255, 0.08) 0%, transparent 55%), radial-gradient(ellipse at 20% 60%, rgba(198, 255, 61, 0.06) 0%, transparent 55%)',
        }}
      />

      <div className="relative container-safe pt-6 pb-24 max-w-2xl mx-auto">
        <header className="mb-6 md:mb-8">
          <div
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] font-bold mb-3"
            style={{ color: '#7dd3ff' }}
          >
            <User size={12} />
            PureX Profile
          </div>
          <h1 className="font-display font-bold text-3xl md:text-4xl tracking-tight leading-[1.05] mb-2">
            Account
          </h1>
        </header>

        <ProfilePageView
          email={profileRow?.email ?? user.email ?? ''}
          fullName={profileRow?.full_name ?? null}
          phone={profileRow?.phone ?? null}
          role={profileRow?.role ?? 'user'}
          avatarUrl={profileRow?.avatar_url ?? null}
          memberSince={profileRow?.created_at ?? user.created_at}
          bodySettings={bodySettings}
          proportions={proportions}
        />
      </div>
    </main>
  );
}
