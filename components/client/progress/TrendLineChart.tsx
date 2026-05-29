'use client';

/**
 * Lightweight SVG line chart for daily score trend.
 *
 * Whoop-style: smooth curve, color-zoned (green > 70 / yellow 50-70 /
 * red < 50), with subtle dots on actual data points and a soft area
 * fill under the line. No external chart lib — keeps the bundle
 * small and the styling exactly matches the PureX dark theme.
 */

import { useMemo } from 'react';

interface Point {
  date: string;          // YYYY-MM-DD
  value: number | null;  // 0..100, null = no data
}

interface Props {
  data: Point[];
  height?: number;
  /** Y threshold for the "goal line" — drawn as a dashed reference. */
  goalLine?: number;
}

export function TrendLineChart({ data, height = 120, goalLine = 70 }: Props) {
  const width = 600;             // viewBox, scales via CSS
  const padding = { top: 12, right: 8, bottom: 16, left: 8 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const stats = useMemo(() => {
    const filled = data
      .map((d, i) => ({ ...d, i }))
      .filter((d) => d.value !== null) as Array<{ date: string; value: number; i: number }>;
    const min = 0;
    const max = 100;
    const totalDays = data.length;
    return { filled, min, max, totalDays };
  }, [data]);

  const xFor = (idx: number) =>
    padding.left + (idx / Math.max(1, stats.totalDays - 1)) * innerW;
  const yFor = (val: number) =>
    padding.top + innerH - ((val - stats.min) / (stats.max - stats.min)) * innerH;

  // Build smooth catmull-rom-ish path through filled points
  const linePath = useMemo(() => {
    if (stats.filled.length === 0) return '';
    if (stats.filled.length === 1) {
      const p = stats.filled[0];
      return `M ${xFor(p.i)} ${yFor(p.value)}`;
    }
    const pts = stats.filled.map((p) => ({ x: xFor(p.i), y: yFor(p.value) }));
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }, [stats]); // eslint-disable-line react-hooks/exhaustive-deps

  // Area fill = line path + close to bottom
  const areaPath = linePath
    ? `${linePath} L ${xFor(stats.filled[stats.filled.length - 1].i)} ${
        padding.top + innerH
      } L ${xFor(stats.filled[0].i)} ${padding.top + innerH} Z`
    : '';

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c6ff3d" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#c6ff3d" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Goal line — dashed at threshold */}
      <line
        x1={padding.left}
        x2={padding.left + innerW}
        y1={yFor(goalLine)}
        y2={yFor(goalLine)}
        stroke="rgba(255,255,255,0.18)"
        strokeWidth={1}
        strokeDasharray="3 4"
      />
      {/* Goal label */}
      <text
        x={padding.left + innerW}
        y={yFor(goalLine) - 4}
        textAnchor="end"
        fontSize={10}
        fill="rgba(255,255,255,0.40)"
        fontFamily="ui-monospace, monospace"
      >
        {goalLine}
      </text>

      {/* Area fill */}
      {areaPath && <path d={areaPath} fill="url(#trendArea)" />}

      {/* Line */}
      {linePath && (
        <path
          d={linePath}
          fill="none"
          stroke="#c6ff3d"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: 'drop-shadow(0 0 4px rgba(198,255,61,0.45))' }}
        />
      )}

      {/* Dots on each filled point */}
      {stats.filled.map((p) => (
        <circle
          key={p.date}
          cx={xFor(p.i)}
          cy={yFor(p.value)}
          r={2.5}
          fill="#c6ff3d"
          stroke="#0a0c09"
          strokeWidth={1.5}
        />
      ))}

      {/* X axis labels — first and last date */}
      {data.length > 0 && (
        <>
          <text
            x={padding.left}
            y={height - 2}
            textAnchor="start"
            fontSize={9}
            fill="rgba(255,255,255,0.35)"
            fontFamily="ui-monospace, monospace"
          >
            {labelDate(data[0].date)}
          </text>
          <text
            x={padding.left + innerW}
            y={height - 2}
            textAnchor="end"
            fontSize={9}
            fill="rgba(255,255,255,0.35)"
            fontFamily="ui-monospace, monospace"
          >
            {labelDate(data[data.length - 1].date)}
          </text>
        </>
      )}
    </svg>
  );
}

function labelDate(iso: string): string {
  const dt = new Date(iso + 'T00:00:00');
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
