'use client';

import { motion } from 'framer-motion';
import { ProgressRing } from './ProgressRing';
import { MOCK_MACROS } from '@/lib/data/client-mock';

interface MacroBarProps {
  label: string;
  current: number;
  target: number;
  color: string;
  unit?: string;
}

function MacroBar({ label, current, target, color, unit = 'g' }: MacroBarProps) {
  const percent = Math.min(100, (current / target) * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted font-bold">
          {label}
        </span>
        <span className="text-[11px] font-medium">
          <span style={{ color }}>{current}</span>
          <span className="text-text-muted">/{target}{unit}</span>
        </span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            boxShadow: `0 0 8px ${color}40`,
          }}
        />
      </div>
    </div>
  );
}

export function NutritionCard() {
  const { caloriesConsumed, caloriesTarget, protein, carbs, fats } = MOCK_MACROS;
  const remaining = caloriesTarget - caloriesConsumed;
  const progress = (caloriesConsumed / caloriesTarget) * 100;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
      className="bg-bg-card border border-border rounded-2xl p-5 md:p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold mb-1">
            Nutrition
          </div>
          <h3 className="font-display font-semibold text-lg tracking-tight">Today&rsquo;s intake</h3>
        </div>
        <button className="text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted hover:text-accent transition-colors font-bold">
          Log meal +
        </button>
      </div>

      <div className="flex items-center gap-5 mb-6">
        <ProgressRing progress={progress} size={120} strokeWidth={9}>
          <div className="font-display font-bold text-xl text-accent tracking-tight leading-none">
            {caloriesConsumed.toLocaleString()}
          </div>
          <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted font-bold mt-0.5">
            of {caloriesTarget}
          </div>
        </ProgressRing>

        <div className="flex-1 min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted font-bold mb-1">
            Remaining
          </div>
          <div className="font-display font-bold text-3xl md:text-4xl text-text tracking-tight leading-none">
            {remaining.toLocaleString()}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted mt-2 font-medium">
            kcal left
          </div>
        </div>
      </div>

      <div className="space-y-3.5 pt-5 border-t border-border-soft">
        <MacroBar label="Protein" current={protein.current} target={protein.target} color="#c6ff3d" />
        <MacroBar label="Carbs" current={carbs.current} target={carbs.target} color="#7dd3ff" />
        <MacroBar label="Fats" current={fats.current} target={fats.target} color="#ffb84d" />
      </div>
    </motion.section>
  );
}
