/**
 * Compact SVG sparkline for showing 7-30 day trends next to a KPI.
 *
 * No chart-library dependency — pure SVG so it's tree-shakeable and
 * renders identically in the WebView. Whoop / Fitbit put one of these
 * under every top-of-card number; it adds a huge perceived "data
 * density" lift without any real information cost.
 *
 * Renders:
 *   - The path (stroke)
 *   - A soft gradient fill under the line
 *   - Optional last-point dot
 *
 * Trend colour is auto-picked from the data:
 *   - up   → accent lime
 *   - down → soft red
 *   - flat → text-dim
 * Override with the `color` prop if the containing card has a fixed
 * palette (e.g. gold PureX Score hero).
 */
export function Sparkline({
  data,
  width = 80,
  height = 24,
  color,
  showDot = true,
  strokeWidth = 1.5,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showDot?: boolean;
  strokeWidth?: number;
}) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  // Deterministic-ish trend detection — compare last-third vs first-third
  // mean. Avoids being thrown by a single outlier.
  const third = Math.max(1, Math.floor(data.length / 3));
  const first = data.slice(0, third).reduce((a, b) => a + b, 0) / third;
  const last = data.slice(-third).reduce((a, b) => a + b, 0) / third;
  const delta = last - first;
  const relDelta = delta / (Math.abs(first) || 1);
  const trend: 'up' | 'down' | 'flat' =
    relDelta > 0.05 ? 'up' : relDelta < -0.05 ? 'down' : 'flat';

  const strokeColor =
    color ??
    (trend === 'up'
      ? '#c6ff3d'
      : trend === 'down'
      ? '#ff6b6b'
      : 'rgba(255,255,255,0.35)');

  // Map data points to SVG coordinates. Y is inverted (SVG origin is top).
  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 2) - 1;
    return { x, y };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');

  // Area under the line = same path + bottom-corners → close.
  const areaD =
    pathD +
    ` L ${width.toFixed(2)} ${height.toFixed(2)}` +
    ` L 0 ${height.toFixed(2)} Z`;

  const gradientId = `spark-grad-${Math.abs(
    data.reduce((h, v) => (h * 31 + v) | 0, 7)
  )}`;

  const lastPoint = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradientId})`} />
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {showDot && (
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={2}
          fill={strokeColor}
        />
      )}
    </svg>
  );
}
