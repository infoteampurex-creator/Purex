'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface Props {
  /** Lift number shown above the arrow (e.g. "+26"). */
  lift: number;
  /** Color tint of the beam — defaults to brand gold. */
  color?: string;
}

/**
 * Animated beam between Today's twin and Future's twin. A gradient
 * bar pulses left→right, with sparse particles riding the beam. The
 * lift value floats above as the "evolution delta" headline.
 */
export function TransformationBeam({ lift, color = '#ffd24d' }: Props) {
  return (
    <div className="flex flex-col items-center px-1 relative">
      {/* Lift number */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
        className="font-display font-bold tabular-nums leading-none"
        style={{
          fontSize: 22,
          color,
          textShadow: `0 0 12px ${color}66`,
        }}
      >
        +{lift}
      </motion.div>
      <div
        className="font-mono uppercase tracking-[0.18em] font-bold mt-1"
        style={{ fontSize: 8, color: `${color}b3` }}
      >
        Vitality lift
      </div>

      {/* Beam */}
      <div
        className="relative w-full h-1 mt-3 mb-3 overflow-hidden rounded-full"
        style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
      >
        <motion.div
          className="absolute inset-y-0 left-0 w-2/3"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
            filter: `blur(0.5px)`,
          }}
          animate={{ x: ['-60%', '120%'] }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Arrow + particles */}
      <div className="relative w-full flex items-center justify-center">
        <motion.div
          animate={{ x: [0, 4, 0], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ color, filter: `drop-shadow(0 0 6px ${color})` }}
        >
          <ArrowRight size={18} />
        </motion.div>

        {/* Riding particles */}
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              width: 3,
              height: 3,
              backgroundColor: color,
              filter: `blur(0.4px) drop-shadow(0 0 4px ${color})`,
              top: '50%',
            }}
            animate={{
              x: ['-50%', '50%'],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2.2,
              delay: i * 0.7,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  );
}
