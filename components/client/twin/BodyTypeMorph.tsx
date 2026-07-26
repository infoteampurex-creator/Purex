'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Image from 'next/image';
import type { BodyType } from '@/lib/data/body-proportions';

const TYPE_ORDER: BodyType[] = ['lean', 'athletic', 'solid', 'heavy'];

const TYPE_LABEL: Record<BodyType, string> = {
  lean: 'Lean',
  athletic: 'Athletic',
  solid: 'Solid',
  heavy: 'Heavy',
};

interface Props {
  userId: string;
  currentBodyType: BodyType;
  currentAvatarSrc: string;
  previousAvatarSrc?: string;
}

/**
 * "You evolved" moment. Fires ONCE when the user's bodyType bucket
 * changes since their last dashboard visit.
 *
 * Flow:
 *   1. On mount, read `purex:lastBodyType:{userId}` from localStorage.
 *   2. If different from current → play the celebration overlay.
 *   3. Write the new bodyType to localStorage. Next visit is silent
 *      until the bucket changes again.
 *
 * The overlay is a 5 s full-viewport-fixed celebration: gradient
 * background, "You evolved" headline, old avatar → new avatar
 * crossfade with an arrow between them, direction badge (leaner or
 * heavier — we don't editorialise which is "better"), then auto-
 * dismisses with a swipe-down gesture on mobile or a tap-to-close
 * anywhere.
 *
 * Storage is per-user + per-device (localStorage). On a new device
 * the user's first visit re-plays the overlay — acceptable trade-off
 * vs. burning a Supabase round-trip on every dashboard SSR.
 */
export function BodyTypeMorph({
  userId,
  currentBodyType,
  currentAvatarSrc,
  previousAvatarSrc,
}: Props) {
  const [showMorph, setShowMorph] = useState<{
    from: BodyType;
    to: BodyType;
    fromSrc: string;
  } | null>(null);

  // Guard against React StrictMode double-invocation writing the
  // new bodyType before the initial compare finishes.
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    try {
      const key = `purex:lastBodyType:${userId}`;
      const previous = localStorage.getItem(key);

      if (previous && previous !== currentBodyType && isValidBodyType(previous)) {
        // Trigger the overlay. Use the passed previousAvatarSrc if
        // available (server can compute it deterministically); else
        // synthesize by inference from the previous body type.
        const fromSrc =
          previousAvatarSrc || avatarSrcFromBodyType(previous, currentAvatarSrc);
        setShowMorph({ from: previous, to: currentBodyType, fromSrc });
      }

      // Write the new state immediately — even if the overlay is
      // still animating, subsequent renders on this device shouldn't
      // re-trigger.
      localStorage.setItem(key, currentBodyType);
    } catch {
      // ignore — localStorage might be blocked (privacy mode, cookies
      // off); no morph = silent no-op which is the correct behavior.
    }
  }, [userId, currentBodyType, currentAvatarSrc, previousAvatarSrc]);

  if (!showMorph) return null;

  const fromIdx = TYPE_ORDER.indexOf(showMorph.from);
  const toIdx = TYPE_ORDER.indexOf(showMorph.to);
  const leaner = toIdx < fromIdx;
  const direction = leaner ? 'Leaner' : 'Stronger foundation';
  const accent = leaner ? '#c6ff3d' : '#ffd24d';

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-label={`Body type evolved to ${TYPE_LABEL[showMorph.to]}`}
        onClick={() => setShowMorph(null)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-[200] flex items-center justify-center cursor-pointer"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, ${accent}30 0%, transparent 60%),
            radial-gradient(ellipse at 50% 100%, ${accent}20 0%, transparent 60%),
            rgba(6, 8, 5, 0.96)
          `,
          backdropFilter: 'blur(24px)',
        }}
      >
        <div
          className="relative w-full max-w-md px-6 py-8 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Sparkle burst */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 font-mono uppercase tracking-[0.32em] font-bold mb-3"
            style={{ fontSize: 11, color: accent }}
          >
            <Sparkles size={13} />
            You Evolved
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="font-display font-semibold tracking-tight leading-tight mb-2"
            style={{ fontSize: 32, color: 'rgba(245,245,240,0.98)' }}
          >
            <span
              style={{
                background: `linear-gradient(135deg, #ffffff 0%, ${accent} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {direction}
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-text-muted mb-8 max-w-xs mx-auto leading-relaxed"
            style={{ fontSize: 15 }}
          >
            Your Twin just shifted from{' '}
            <span className="font-semibold text-text">
              {TYPE_LABEL[showMorph.from]}
            </span>{' '}
            to{' '}
            <span
              className="font-semibold"
              style={{ color: accent }}
            >
              {TYPE_LABEL[showMorph.to]}
            </span>
            . Your body is responding to the work.
          </motion.p>

          {/* Twin crossfade: OLD → NEW */}
          <div className="relative flex items-center justify-center gap-4 mb-8">
            {/* OLD (fades out) */}
            <motion.div
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: 0.35, scale: 0.9 }}
              transition={{ delay: 0.8, duration: 1.2, ease: 'easeInOut' }}
              className="relative w-[110px] h-[180px]"
            >
              <Image
                src={showMorph.fromSrc}
                alt="Previous body type"
                fill
                sizes="110px"
                style={{ objectFit: 'contain', filter: 'grayscale(80%)' }}
              />
              <div
                className="absolute inset-x-0 -bottom-6 font-mono uppercase tracking-[0.18em] font-bold text-center"
                style={{ fontSize: 9, color: 'rgba(245,245,240,0.5)' }}
              >
                Before
              </div>
            </motion.div>

            {/* Arrow */}
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0, duration: 0.5 }}
              className="font-mono font-bold"
              style={{ fontSize: 28, color: accent }}
            >
              →
            </motion.div>

            {/* NEW (fades in bright) */}
            <motion.div
              initial={{ opacity: 0.3, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1.05 }}
              transition={{ delay: 1.1, duration: 1.2, ease: 'easeOut' }}
              className="relative w-[130px] h-[210px]"
              style={{
                filter: `drop-shadow(0 0 32px ${accent}66)`,
              }}
            >
              <Image
                src={currentAvatarSrc}
                alt="New body type"
                fill
                sizes="130px"
                style={{ objectFit: 'contain' }}
              />
              <div
                className="absolute inset-x-0 -bottom-6 font-mono uppercase tracking-[0.18em] font-bold text-center"
                style={{ fontSize: 10, color: accent }}
              >
                Now
              </div>
            </motion.div>
          </div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: 0.5 }}
            onClick={() => setShowMorph(null)}
            className="mt-8 px-6 py-3 rounded-full font-mono uppercase tracking-[0.16em] font-bold"
            style={{
              fontSize: 12,
              background: accent,
              color: '#06080a',
              minHeight: 44,
            }}
          >
            Continue
          </motion.button>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 2.2, duration: 0.5 }}
            className="mt-4 font-mono uppercase tracking-[0.16em]"
            style={{ fontSize: 9, color: 'rgba(245,245,240,0.5)' }}
          >
            Tap anywhere to dismiss
          </motion.p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function isValidBodyType(v: string): v is BodyType {
  return v === 'lean' || v === 'athletic' || v === 'solid' || v === 'heavy';
}

/**
 * Best-effort synthesis of the previous avatar src when the server
 * didn't provide one. Swaps the body-type slug in the current
 * avatar's path (e.g. male-heavy.webp → male-solid.webp) — works
 * because our asset naming follows a strict convention.
 */
function avatarSrcFromBodyType(
  prev: BodyType,
  currentSrc: string
): string {
  for (const t of TYPE_ORDER) {
    if (currentSrc.includes(`-${t}.`)) {
      return currentSrc.replace(`-${t}.`, `-${prev}.`);
    }
  }
  // Last-resort: return current, which produces no visible crossfade
  return currentSrc;
}
