'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Flame, Info } from 'lucide-react';
import { getMockClientTwin } from '@/lib/data/twin';
import { TwinVisualization } from '@/components/client/TwinVisualization';
import { cn } from '@/lib/cn';

export default function TwinPage() {
  const twin = getMockClientTwin();

  const milestones = twin.projections.map((p) => ({ day: p.day, label: p.label }));
  const [selectedIdx, setSelectedIdx] = useState(3); // Default Day 100

  const current = twin.projections[0];
  const selected = twin.projections[selectedIdx];

  const weightDelta = selected.weightKg - current.weightKg;
  const bodyFatDelta = selected.bodyFatPercent - current.bodyFatPercent;
  const vo2Delta = selected.vo2max - current.vo2max;
  const strengthDelta = selected.strengthIndex - current.strengthIndex;

  return (
    <main className="bg-bg text-text min-h-screen">
      <div className="container-safe py-8 md:py-12 max-w-6xl">
        {/* Back link */}
        <Link
          href="/client/dashboard"
          className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted hover:text-accent transition-colors mb-6"
        >
          <ArrowLeft size={12} />
          Back to dashboard
        </Link>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-3">
            <Flame size={12} strokeWidth={2.5} />
            Digital Twin · {twin.goalLabel}
          </div>
          <h1 className="font-display font-semibold text-3xl md:text-5xl tracking-tight leading-[1.05] mb-3">
            Meet your <span className="text-accent">future self</span>.
          </h1>
          <p className="text-text-muted text-base md:text-lg max-w-2xl leading-relaxed">
            A visualization of where your trajectory is headed — based on your current{' '}
            <span className="text-accent font-semibold">{twin.adherenceScore}% streak</span>.
            Scrub the timeline to see yourself at 30, 60, 100, and 365 days. Every session
            you log shapes this projection.
          </p>
        </div>

        {/* Side-by-side visualizations */}
        <div className="rounded-2xl bg-bg-card border border-border p-4 md:p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-6 relative">
            {/* Current */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.22em] font-bold text-sky">
                    Today
                  </div>
                  <div className="font-display font-semibold text-base md:text-lg text-white">
                    {current.label}
                  </div>
                </div>
              </div>
              <TwinVisualization projection={current} variant="current" />
              <div className="mt-3 text-center">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold">
                  {current.weightKg}kg · {current.bodyFatPercent}% BF
                </div>
                <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-dim mt-1">
                  VO₂ {current.vo2max} · STR {current.strengthIndex}
                </div>
              </div>
            </div>

            {/* Centre badge */}
            <div className="hidden md:flex absolute inset-y-0 left-1/2 -translate-x-1/2 items-center pointer-events-none z-20">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg border border-accent/40 font-mono text-[9px] uppercase tracking-[0.22em] text-accent font-bold shadow-xl">
                <span>
                  {selected.day === 0
                    ? 'Today'
                    : selected.day === 365
                      ? '+1yr'
                      : `+${selected.day}d`}
                </span>
                <ArrowRight size={10} />
              </div>
            </div>

            {/* Projected */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.22em] font-bold text-accent">
                    Projection
                  </div>
                  <div className="font-display font-semibold text-base md:text-lg text-white">
                    {selected.label}
                  </div>
                </div>
              </div>
              <TwinVisualization projection={selected} variant="projected" />
              <div className="mt-3 text-center">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent font-bold">
                  {selected.weightKg}kg · {selected.bodyFatPercent}% BF
                </div>
                <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted mt-1">
                  VO₂ {selected.vo2max} · STR {selected.strengthIndex}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline scrubber */}
          <div className="relative pt-4 border-t border-border-soft">
            <div className="flex items-center justify-between mb-4 gap-2">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold">
                Timeline
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim">
                Tap a milestone
              </div>
            </div>

            <div className="relative h-14">
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-border rounded-full" />

              {selectedIdx > 0 && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-0.5 rounded-full transition-all duration-500"
                  style={{
                    left: '0%',
                    width: `${(selectedIdx / (milestones.length - 1)) * 100}%`,
                    background: 'linear-gradient(90deg, #7dd3ff 0%, #c6ff3d 100%)',
                    boxShadow: '0 0 8px rgba(198, 255, 61, 0.5)',
                  }}
                />
              )}

              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between items-center">
                {milestones.map((m, i) => {
                  const active = i === selectedIdx;
                  const passed = i <= selectedIdx;
                  return (
                    <button
                      key={m.day}
                      onClick={() => setSelectedIdx(i)}
                      className="relative flex flex-col items-center group"
                      aria-label={`View ${m.label}`}
                    >
                      <div
                        className={cn(
                          'w-5 h-5 rounded-full border-2 transition-all duration-300',
                          active
                            ? 'bg-accent border-accent scale-125'
                            : passed
                              ? 'bg-sky border-sky'
                              : 'bg-bg border-border'
                        )}
                        style={{
                          boxShadow: active
                            ? '0 0 12px rgba(198, 255, 61, 0.8)'
                            : 'none',
                        }}
                      />
                      <div
                        className={cn(
                          'mt-3 font-mono text-[9px] md:text-[10px] uppercase tracking-[0.12em] font-bold transition-colors whitespace-nowrap',
                          active
                            ? 'text-accent'
                            : passed
                              ? 'text-sky'
                              : 'text-text-dim group-hover:text-text-muted'
                        )}
                      >
                        {m.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Metric deltas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <DeltaCard
            label="Weight"
            current={`${current.weightKg}kg`}
            projected={`${selected.weightKg}kg`}
            delta={weightDelta}
            unit="kg"
            inverted
          />
          <DeltaCard
            label="Body Fat"
            current={`${current.bodyFatPercent}%`}
            projected={`${selected.bodyFatPercent}%`}
            delta={bodyFatDelta}
            unit="%"
            inverted
          />
          <DeltaCard
            label="VO₂ Max"
            current={`${current.vo2max}`}
            projected={`${selected.vo2max}`}
            delta={vo2Delta}
            unit=""
          />
          <DeltaCard
            label="Strength"
            current={`${current.strengthIndex}`}
            projected={`${selected.strengthIndex}`}
            delta={strengthDelta}
            unit=""
          />
        </div>

        {/* Callouts */}
        {selected.callouts.length > 0 && (
          <div className="rounded-2xl bg-bg-card border border-border p-5 md:p-7 mb-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-4">
              What {selected.label} looks like
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              {selected.callouts.map((callout, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-xl bg-bg/40 border border-border-soft"
                >
                  <div
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{
                      background: 'rgba(198, 255, 61, 0.15)',
                      border: '1px solid rgba(198, 255, 61, 0.4)',
                      color: '#c6ff3d',
                    }}
                  >
                    {i + 1}
                  </div>
                  <p className="text-sm text-text leading-relaxed">{callout}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Honesty footer */}
        <div className="rounded-2xl border border-border-soft bg-bg-card/60 p-4 md:p-5">
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
                This projection is honest
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                The projection reflects your actual{' '}
                <span className="text-text font-semibold">
                  {twin.adherenceScore}% streak
                </span>{' '}
                — not a marketing promise. Miss a week of training and the projection
                recalibrates. Nail your commitments and Day 100 you gets closer. Your
                choices today shape what you see on the right.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function DeltaCard({
  label,
  current,
  projected,
  delta,
  unit,
  inverted = false,
}: {
  label: string;
  current: string;
  projected: string;
  delta: number;
  unit: string;
  inverted?: boolean;
}) {
  const isImprovement = inverted ? delta < 0 : delta > 0;
  const isNoChange = Math.abs(delta) < 0.05;
  const color = isNoChange ? '#5a6058' : isImprovement ? '#c6ff3d' : '#ff6b5b';
  const sign = delta > 0 ? '+' : '';

  return (
    <div className="rounded-xl bg-bg-card border border-border-soft p-4">
      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted font-bold mb-2">
        {label}
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="font-display font-bold text-xl text-text-muted line-through decoration-text-dim leading-none tabular-nums">
          {current}
        </span>
        <ArrowRight size={10} className="text-text-dim" />
        <span
          className="font-display font-bold text-2xl leading-none tabular-nums"
          style={{ color }}
        >
          {projected}
        </span>
      </div>
      <div
        className="font-mono text-[10px] uppercase tracking-[0.14em] font-bold"
        style={{ color }}
      >
        {isNoChange ? 'NO CHANGE' : `${sign}${Math.abs(delta).toFixed(1)}${unit}`}
      </div>
    </div>
  );
}
