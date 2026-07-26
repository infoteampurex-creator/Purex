'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  useGLTF,
  Environment,
  ContactShadows,
} from '@react-three/drei';
import type { Group } from 'three';

/**
 * Twin3DViewer — renders a Ready Player Me full-body .glb avatar
 * in an interactive Three.js canvas.
 *
 * Uses @react-three/fiber (React renderer for Three.js) and drei
 * helpers. Ready Player Me exports GLB with:
 *   - PBR materials + textures
 *   - Rigged skeleton (mixamo-compatible bone names)
 *   - Blendshapes for facial expressions
 *   - Optional morph targets for body shape (BodyType_Light,
 *     BodyType_Athletic, BodyType_Muscular, BodyType_Heavy)
 *
 * The avatar's origin is at the character's feet, ~1.8m tall. We
 * position the camera to frame it head-to-foot on both mobile and
 * desktop.
 *
 * A soft breathing animation is applied — subtle scale wobble on
 * the whole rig — so the avatar feels alive even without a full
 * body-animation clip. When RPM's animation library ships fuller
 * idle clips we'll swap this out.
 *
 * WebGL fallback: if the browser doesn't support WebGL 2 or the
 * canvas fails to init, the parent should fall back to the PNG
 * <AvatarImage> via a WebGL capability check (built into the
 * Twin wrappers).
 */

interface Props {
  /** The .glb URL from Ready Player Me (e.g. https://models.readyplayer.me/xxx.glb) */
  glbUrl: string;
  /** Accent colour for the ground contact shadow & rim light. */
  accent?: string;
  /** Whether to enable orbit controls (drag to rotate). Defaults true. */
  interactive?: boolean;
  /** Camera framing preset. Default 'full' shows the whole body. */
  framing?: 'full' | 'bust';
}

export function Twin3DViewer({
  glbUrl,
  accent = '#c6ff3d',
  interactive = true,
  framing = 'full',
}: Props) {
  return (
    <div className="w-full aspect-[3/4] relative">
      <Canvas
        camera={{
          position: framing === 'full' ? [0, 1.0, 2.4] : [0, 1.6, 1.2],
          fov: 30,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
      >
        <Suspense fallback={<LoadingIndicator />}>
          {/* Lighting: soft studio setup */}
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[2, 3, 2]}
            intensity={0.8}
            castShadow
          />
          <directionalLight
            position={[-2, 2, -1]}
            intensity={0.3}
            color={accent}
          />

          <RpmAvatar glbUrl={glbUrl} />

          {/* Ground contact shadow — grounds the character
              visually without needing a full ground plane. */}
          <ContactShadows
            position={[0, 0, 0]}
            opacity={0.5}
            scale={4}
            blur={2}
            far={2}
            color="#000000"
          />

          {/* Studio environment for realistic PBR lighting on the
              avatar's skin & clothing. Uses preset built into drei
              so no external HDR fetch is needed. */}
          <Environment preset="studio" />

          {interactive ? (
            <OrbitControls
              enablePan={false}
              enableZoom={true}
              minPolarAngle={Math.PI / 3}
              maxPolarAngle={Math.PI / 1.8}
              minDistance={1.5}
              maxDistance={4}
              target={[0, framing === 'full' ? 0.9 : 1.5, 0]}
            />
          ) : null}
        </Suspense>
      </Canvas>
    </div>
  );
}

/**
 * Loads the .glb and applies the subtle breathing animation.
 * useGLTF caches by URL so subsequent renders of the same avatar
 * hit the cache instantly.
 */
function RpmAvatar({ glbUrl }: { glbUrl: string }) {
  const { scene } = useGLTF(glbUrl);
  const groupRef = useRef<Group>(null);

  // Subtle breathing — scale wobble on Y, ~4 s period, ±1%.
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    const breath = 1 + Math.sin(t * 1.6) * 0.008;
    groupRef.current.scale.setY(breath);
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive object={scene} />
    </group>
  );
}

function LoadingIndicator() {
  return (
    <mesh position={[0, 1, 0]}>
      <sphereGeometry args={[0.05, 16, 16]} />
      <meshBasicMaterial color="#c6ff3d" wireframe />
    </mesh>
  );
}

// Preload the drei GLTF loader for the demo avatar so first render
// on the target page doesn't wait for the network. Consumers can
// call useGLTF.preload(url) for their own users' avatars.
if (typeof window !== 'undefined') {
  // Ready Player Me public demo avatar — used as the default until
  // the user creates their own.
  useGLTF.preload('https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb');
}
