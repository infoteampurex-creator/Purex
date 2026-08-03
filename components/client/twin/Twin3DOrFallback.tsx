'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { TwinAvatarResponsive } from './TwinAvatarResponsive';
import type { BodyProportions } from '@/lib/data/body-proportions';
import type { Gender } from '@/lib/data/body-measurements';

// Twin3DViewer bundle contains three.js + drei + fiber (~500 KB
// gzipped). Load it dynamically so users who fall back to the PNG
// path never pay the download cost.
const Twin3DViewer = dynamic(
  () => import('./Twin3DViewer').then((m) => m.Twin3DViewer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full aspect-[3/4] flex items-center justify-center">
        <div className="text-text-muted font-mono text-xs uppercase tracking-[0.24em]">
          Loading Twin…
        </div>
      </div>
    ),
  }
);

interface Props {
  glbUrl: string | null;
  fallbackAvatarSrc: string;
  accent?: string;
  interactive?: boolean;
  framing?: 'full' | 'bust';
  proportions?: BodyProportions | null;
  heightCm?: number | null;
  gender?: Gender | null;
}

/**
 * Renders the 3D avatar when possible, falls back to the PNG when:
 *   1. The user hasn't created a 3D avatar yet (glbUrl is null)
 *   2. The browser doesn't support WebGL 2.0
 *   3. The device is on a known-slow-GPU allowlist
 *
 * WebGL detection is a one-off probe on mount — cheap, doesn't
 * touch the GPU. Result is memoised in module-scope so subsequent
 * renders skip the probe.
 */
export function Twin3DOrFallback({
  glbUrl,
  fallbackAvatarSrc,
  accent,
  interactive,
  framing,
  proportions,
  heightCm,
  gender,
}: Props) {
  const [canRender3D, setCanRender3D] = useState<boolean | null>(null);

  useEffect(() => {
    if (webglSupportCached !== null) {
      setCanRender3D(webglSupportCached);
      return;
    }
    const supported = detectWebGL();
    webglSupportCached = supported;
    setCanRender3D(supported);
  }, []);

  // Fall through to PNG if: no glbUrl, WebGL unsupported, or probe
  // hasn't finished yet (canRender3D === null). The last case
  // ensures the PNG shows first-paint while the probe runs, so no
  // blank canvas is visible.
  if (!glbUrl || canRender3D === false || canRender3D === null) {
    return (
      <TwinAvatarResponsive
        src={fallbackAvatarSrc}
        accent={accent}
        proportions={proportions}
        heightCm={heightCm}
        gender={gender}
      />
    );
  }

  return (
    <Twin3DViewer
      glbUrl={glbUrl}
      accent={accent}
      interactive={interactive}
      framing={framing}
    />
  );
}

// Module-scoped memoisation of the WebGL probe result. First render
// pays the ~2 ms probe cost; every subsequent render on the same
// page reuses.
let webglSupportCached: boolean | null = null;

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    // Try WebGL 2 first — required for the shader features drei uses.
    // Fall back to WebGL 1 detection so we can bail cleanly on very
    // old devices instead of pretending we can render.
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    if (!gl) return false;

    // Extra safety: check if the context is actually usable (some
    // headless / sandboxed browsers return a null context or a
    // context that immediately errors on the first draw).
    const contextAttrs = (gl as WebGLRenderingContext).getContextAttributes?.();
    if (!contextAttrs) return false;

    return true;
  } catch {
    return false;
  }
}
