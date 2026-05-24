'use client';

import { Canvas } from '@react-three/fiber';
import { Bounds, OrbitControls, Environment, useAnimations, useGLTF } from '@react-three/drei';
import { useEffect, useMemo, useRef, Suspense } from 'react';
import { Group, Mesh, SkinnedMesh, type AnimationClip } from 'three';
import { SkeletonUtils } from 'three-stdlib';
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

// Drei preload — fetches the .glb on first import so the avatar
// renders without a loading flash. Browser caches it after first hit.
useGLTF.preload('/twin/3d/character.glb');

/**
 * Avatar3D — WebGL Twin avatar using a rigged glTF character.
 *
 * Model: Mixamo "X-Bot" (mirrored by three.js examples, free for
 * commercial use). Single skinned mesh with baked-in animation clips
 * (`idle`, `walk`, `run`). We play `idle` as the default state.
 *
 * Body-type morph strategy:
 *   The X-Bot doesn't have blendshapes for body fat — it's a single
 *   mesh designed for skeleton-driven animation. We approximate body
 *   type by uniform + axial scaling (heavier = wider XZ, slightly
 *   shorter overall). For a true morph rig (lean ↔ heavy via mesh
 *   deformation) we'd swap to a Ready Player Me or custom-rigged
 *   character — same component contract, different .glb URL.
 *
 * Why we clone the scene with SkeletonUtils:
 *   useGLTF caches the scene globally. If two <Avatar3D /> instances
 *   (Today + Day-90 on the Future Clone card) render simultaneously,
 *   they'd share the same skeleton and animate as one. Cloning gives
 *   each instance an independent skeleton + animation state.
 *
 * Performance budget (target: 60fps on mid-tier Android):
 *   - One skinned mesh, ~10k tris
 *   - One animation mixer per instance
 *   - dpr clamped to [1, 2] so retina phones don't melt the GPU
 *   - PBR environment lighting kept to "city" preset (~50 KB)
 */
export function Avatar3D({ bodyType, size = 220, accent = '#7dd3ff', glow = false }: Props) {
  return (
    <div style={{ width: size, height: size }} className="relative">
      <Canvas
        // Camera starts far back — drei's <Bounds fit> below will
        // re-position it to perfectly frame the character bounding
        // box. This avoids the "only legs visible" bug that hard-
        // coded coords cause when the model's actual scale differs
        // from assumptions.
        camera={{ position: [0, 1.4, 6], fov: 32 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ background: 'transparent' }}
        shadows
      >
        {/* Ambient + key + rim for a clean editorial look */}
        <ambientLight intensity={0.55} color={accent} />
        <directionalLight
          position={[3, 5, 4]}
          intensity={glow ? 1.6 : 1.2}
          color="#ffffff"
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight
          position={[-3, 2, -3]}
          intensity={0.55}
          color={glow ? '#ffd24d' : accent}
        />

        <Suspense fallback={null}>
          {/* Bounds auto-fits the camera to the character's bounding
              box on first render with a 1.15 margin — so we always
              see the whole figure regardless of model scale or body-
              type morph. `clip` adjusts near/far planes too. */}
          <Bounds fit clip observe margin={1.15}>
            <Character bodyType={bodyType} accent={accent} glow={glow} />
          </Bounds>
          <Environment preset="city" />
        </Suspense>

        {/* Auto-rotate provides the depth cue without needing drag.
            Target is set by Bounds automatically. */}
        <OrbitControls
          enabled={false}
          autoRotate
          autoRotateSpeed={0.7}
          enableZoom={false}
          enablePan={false}
        />
      </Canvas>
    </div>
  );
}

// ─── Character — loads + animates the .glb ──────────────────────────

interface CharacterProps {
  bodyType: BodyType;
  accent: string;
  glow: boolean;
}

/**
 * Body morph table — scale parameters per body type.
 *   sx, sz    = lateral spread (heavier = wider torso/limbs from
 *               front-back AND side-to-side)
 *   sy        = height factor (heavier reads slightly shorter
 *               because mass concentrates around the middle)
 *   yOffset   = vertical adjust to keep feet on the ground plane
 *               after scaling
 */
const BODY_PARAMS: Record<
  BodyType,
  { sx: number; sy: number; sz: number; yOffset: number }
> = {
  lean:     { sx: 0.92, sy: 1.04, sz: 0.92, yOffset: 0 },
  athletic: { sx: 1.00, sy: 1.00, sz: 1.00, yOffset: 0 },
  solid:    { sx: 1.14, sy: 0.98, sz: 1.10, yOffset: 0 },
  heavy:    { sx: 1.28, sy: 0.96, sz: 1.20, yOffset: 0 },
};

function Character({ bodyType, accent, glow }: CharacterProps) {
  const groupRef = useRef<Group>(null);

  // Load the .glb. useGLTF returns a singleton — we clone it below.
  const { scene, animations } = useGLTF('/twin/3d/character.glb') as unknown as {
    scene: Group;
    animations: AnimationClip[];
  };

  // Clone the scene so each Avatar3D instance has its own skeleton.
  // SkeletonUtils.clone (vs plain scene.clone) preserves bone bindings.
  const cloned = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  // Apply the accent color as a subtle emissive tint over the
  // character's existing materials so it reads as part of the
  // holographic UI rather than a separate asset.
  useEffect(() => {
    cloned.traverse((obj) => {
      if ((obj as Mesh).isMesh || (obj as SkinnedMesh).isSkinnedMesh) {
        const mesh = obj as Mesh;
        const mat = mesh.material as {
          emissive?: { set: (c: string) => void };
          emissiveIntensity?: number;
          metalness?: number;
          roughness?: number;
        };
        if (mat.emissive?.set) mat.emissive.set(accent);
        if ('emissiveIntensity' in mat) mat.emissiveIntensity = glow ? 0.35 : 0.18;
        if ('metalness' in mat) mat.metalness = 0.4;
        if ('roughness' in mat) mat.roughness = 0.45;
        mesh.castShadow = true;
        mesh.receiveShadow = false;
      }
    });
  }, [cloned, accent, glow]);

  // Wire animations to the cloned scene (NOT the singleton).
  const { actions, names } = useAnimations(animations, cloned);

  // Play the idle clip on mount. The X-Bot ships with clips named
  // exactly "idle", "walk", "run" — fall back to the first clip if
  // the naming ever changes upstream.
  useEffect(() => {
    const idleName =
      names.find((n) => n.toLowerCase().includes('idle')) ?? names[0];
    if (!idleName) return;
    const action = actions[idleName];
    if (!action) return;
    action.reset().fadeIn(0.4).play();
    return () => {
      action.fadeOut(0.4);
    };
  }, [actions, names]);

  const params = BODY_PARAMS[bodyType];

  return (
    <group
      ref={groupRef}
      position={[0, -0.05, 0]}
      scale={[params.sx, params.sy, params.sz]}
    >
      <primitive object={cloned} />
      <RingBase accent={accent} glow={glow} />
    </group>
  );
}

// ─── Holographic ring base under the character's feet ───────────────

function RingBase({ accent, glow }: { accent: string; glow: boolean }) {
  return (
    <group position={[0, 0, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.55, 0.012, 12, 96]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={glow ? 2.0 : 1.4}
          transparent
          opacity={0.92}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[0.33, 0.53, 64]} />
        <meshBasicMaterial color={accent} transparent opacity={0.10} />
      </mesh>
    </group>
  );
}
