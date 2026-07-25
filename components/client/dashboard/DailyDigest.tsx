'use client';

import { motion } from 'framer-motion';
import { Sparkles, Sun, Moon, Trophy, Heart } from 'lucide-react';
import type { DailyDigest as DigestType } from '@/lib/data/daily-digest';

const TONE_META: Record<
  DigestType['tone'],
  { color: string; icon: React.ComponentType<{ size?: number }> }
> = {
  warm: { color: '#c6ff3d', icon: Sun },
  push: { color: '#ff8a4d', icon: Sparkles },
  celebrate: { color: '#ffd24d', icon: Trophy },
  recover: { color: '#7dd3ff', icon: Moon },
};

/**
 * Top-of-dashboard coach greeting. Renders a compact 3-line card:
 *
 *   [icon]  Good morning, Vishnu.
 *           You slept 6.4h last night — well below your 8h target.
 *           Ease into today.
 *
 * Whoop opens their app with this exact pattern. It's the single
 * biggest emotional hook — the client feels the app is watching for
 * them, not just recording numbers. Tone + icon are picked in
 * lib/data/daily-digest based on the actual signal.
 */
export function DailyDigest({ digest }: { digest: DigestType }) {
  const meta = TONE_META[digest.tone];
  const Icon = meta.icon;

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-3xl border p-5 relative overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 0% 0%, ${meta.color}18 0%, transparent 55%),
          linear-gradient(180deg, #11150f 0%, #0a0c09 100%)
        `,
        borderColor: `${meta.color}30`,
        boxShadow: `0 0 0 1px ${meta.color}10, 0 24px 48px -12px rgba(0,0,0,0.55)`,
      }}
    >
      {/* Ambient wave underline — soft breathing pulse at bottom */}
      <div
        aria-hidden
        className="absolute left-0 right-0 bottom-0 h-1 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${meta.color}55 50%, transparent 100%)`,
          animation: 'digest-wave 4s ease-in-out infinite',
        }}
      />

      <div className="flex items-start gap-3">
        <div
          className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center"
          style={{
            background: `${meta.color}18`,
            border: `1px solid ${meta.color}45`,
            color: meta.color,
          }}
        >
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="font-display font-semibold leading-snug"
            style={{ fontSize: 17, color: 'rgba(245,245,240,0.98)' }}
          >
            {digest.greeting}
          </div>
          <p
            className="mt-1 leading-relaxed"
            style={{ fontSize: 14, color: 'rgba(245,245,240,0.75)' }}
          >
            {digest.observation}
          </p>
          <p
            className="mt-2 leading-relaxed inline-flex items-center gap-1.5"
            style={{ fontSize: 13, color: meta.color, fontWeight: 500 }}
          >
            <Heart size={11} />
            {digest.callToAction}
          </p>
        </div>
      </div>
    </motion.section>
  );
}
