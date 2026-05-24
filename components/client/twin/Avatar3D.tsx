'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { useRef, Suspense } from 'react';
import type { Group, Mesh } from 'three';
import type { BodyType } from '@/lib/data/body-proportions';

interface Props {
  /** Drives the avatar's body silhouette: lean / athletic / solid / heavy. */
  bodyType: BodyType;
  /** Pixel width/height of the canvas square. */
  size?: number;
  /** Hex color for the holographic accent — matches the Twin card's status color. */
  accent?: string;
  /** Brighter rim lighting + warmer base — Day-90 "future" treatment. */
  glow?: boolean;
}

/**
 * Avatar3D — first-cut WebGL 3D Twin avatar.
 *
 * Procedural humanoid built from Three.js primitives (capsule torso,
 * sphere head, cylinder limbs). The body silhouette morphs by body
 * type via scale parameters — heavier = wider torso/legs, leaner =
 * narrower. Auto-rotates slowly so you see the depth without needing
 * to drag.
 *
 * Why primitives first vs. a glTF character?
 *   The first thing we need to validate is that WebGL + R3F renders
 *   reliably inside the Capacitor WebView on Android. Once that's
 *   confirmed in the field, we swap the primitive mesh for a rigged
 *   glTF character (Mixamo / Quaternius / Ready Player Me) — same
 *   component, swap the <HumanoidMesh /> for a <CharacterMesh /> that
 *   loads a .glb via drei's useGLTF.
 *
 * Performance budget (target: 60fps on mid-tier Android):
 *   - <500 draw calls per frame (we use 8: torso/head/2 arms/2 legs/ground/ring)
 *   - <50k triangles total (we use ~5k from primitives)
 *   - No post-processing yet
 *   - dpr clamped to [1, 2] so retina phones don't melt the GPU
 */
export function Avatar3D({ bodyType, size = 220, accent = '#7dd3ff', glow = false }: Props) {
  return (
    <div style={{ width: size, height: size }} className="relative">
      <Canvas
        camera={{ position: [0, 0.4, 3.6], fov: 32 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,                // transparent background → card gradient shows through
          powerPreference: 'high-performance',
        }}
        style={{ background: 'transparent' }}
      >
        {/* Subtle holographic ambient */}
        <ambientLight intensity={0.45} color={accent} />
        {/* Key light from upper-front, accent-tinted */}
        <directionalLight
          position={[2.5, 4, 3]}
          intensity={glow ? 1.4 : 1.1}
          color={accent}
        />
        {/* Cool rim from behind to separate silhouette from card */}
        <directionalLight
          position={[-2, 2, -2.5]}
          intensity={0.6}
          color={glow ? '#ffd24d' : '#a0c4ff'}
        />

        <Suspense fallback={null}>
          <Scene bodyType={bodyType} accent={accent} glow={glow} />
          {/* drei Environment gives PBR-style reflections "for free".
              "city" preset is small (~50KB) and well-suited to neon UI. */}
          <Environment preset="city" />
        </Suspense>

        {/* No user controls by default — auto-rotate handles depth cue.
            Uncomment to let users drag-rotate the avatar. */}
        <OrbitControls
          enabled={false}
          autoRotate
          autoRotateSpeed={0.6}
          enableZoom={false}
          enablePan={false}
        />
      </Canvas>
    </div>
  );
}

// ─── Scene: body morph parameters by BodyType ──────────────────────

interface SceneProps {
  bodyType: BodyType;
  accent: string;
  glow: boolean;
}

/**
 * Body morph table — drives capsule scaling per body type.
 * Same vector both AvatarImage's PNG selection and the Unity bridge
 * use, so the visual story stays consistent across rendering paths.
 *   torsoScale = how wide the chest reads
 *   limbScale  = arm/leg girth
 *   bellyZ     = forward bulge (heavier = more)
 */
const BODY_PARAMS: Record<BodyType, { torsoScale: number; limbScale: number; bellyZ: number }> = {
  lean:     { torsoScale: 0.85, limbScale: 0.85, bellyZ: 0.00 },
  athletic: { torsoScale: 1.00, limbScale: 1.00, bellyZ: 0.00 },
  solid:    { torsoScale: 1.18, limbScale: 1.12, bellyZ: 0.06 },
  heavy:    { torsoScale: 1.36, limbScale: 1.20, bellyZ: 0.14 },
};

function Scene({ bodyType, accent, glow }: SceneProps) {
  const groupRef = useRef<Group>(null);
  const heartRef = useRef<Mesh>(null);
  const params = BODY_PARAMS[bodyType];

  // Subtle breathing — torso scales up/down on a 3.5s cycle. Matches
  // the breathing tempo of the PNG AvatarImage so a user switching
  // between paths doesn't feel a tempo shift.
  useFrame((state) => {
    if (groupRef.current) {
      const breathe = 1 + Math.sin(state.clock.elapsedTime * 1.8) * 0.012;
      groupRef.current.scale.y = breathe;
    }
    // Heart pulse — opacity flicker on a 1.2s cycle.
    if (heartRef.current) {
      const pulse = (Math.sin(state.clock.elapsedTime * 5.2) + 1) / 2; // 0→1
      const mat = heartRef.current.material as { opacity?: number };
      if ('opacity' in mat) mat.opacity = pulse * 0.85;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.9, 0]}>
      {/* Torso — wider for heavier body types */}
      <mesh position={[0, 0.95, params.bellyZ]} castShadow>
        <capsuleGeometry args={[0.34 * params.torsoScale, 0.85, 8, 16]} />
        <meshStandardMaterial
          color="#2a3340"
          metalness={0.55}
          roughness={0.35}
          emissive={accent}
          emissiveIntensity={glow ? 0.22 : 0.12}
        />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.78, 0]} castShadow>
        <sphereGeometry args={[0.24, 24, 24]} />
        <meshStandardMaterial
          color="#3a4452"
          metalness={0.5}
          roughness={0.4}
          emissive={accent}
          emissiveIntensity={glow ? 0.18 : 0.08}
        />
      </mesh>

      {/* Arms */}
      {[-0.46, 0.46].map((x) => (
        <mesh
          key={x}
          position={[x * params.torsoScale, 0.8, 0]}
          rotation={[0, 0, x > 0 ? -0.15 : 0.15]}
          castShadow
        >
          <capsuleGeometry args={[0.10 * params.limbScale, 0.95, 6, 12]} />
          <meshStandardMaterial
            color="#2a3340"
            metalness={0.55}
            roughness={0.35}
            emissive={accent}
            emissiveIntensity={glow ? 0.18 : 0.10}
          />
        </mesh>
      ))}

      {/* Legs */}
      {[-0.18, 0.18].map((x) => (
        <mesh key={x} position={[x * params.torsoScale, -0.15, 0]} castShadow>
          <capsuleGeometry args={[0.14 * params.limbScale, 1.0, 6, 12]} />
          <meshStandardMaterial
            color="#2a3340"
            metalness={0.55}
            roughness={0.35}
            emissive={accent}
            emissiveIntensity={glow ? 0.18 : 0.10}
          />
        </mesh>
      ))}

      {/* Heart pulse — small accent sphere over chest */}
      <mesh ref={heartRef} position={[0, 1.18, 0.36 * params.torsoScale]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial
          color="#ff4566"
          emissive="#ff4566"
          emissiveIntensity={2.5}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Holographic ring base — flat torus on the ground plane */}
      <mesh position={[0, -0.78, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.65, 0.012, 12, 96]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={glow ? 1.8 : 1.2}
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh position={[0, -0.77, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 0.62, 64]} />
        <meshBasicMaterial color={accent} transparent opacity={0.10} />
      </mesh>
    </group>
  );
}
