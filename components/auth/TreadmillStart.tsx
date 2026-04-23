'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Power } from 'lucide-react';

interface TreadmillStartProps {
  activated: boolean;
  onActivate: () => void;
}

/**
 * Treadmill silhouette with activation button.
 *
 * Positioned at the BOTTOM of the gym scene (treadmills sit on the ground).
 * Rendered as a 3/4-front view: angled belt platform, upright console,
 * side handrails, green power button as the focal point.
 *
 * On click: power button flashes, console display boots up, belt animates
 * (subtle moving texture), green glow fills the machine, neon sign ignites.
 */
export function TreadmillStart({ activated, onActivate }: TreadmillStartProps) {
  const [hovered, setHovered] = useState(false);
  const [pressing, setPressing] = useState(false);
  const [bootStep, setBootStep] = useState(0);

  const bootMessages = ['READY', 'BOOT', 'CALIBRATE', 'ONLINE', 'PURE X'];

  useEffect(() => {
    if (!activated) {
      setBootStep(0);
      return;
    }
    let step = 1;
    const interval = setInterval(() => {
      setBootStep(step);
      step++;
      if (step >= bootMessages.length) clearInterval(interval);
    }, 260);
    return () => clearInterval(interval);
  }, [activated, bootMessages.length]);

  const handleClick = () => {
    if (activated) return;
    setPressing(true);
    setTimeout(() => {
      onActivate();
      setPressing(false);
    }, 180);
  };

  const displayText = activated
    ? bootMessages[bootStep]
    : hovered
      ? 'PRESS'
      : 'READY';

  return (
    <div
      className="absolute bottom-0 left-1/2 -translate-x-1/2 select-none pointer-events-none"
      style={{ width: 520, height: 360, zIndex: 10 }}
    >
      {/* Ambient floor glow when activated */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 rounded-full"
        animate={{
          opacity: activated ? 0.8 : hovered ? 0.3 : 0,
          scale: activated ? 1.3 : 1,
        }}
        transition={{ duration: 0.8 }}
        style={{
          bottom: -40,
          width: 600,
          height: 200,
          background:
            'radial-gradient(ellipse at center, rgba(198, 255, 61, 0.4), transparent 65%)',
          filter: 'blur(40px)',
          mixBlendMode: 'screen',
        }}
      />

      {/* ═══ BELT PLATFORM (bottom) ═══ */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: 10,
          left: '50%',
          transform: 'translateX(-50%) perspective(800px) rotateX(52deg)',
          transformOrigin: 'center bottom',
          width: 340,
          height: 180,
        }}
      >
        {/* Outer frame */}
        <div
          className="absolute inset-0 rounded-lg"
          style={{
            background:
              'linear-gradient(180deg, #1a1e18 0%, #0f120e 100%)',
            boxShadow: `
              inset 0 2px 3px rgba(255,255,255,0.04),
              0 0 0 2px rgba(60, 70, 55, 0.5),
              0 20px 40px rgba(0,0,0,0.8)
            `,
          }}
        />

        {/* Inner running surface */}
        <div
          className="absolute rounded-md overflow-hidden"
          style={{
            inset: '16px 40px',
            background:
              'linear-gradient(180deg, #0a0c09 0%, #050704 100%)',
            boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.9)',
          }}
        >
          {/* Belt segments — static when dormant, animated when active */}
          <motion.div
            className="absolute inset-0"
            animate={activated ? { y: [0, -40] } : { y: 0 }}
            transition={
              activated
                ? { duration: 1.5, repeat: Infinity, ease: 'linear' }
                : { duration: 0.3 }
            }
            style={{
              backgroundImage:
                'repeating-linear-gradient(180deg, transparent 0px, transparent 18px, rgba(255,255,255,0.04) 18px, rgba(255,255,255,0.04) 20px)',
            }}
          />

          {/* Subtle center line */}
          <div
            className="absolute inset-y-0 left-1/2 w-px"
            style={{
              background: activated
                ? 'linear-gradient(180deg, transparent 0%, rgba(198, 255, 61, 0.3) 50%, transparent 100%)'
                : 'rgba(255,255,255,0.03)',
              transition: 'background 0.6s ease',
            }}
          />
        </div>

        {/* Side rails on belt */}
        <div
          className="absolute top-4 bottom-4 rounded-sm"
          style={{
            left: 10,
            width: 22,
            background: 'linear-gradient(90deg, #2a2e28, #1a1e18)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        />
        <div
          className="absolute top-4 bottom-4 rounded-sm"
          style={{
            right: 10,
            width: 22,
            background: 'linear-gradient(90deg, #1a1e18, #2a2e28)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        />
      </div>

      {/* ═══ LEFT HANDRAIL ═══ */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: 70,
          left: 42,
          width: 120,
          height: 4,
          borderRadius: 2,
          background:
            'linear-gradient(90deg, #3a3e38 0%, #2a2e28 50%, #1a1e18 100%)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
          transform: 'rotate(-8deg)',
          transformOrigin: 'right center',
        }}
      />
      {/* Left handrail vertical support */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: 70,
          left: 42,
          width: 4,
          height: 70,
          borderRadius: 2,
          background: 'linear-gradient(180deg, #2a2e28 0%, #1a1e18 100%)',
          boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.05)',
        }}
      />

      {/* ═══ RIGHT HANDRAIL ═══ */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: 70,
          right: 42,
          width: 120,
          height: 4,
          borderRadius: 2,
          background:
            'linear-gradient(90deg, #1a1e18 0%, #2a2e28 50%, #3a3e38 100%)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
          transform: 'rotate(8deg)',
          transformOrigin: 'left center',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: 70,
          right: 42,
          width: 4,
          height: 70,
          borderRadius: 2,
          background: 'linear-gradient(180deg, #2a2e28 0%, #1a1e18 100%)',
          boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.05)',
        }}
      />

      {/* ═══ CENTER CONSOLE (the upright) ═══ */}
      <motion.div
        animate={
          activated && bootStep <= 3
            ? { x: [0, -1, 1, -1, 0] }
            : { x: 0 }
        }
        transition={
          activated
            ? { duration: 0.1, repeat: 4 }
            : { duration: 0.2 }
        }
        className="absolute left-1/2 -translate-x-1/2 pointer-events-auto"
        style={{
          bottom: 130,
          width: 200,
        }}
      >
        {/* Console housing */}
        <div
          className="relative rounded-xl overflow-hidden"
          style={{
            padding: '14px 16px 12px 16px',
            background:
              'linear-gradient(180deg, #2a2e28 0%, #1a1e18 40%, #0f120e 100%)',
            boxShadow: `
              inset 0 2px 3px rgba(255,255,255,0.06),
              inset 0 -2px 3px rgba(0,0,0,0.5),
              0 10px 30px rgba(0,0,0,0.7),
              0 0 0 1.5px rgba(80, 90, 80, 0.5)
            `,
          }}
        >
          {/* Status LEDs */}
          <div className="flex items-center justify-between mb-2.5 px-1">
            {[0, 1, 2, 3].map((i) => (
              <LedDot key={i} index={i} activated={activated} />
            ))}
          </div>

          {/* LCD display */}
          <div
            className="relative mb-3 rounded-md overflow-hidden"
            style={{
              padding: '8px 10px',
              background: activated
                ? 'linear-gradient(180deg, #0a1405 0%, #0a1805 100%)'
                : 'linear-gradient(180deg, #0a0c09 0%, #050704 100%)',
              boxShadow:
                'inset 0 2px 4px rgba(0,0,0,0.9), inset 0 0 0 1px rgba(0,0,0,0.4)',
            }}
          >
            {/* Scanlines */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 3px)',
              }}
            />

            <div className="relative text-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={displayText}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.15 }}
                  className="font-mono text-[12px] tracking-[0.28em] font-bold"
                  style={{
                    color: activated ? '#c6ff3d' : hovered ? '#a8c842' : '#4a5040',
                    textShadow: activated
                      ? '0 0 8px rgba(198, 255, 61, 0.8)'
                      : 'none',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  {displayText}
                </motion.div>
              </AnimatePresence>
              <div
                className="mt-0.5 font-mono text-[6px] uppercase tracking-[0.28em] font-bold"
                style={{
                  color: activated ? 'rgba(198, 255, 61, 0.4)' : '#3a3e38',
                  transition: 'color 0.6s ease',
                }}
              >
                PURE X Console
              </div>
            </div>
          </div>

          {/* Power button */}
          <button
            type="button"
            onClick={handleClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            disabled={activated}
            aria-label={activated ? 'Console online' : 'Press to power on'}
            className="relative mx-auto block outline-none group cursor-pointer disabled:cursor-default"
            style={{
              width: 58,
              height: 58,
              padding: 0,
              background: 'transparent',
              border: 'none',
            }}
          >
            {/* Hover glow */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              animate={{
                scale: hovered && !activated ? 1.3 : 1,
                opacity: hovered && !activated ? 1 : 0,
              }}
              transition={{ duration: 0.3 }}
              style={{
                background:
                  'radial-gradient(circle, rgba(198, 255, 61, 0.5), transparent 65%)',
                filter: 'blur(10px)',
              }}
            />

            {/* Activation flash */}
            <AnimatePresence>
              {(pressing || activated) && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.9 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(198, 255, 61, 0.9), transparent 60%)',
                  }}
                />
              )}
            </AnimatePresence>

            {/* Bezel ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: activated
                  ? '0 0 0 2px rgba(198, 255, 61, 0.7), 0 0 30px rgba(198, 255, 61, 0.6), inset 0 2px 4px rgba(0,0,0,0.6)'
                  : hovered
                    ? '0 0 0 2px rgba(198, 255, 61, 0.3), 0 0 16px rgba(198, 255, 61, 0.2), inset 0 2px 4px rgba(0,0,0,0.8)'
                    : '0 0 0 2px rgba(60, 70, 55, 0.4), inset 0 2px 4px rgba(0,0,0,0.8)',
              }}
              transition={{ duration: 0.4 }}
              style={{
                background:
                  'radial-gradient(circle at 50% 40%, #252925 0%, #141814 70%, #0a0c09 100%)',
              }}
            />

            {/* Button face */}
            <motion.div
              className="absolute inset-1.5 rounded-full flex items-center justify-center"
              animate={{
                scale: pressing ? 0.92 : activated ? 1 : hovered ? 1.03 : 1,
                y: pressing ? 2 : 0,
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              style={{
                background: activated
                  ? 'radial-gradient(circle at 30% 30%, #e5ff7d 0%, #c6ff3d 40%, #68a00c 100%)'
                  : hovered
                    ? 'radial-gradient(circle at 30% 30%, #5a6050 0%, #2a2e28 50%, #1a1e18 100%)'
                    : 'radial-gradient(circle at 30% 30%, #4a4e48 0%, #252925 60%, #141818 100%)',
                boxShadow: activated
                  ? 'inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(60, 80, 20, 0.5), 0 0 20px rgba(198, 255, 61, 0.5)'
                  : 'inset 0 2px 4px rgba(255,255,255,0.08), inset 0 -2px 4px rgba(0,0,0,0.5)',
                transition: 'background 0.4s ease, box-shadow 0.4s ease',
              }}
            >
              <Power
                size={22}
                strokeWidth={2.5}
                style={{
                  color: activated ? '#0a0c09' : hovered ? '#c6ff3d' : '#5a6050',
                  filter: activated
                    ? 'drop-shadow(0 1px 1px rgba(255,255,255,0.3))'
                    : hovered
                      ? 'drop-shadow(0 0 8px rgba(198, 255, 61, 0.4))'
                      : 'none',
                  transition: 'color 0.4s ease, filter 0.4s ease',
                }}
              />
            </motion.div>

            {/* Attention ring when dormant */}
            {!activated && !hovered && (
              <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                animate={{
                  scale: [1, 1.4, 1.4],
                  opacity: [0.5, 0, 0],
                }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: 'easeOut',
                  times: [0, 0.7, 1],
                }}
                style={{ border: '1.5px solid rgba(198, 255, 61, 0.5)' }}
              />
            )}
          </button>

          {/* Speed/Incline/Mode labels */}
          <div className="flex items-center justify-between gap-1.5 mt-3">
            {['SPEED', 'INCLINE', 'MODE'].map((label) => (
              <div
                key={label}
                className="rounded-sm px-1.5 py-0.5 flex-1 text-center"
                style={{
                  background: 'linear-gradient(180deg, #1a1e18 0%, #0a0c09 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 2px rgba(0,0,0,0.4)',
                }}
              >
                <div
                  className="font-mono text-[6px] uppercase tracking-[0.16em] font-bold"
                  style={{
                    color: activated ? 'rgba(198, 255, 61, 0.3)' : '#3a3e38',
                    transition: 'color 0.6s ease',
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Console support arm going down to belt */}
        <div
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            bottom: -22,
            width: 14,
            height: 24,
            background: 'linear-gradient(180deg, #1a1e18 0%, #0f120e 100%)',
            boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.04), inset -1px 0 0 rgba(0,0,0,0.3)',
          }}
        />
      </motion.div>

      {/* Helper text — positioned between console and neon sign area */}
      <div
        className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none"
        style={{ bottom: -30, whiteSpace: 'nowrap' }}
      >
        <motion.div
          animate={{
            color: activated ? '#c6ff3d' : hovered ? '#c6ff3d' : '#6a6e66',
          }}
          transition={{ duration: 0.4 }}
          className="font-mono text-[10px] uppercase tracking-[0.24em] font-bold"
        >
          {activated ? 'System Online' : hovered ? 'Press to Begin' : 'Power On the Treadmill'}
        </motion.div>
      </div>
    </div>
  );
}

function LedDot({ index, activated }: { index: number; activated: boolean }) {
  return (
    <motion.div
      className="rounded-full"
      animate={
        activated
          ? {
              backgroundColor: ['#3a3e38', '#c6ff3d', '#c6ff3d'],
              boxShadow: [
                'none',
                '0 0 6px rgba(198, 255, 61, 0.8)',
                '0 0 6px rgba(198, 255, 61, 0.8)',
              ],
            }
          : { backgroundColor: '#2a2e28', boxShadow: 'none' }
      }
      transition={{
        duration: 0.3,
        delay: activated ? index * 0.1 : 0,
      }}
      style={{ width: 4, height: 4 }}
    />
  );
}
