'use client';

import { useState } from 'react';
import type { DayScore } from '@/lib/data/score';

interface ScoreTrendChartProps {
  history: DayScore[];
}

/**
 * Pure-SVG trend chart with hover interactivity.
 * No chart library dependency — fully custom for the PURE X aesthetic.
 */
export function ScoreTrendChart({ history }: ScoreTrendChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 800;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Scale: score 0-100 -> y, index 0-29 -> x
  const xAt = (i: number) => padding.left + (i / (history.length - 1)) * chartW;
  const yAt = (s: number) => padding.top + (1 - s / 100) * chartH;

  // Line points
  const linePoints = history.map((d, i) => `${xAt(i)},${yAt(d.total)}`).join(' ');

  // Area fill (same path but closed to the bottom)
  const areaPath =
    `M ${xAt(0)},${yAt(history[0].total)} ` +
    history
      .map((d, i) => (i === 0 ? '' : `L ${xAt(i)},${yAt(d.total)}`))
      .join(' ') +
    ` L ${xAt(history.length - 1)},${padding.top + chartH}` +
    ` L ${xAt(0)},${padding.top + chartH} Z`;

  // Y-axis gridlines at 40, 60, 80, 100
  const gridValues = [40, 60, 80, 100];

  const avg = Math.round(history.reduce((s, d) => s + d.total, 0) / history.length);
  const hovered = hoverIdx !== null ? history[hoverIdx] : null;

  return (
    <div className="relative">
      {/* Summary row */}
      <div className="flex items-end justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-baseline gap-6">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-text-muted">
              30-day avg
            </div>
            <div className="font-display font-bold text-2xl text-text tabular-nums leading-none mt-1">
              {avg}
            </div>
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-text-muted">
              Best day
            </div>
            <div className="font-display font-bold text-2xl text-accent tabular-nums leading-none mt-1">
              {Math.max(...history.map((d) => d.total))}
            </div>
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-text-muted">
              Worst day
            </div>
            <div className="font-display font-bold text-2xl text-text-muted tabular-nums leading-none mt-1">
              {Math.min(...history.map((d) => d.total))}
            </div>
          </div>
        </div>

        {hovered && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/30">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted">
              {new Date(hovered.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <span className="font-display font-bold text-accent tabular-nums">
              {hovered.total}
            </span>
          </div>
        )}
      </div>

      {/* SVG chart */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="score-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#c6ff3d" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#c6ff3d" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="score-line" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#68a00c" />
            <stop offset="50%" stopColor="#c6ff3d" />
            <stop offset="100%" stopColor="#c6ff3d" />
          </linearGradient>
        </defs>

        {/* Gridlines */}
        {gridValues.map((v) => (
          <g key={v}>
            <line
              x1={padding.left}
              y1={yAt(v)}
              x2={padding.left + chartW}
              y2={yAt(v)}
              stroke="#2a2f28"
              strokeWidth={1}
              strokeDasharray="2,3"
            />
            <text
              x={padding.left - 8}
              y={yAt(v) + 4}
              fill="#5a6058"
              fontSize="10"
              fontFamily="var(--font-mono), monospace"
              textAnchor="end"
            >
              {v}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#score-area)" />

        {/* Main line */}
        <polyline
          points={linePoints}
          fill="none"
          stroke="url(#score-line)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {history.map((d, i) => {
          const isHovered = hoverIdx === i;
          const isLast = i === history.length - 1;
          return (
            <g key={d.date}>
              {/* Hit area */}
              <rect
                x={xAt(i) - 12}
                y={padding.top}
                width={24}
                height={chartH}
                fill="transparent"
                onMouseEnter={() => setHoverIdx(i)}
                style={{ cursor: 'pointer' }}
              />
              {/* Dot */}
              {(isHovered || isLast) && (
                <>
                  {isHovered && (
                    <line
                      x1={xAt(i)}
                      y1={padding.top}
                      x2={xAt(i)}
                      y2={padding.top + chartH}
                      stroke="#c6ff3d"
                      strokeWidth={1}
                      strokeDasharray="2,2"
                      opacity={0.4}
                    />
                  )}
                  <circle
                    cx={xAt(i)}
                    cy={yAt(d.total)}
                    r={isHovered ? 6 : 4}
                    fill="#0a0c09"
                    stroke="#c6ff3d"
                    strokeWidth={2}
                  />
                  {isLast && !isHovered && (
                    <circle
                      cx={xAt(i)}
                      cy={yAt(d.total)}
                      r={9}
                      fill="none"
                      stroke="#c6ff3d"
                      strokeWidth={1}
                      opacity={0.4}
                    >
                      <animate
                        attributeName="r"
                        values="5;12;5"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.5;0;0.5"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                </>
              )}
            </g>
          );
        })}

        {/* X-axis labels every 5 days */}
        {history.map((d, i) => {
          if (i % 5 !== 0 && i !== history.length - 1) return null;
          return (
            <text
              key={d.date}
              x={xAt(i)}
              y={padding.top + chartH + 20}
              fill="#5a6058"
              fontSize="10"
              fontFamily="var(--font-mono), monospace"
              textAnchor="middle"
            >
              {new Date(d.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
