/**
 * unity-bridge — TypeScript wrapper around the native UnityBridge
 * Capacitor plugin (android/app/src/main/java/.../UnityBridgePlugin.kt).
 *
 * Safe to import on web or server — every call no-ops to a benign
 * default when Capacitor isn't present or the Unity .aar isn't linked.
 * That means the same React component can run unchanged in the
 * marketing site (no Unity), the Capacitor app on a device WITHOUT
 * the Unity build (PNG fallback), and the Capacitor app WITH Unity
 * (real 3D avatar).
 *
 * See docs/unity-as-library.md for the full integration runbook.
 */

import type { BodyType } from '@/lib/data/body-proportions';

// Animation names the Unity-side PureXBridge.cs is expected to support.
// Add new values here AND in the Unity Animator controller when extending.
export type UnityAnimation = 'idle' | 'flex' | 'walk' | 'charged';

interface UnityBridgePlugin {
  isAvailable(): Promise<{ available: boolean }>;
  start(opts: { bodyType: BodyType; animation?: UnityAnimation }): Promise<void>;
  stop(): Promise<void>;
  sendMessage(opts: { object: string; method: string; payload?: string }): Promise<void>;
  setBodyType(opts: { bodyType: BodyType }): Promise<void>;
  setAnimation(opts: { name: UnityAnimation }): Promise<void>;
}

/**
 * Lazily resolve the native plugin. We avoid importing `@capacitor/core`
 * at the top of every page (it pulls a sizable runtime into the web
 * bundle for no reason on /login, /marketing, etc.).
 */
async function resolvePlugin(): Promise<UnityBridgePlugin | null> {
  if (typeof window === 'undefined') return null;
  try {
    const { Capacitor, registerPlugin } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return null;
    // registerPlugin returns a proxy bound to the native bridge. The
    // first argument MUST match the @CapacitorPlugin(name=...) value
    // in UnityBridgePlugin.kt — "UnityBridge".
    return registerPlugin<UnityBridgePlugin>('UnityBridge');
  } catch {
    return null;
  }
}

let cached: UnityBridgePlugin | null | undefined;
async function get(): Promise<UnityBridgePlugin | null> {
  if (cached !== undefined) return cached;
  cached = await resolvePlugin();
  return cached;
}

/**
 * Quick capability probe. Returns true ONLY when:
 *   1. Running inside the Capacitor native shell (Android/iOS), AND
 *   2. The Unity .aar/.framework is linked into this build, AND
 *   3. `com.unity3d.player.UnityPlayer` resolves via reflection.
 *
 * Use this to feature-flag the UnityAvatarHost vs the PNG AvatarImage
 * fallback. Result is memoised after the first call.
 */
let availabilityCache: boolean | null = null;
export async function isUnityAvailable(): Promise<boolean> {
  if (availabilityCache !== null) return availabilityCache;
  const plugin = await get();
  if (!plugin) { availabilityCache = false; return false; }
  try {
    const { available } = await plugin.isAvailable();
    availabilityCache = available;
    return available;
  } catch {
    availabilityCache = false;
    return false;
  }
}

/** Launch the Unity activity full-screen with the given body type. */
export async function startUnityAvatar(
  bodyType: BodyType,
  animation: UnityAnimation = 'idle'
): Promise<void> {
  const plugin = await get();
  if (!plugin) throw new Error('UnityBridge not available on this platform');
  await plugin.start({ bodyType, animation });
}

/** Update the currently-displayed body type (hot-swaps blendshapes). */
export async function setUnityBodyType(bodyType: BodyType): Promise<void> {
  const plugin = await get();
  if (!plugin) return; // no-op fallback
  try { await plugin.setBodyType({ bodyType }); } catch { /* swallow */ }
}

/** Trigger a one-shot animation on the avatar. */
export async function setUnityAnimation(name: UnityAnimation): Promise<void> {
  const plugin = await get();
  if (!plugin) return;
  try { await plugin.setAnimation({ name }); } catch { /* swallow */ }
}

/** Tear down Unity to free GPU/VRAM. Call on component unmount. */
export async function stopUnityAvatar(): Promise<void> {
  const plugin = await get();
  if (!plugin) return;
  try { await plugin.stop(); } catch { /* swallow */ }
}

/** Bundled convenience export — pick whichever style your call-site prefers. */
export const unityBridge = {
  isAvailable: isUnityAvailable,
  start: startUnityAvatar,
  setBodyType: setUnityBodyType,
  setAnimation: setUnityAnimation,
  stop: stopUnityAvatar,
};
