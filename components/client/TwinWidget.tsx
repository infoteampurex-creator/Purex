'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles, Play } from 'lucide-react';
import type { DigitalTwin } from '@/lib/data/twin';

interface TwinWidgetProps {
  twin: DigitalTwin;
}

/**
 * Digital Twin widget for the client dashboard.
 *
 * Keeps Three.js off the dashboard (for performance + to avoid reconciler
 * races). Shows a visually striking preview card; the full interactive
 * 3D viewer lives at /client/twin.
 */
export function TwinWidget({ twin }: TwinWidgetProps) {
  const current = twin.projections[0];
  const day100 = twin.projections[3];

  const weightDelta = day100.weightKg - current.weightKg;
  const bodyFatDelta = day100.bodyFatPercent - current.bodyFatPercent;

  return (
    <Link
      href="/client/twin"
      className="group relative block rounded-2xl bg-bg-card border border-border hover:border-accent/40 transition-all duration-500 overflow-hidden"
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity duration-700"
        style={{
          background:
            'radial-gradient(circle, rgba(198, 255, 61, 0.14) 0%, transparent 70%)',
        }}
      />

      <div className="relative p-5 md:p-6">
        {/* Header */}
        <div className="mb-5">
          <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold mb-1.5">
            <Sparkles size={12} strokeWidth={2.5} />
            Digital Twin
          </div>
          <div className="font-display font-semibold text-lg md:text-xl text-white leading-tight">
            Meet your Day 100 self.
          </div>
          <div className="font-mono text-[10px] text-text-muted mt-1">
            {twin.goalLabel} · {twin.daysToReveal} days to reveal
          </div>
        </div>

        {/* Preview panel — gradient + stylized frame */}
        <div
          className="relative h-48 rounded-xl overflow-hidden mb-5 border border-border-soft"
          style={{
            background: `
              radial-gradient(ellipse at 30% 50%, rgba(125, 211, 255, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 50%, rgba(198, 255, 61, 0.2) 0%, transparent 50%),
              linear-gradient(180deg, #0f1410 0%, #0a0c09 100%)
            `,
          }}
        >
          {/* Floating particles */}
          {[...Array(8)].map((_, i) => (
            <span
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${55 + (i * 7) % 40}%`,
                top: `${15 + (i * 11) % 70}%`,
                width: `${1 + (i % 3)}px`,
                height: `${1 + (i % 3)}px`,
                background: '#c6ff3d',
                opacity: 0.4 + (i % 3) * 0.2,
                boxShadow: '0 0 4px rgba(198, 255, 61, 0.6)',
                animation: `twin-widget-particle ${4 + i}s ease-in-out ${i * 0.3}s infinite`,
              }}
            />
          ))}

          {/* Centered play-to-view prompt */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center border-2 border-accent/40 bg-accent/10 backdrop-blur-sm group-hover:border-accent group-hover:bg-accent/20 transition-all"
                  style={{ boxShadow: '0 0 24px rgba(198, 255, 61, 0.25)' }}
                >
                  <Play
                    size={18}
                    strokeWidth={2.5}
                    className="text-accent ml-0.5"
                    fill="#c6ff3d"
                  />
                </div>
                {/* Pulse ring */}
                <div
                  className="absolute inset-0 rounded-full border border-accent/30 group-hover:border-accent/60"
                  style={{
                    animation: 'twin-widget-pulse 2s ease-out infinite',
                  }}
                />
              </div>
              <div className="text-center">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent font-bold">
                  Interactive 3D
                </div>
                <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted mt-1">
                  Tap to view
                </div>
              </div>
            </div>
          </div>

          <style jsx>{`
            @keyframes twin-widget-particle {
              0%,
              100% {
                transform: translateY(0) scale(1);
                opacity: 0.3;
              }
              50% {
                transform: translateY(-20px) scale(1.3);
                opacity: 0.8;
              }
            }
            @keyframes twin-widget-pulse {
              0% {
                transform: scale(1);
                opacity: 0.8;
              }
              100% {
                transform: scale(1.6);
                opacity: 0;
              }
            }
          `}</style>
        </div>

        {/* Delta summary */}
        <div className="grid grid-cols-2 gap-3 pb-3 border-b border-border-soft">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted font-bold">
              Weight
            </span>
            <span
              className="font-display font-bold text-sm tabular-nums"
              style={{ color: weightDelta < 0 ? '#c6ff3d' : '#7dd3ff' }}
            >
              {weightDelta > 0 ? '+' : ''}
              {weightDelta.toFixed(1)}kg
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted font-bold">
              Body Fat
            </span>
            <span
              className="font-display font-bold text-sm tabular-nums"
              style={{ color: bodyFatDelta < 0 ? '#c6ff3d' : '#7dd3ff' }}
            >
              {bodyFatDelta > 0 ? '+' : ''}
              {bodyFatDelta.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center justify-end pt-3">
          <div className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold group-hover:gap-2 transition-all">
            Explore in 3D
            <ArrowRight size={11} strokeWidth={2.5} />
          </div>
        </div>
      </div>
    </Link>
  );
}
