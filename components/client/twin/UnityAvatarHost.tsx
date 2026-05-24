'use client';

import { useCallback, useEffect, useState } from 'react';
import { Box } from 'lucide-react';
import { motion } from 'framer-motion';
import { AvatarImage } from './AvatarImage';
import { unityBridge } from '@/lib/plugins/unity-bridge';
import type { BodyType } from '@/lib/data/body-proportions';
import type { UnityAnimation } from '@/lib/plugins/unity-bridge';

interface Props {
  /** PNG to show when Unity is unavailable or before tap. */
  fallbackSrc: string;
  /** Drives the Unity-side blendshape selection. */
  bodyType: BodyType;
  /** Animation state to play once Unity launches. Default: idle. */
  animation?: UnityAnimation;
  width?: number;
  accent?: string;
  glow?: boolean;
  /** Hide the "View in 3D" overlay even when Unity is available. */
  hide3DButton?: boolean;
}

/**
 * UnityAvatarHost
 * ---------------
 * Drop-in replacement for <AvatarImage /> that adds a "View in 3D"
 * affordance when the Unity-as-Library build is present. Until the
 * Unity .aar is linked into the Android project (see
 * docs/unity-as-library.md), this renders exactly the same PNG as
 * before — no visual diff, zero runtime cost.
 *
 * Why a separate component instead of inlining the check into
 * AvatarImage?
 *   AvatarImage is used in 5+ places (Twin card, Future Clone card,
 *   /client/twin page, etc.) and most of them shouldn't fire up a 3D
 *   activity. The Twin card is the one place where the "view in 3D"
 *   gesture makes sense — keeping the unity hook out of AvatarImage
 *   means lazy-loaders don't pull in @capacitor/core on every screen
 *   that happens to render an avatar (the marketing page included).
 *
 * Launch model (Phase 1):
 *   Tapping "View in 3D" launches the Unity activity FULL-SCREEN as a
 *   separate Android activity. Simpler than embedding a SurfaceView
 *   over the WebView, and good enough for v1 — users get the wow
 *   moment, then back-button returns to the WebView Twin card.
 *
 * Future (Phase 5):
 *   Embed UnityPlayer's view inline at the avatar's position. Requires
 *   `UnityPlayer.requestFocus`, a transparent surface, and DOM-coord
 *   bridging from JS. Out of scope until Phase 1 ships and we measure
 *   battery/memory impact.
 */
export function UnityAvatarHost({
  fallbackSrc,
  bodyType,
  animation = 'idle',
  width = 200,
  accent = '#7dd3ff',
  glow = false,
  hide3DButton = false,
}: Props) {
  const [unityReady, setUnityReady] = useState(false);
  const [launching, setLaunching] = useState(false);

  // Probe capability once. If Unity is not linked, button stays hidden.
  useEffect(() => {
    let cancelled = false;
    unityBridge.isAvailable().then((available) => {
      if (!cancelled) setUnityReady(available);
    });
    return () => { cancelled = true; };
  }, []);

  const open3D = useCallback(async () => {
    if (!unityReady || launching) return;
    setLaunching(true);
    try {
      await unityBridge.start(bodyType, animation);
    } catch (e) {
      // Surface to console; UX-wise we silently keep showing the PNG.
      // eslint-disable-next-line no-console
      console.warn('Unity launch failed:', e);
    } finally {
      // Reset shortly after — the Unity activity covers the screen,
      // so by the time control returns here the user is already in it.
      setTimeout(() => setLaunching(false), 500);
    }
  }, [unityReady, launching, bodyType, animation]);

  return (
    <div className="relative">
      <AvatarImage
        src={fallbackSrc}
        width={width}
        accent={accent}
        glow={glow}
      />

      {unityReady && !hide3DButton && (
        <motion.button
          type="button"
          onClick={open3D}
          disabled={launching}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          aria-label="View avatar in 3D"
          className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono uppercase tracking-[0.18em] font-bold backdrop-blur-md transition-opacity active:opacity-70 disabled:opacity-50"
          style={{
            fontSize: 9,
            color: accent,
            backgroundColor: 'rgba(10,12,9,0.72)',
            border: `1px solid ${accent}55`,
            boxShadow: `0 0 12px ${accent}33`,
          }}
        >
          <Box size={10} />
          {launching ? 'Loading…' : 'View in 3D'}
        </motion.button>
      )}
    </div>
  );
}
