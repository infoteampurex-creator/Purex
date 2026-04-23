'use client';

import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, ContactShadows, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { UserCircle2, AlertCircle } from 'lucide-react';

/**
 * TwinViewer3D — cinematic 3D character renderer (local-GLB version).
 *
 * Loads the GLB file from /public/models/ (same origin as the site).
 * This is the most reliable setup — no external CDN, no network ties.
 *
 * DEFAULT AVATAR PATH: /models/avatar.glb
 *
 * To get started, download a GLB file (we recommend the free rigged
 * humanoid from https://github.com/KhronosGroup/glTF-Sample-Assets) and
 * drop it at public/models/avatar.glb. Full instructions in:
 *   docs/08-3d-avatar-setup.md
 *
 * Features:
 *   - Dramatic 3-point studio lighting
 *   - Ambient colored rim glow
 *   - Contact floor shadow
 *   - Subtle idle breathing animation
 *   - Drag to rotate (desktop + touch)
 *   - Graceful fallback when no GLB present
 */

interface TwinViewer3DProps {
  avatarUrl?: string;
  variant?: 'current' | 'projected';
  height?: number;
  interactive?: boolean;
}

const DEFAULT_AVATAR = '/models/avatar.glb';

export function TwinViewer3D({
  avatarUrl = DEFAULT_AVATAR,
  variant = 'current',
  height = 480,
  interactive = true,
}: TwinViewer3DProps) {
  const isProjected = variant === 'projected';
  const tintColor = isProjected ? '#c6ff3d' : '#7dd3ff';

  // Check if the GLB file exists
  const [status, setStatus] = useState<'checking' | 'ready' | 'missing'>(
    'checking'
  );

  useEffect(() => {
    let cancelled = false;
    fetch(avatarUrl, { method: 'HEAD' })
      .then((res) => {
        if (!cancelled) setStatus(res.ok ? 'ready' : 'missing');
      })
      .catch(() => {
        if (!cancelled) setStatus('missing');
      });
    return () => {
      cancelled = true;
    };
  }, [avatarUrl]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl"
      style={{ height, background: '#0a0c09' }}
    >
      {/* Moody background */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isProjected
            ? 'radial-gradient(ellipse at 50% 40%, rgba(198, 255, 61, 0.12) 0%, rgba(10, 12, 9, 0.4) 60%, rgba(10, 12, 9, 1) 100%)'
            : 'radial-gradient(ellipse at 50% 40%, rgba(125, 211, 255, 0.08) 0%, rgba(10, 12, 9, 0.4) 60%, rgba(10, 12, 9, 1) 100%)',
        }}
      />

      {status === 'checking' && <LoadingPlaceholder />}
      {status === 'missing' && <MissingAvatarPlaceholder variant={variant} />}
      {status === 'ready' && (
        <>
          {isProjected && <ParticleLayer />}

          <Canvas
            camera={{ position: [0, 1.2, 2.8], fov: 30 }}
            shadows
            gl={{ antialias: true, alpha: true }}
            className="relative"
          >
            <Suspense fallback={null}>
              <ambientLight intensity={0.35} color="#ffffff" />
              <directionalLight
                position={[-3, 4, 3]}
                intensity={1.8}
                color={isProjected ? '#eaff9a' : '#ffffff'}
                castShadow
                shadow-mapSize={[1024, 1024]}
              />
              <directionalLight position={[3, 2, 2]} intensity={0.5} color="#ffffff" />
              <pointLight
                position={[0, 2, -3]}
                intensity={2}
                color={tintColor}
                distance={8}
              />
              <pointLight
                position={[0, -1, 2]}
                intensity={0.4}
                color={tintColor}
                distance={5}
              />

              <Character url={avatarUrl} />

              <ContactShadows
                position={[0, -0.01, 0]}
                scale={4}
                blur={2.5}
                opacity={0.6}
                far={3}
                resolution={256}
              />

              {interactive && (
                <OrbitControls
                  enablePan={false}
                  enableZoom={false}
                  minPolarAngle={Math.PI / 2.4}
                  maxPolarAngle={Math.PI / 2}
                  enableDamping
                  dampingFactor={0.08}
                />
              )}
            </Suspense>
          </Canvas>
        </>
      )}

      {/* Vignette */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 80px 20px rgba(10, 12, 9, 0.6)',
          borderRadius: '1rem',
        }}
      />
    </div>
  );
}

// ─── Character with breathing animation ────────────────────────────
function Character({ url }: { url: string }) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(url);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();
    group.current.position.y = -0.95 + Math.sin(t * 1.5) * 0.008;
    group.current.rotation.y = Math.sin(t * 0.4) * 0.03;
  });

  return (
    <group ref={group} position={[0, -0.95, 0]}>
      <primitive object={scene} scale={1.0} />
    </group>
  );
}

// ─── Loading state ─────────────────────────────────────────────────
function LoadingPlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-10">
      <div className="text-center">
        <div className="relative mx-auto mb-3 w-10 h-10">
          <div
            className="absolute inset-0 rounded-full border-2 border-accent/20 animate-spin"
            style={{ borderTopColor: '#c6ff3d' }}
          />
        </div>
        <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-text-muted">
          Checking 3D model…
        </div>
      </div>
    </div>
  );
}

// ─── Missing avatar fallback ───────────────────────────────────────
function MissingAvatarPlaceholder({
  variant,
}: {
  variant: 'current' | 'projected';
}) {
  const color = variant === 'projected' ? '#c6ff3d' : '#7dd3ff';

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6 text-center">
      {/* Decorative silhouette outline */}
      <div className="relative mb-5">
        <UserCircle2
          size={96}
          className="text-text-muted opacity-30"
          strokeWidth={1}
        />
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-40"
          style={{ background: color }}
        />
      </div>

      <div className="max-w-[85%]">
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-3 border"
          style={{
            background: `${color}14`,
            borderColor: `${color}40`,
            color,
          }}
        >
          <AlertCircle size={10} strokeWidth={2.5} />
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] font-bold">
            3D Model Missing
          </span>
        </div>

        <h3 className="font-display font-semibold text-base md:text-lg text-white mb-2">
          Add your avatar file
        </h3>
        <p className="text-xs text-text-muted leading-relaxed mb-3">
          Drop a GLB file at{' '}
          <code className="inline-block px-1.5 py-0.5 rounded bg-bg-card text-accent font-mono text-[10px]">
            public/models/avatar.glb
          </code>
        </p>
        <p className="text-[10px] text-text-dim leading-relaxed">
          See{' '}
          <code className="text-accent">docs/08-3d-avatar-setup.md</code> for
          free avatar sources
        </p>
      </div>
    </div>
  );
}

// ─── Floating particles ────────────────────────────────────────────
function ParticleLayer() {
  const [particles] = useState(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: 5 + Math.random() * 90,
      top: 10 + Math.random() * 80,
      size: 1 + Math.random() * 2.5,
      duration: 4 + Math.random() * 4,
      delay: Math.random() * 5,
      opacity: 0.25 + Math.random() * 0.45,
    }))
  );

  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none overflow-hidden z-10"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: '#c6ff3d',
            opacity: p.opacity,
            boxShadow: '0 0 4px rgba(198, 255, 61, 0.6)',
            animation: `twin-particle-float ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes twin-particle-float {
          0%,
          100% {
            transform: translateY(0) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-40px) scale(1.2);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}

// Preload default avatar
useGLTF.preload(DEFAULT_AVATAR);
