'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Footprints,
  Moon,
  Droplets,
  Apple,
  Scale,
  Plus,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';

export type LogTarget = 'weight' | 'steps' | 'sleep' | 'water' | 'meal';

interface Props {
  /** Bubbles up the user's pick. Parent owns the actual sheet rendering. */
  onPick: (target: LogTarget) => void;
}

/**
 * Single primary action button on the redesigned dashboard. Tap →
 * a bottom sheet asks "what do you want to log?" with 5 colourful
 * chips: Weight / Steps / Sleep / Water / Meal. The parent owns the
 * actual log sheets so the same picker can route through the
 * activity-ring taps too (tap a ring on the dashboard = same as
 * tapping the matching chip here).
 */
export function LogTodayButton({ onPick }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const handlePick = (target: LogTarget) => {
    setPickerOpen(false);
    onPick(target);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="w-full inline-flex items-center justify-center gap-2 rounded-full font-mono uppercase tracking-[0.18em] font-bold transition-opacity hover:opacity-90 active:scale-[0.99]"
        style={{
          height: 52,
          fontSize: 12,
          color: '#0a0c09',
          background:
            'linear-gradient(135deg, #c6ff3d 0%, #a8e60a 100%)',
          boxShadow: '0 0 24px rgba(198, 255, 61, 0.25)',
        }}
      >
        <Plus size={14} strokeWidth={2.8} />
        Log today
      </button>

      <AnimatePresence>
        {pickerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setPickerOpen(false)}
              className="fixed inset-0 z-40"
              style={{
                backgroundColor: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(4px)',
              }}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 240 }}
              className="fixed left-0 right-0 bottom-0 z-50 rounded-t-3xl overflow-hidden"
              style={{
                background:
                  'linear-gradient(180deg, #15110f 0%, #0a0c09 100%)',
                border: '1px solid rgba(198,255,61,0.18)',
                borderBottom: 'none',
                boxShadow:
                  '0 -8px 40px rgba(198,255,61,0.10), 0 -24px 64px rgba(0,0,0,0.6)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              }}
            >
              <div className="flex justify-center pt-3">
                <div
                  className="w-10 h-1 rounded-full"
                  style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                />
              </div>

              <div className="px-5 pt-4 pb-3 flex items-center justify-between">
                <div>
                  <div
                    className="font-mono uppercase tracking-[0.22em] font-bold"
                    style={{ fontSize: 11, color: '#c6ff3d' }}
                  >
                    Log today
                  </div>
                  <div
                    className="font-mono uppercase tracking-[0.16em] mt-0.5"
                    style={{
                      fontSize: 9,
                      color: 'rgba(255,255,255,0.40)',
                    }}
                  >
                    Pick what you want to capture
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPickerOpen(false)}
                  aria-label="Close"
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                >
                  <X size={16} style={{ color: 'rgba(255,255,255,0.6)' }} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2.5 px-5 pb-5">
                <Chip
                  icon={<Scale size={18} />}
                  label="Weight"
                  color="#ff8a4d"
                  onClick={() => handlePick('weight')}
                />
                <Chip
                  icon={<Footprints size={18} />}
                  label="Steps"
                  color="#c6ff3d"
                  onClick={() => handlePick('steps')}
                />
                <Chip
                  icon={<Moon size={18} />}
                  label="Sleep"
                  color="#a78bfa"
                  onClick={() => handlePick('sleep')}
                />
                <Chip
                  icon={<Droplets size={18} />}
                  label="Water"
                  color="#7dd3ff"
                  onClick={() => handlePick('water')}
                />
                <Chip
                  icon={<Apple size={18} />}
                  label="Meal"
                  color="#ff8a4d"
                  onClick={() => handlePick('meal')}
                  colSpan2
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function Chip({
  icon,
  label,
  color,
  onClick,
  colSpan2,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
  colSpan2?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-2xl border flex flex-col items-center justify-center gap-1.5 active:scale-[0.97] transition-transform',
        colSpan2 && 'col-span-2'
      )}
      style={{
        height: 88,
        background: `${color}10`,
        borderColor: `${color}33`,
        color,
      }}
    >
      {icon}
      <span
        className="font-mono uppercase tracking-[0.16em] font-bold"
        style={{ fontSize: 11 }}
      >
        {label}
      </span>
    </button>
  );
}
