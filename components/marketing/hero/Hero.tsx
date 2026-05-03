'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Activity, Stethoscope, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { HeroFeatureCard } from './HeroFeatureCard';
import { HeroBackdrop } from './HeroBackdrop';
import { HERO_BACKGROUND_VIDEO } from '@/lib/videos';

/**
 * ═══════════════════════════════════════════════════════════════════════
 *  TO ADD YOUR HERO IMAGE / VIDEO:
 *
 *  STATIC PHOTO:
 *    Drop at /public/trainers/trainer-siva-reddy.jpg (auto-loads in card)
 *    Drop at /public/hero/hero-backdrop.jpg (enable via HERO_BACKDROP_IMAGE below)
 *
 *  AMBIENT VIDEO:
 *    Drop at /public/videos/hero-ambient.mp4
 *    Edit /lib/videos.ts → HERO_BACKGROUND_VIDEO to enable
 *    (See /docs/05-video-guide.md for specs)
 * ═══════════════════════════════════════════════════════════════════════
 */
const HERO_BACKDROP_IMAGE: string | null = null;
// Example: const HERO_BACKDROP_IMAGE = '/hero/hero-backdrop.jpg';

export function Hero() {
  return (
    <section className="relative min-h-[100svh] pt-16 md:pt-20 overflow-hidden">
      {/* Cinematic dark gym backdrop (video > photo > SVG silhouette) */}
      <HeroBackdrop imageSrc={HERO_BACKDROP_IMAGE} videoSlot={HERO_BACKGROUND_VIDEO} />

      <div className="container-safe relative py-16 md:py-24 lg:py-28">
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-16 items-center">

          {/* LEFT — Editorial headline + CTAs */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.22em] text-accent font-bold mb-6 md:mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
              Integrated Health Coaching · India & UK
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              className="font-display font-semibold text-display-xl leading-[1.1] tracking-tight mb-5 md:mb-7 max-w-[16ch]"
            >
              Train for <span className="text-text">Life</span>.{' '}
              <span className="block md:inline">
                Not Just <DissolvingWord words={['Aesthetics.', 'Looks.', 'Show.', 'Vanity.']} />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
              className="text-base md:text-lg text-text-muted leading-relaxed max-w-[52ch] mb-6 md:mb-8"
            >
              PURE X is the only coaching platform where your trainer, doctor, physiotherapist, athletic coach, and mental health specialist work from one coordinated plan. No shortcuts. No guesswork. Just measurable, sustainable transformation.
            </motion.p>

            {/* Credibility badges row */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="flex flex-wrap gap-2 mb-8 md:mb-10"
            >
              <SpecBadge icon={Stethoscope} label="Medically Supervised" />
              <SpecBadge icon={Activity} label="Lifestyle Built" />
              <SpecBadge icon={Dumbbell} label="Performance Driven" />
              <SpecBadge icon={Dumbbell} label="Physio Integrated" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.45 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4"
            >
              <Link href="/book">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Your Transformation
                  <ArrowRight size={18} />
                </Button>
              </Link>
            </motion.div>

            {/* Trust signals */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.65 }}
              className="mt-10 md:mt-14 pt-8 border-t border-border/60 grid grid-cols-3 gap-6 max-w-md"
            >
              <div>
                <div className="font-display font-bold text-2xl md:text-3xl text-accent tracking-tight">60+</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted mt-1">
                  Transformed
                </div>
              </div>
              <div>
                <div className="font-display font-bold text-2xl md:text-3xl text-accent tracking-tight">6</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted mt-1">
                  Specialists
                </div>
              </div>
              <div>
                <div className="font-display font-bold text-2xl md:text-3xl text-accent tracking-tight">100%</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted mt-1">
                  Medically Supervised
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT — Siva featured card */}
          <div className="relative w-full max-w-md lg:max-w-none mx-auto">
            <HeroFeatureCard />
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2"
      >
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-text-dim font-medium">
          Scroll
        </span>
        <div className="w-px h-10 bg-gradient-to-b from-accent/60 to-transparent" />
      </motion.div>
    </section>
  );
}

function SpecBadge({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-card/70 backdrop-blur-md border border-border/80">
      <Icon size={13} strokeWidth={2} />
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text font-medium">
        {label}
      </span>
    </div>
  );
}

/**
 * Letter-by-letter dissolve with sparkle particles.
 *
 * Behaviour:
 *   - Full word visible on load
 *   - 1.5s grace period so the user reads the headline first
 *   - Each letter fades out left-to-right, drifting up with a slight horizontal wobble
 *   - 4 tiny lime-green sparkle particles burst outward from each letter as it dissolves
 *   - Word stays gone — no looping
 *
 * Uses Framer Motion's keyframe animation (no infinite repeat). After the animation
 * completes, the letters stay at opacity 0.
 */
/**
 * Cycles through multiple words with a dissolve-out, materialize-in animation.
 * Each word lives ~3s on screen, then dissolves letter-by-letter while sparkles
 * burst, then the next word fades in.
 */
function DissolvingWord({ words }: { words: string[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const wordHoldMs = 3200; // how long a word stays visible before dissolving

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((idx) => (idx + 1) % words.length);
    }, wordHoldMs);
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <span className="relative inline-block" aria-label={words[activeIdx]}>
      {words.map((word, wordIdx) => (
        <SingleDissolvingWord
          key={`${word}-${wordIdx}`}
          word={word}
          isActive={wordIdx === activeIdx}
        />
      ))}
    </span>
  );
}

/**
 * One word in the cycle. Renders absolutely positioned so all words stack
 * on top of each other; only the active one is visible.
 */
function SingleDissolvingWord({
  word,
  isActive,
}: {
  word: string;
  isActive: boolean;
}) {
  const letters = word.split('');
  const dissolveDelay = 0.28;
  const dissolveDuration = 0.9;

  // Hold the word fully opaque for ~2s before dissolving letter-by-letter.
  // After dissolve, snap back to invisible until next active.
  const holdBeforeDissolve = 1.6;

  return (
    <span
      className="inline-block text-text-muted"
      aria-hidden={!isActive}
      style={{
        position: isActive ? 'relative' : 'absolute',
        top: 0,
        left: 0,
        opacity: isActive ? 1 : 0,
        pointerEvents: 'none',
      }}
    >
      {letters.map((char, i) => {
        const letterStart = holdBeforeDissolve + i * dissolveDelay;
        const xDrift = ((i * 7) % 5) - 2;
        const yDrift = -10 - ((i * 3) % 6);

        return (
          <span
            key={`${char}-${i}-${isActive ? 'on' : 'off'}`}
            className="relative inline-block"
          >
            <motion.span
              initial={{ opacity: 1, y: 0, x: 0, filter: 'blur(0px)' }}
              animate={
                isActive
                  ? {
                      opacity: [1, 1, 0],
                      y: [0, 0, yDrift],
                      x: [0, 0, xDrift],
                      filter: ['blur(0px)', 'blur(0px)', 'blur(3px)'],
                    }
                  : { opacity: 0 }
              }
              transition={{
                duration: dissolveDuration + holdBeforeDissolve,
                times: [0, holdBeforeDissolve / (dissolveDuration + holdBeforeDissolve), 1],
                delay: i * dissolveDelay * 0.1,
                ease: [0.4, 0, 0.6, 1],
              }}
              className="inline-block"
              style={{ willChange: 'transform, opacity, filter' }}
            >
              {char}
            </motion.span>
            {isActive && <Sparkles letterIndex={i} startAt={letterStart + 0.15} />}
          </span>
        );
      })}
    </span>
  );
}

/**
 * Small cluster of 4 green sparkle particles that burst outward when a letter
 * fades. Each sparkle drifts in a different direction and fades out.
 */
function Sparkles({ letterIndex, startAt }: { letterIndex: number; startAt: number }) {
  // 4 sparkles per letter with different burst directions
  const sparkles = [
    { dx: -8, dy: -14, size: 2.5 },
    { dx: 6, dy: -16, size: 2 },
    { dx: 10, dy: -6, size: 2.5 },
    { dx: -5, dy: -8, size: 2 },
  ];

  return (
    <>
      {sparkles.map((s, si) => (
        <motion.span
          key={si}
          aria-hidden
          className="absolute left-1/2 top-1/2 pointer-events-none rounded-full"
          style={{
            width: s.size,
            height: s.size,
            background:
              'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(198,255,61,0.8) 40%, rgba(198,255,61,0) 80%)',
            filter: 'blur(0.4px)',
            boxShadow: '0 0 4px rgba(198, 255, 61, 0.6)',
          }}
          initial={{ opacity: 0, x: '-50%', y: '-50%', scale: 0.3 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: [`-50%`, `calc(-50% + ${s.dx * 0.4}px)`, `calc(-50% + ${s.dx}px)`, `calc(-50% + ${s.dx * 1.4}px)`],
            y: [`-50%`, `calc(-50% + ${s.dy * 0.4}px)`, `calc(-50% + ${s.dy}px)`, `calc(-50% + ${s.dy * 1.6}px)`],
            scale: [0.3, 1, 1, 0.2],
          }}
          transition={{
            delay: startAt + si * 0.04, // slight stagger between sparkles of same letter
            duration: 1.1,
            times: [0, 0.2, 0.6, 1],
            ease: 'easeOut',
          }}
        />
      ))}
    </>
  );
}
