'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Telescope } from 'lucide-react';
import { AvatarImage } from '@/components/client/twin/AvatarImage';
import { TwinStatusBadge } from '@/components/client/twin/TwinStatusBadge';
import {
  VitalsStrip,
  type VitalsSnapshot,
} from '@/components/client/twin/VitalsStrip';
import type { TwinVisualState } from '@/lib/data/twin';

// Sample vitals for fresh accounts. Realistic resting values for a
// mid-30s adult in decent condition — the "you could look like this"
// baseline, not aspirational. Labelled with the Sample chip so it's
// not misleading. Replaced with live values once Health Connect /
// wearable sync lands.
const SAMPLE_VITALS: VitalsSnapshot = {
  heartRateBpm: 62,
  hrvMs: 68,
  spo2Pct: 98,
  skinTempC: 36.5,
  isPreview: true,
};

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
 * Dashboard hero preview of the PureX Twin.
 *
 * Redesigned 2026-07-15 to be a proper signature moment instead of a
 * horizontal thumbnail card. The Twin is Team Purex's biggest
 * differentiator vs Whoop / Fitbit / Google Fit — none of them show a
 * living, breathing body silhouette that responds to today's data.
 * Previously this component shrunk it to 96 px, tucked next to a
 * Vitality number, which read as an afterthought.
 *
 * New layout (dashboard-only):
 *   ┌────────────────────────────────────┐
 *   │  PureX Twin · <status badge>       │
 *   │                                    │
 *   │       [large animated avatar]      │  ← 200px, 7 anim layers
 *   │                                    │
 *   │       89                           │  ← colossal number
 *   │       Vitality today               │
 *   │                                    │
 *   │  “<one-line coach message>”        │
 *   │                                    │
 *   │  [ Open Twin ]  [ Future Clone ]   │
 *   └────────────────────────────────────┘
 *
 * On tap of the whole card or the Open Twin button → /client/twin.
 */
export function TwinCloneTeaser({
  avatarSrc,
  state,
  overall,
  message,
}: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border"
      style={{
        background: `
          radial-gradient(ellipse at 50% 0%, rgba(198,255,61,0.14) 0%, transparent 55%),
          radial-gradient(ellipse at 100% 100%, rgba(125,211,255,0.08) 0%, transparent 55%),
          linear-gradient(180deg, #10160e 0%, #0a0c09 100%)
        `,
        borderColor: 'rgba(198,255,61,0.22)',
        boxShadow:
          '0 0 0 1px rgba(198,255,61,0.10), 0 24px 48px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Header strip */}
      <div className="relative flex items-center justify-between px-5 pt-5 pb-2">
        <div
          className="inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.22em] font-bold"
          style={{ fontSize: 10, color: '#c6ff3d' }}
        >
          <Sparkles size={11} />
          PureX Twin
        </div>
        <TwinStatusBadge state={state} compact />
      </div>

      {/* Big animated avatar — the wow moment */}
      <Link
        href="/client/twin"
        aria-label="Open your PureX Twin"
        className="relative flex items-center justify-center pt-2 pb-2"
      >
        <AvatarImage src={avatarSrc} width={200} accent="#c6ff3d" />
      </Link>

      {/* Vitality readout */}
      <div className="relative flex flex-col items-center px-5 pb-3">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
          className="tabular-nums flex items-baseline gap-2"
        >
          <span
            className="font-display font-bold leading-none"
            style={{
              fontSize: 56,
              color: '#c6ff3d',
              textShadow: '0 0 24px rgba(198,255,61,0.35)',
            }}
          >
            {overall}
          </span>
          <span
            className="font-mono uppercase tracking-[0.20em] font-bold"
            style={{ fontSize: 10, color: 'rgba(198,255,61,0.65)' }}
          >
            / 100
          </span>
        </motion.div>
        <div
          className="mt-1 font-mono uppercase tracking-[0.22em] font-bold"
          style={{ fontSize: 10, color: 'rgba(255,255,255,0.50)' }}
        >
          Vitality today
        </div>

        {/* Coach one-liner */}
        <p
          className="mt-4 text-center max-w-md leading-relaxed italic"
          style={{
            fontSize: 13.5,
            color: 'rgba(245,245,240,0.78)',
            fontWeight: 500,
          }}
        >
          {'“' + message + '”'}
        </p>
      </div>

      {/* Vitals strip — the "medical monitor" moment. Sample vitals
          for fresh accounts (clearly labelled). Once wearable sync
          lands, the live HR / HRV / SpO2 / skin-temp flow in here. */}
      <div className="px-4 pt-3">
        <VitalsStrip vitals={SAMPLE_VITALS} />
      </div>

      {/* Bottom CTAs */}
      <div className="grid grid-cols-2 gap-2 px-4 pt-3 pb-4">
        <Link
          href="/client/twin"
          className="inline-flex items-center justify-center gap-1.5 rounded-full font-mono uppercase tracking-[0.18em] font-bold transition-opacity hover:opacity-90"
          style={{
            height: 44,
            fontSize: 11,
            color: '#0a0c09',
            background: 'linear-gradient(135deg, #d4ff5a 0%, #a8e60a 100%)',
          }}
        >
          Open Twin
          <ArrowRight size={12} strokeWidth={2.5} />
        </Link>
        <Link
          href="/client/future-clone"
          className="inline-flex items-center justify-center gap-1.5 rounded-full font-mono uppercase tracking-[0.16em] font-bold transition-colors"
          style={{
            height: 44,
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
    </motion.section>
  );
}
