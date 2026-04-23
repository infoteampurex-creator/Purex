'use client';

import { useRef, useState, useCallback } from 'react';

interface TiltState {
  rotateX: number;
  rotateY: number;
  translateX: number;
  translateY: number;
  glowX: number;
  glowY: number;
  isHovered: boolean;
}

/**
 * Mouse-follow 3D tilt with glow tracking.
 * Returns ref + tilt state + handlers. Apply rotateX/Y as CSS transforms
 * and glowX/Y as CSS custom properties for a spotlight overlay.
 *
 * @param maxTilt degrees of max rotation (default 10)
 * @param scale   scale on hover (default 1.02)
 */
export function useMouseTilt(maxTilt: number = 10) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<TiltState>({
    rotateX: 0,
    rotateY: 0,
    translateX: 0,
    translateY: 0,
    glowX: 50,
    glowY: 50,
    isHovered: false,
  });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;

      // Normalized (-1..1) from center
      const nx = (x - cx) / cx;
      const ny = (y - cy) / cy;

      setTilt({
        rotateX: -ny * maxTilt, // Invert Y for natural feel
        rotateY: nx * maxTilt,
        translateX: nx * 4,
        translateY: ny * 4,
        glowX: (x / rect.width) * 100,
        glowY: (y / rect.height) * 100,
        isHovered: true,
      });
    },
    [maxTilt]
  );

  const handleMouseLeave = useCallback(() => {
    setTilt({
      rotateX: 0,
      rotateY: 0,
      translateX: 0,
      translateY: 0,
      glowX: 50,
      glowY: 50,
      isHovered: false,
    });
  }, []);

  return {
    ref,
    tilt,
    handlers: {
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
    },
  };
}
