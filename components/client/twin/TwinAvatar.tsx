'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { AvatarImage } from './AvatarImage';
import type { BodyType } from '@/lib/data/body-proportions';

interface Props {
  /** PNG to fall back to when WebGL is unavailable or the 3D bundle fails to load. */
  fallbackSrc: string;
  /** Body silhouette tier — drives both 3D capsule scaling and the PNG selection. */
  bodyType: BodyType;
  width?: number;
  accent?: string;
  glow?: boolean;
}

/**
 * Lazy-load Avatar3D. ssr:false because the Three.js renderer
 * absolutely cannot run server-side (no WebGL context in Node).
 *
 * Bundle effect: Three.js + R3F + drei (~150 KB gzipped) only loads
 * when this component mounts — which only happens on the dashboard
 * Twin card inside the app surface. Web visitors never pay the cost.
 */
const Avatar3DLazy = dynamic(
  () => import('./Avatar3D').then((m) => m.Avatar3D),
  { ssr: false, loading: () => null }
);

/**
 * TwinAvatar — picks 3D (WebGL) or 2D (PNG) avatar at runtime.
 *
 * Decision flow on mount:
 *   1. Try to create a tiny WebGL context. If the browser/WebView
 *      doesn't support WebGL, fall back to PNG immediately.
 *   2. Otherwise render Avatar3D inside Suspense; if the dynamic
 *      import or the GLSL pipeline fails, the inner ErrorBoundary
 *      also falls back to PNG.
 *
 * Why probe WebGL up-front instead of always trying 3D?
 *   On very old Android phones (~5% of installs) WebGL is broken
 *   or disabled. Better to render the PNG immediately than to flash
 *   a black square while the Three.js bundle loads only to fail.
 */
export function TwinAvatar({
  fallbackSrc,
  bodyType,
  width = 200,
  accent = '#7dd3ff',
  glow = false,
}: Props) {
  // null = probing, true = WebGL works, false = use PNG
  const [webglOk, setWebglOk] = useState<boolean | null>(null);

  useEffect(() => {
    // Probe runs once on mount in the WebView.
    try {
      const canvas = document.createElement('canvas');
      const gl =
        canvas.getContext('webgl2') ||
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl');
      setWebglOk(!!gl);
    } catch {
      setWebglOk(false);
    }
  }, []);

  // While probing, render the PNG to avoid layout flicker. Once we
  // know WebGL is fine, swap in the 3D canvas. drei/R3F handle their
  // own internal loading state via Suspense.
  if (webglOk !== true) {
    return (
      <AvatarImage
        src={fallbackSrc}
        width={width}
        accent={accent}
        glow={glow}
      />
    );
  }

  return (
    <ThreeBoundary
      fallback={
        <AvatarImage
          src={fallbackSrc}
          width={width}
          accent={accent}
          glow={glow}
        />
      }
    >
      <Avatar3DLazy
        bodyType={bodyType}
        size={width}
        accent={accent}
        glow={glow}
      />
    </ThreeBoundary>
  );
}

// ─── Tiny error boundary so a Three.js crash never breaks the card ──

import { Component, type ReactNode } from 'react';

class ThreeBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: unknown) {
    // eslint-disable-next-line no-console
    console.warn('[TwinAvatar] 3D render failed, falling back to PNG:', err);
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
