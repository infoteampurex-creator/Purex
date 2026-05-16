import { ImageResponse } from 'next/og';
import { NextResponse } from 'next/server';
import {
  getAdminParticipantById,
  getMotherStrongLeaderboard,
  getMotherStrongConfig,
} from '@/lib/data/mother-strong';
import { requireAuth } from '@/lib/supabase/server';

/**
 * Generate a personalised "Mother Strong" gratitude PNG for a single
 * participant. Renders 1200×630 (open-graph standard) — large enough
 * to look crisp when forwarded on WhatsApp / Instagram / Facebook,
 * small enough to download in under a second on 3G.
 *
 * Admin-only. The Edge runtime cannot use sharp / @supabase admin
 * client identically, but the SSR client + cookies works — admin's
 * login lets us read the full participant detail.
 */

export const runtime = 'nodejs'; // Node so we can use the admin Supabase client
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;

  // Admin guard
  const adminUser = await requireAuth({ adminOnly: true });
  if (!adminUser) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 401 });
  }

  const [participant, board, config] = await Promise.all([
    getAdminParticipantById(id),
    getMotherStrongLeaderboard(),
    getMotherStrongConfig(),
  ]);

  if (!participant) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Find this participant's leaderboard stats.
  const stats = board.find((b) => b.id === participant.id);
  const daysHit = stats?.daysHitGoal ?? 0;
  const totalSteps = stats?.totalSteps ?? 0;
  const consistency = stats?.consistencyPct ?? 0;
  const streak = stats?.currentStreak ?? 0;
  const cohortLabel = config.cohortLabel ?? "Mother's Day Cohort";

  // First-name display only — preserves dignity vs. full name.
  const firstName = participant.fullName.trim().split(/\s+/)[0];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background:
            'linear-gradient(135deg, #0a0c09 0%, #131811 50%, #0a0c09 100%)',
          color: '#e8eadc',
          padding: '64px 72px',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle accent halo top-right */}
        <div
          style={{
            position: 'absolute',
            top: -200,
            right: -200,
            width: 600,
            height: 600,
            borderRadius: 600,
            background:
              'radial-gradient(circle, rgba(198, 255, 61, 0.30), transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span
            style={{
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: -0.5,
              color: '#f4f7eb',
            }}
          >
            PURE
          </span>
          <span
            style={{
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: -0.5,
              color: '#c6ff3d',
            }}
          >
            X
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 4,
              color: '#a0a69a',
              textTransform: 'uppercase',
              marginLeft: 24,
            }}
          >
            Mother Strong
          </span>
        </div>

        {/* Hero text */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 64,
            flex: 1,
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 6,
              color: '#c6ff3d',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            {cohortLabel}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 76,
              fontWeight: 800,
              letterSpacing: -2,
              lineHeight: 1.05,
              color: '#f4f7eb',
              marginBottom: 12,
            }}
          >
            {firstName}, you walked&nbsp;strong.
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 22,
              color: '#a0a69a',
              lineHeight: 1.45,
              maxWidth: 880,
            }}
          >
            Sixty days. Ten thousand steps a day. You showed up. Here is what
            that looked like.
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            gap: 24,
            marginTop: 'auto',
          }}
        >
          <Stat label="Days hit 10K" value={`${daysHit} / 60`} />
          <Stat label="Total steps" value={totalSteps.toLocaleString('en-IN')} />
          <Stat label="Best streak" value={`${streak} days`} />
          <Stat label="Consistency" value={`${consistency.toFixed(0)}%`} />
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 28,
            paddingTop: 18,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            fontSize: 13,
            color: '#a0a69a',
            letterSpacing: 3,
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          <span>{participant.displayId}</span>
          <span>Train for life. Not just aesthetics.</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        padding: 20,
        borderRadius: 16,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.10)',
      }}
    >
      <div
        style={{
          fontSize: 12,
          letterSpacing: 3,
          textTransform: 'uppercase',
          fontWeight: 700,
          color: '#a0a69a',
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: 32,
          fontWeight: 800,
          color: '#f4f7eb',
        }}
      >
        {value}
      </div>
    </div>
  );
}
