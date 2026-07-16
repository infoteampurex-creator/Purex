'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, X, Heart } from 'lucide-react';

const STORAGE_KEY = 'teampurex.onboarding.completed';

interface Step {
  title: string;
  body: string;
  targetSelector: string;
  align: 'top' | 'bottom';
  accent: string;
}

/**
 * The four beats of the tour. Each step points at a real element on
 * the dashboard (by `data-onboard` attribute) and pops a card next
 * to it explaining what it does.
 *
 * We use data attributes rather than IDs so the target elements can
 * be rearranged without breaking the tour selector chain.
 */
const STEPS: Step[] = [
  {
    title: 'Your daily coach',
    body:
      'Every morning starts here. A personalised message from your Team Purex plan — based on your sleep, your streak, and yesterday\'s log.',
    targetSelector: '[data-onboard="daily-digest"]',
    align: 'bottom',
    accent: '#c6ff3d',
  },
  {
    title: 'Your PureX Score',
    body:
      'One number that captures today. Recovery + training + nutrition + consistency, weighted by your coaches. Aim higher every week.',
    targetSelector: '[data-onboard="score-hero"]',
    align: 'bottom',
    accent: '#ffd24d',
  },
  {
    title: 'Log in one tap',
    body:
      'Tap any ring to log — weight, sleep, water, steps, or a meal. Or take a photo of your plate and let AI estimate the macros.',
    targetSelector: '[data-onboard="today-panel"]',
    align: 'bottom',
    accent: '#ff8a4d',
  },
  {
    title: 'Meet your Twin',
    body:
      'Your live fitness clone. It breathes with your data — steps, sleep, recovery, workouts. Watch it morph over 30-90 days.',
    targetSelector: '[data-onboard="twin"]',
    align: 'top',
    accent: '#c6ff3d',
  },
];

/**
 * First-launch guided tour. Shows a 4-step spotlight walkthrough of
 * the dashboard on the first ever visit. Users can Skip any time; if
 * they complete OR skip, we set localStorage so it never appears
 * again on the same install.
 *
 * Runs only on the client, only on the dashboard, only when the
 * `teampurex.onboarding.completed` key is not set. Zero server cost.
 */
export function OnboardingTour() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const rafRef = useRef<number | null>(null);

  // Decide once, on mount, whether to run.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem(STORAGE_KEY)) return;
    // Wait for the dashboard to actually paint so getBoundingClientRect
    // returns meaningful values. 800 ms gives Framer + animations time.
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  // Track the current step's target rectangle. Also re-measure on
  // resize + scroll so the spotlight follows the element.
  useEffect(() => {
    if (!visible) return;
    const current = STEPS[step];
    if (!current) return;
    const measure = () => {
      const el = document.querySelector(current.targetSelector);
      if (!el) {
        setRect(null);
        return;
      }
      // Scroll the element into view before measuring
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Re-measure after scroll settles
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        setRect(r);
      });
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, { passive: true });
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [visible, step]);

  const finish = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore private-mode storage errors
    }
    setVisible(false);
  };

  const next = () => {
    if (step >= STEPS.length - 1) finish();
    else setStep(step + 1);
  };

  if (!visible) return null;

  const current = STEPS[step];
  const cardPos = computeCardPosition(rect, current.align);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        className="fixed inset-0 z-[90] pointer-events-auto"
        style={{ backdropFilter: 'blur(2px)' }}
      >
        {/* Full-screen dark overlay with the spotlight cut out */}
        <SpotlightOverlay rect={rect} />

        {/* Explainer card floats next to the target */}
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed rounded-2xl border p-5"
          style={{
            ...cardPos,
            width: 'min(340px, calc(100vw - 32px))',
            background:
              'radial-gradient(ellipse at 0% 0%, ' +
              current.accent +
              '22, transparent 60%), linear-gradient(180deg, #14180f 0%, #0a0c09 100%)',
            borderColor: current.accent + '55',
            boxShadow: '0 24px 48px -8px rgba(0,0,0,0.7)',
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: current.accent + '20',
                border: '1px solid ' + current.accent + '55',
                color: current.accent,
              }}
            >
              <Sparkles size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div
                className="font-mono uppercase tracking-[0.22em] font-bold mb-1"
                style={{ fontSize: 9, color: current.accent }}
              >
                Step {step + 1} of {STEPS.length}
              </div>
              <h3
                className="font-display font-semibold tracking-tight"
                style={{ fontSize: 18, color: 'rgba(245,245,240,0.98)' }}
              >
                {current.title}
              </h3>
              <p
                className="mt-2 leading-relaxed"
                style={{ fontSize: 13.5, color: 'rgba(245,245,240,0.75)' }}
              >
                {current.body}
              </p>
            </div>
          </div>

          {/* Progress dots + actions */}
          <div className="flex items-center justify-between mt-5">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className="rounded-full transition-all"
                  style={{
                    width: i === step ? 20 : 5,
                    height: 5,
                    background:
                      i === step
                        ? current.accent
                        : i < step
                        ? 'rgba(255,255,255,0.55)'
                        : 'rgba(255,255,255,0.20)',
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={finish}
                className="font-mono uppercase tracking-[0.16em] font-bold px-3 py-1.5 rounded-full transition-opacity hover:opacity-70"
                style={{
                  fontSize: 10,
                  color: 'rgba(245,245,240,0.55)',
                }}
              >
                Skip
              </button>
              <button
                type="button"
                onClick={next}
                className="font-mono uppercase tracking-[0.18em] font-bold px-4 py-2 rounded-full inline-flex items-center gap-1.5"
                style={{
                  fontSize: 10,
                  color: '#0a0c09',
                  background: current.accent,
                }}
              >
                {step >= STEPS.length - 1 ? (
                  <>
                    Got it
                    <Heart size={11} />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight size={11} />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Top-right corner dismiss */}
        <button
          type="button"
          onClick={finish}
          aria-label="Close tour"
          className="fixed top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.14)',
            color: 'rgba(245,245,240,0.75)',
          }}
        >
          <X size={16} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Full-viewport dark overlay with a rounded-rect cutout over the
 * target element. Uses an SVG mask so the cutout can be any size and
 * has feathered edges. If no target rect, renders a simple dim
 * overlay (last-step / target-not-found fallback).
 */
function SpotlightOverlay({ rect }: { rect: DOMRect | null }) {
  if (!rect) {
    return (
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'rgba(6,8,5,0.72)' }}
      />
    );
  }
  const pad = 12;
  return (
    <svg
      aria-hidden
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <mask id="spotlight-mask">
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          <rect
            x={Math.max(0, rect.left - pad)}
            y={Math.max(0, rect.top - pad)}
            width={rect.width + pad * 2}
            height={rect.height + pad * 2}
            rx="20"
            fill="black"
          />
        </mask>
        <filter id="spotlight-glow">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="rgba(6,8,5,0.72)"
        mask="url(#spotlight-mask)"
      />
      {/* Bright ring around the cutout for emphasis */}
      <rect
        x={Math.max(0, rect.left - pad)}
        y={Math.max(0, rect.top - pad)}
        width={rect.width + pad * 2}
        height={rect.height + pad * 2}
        rx="20"
        fill="none"
        stroke="rgba(198,255,61,0.85)"
        strokeWidth="1.5"
        filter="url(#spotlight-glow)"
      />
    </svg>
  );
}

/** Position the explainer card above or below the target. */
function computeCardPosition(
  rect: DOMRect | null,
  align: 'top' | 'bottom'
): React.CSSProperties {
  const cardMaxWidth = 340;
  if (!rect) {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  }
  const vw = typeof window !== 'undefined' ? window.innerWidth : 375;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const cardW = Math.min(cardMaxWidth, vw - 32);
  const cardLeft = Math.max(16, Math.min(vw - cardW - 16, rect.left + rect.width / 2 - cardW / 2));

  if (align === 'top') {
    // Above the target, or below if not enough room above
    const spaceAbove = rect.top;
    if (spaceAbove > 240) {
      return {
        top: Math.max(16, rect.top - 220),
        left: cardLeft,
      };
    }
    return {
      top: Math.min(vh - 240, rect.bottom + 16),
      left: cardLeft,
    };
  }
  // align === 'bottom' — prefer below, fall back to above
  const spaceBelow = vh - rect.bottom;
  if (spaceBelow > 260) {
    return {
      top: rect.bottom + 16,
      left: cardLeft,
    };
  }
  return {
    top: Math.max(16, rect.top - 240),
    left: cardLeft,
  };
}
