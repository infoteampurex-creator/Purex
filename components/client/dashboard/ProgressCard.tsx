'use client';

import { motion } from 'framer-motion';
import { TrendingDown, ChevronRight, Target } from 'lucide-react';
import Link from 'next/link';
import { MOCK_PROGRESS } from '@/lib/data/client-mock';

export function ProgressCard() {
  const { currentWeight, startWeight, targetWeight, unit, weeklyData } = MOCK_PROGRESS;
  const lost = startWeight - currentWeight;
  const remaining = currentWeight - targetWeight;
  const totalLoss = startWeight - targetWeight;
  const progressPercent = Math.min(100, Math.round((lost / totalLoss) * 100));

  // Mini chart coordinates
  const chartWidth = 260;
  const chartHeight = 60;
  const values = weeklyData.map((d) => d.value);
  const min = Math.min(...values) - 0.3;
  const max = Math.max(...values) + 0.3;
  const range = max - min || 1;

  const points = weeklyData.map((d, i) => {
    const x = (i / (weeklyData.length - 1)) * chartWidth;
    const y = chartHeight - ((d.value - min) / range) * chartHeight;
    return `${x},${y}`;
  });
  const pointsString = points.join(' ');
  const areaPath = `M0,${chartHeight} L${pointsString.replace(/ /g, ' L')} L${chartWidth},${chartHeight} Z`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
      className="bg-bg-card border border-border rounded-2xl p-5 md:p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold mb-1">
            Progress
          </div>
          <h3 className="font-display font-semibold text-lg tracking-tight">Weight trend</h3>
        </div>
        <Link href="/client/progress" className="text-xs text-text-muted hover:text-accent font-medium flex items-center gap-1 transition-colors">
          Full report
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="flex items-baseline gap-3 mb-1">
        <span className="font-display font-bold text-3xl md:text-4xl text-text tracking-tight leading-none">
          {currentWeight}
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-text-muted font-medium">
          {unit}
        </span>
        <span className="inline-flex items-center gap-0.5 text-xs font-bold text-accent">
          <TrendingDown size={12} strokeWidth={2.5} />
          -{lost.toFixed(1)}{unit}
        </span>
      </div>

      <div className="text-xs text-text-muted mb-5">
        Started at {startWeight}{unit} · Target {targetWeight}{unit}
      </div>

      {/* Mini chart */}
      <div className="mb-5 -mx-2">
        <svg
          width="100%"
          height={chartHeight + 8}
          viewBox={`0 -4 ${chartWidth} ${chartHeight + 8}`}
          preserveAspectRatio="none"
          className="block"
        >
          <defs>
            <linearGradient id="progress-area" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#c6ff3d" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#c6ff3d" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            d={areaPath}
            fill="url(#progress-area)"
          />
          <motion.polyline
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
            points={pointsString}
            fill="none"
            stroke="#c6ff3d"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 6px rgba(198, 255, 61, 0.5))' }}
          />
          {/* Latest point */}
          {points.length > 0 && (
            <circle
              cx={points[points.length - 1].split(',')[0]}
              cy={points[points.length - 1].split(',')[1]}
              r="4"
              fill="#c6ff3d"
              style={{ filter: 'drop-shadow(0 0 6px rgba(198, 255, 61, 0.8))' }}
            />
          )}
        </svg>
        <div className="flex justify-between mt-1.5">
          {weeklyData.map((d) => (
            <span
              key={d.day}
              className="font-mono text-[9px] uppercase tracking-[0.1em] text-text-dim font-medium"
            >
              {d.day}
            </span>
          ))}
        </div>
      </div>

      {/* Progress to goal */}
      <div className="pt-4 border-t border-border-soft">
        <div className="flex items-center justify-between mb-2">
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold">
            <Target size={11} />
            Goal Progress
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent font-bold">
            {progressPercent}%
          </span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.8 }}
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #c6ff3d, #4dffb8)',
              boxShadow: '0 0 8px rgba(198, 255, 61, 0.4)',
            }}
          />
        </div>
        <div className="text-[11px] text-text-muted mt-2">
          {remaining > 0 ? (
            <>
              <span className="text-accent font-bold">{remaining.toFixed(1)}{unit}</span> to go
            </>
          ) : (
            <span className="text-accent font-bold">Goal reached 🎯</span>
          )}
        </div>
      </div>
    </motion.section>
  );
}
