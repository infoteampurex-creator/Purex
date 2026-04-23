'use client';

import { motion } from 'framer-motion';
import { Play, Clock, Flame, Check, ChevronRight } from 'lucide-react';
import { MOCK_WORKOUT_LIBRARY, type WorkoutCard } from '@/lib/data/client-mock';
import { cn } from '@/lib/cn';

export function WorkoutCards() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
    >
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-bold mb-1">
            This Week&rsquo;s Workouts
          </div>
          <h3 className="font-display font-semibold text-lg tracking-tight">
            Your training queue
          </h3>
        </div>
        <button className="text-xs text-text-muted hover:text-accent font-medium flex items-center gap-1 transition-colors">
          See all
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {MOCK_WORKOUT_LIBRARY.map((w, i) => (
          <WorkoutCardItem key={w.id} workout={w} index={i} />
        ))}
      </div>
    </motion.section>
  );
}

// Category-based gradient thumbnails
const categoryGradients: Record<string, string> = {
  Strength:
    'radial-gradient(ellipse at 20% 30%, rgba(198, 255, 61, 0.35), transparent 60%), linear-gradient(135deg, #2a3a1a, #141810)',
  HYROX:
    'radial-gradient(ellipse at 30% 30%, rgba(255, 107, 157, 0.3), transparent 60%), linear-gradient(135deg, #2a1a25, #14101a)',
  Conditioning:
    'radial-gradient(ellipse at 30% 30%, rgba(125, 211, 255, 0.3), transparent 60%), linear-gradient(135deg, #1a2530, #10161a)',
  Mobility:
    'radial-gradient(ellipse at 30% 30%, rgba(77, 255, 184, 0.3), transparent 60%), linear-gradient(135deg, #1a2a25, #101a16)',
};

function WorkoutCardItem({ workout, index }: { workout: WorkoutCard; index: number }) {
  const gradient = categoryGradients[workout.category] ?? categoryGradients.Strength;

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.45 + index * 0.06 }}
      className={cn(
        'group text-left bg-bg-card border border-border rounded-2xl overflow-hidden',
        'hover:border-accent/40 hover:-translate-y-0.5 active:scale-[0.99]',
        'transition-all duration-300'
      )}
    >
      <div className="flex gap-4 p-3">
        {/* Thumbnail */}
        <div
          className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden flex items-center justify-center"
          style={{ background: gradient }}
        >
          {/* Grid texture */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />

          {/* Play button or completed badge */}
          {workout.completed ? (
            <div className="relative w-10 h-10 rounded-full bg-accent flex items-center justify-center">
              <Check size={16} strokeWidth={3} className="text-bg" />
            </div>
          ) : (
            <div className="relative w-10 h-10 rounded-full bg-bg/60 backdrop-blur-md border border-white/20 group-hover:bg-accent group-hover:border-accent transition-all flex items-center justify-center">
              <Play size={14} fill="currentColor" className="group-hover:text-bg transition-colors ml-0.5" />
            </div>
          )}

          {/* Category badge */}
          <div className="absolute top-2 left-2 font-mono text-[8px] uppercase tracking-[0.14em] bg-bg/70 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-white/10 font-bold text-white">
            {workout.category}
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <h4 className="font-display font-semibold text-base tracking-tight leading-tight truncate">
              {workout.name}
            </h4>
            <div className="text-[11px] text-text-muted mt-0.5 truncate">{workout.focus}</div>
          </div>

          <div className="flex items-center gap-3 flex-wrap mt-2">
            <span className="inline-flex items-center gap-1 text-[10px] text-text-muted font-medium">
              <Clock size={11} />
              {workout.duration}m
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-text-muted font-medium">
              <Flame size={11} />
              {workout.calories}
            </span>
            <span className="inline-flex items-center text-[9px] uppercase tracking-[0.14em] font-mono font-bold text-accent">
              {workout.difficulty}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
