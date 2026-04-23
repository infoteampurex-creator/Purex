import Link from 'next/link';
import { Metadata } from 'next';
import { ArrowLeft, Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getMockClientScore, statusLabel, statusColor } from '@/lib/data/score';
import { ScoreTrendChart } from '@/components/client/ScoreTrendChart';

export const metadata: Metadata = {
  title: 'My PURE X Score · PURE X',
};

export default function ScorePage() {
  const score = getMockClientScore();
  const totalStatus =
    score.total >= 90 ? 'peak' :
    score.total >= 80 ? 'strong' :
    score.total >= 65 ? 'steady' :
    score.total >= 50 ? 'watch' : 'risk';
  const totalColor = statusColor(totalStatus);
  const TrendIcon =
    score.trend === 'up' ? TrendingUp : score.trend === 'down' ? TrendingDown : Minus;

  return (
    <main className="bg-bg text-text min-h-screen">
      <div className="container-safe py-8 md:py-12 max-w-5xl">
        {/* Back link */}
        <Link
          href="/client/dashboard"
          className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted hover:text-accent transition-colors mb-6"
        >
          <ArrowLeft size={12} />
          Back to dashboard
        </Link>

        {/* ─── Hero — big score display ────────────────────────────── */}
        <div
          className="rounded-2xl border p-6 md:p-10 mb-6 relative overflow-hidden"
          style={{
            background: 'var(--color-bg-card)',
            borderColor: `${totalColor}4D`,
          }}
        >
          <div
            aria-hidden
            className="absolute -top-24 -right-24 w-80 h-80 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${totalColor}28 0%, transparent 70%)`,
            }}
          />

          <div className="relative grid md:grid-cols-[auto_1fr] gap-6 md:gap-10 items-center">
            {/* Big number */}
            <div>
              <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-3">
                <span className="w-3 h-px bg-accent" />
                Today's PURE X Score
              </div>
              <div className="flex items-baseline gap-3">
                <span
                  className="font-display font-bold text-7xl md:text-9xl leading-none tabular-nums"
                  style={{ color: totalColor }}
                >
                  {score.total}
                </span>
                <span className="font-display font-semibold text-2xl md:text-3xl text-text-muted leading-none">
                  / 100
                </span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border"
                  style={{
                    background: `${totalColor}14`,
                    borderColor: `${totalColor}66`,
                    color: totalColor,
                  }}
                >
                  <TrendIcon size={11} strokeWidth={2.5} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] font-bold">
                    {score.delta > 0 ? '+' : ''}
                    {score.delta.toFixed(1)} · {statusLabel(totalStatus)}
                  </span>
                </div>
                <div className="font-mono text-[10px] text-text-muted uppercase tracking-[0.14em]">
                  vs 7-day avg
                </div>
              </div>
            </div>

            {/* Morning brief */}
            <div className="md:pl-10 md:border-l md:border-border-soft">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-3 flex items-center gap-2">
                <Info size={12} strokeWidth={2.5} />
                Morning Brief
              </div>
              <p className="font-display text-lg md:text-xl text-text leading-[1.4]">
                {score.morningInsight}
              </p>
            </div>
          </div>
        </div>

        {/* ─── 30-day trend chart ────────────────────────────────── */}
        <div className="rounded-2xl bg-bg-card border border-border p-5 md:p-7 mb-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-1">
                30-Day Trend
              </div>
              <div className="font-display font-semibold text-xl md:text-2xl tracking-tight">
                Your score over time.
              </div>
            </div>
            <div className="font-mono text-[10px] text-text-muted uppercase tracking-[0.14em] text-right">
              Last 30 days
            </div>
          </div>

          <ScoreTrendChart history={score.history} />
        </div>

        {/* ─── Pillar breakdown ──────────────────────────────────── */}
        <div className="rounded-2xl bg-bg-card border border-border p-5 md:p-7">
          <div className="mb-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-1">
              5 Pillars · Weighted Breakdown
            </div>
            <div className="font-display font-semibold text-xl md:text-2xl tracking-tight">
              What your score is made of.
            </div>
          </div>

          <div className="space-y-3">
            {score.pillars.map((pillar) => (
              <div
                key={pillar.key}
                className="rounded-xl border border-border-soft bg-bg/40 p-4 md:p-5"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1">
                      <span
                        className="font-display font-semibold text-base md:text-lg text-white"
                      >
                        {pillar.label}
                      </span>
                      <span
                        className="font-mono text-[9px] uppercase tracking-[0.14em] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: `${pillar.color}14`,
                          color: pillar.color,
                          border: `1px solid ${pillar.color}40`,
                        }}
                      >
                        {statusLabel(pillar.status)}
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-dim">
                        {Math.round(pillar.weight * 100)}% weight
                      </span>
                    </div>
                    <p className="text-xs text-text-muted">{pillar.description}</p>
                  </div>

                  <div
                    className="font-display font-bold text-3xl md:text-4xl leading-none tabular-nums flex-shrink-0"
                    style={{ color: pillar.color }}
                  >
                    {pillar.score}
                  </div>
                </div>

                {/* Bar */}
                <div className="h-2 rounded-full bg-bg-elevated overflow-hidden mb-3">
                  <div
                    className="h-full transition-all duration-1000"
                    style={{
                      width: `${pillar.score}%`,
                      background: pillar.color,
                      boxShadow: `0 0 10px ${pillar.color}80`,
                    }}
                  />
                </div>

                {/* Insight */}
                <div className="flex items-start gap-2 pt-2 border-t border-border-soft">
                  <Info
                    size={12}
                    className="text-text-muted flex-shrink-0 mt-0.5"
                    strokeWidth={2}
                  />
                  <p className="text-xs text-text-muted leading-relaxed">
                    {pillar.insight}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Footer explainer ──────────────────────────────────── */}
        <div className="mt-6 rounded-xl bg-bg-card/60 border border-border-soft p-4 md:p-5">
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
              style={{
                background: 'rgba(198, 255, 61, 0.08)',
                border: '1px solid rgba(198, 255, 61, 0.25)',
                color: '#c6ff3d',
              }}
            >
              <Info size={14} />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold mb-1">
                How the score is calculated
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                The PURE X Score is a weighted average of 5 pillars — Training Load (25%),
                Recovery Quality (20%), Mental Resilience (15%), Nutrition (25%), and
                Medical Markers (15%). Each pillar updates daily from your app logs,
                wearable data, and coach check-ins. Your coaches see the same score — so
                when a pillar dips, they're already on it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
