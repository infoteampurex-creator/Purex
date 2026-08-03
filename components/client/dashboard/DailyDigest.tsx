'use client';

import { motion } from 'framer-motion';
import { Sparkles, Sun, Moon, Trophy, Zap } from 'lucide-react';
import type { DailyDigest as DigestType } from '@/lib/data/daily-digest';

const TONE_META: Record<
  DigestType['tone'],
  { color: string; icon: React.ComponentType<{ size?: number }>; label: string }
> = {
  warm: { color: '#c6ff3d', icon: Sun, label: 'baseline' },
  push: { color: '#ff8a4d', icon: Zap, label: 'push' },
  celebrate: { color: '#ffd24d', icon: Trophy, label: 'momentum' },
  recover: { color: '#7dd3ff', icon: Moon, label: 'recovery' },
};

/**
 * Top-of-dashboard "AI Coach Insight" card. Whoop opens with a
 * "Recovery / Strain / Sleep" recap block, Fitbit with a personalised
 * Daily Readiness message — same idea.
 *
 * Two-layer pipeline: buildDailyDigest() runs the rule-based
 * deterministic insight first (renders instantly, always works),
 * then enhanceDigestWithClaude() (lib/data/daily-digest-ai.ts) layers
 * Claude Haiku 4.5 on top server-side with a hard 3.5 s timeout,
 * per-user-per-day cache, and silent fall-through to the rule-based
 * message on any failure. So this component just consumes the final
 * digest — it doesn't know or care which layer produced it.
 */
export function DailyDigest({ digest }: { digest: DigestType }) {
  const meta = TONE_META[digest.tone];
  const Icon = meta.icon;

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-3xl border p-5 md:p-6 overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 0% 0%, ${meta.color}20 0%, transparent 55%),
          radial-gradient(ellipse at 100% 100%, ${meta.color}10 0%, transparent 55%),
          linear-gradient(180deg, #10140e 0%, #0a0c09 100%)
        `,
        borderColor: `${meta.color}38`,
        boxShadow: `0 0 0 1px ${meta.color}14, 0 32px 60px -18px rgba(0,0,0,0.6)`,
      }}
    >
      {/* Ambient wave underline — soft breathing pulse at bottom */}
      <div
        aria-hidden
        className="absolute left-0 right-0 bottom-0 h-1 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${meta.color}66 50%, transparent 100%)`,
          animation: 'digest-wave 4s ease-in-out infinite',
        }}
      />

      {/* Header row — small "AI Coach Insight" label + tone chip */}
      <div className="flex items-center justify-between mb-3">
        <div
          className="inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.24em] font-bold"
          style={{ fontSize: 10, color: meta.color }}
        >
          <Sparkles size={11} strokeWidth={2.4} />
          AI Coach Insight
        </div>
        <span
          className="font-mono uppercase tracking-[0.20em] font-bold px-2 py-0.5 rounded-full"
          style={{
            fontSize: 9,
            color: meta.color,
            background: `${meta.color}18`,
            border: `1px solid ${meta.color}40`,
          }}
        >
          {meta.label}
        </span>
      </div>

      <div className="flex items-start gap-3">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' }}
          className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{
            background: `${meta.color}18`,
            border: `1px solid ${meta.color}50`,
            color: meta.color,
            boxShadow: `0 0 24px ${meta.color}22`,
          }}
        >
          <Icon size={22} />
        </motion.div>
        <div className="min-w-0 flex-1 pt-0.5">
          <div
            className="font-display font-semibold leading-snug"
            style={{ fontSize: 20, color: 'rgba(245,245,240,0.98)' }}
          >
            {digest.greeting}
          </div>
          <p
            className="mt-2 leading-relaxed"
            style={{ fontSize: 14.5, color: 'rgba(245,245,240,0.82)' }}
          >
            {digest.observation}
          </p>
          <p
            className="mt-3 leading-relaxed"
            style={{
              fontSize: 13.5,
              color: meta.color,
              fontWeight: 500,
              opacity: 0.95,
            }}
          >
            → {digest.callToAction}
          </p>
        </div>
      </div>
    </motion.section>
  );
}
