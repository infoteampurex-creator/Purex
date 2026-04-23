import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';

interface AdminStatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: ReactNode;
  trend?: { direction: 'up' | 'down' | 'flat'; value: string };
  accent?: 'lime' | 'emerald' | 'amber' | 'magenta' | 'sky';
}

const accentMap = {
  lime: { bg: 'rgba(198, 255, 61, 0.12)', fg: '#c6ff3d' },
  emerald: { bg: 'rgba(77, 255, 184, 0.12)', fg: '#4dffb8' },
  amber: { bg: 'rgba(255, 184, 77, 0.12)', fg: '#ffb84d' },
  magenta: { bg: 'rgba(255, 107, 157, 0.12)', fg: '#ff6b9d' },
  sky: { bg: 'rgba(125, 211, 255, 0.12)', fg: '#7dd3ff' },
};

export function AdminStatCard({
  label,
  value,
  sublabel,
  icon,
  trend,
  accent = 'lime',
}: AdminStatCardProps) {
  const colors = accentMap[accent];
  const TrendIcon =
    trend?.direction === 'up' ? TrendingUp : trend?.direction === 'down' ? TrendingDown : Minus;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-bg-card border border-border p-5 hover:border-border-soft transition-all">
      {/* Corner glow */}
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${colors.bg}, transparent 70%)` }}
      />

      <div className="relative flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: colors.bg, color: colors.fg }}
        >
          {icon}
        </div>
        {trend && (
          <div
            className="inline-flex items-center gap-0.5 text-[10px] font-mono uppercase tracking-[0.14em] font-bold"
            style={{ color: colors.fg }}
          >
            <TrendIcon size={11} strokeWidth={2.5} />
            {trend.value}
          </div>
        )}
      </div>

      <div className="relative">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-medium mb-1">
          {label}
        </div>
        <div
          className="font-display font-bold text-2xl md:text-3xl tracking-tight leading-none"
          style={{ color: colors.fg }}
        >
          {value}
        </div>
        {sublabel && (
          <div className="mt-2 text-xs text-text-muted">{sublabel}</div>
        )}
      </div>
    </div>
  );
}
