'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Telescope } from 'lucide-react';
import { TwinStatusBadge } from '@/components/client/twin/TwinStatusBadge';
import type { TwinVisualState } from '@/lib/data/twin';

interface Props {
  /** Path to the avatar PNG/WebP — comes from avatarFor() on the server. */
  avatarSrc: string;
  /** Twin visual state (peak / strong / steady / depleted / etc.). */
  state: TwinVisualState;
  /** Overall vitality 0..100. */
  overall: number;
  /** Short one-line message from dailyTwinMessage(). */
  message: string;
}

/**
 * Dashboard preview of the PureX Twin + Future Clone.
 *
 * Brings back the gamified "feel" of the avatar pages without dragging
 * the full TwinSection (200+ lines, particles, animated rings, vital
 * stats panel) into the home view. Quick read of vitality + status,
 * plus two clear CTAs into the full pages.
 *
 * App-feel only — uses the static avatar PNG. The full immersive
 * 3D-grade stage lives on /client/twin.
 */
export function TwinCloneTeaser({
  avatarSrc,
  state,
  overall,
  message,
}: Props) {
  return (
    <section
      className="rounded-3xl border border-border overflow-hidden relative"
      style={{
        background: `
          radial-gradient(ellipse at 0% 0%, rgba(198, 255, 61, 0.10) 0%, transparent 55%),
          radial-gradient(ellipse at 100% 100%, rgba(255, 210, 77, 0.08) 0%, transparent 55%),
          linear-gradient(180deg, #10160e 0%, #0a0c09 100%)
        `,
      }}
    >
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Avatar — small, no expensive particle layers. */}
        <Link
          href="/client/twin"
          aria-label="Open your PureX Twin"
          className="relative flex-shrink-0 block"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative rounded-2xl overflow-hidden"
            style={{
              width: 96,
              height: 96,
              background:
                'radial-gradient(ellipse at 50% 100%, rgba(198,255,61,0.18) 0%, transparent 70%)',
              border: '1px solid rgba(198,255,61,0.22)',
            }}
          >
            <Image
              src={avatarSrc}
              alt="PureX Twin"
              fill
              sizes="96px"
              style={{ objectFit: 'cover' }}
              priority={false}
            />
            {/* Soft glow */}
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at 50% 40%, rgba(198,255,61,0.12) 0%, transparent 60%)',
              }}
            />
          </motion.div>
        </Link>

        {/* Stack: header + vitality + status */}
        <div className="min-w-0 flex-1">
          <div
            className="inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.22em] font-bold mb-1"
            style={{ fontSize: 10, color: '#c6ff3d' }}
          >
            <Sparkles size={10} />
            PureX Twin
          </div>
          <div className="flex items-baseline gap-2 mb-1.5 tabular-nums">
            <span
              className="font-display font-bold leading-none"
              style={{ fontSize: 26, color: '#c6ff3d' }}
            >
              {overall}
            </span>
            <span
              className="font-mono uppercase tracking-[0.18em] font-bold"
              style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}
            >
              Vitality
            </span>
          </div>
          <TwinStatusBadge state={state} compact />
        </div>
      </div>

      {/* One-liner message */}
      <p
        className="px-5 leading-relaxed"
        style={{ fontSize: 13, color: 'rgba(255,255,255,0.70)' }}
      >
        {message}
      </p>

      {/* Bottom CTAs */}
      <div className="grid grid-cols-2 gap-2 px-5 pt-3 pb-4 mt-3">
        <Link
          href="/client/twin"
          className="inline-flex items-center justify-center gap-1.5 rounded-full font-mono uppercase tracking-[0.16em] font-bold transition-opacity hover:opacity-90"
          style={{
            height: 42,
            fontSize: 11,
            color: '#0a0c09',
            background:
              'linear-gradient(135deg, #c6ff3d 0%, #a8e60a 100%)',
          }}
        >
          Open Twin
          <ArrowRight size={12} strokeWidth={2.5} />
        </Link>
        <Link
          href="/client/future-clone"
          className="inline-flex items-center justify-center gap-1.5 rounded-full font-mono uppercase tracking-[0.16em] font-bold transition-colors"
          style={{
            height: 42,
            fontSize: 11,
            color: '#ffd24d',
            background: 'rgba(255, 210, 77, 0.08)',
            border: '1px solid rgba(255, 210, 77, 0.30)',
          }}
        >
          <Telescope size={12} />
          Future Clone
        </Link>
      </div>
    </section>
  );
}
