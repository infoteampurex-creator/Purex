# Unity 3D Avatar — Documentation Index

Everything PureX needs to ship a Unity 3D avatar into the existing
Capacitor app. Phase 1 = one male character, idle animation, opens
full-screen on tap.

## Start here

If it's your first time, read in this order:

1. **[unity-as-library.md](../unity-as-library.md)** — Why this exists,
   architecture, phased plan, costs. ~10 min read.
2. **[phase-1-weekend-checklist.md](./phase-1-weekend-checklist.md)** —
   The exact step-by-step you follow over a weekend. Print this.
3. **[gitignore-for-unity-project.txt](./gitignore-for-unity-project.txt)**
   — Copy to the root of your new Unity project as `.gitignore`.

## Ready-to-drop Unity C# scripts

In [`scripts/`](./scripts/), drop these into `Assets/Scripts/` in your
Unity project after you create it:

| File | Goes on | What it does |
|---|---|---|
| `PureXBridge.cs` | Empty GameObject named "PureXBridge" | Receives Intent extras from Android, plays the requested animation. Phase 2 hooks for body morph / vitality are commented inline. |
| `PureXLifecycle.cs` | Same GameObject as PureXBridge | Caps framerate to 30, frees memory on background, respects OS sleep timeout. Critical for battery. |
| `HoloRingPulse.cs` | The HoloRing Quad GameObject | Pulses the ring's alpha on a slow sine wave. |

## Already wired in the Capacitor app

These exist in the repo, dormant until you drop a `unityLibrary/`
into `android/`:

- `android/app/src/main/java/com/teampurex/app/UnityBridgePlugin.kt`
  — Capacitor plugin (reflection-based, no compile-time Unity dep)
- `lib/plugins/unity-bridge.ts` — TS wrapper with `unityBridge.start()`
- `components/client/twin/UnityAvatarHost.tsx` — React component with
  built-in PNG fallback when Unity isn't present

## When you're done with Phase 1

The phase-1-weekend-checklist has a "common errors" section. If you
hit something not listed there, come back to the assistant with:
- The exact error message
- Which step in the checklist you were on
- Whether it's a Unity build error or an Android runtime error
