import { redirect } from 'next/navigation';
import { HeartPulse } from 'lucide-react';
import { HealthPageView } from '@/components/client/health/HealthPageView';
import { getCurrentUserId } from '@/lib/data/client-live';
import { getTwinDailyInputs } from '@/lib/data/twin-server';
import {
  getLatestMeasurements,
  getProfileBodySettings,
  EMPTY_PROFILE_BODY_SETTINGS,
} from '@/lib/data/body-measurements';
import { deriveBodyProportions } from '@/lib/data/body-proportions';
import { getMyHealthReports } from '@/lib/actions/health-reports';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import type { MoodState } from '@/lib/data/mood';

export const metadata = {
  title: 'PureX Health · Body data, reports, conditions',
};
export const dynamic = 'force-dynamic';

/**
 * Top-level Health page — the user's body-data hub.
 *
 * Replaces "Bookings" in the bottom nav per user direction. Bookings
 * stays accessible via /book and the Profile page.
 *
 * Aggregates the body-data surfaces that used to be scattered on the
 * dashboard (BodyMeasurements, HealthPassport) plus new sections:
 * Daily Vitals snapshot, Mood Pattern (last 7 days), Health Conditions
 * stub. Keeps the dashboard focused on "today's actions" while the
 * Health page is "your body's data."
 *
 * Information-architecture rationale:
 *   - Home    = what to do today (score, mission, mood, streak, twin)
 *   - Plan    = the training plan
 *   - Nutrition = fuel + food sources
 *   - Progress = long-term progress (charts, transformation, PRs)
 *   - Health  = body data (this page)
 *   - Profile = account / preferences
 */
export default async function HealthPage() {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect('/login');
  }

  const today = new Date().toISOString().slice(0, 10);

  const [
    inputsResult,
    measurements,
    bodySettings,
    healthReports,
    moodHistoryRows,
  ] = await Promise.all([
    getTwinDailyInputs(userId, today),
    getLatestMeasurements(userId),
    getProfileBodySettings(userId),
    getMyHealthReports(),
    // 7-day mood history — small enough query to inline here.
    (async () => {
      const sb = await createSupabaseClient();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const fromDate = sevenDaysAgo.toISOString().slice(0, 10);
      const { data } = await sb
        .from('client_daily_logs')
        .select('log_date, mood_state')
        .eq('client_id', userId)
        .gte('log_date', fromDate)
        .lte('log_date', today)
        .order('log_date', { ascending: false });
      return (data ?? []) as Array<{
        log_date: string;
        mood_state: MoodState | null;
      }>;
    })(),
  ]);

  const proportions = deriveBodyProportions(
    measurements,
    bodySettings.heightCm,
    bodySettings.gender
  );

  return (
    <main className="relative bg-bg text-text min-h-screen">
      {/* Background atmosphere — cool blue + cyan, "health/wellness" vibe */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 80% 0%, rgba(125, 211, 255, 0.10) 0%, transparent 55%), radial-gradient(ellipse at 20% 60%, rgba(167, 139, 250, 0.07) 0%, transparent 55%)',
        }}
      />

      <div className="relative container-safe pt-6 pb-24 max-w-3xl mx-auto">
        <header className="mb-6 md:mb-8">
          <div
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] font-bold mb-3"
            style={{ color: '#7dd3ff' }}
          >
            <HeartPulse size={12} />
            PureX Health
          </div>
          <h1 className="font-display font-bold text-3xl md:text-4xl tracking-tight leading-[1.05] mb-2">
            Your body, mapped.
          </h1>
          <p
            className="text-text-muted leading-relaxed max-w-xl"
            style={{ fontSize: 15 }}
          >
            Measurements, lab reports, daily vitals, mood pattern, and
            the health conditions your coach uses to tailor your plan.
            Everything in one place.
          </p>
        </header>

        <HealthPageView
          measurements={measurements}
          bodySettings={bodySettings}
          proportions={proportions}
          healthReports={healthReports}
          moodHistory={moodHistoryRows}
          dailyInputs={inputsResult.inputs}
        />
      </div>
    </main>
  );
}

// Defensive: ensure EMPTY_PROFILE_BODY_SETTINGS is referenced so
// the import stays useful if the body data fetches ever fall back.
void EMPTY_PROFILE_BODY_SETTINGS;
