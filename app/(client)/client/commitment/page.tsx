import Link from 'next/link';
import { Metadata } from 'next';
import { ArrowLeft, Calendar, Flame, Target, Heart, CheckCircle2 } from 'lucide-react';
import { getMockClientPact, COMMITMENT_MILESTONES } from '@/lib/data/commitment';
import { cn } from '@/lib/cn';

export const metadata: Metadata = {
  title: 'My 100-Day Pact · PURE X',
};

export default function CommitmentPage() {
  const pact = getMockClientPact();
  const daysLeft = 100 - pact.metrics.currentDay;
  const progressPercent = (pact.metrics.currentDay / 100) * 100;

  return (
    <main className="bg-bg text-text min-h-screen">
      <div className="container-safe py-8 md:py-12 max-w-4xl">
        {/* Back link */}
        <Link
          href="/client/dashboard"
          className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted hover:text-accent transition-colors mb-6"
        >
          <ArrowLeft size={12} />
          Back to dashboard
        </Link>

        {/* ─── Hero header ─── */}
        <div className="rounded-2xl bg-bg-card border border-accent/30 p-6 md:p-10 mb-6 relative overflow-hidden">
          <div
            aria-hidden
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, rgba(198, 255, 61, 0.15) 0%, transparent 70%)',
            }}
          />

          <div className="relative">
            <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-4">
              <Flame size={12} strokeWidth={2.5} />
              The 100-Day Commitment
            </div>

            <div className="flex items-baseline gap-3 mb-2">
              <span className="font-display font-bold text-6xl md:text-8xl tracking-tight text-white leading-none">
                {pact.metrics.currentDay}
              </span>
              <span className="font-display font-semibold text-2xl md:text-3xl text-text-muted leading-none">
                / 100
              </span>
            </div>

            <div className="font-mono text-xs uppercase tracking-[0.18em] text-text-muted mb-6">
              {daysLeft} days remaining · Reveal Day {pact.endDate}
            </div>

            {/* Big progress bar */}
            <div className="relative mb-4">
              <div className="h-3 rounded-full bg-bg-elevated overflow-hidden">
                <div
                  className="h-full transition-all duration-1000"
                  style={{
                    width: `${progressPercent}%`,
                    background:
                      'linear-gradient(90deg, #c6ff3d 0%, #68a00c 70%, #c6ff3d 100%)',
                    boxShadow: '0 0 16px rgba(198, 255, 61, 0.6)',
                  }}
                />
              </div>

              <div className="absolute inset-0 flex items-center pointer-events-none">
                {COMMITMENT_MILESTONES.map((m) => {
                  const passed = pact.metrics.currentDay >= m.day;
                  return (
                    <div
                      key={m.day}
                      className="absolute -translate-x-1/2"
                      style={{ left: `${m.day}%` }}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 rounded-full border-2 transition-all duration-500',
                          passed
                            ? 'bg-accent border-accent scale-110'
                            : 'bg-bg-elevated border-border-soft'
                        )}
                        style={{
                          boxShadow: passed ? '0 0 10px rgba(198, 255, 61, 0.8)' : 'none',
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Milestone labels */}
            <div className="relative h-5 pointer-events-none">
              {COMMITMENT_MILESTONES.map((m) => {
                const passed = pact.metrics.currentDay >= m.day;
                return (
                  <div
                    key={m.day}
                    className="absolute -translate-x-1/2 text-center"
                    style={{ left: `${m.day}%` }}
                  >
                    <div
                      className={cn(
                        'font-mono text-[9px] uppercase tracking-[0.14em] font-bold',
                        passed ? 'text-accent' : 'text-text-dim'
                      )}
                    >
                      {m.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── The Pact document ─── */}
        <div className="rounded-2xl bg-bg-card border border-border p-6 md:p-10 mb-6">
          <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-5">
            <Target size={12} strokeWidth={2.5} />
            The Pact
          </div>

          {/* Goal */}
          <div className="mb-8 pb-6 border-b border-border-soft">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold mb-2">
              Your Goal
            </div>
            <p className="font-display font-semibold text-xl md:text-2xl leading-[1.3] text-white">
              "{pact.goalStatement}"
            </p>
          </div>

          {/* Pledge */}
          <div className="mb-8 pb-6 border-b border-border-soft">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold mb-2">
              Your Pledge
            </div>
            <p className="font-display italic text-lg md:text-xl leading-[1.4] text-accent">
              "{pact.pledge}"
            </p>
          </div>

          {/* Commitments */}
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold mb-4">
              Your Commitments
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Commitment
                value={pact.metrics.workoutsLogged}
                target={pact.commitments.workoutSessions}
                label="Training sessions"
              />
              <Commitment
                value={pact.metrics.nutritionDaysLogged}
                target={Math.round(pact.commitments.nutritionLogs / 3)}
                label="Nutrition logging days"
              />
              <Commitment
                value={pact.metrics.callsCompleted}
                target={pact.commitments.weeklyCalls}
                label="Weekly coaching calls"
              />
              <Commitment
                value={pact.metrics.physioCheckInsCompleted}
                target={pact.commitments.physioCheckIns}
                label="Physio check-ins"
              />
            </div>
          </div>
        </div>

        {/* ─── Witness & signature ─── */}
        <div className="rounded-2xl bg-bg-card border border-border p-6 md:p-8">
          <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-5">
            <Heart size={12} strokeWidth={2.5} />
            Signed & Witnessed
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Your signature */}
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-text-muted font-bold mb-2">
                Your Signature
              </div>
              <div className="rounded-xl border border-border-soft p-6 bg-bg/40 min-h-[96px] flex items-center justify-center">
                {pact.signatureDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pact.signatureDataUrl}
                    alt="Your signature"
                    className="max-h-20"
                  />
                ) : (
                  <span className="font-display italic text-2xl text-text-muted">
                    {pact.clientName}
                  </span>
                )}
              </div>
              <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-text-dim flex items-center gap-2">
                <Calendar size={10} />
                Signed {pact.startDate}
              </div>
            </div>

            {/* Witnessed by */}
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-text-muted font-bold mb-2">
                Witnessed By
              </div>
              <div className="rounded-xl border border-accent/30 p-6 bg-accent/5 min-h-[96px]">
                <Link
                  href={`/experts/${pact.witnessSlug}`}
                  className="block hover:opacity-80 transition-opacity"
                >
                  <div className="font-display font-semibold text-xl text-white leading-tight">
                    {pact.witnessName}
                  </div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-accent font-bold mt-1">
                    Co-Founder & PT Head · PURE X
                  </div>
                </Link>
              </div>
              <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-text-dim">
                Your coach. Your witness. Your accountability partner.
              </div>
            </div>
          </div>

          {/* Motivation footer */}
          <div className="mt-8 pt-6 border-t border-border-soft text-center">
            <p className="font-display italic text-base md:text-lg text-text-muted max-w-xl mx-auto">
              "You are not starting a diet. You are becoming someone else."
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function Commitment({
  value,
  target,
  label,
}: {
  value: number;
  target: number;
  label: string;
}) {
  const percent = Math.min((value / target) * 100, 100);
  const onTrack = percent >= (value === 0 ? 0 : 30); // simple heuristic

  return (
    <div className="rounded-xl bg-bg/40 border border-border-soft p-4">
      <div className="flex items-baseline justify-between mb-2">
        <span className="font-display font-bold text-2xl text-white leading-none">
          {Math.round(value)}
        </span>
        <span className="font-mono text-xs text-text-muted">
          / {Math.round(target)}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-bg-elevated overflow-hidden mb-2">
        <div
          className={cn(
            'h-full transition-all duration-1000',
            onTrack ? 'bg-accent' : 'bg-amber'
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex items-center gap-1.5">
        <CheckCircle2 size={10} className="text-accent" />
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
          {label}
        </span>
      </div>
    </div>
  );
}
