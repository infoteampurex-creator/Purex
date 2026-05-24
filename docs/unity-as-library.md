# Unity-as-Library (UaaL) — PureX Avatar 3D Runbook

> **Status:** scaffold landed (Capacitor plugin + TS bridge + React host).
> **Pending:** Unity Editor project, `.aar` export, asset rigging.
>
> **Estimated effort:** 4–8 weeks engineering. Assumes Unity 2022.3 LTS
> (most stable UaaL target as of late 2025). +50–100 MB APK size impact.

---

## Why this exists

The current Twin avatar is a transparent WebP swapped by BMI band
(`lib/data/avatar-asset.ts`). Looks good, costs ₹0, but it's static —
no motion, no real "I'm becoming a different body" feeling.

Unity-as-Library lets us embed a real 3D character (idle breathing,
strength-flex animation, walking sequence, body-morph blendshapes)
rendered by a real game engine, while keeping the rest of the app as
Capacitor + Next.js. Industry-standard route used by health apps like
Freeletics, Centr, etc.

## Architecture

```
┌─────────────────────────────────────────────┐
│            Next.js (TypeScript)             │
│  ┌─────────────────────────────────────┐    │
│  │ UnityAvatarHost.tsx (React)         │    │
│  │   → unityBridge.start()             │    │
│  │   → unityBridge.setBodyType('heavy')│    │
│  └────────────┬────────────────────────┘    │
└───────────────┼─────────────────────────────┘
                │ Capacitor plugin JSON
┌───────────────▼─────────────────────────────┐
│      UnityBridgePlugin.kt (Capacitor)       │
│   reflection → UnityPlayer (in .aar)        │
└───────────────┬─────────────────────────────┘
                │ UnitySendMessage / native calls
┌───────────────▼─────────────────────────────┐
│        Unity Engine (.aar, ~40 MB)          │
│   PureXAvatar.unity scene                   │
│     - Rigged character mesh                 │
│     - Idle / Flex / Walk animator           │
│     - Body-type blendshapes (4 stops)       │
└─────────────────────────────────────────────┘
```

## Phased plan

### Phase 0 — Decision gates (do this first, don't skip)

Before sinking weeks into Unity:

- [ ] Confirm budget: contractor (~₹3–8 lakh for 3-month engagement) **OR**
      committing to learning Unity C# yourself
- [ ] Confirm APK size budget: +50–100 MB is acceptable for Play Store
      (current APK is ~12 MB)
- [ ] Confirm 4–8 week timeline doesn't block more urgent features
      (Health Connect, meal AI Phase 2, etc.)
- [ ] Asset source plan picked:
      - **Free path:** Mixamo rigged characters + manual import (free, but
        no body-morph blendshapes — would need to author those in Blender)
      - **Paid character:** Synty / Polygon characters ($30–50 each)
      - **Service:** Ready Player Me API (~₹2k–5k/month, runtime avatars
        but limited customization)

### Phase 1 — Unity-side project

1. Install **Unity Hub** + **Unity 2022.3 LTS** (~10 GB disk)
2. Install **Android Build Support** module via Hub
3. Create new Unity project: `purex-unity-avatar/` (sibling repo to
   `purex-phase1/`, not nested — separate Git repo)
4. Import a rigged humanoid character (Mixamo recommended for first pass)
5. Build the avatar scene:
   - `Scenes/PureXAvatar.unity`
   - Camera framed waist-up
   - Lighting: 3-point, warm key + cool fill (matches app's gold/cyan)
   - Animator with states: `Idle`, `Flex`, `Walk`, `Charged`
   - Blendshape rig for body-type morph (lean / athletic / solid / heavy)
6. Write `PureXBridge.cs` — receives `SetBodyType(string)`,
   `SetAnimation(string)` from Android via `UnitySendMessage`
7. **Build Settings → Android → Export Project** = ✓
8. Build → produces `unityLibrary/` Gradle module

### Phase 2 — Wire into Capacitor Android

1. Copy Unity-exported `unityLibrary/` into
   `purex-phase1/android/unityLibrary/`
2. Add to `android/settings.gradle`:
   ```gradle
   include ':unityLibrary'
   project(':unityLibrary').projectDir = new File('./unityLibrary')
   ```
3. Add to `android/app/build.gradle` dependencies:
   ```gradle
   implementation project(':unityLibrary')
   ```
4. Add Unity activity to `AndroidManifest.xml`:
   ```xml
   <activity
       android:name="com.unity3d.player.UnityPlayerActivity"
       android:theme="@style/UnityThemeSelector"
       android:configChanges="mcc|mnc|locale|touchscreen|keyboard|keyboardHidden|navigation|orientation|screenLayout|uiMode|screenSize|smallestScreenSize|fontScale|layoutDirection|density"
       android:hardwareAccelerated="false"
       android:exported="false" />
   ```
5. The `UnityBridgePlugin.kt` already in the repo uses **reflection** to
   call into `com.unity3d.player.UnityPlayer` — no recompile needed once
   the `unityLibrary` module is present.
6. Run `npx cap sync android` then build APK. First build will be slow
   (~5 min) — Unity's gradle module is heavy.

### Phase 3 — JS-side integration

The `lib/plugins/unity-bridge.ts` + `components/client/twin/UnityAvatarHost.tsx`
scaffolds in this repo are ready. To enable in the Twin card:

```tsx
// In TwinDashboardCardApp.tsx, replace AvatarImage with:
import { UnityAvatarHost } from './UnityAvatarHost';

<UnityAvatarHost
  bodyType={bodyType}
  animation="idle"
  fallbackSrc={avatarSrc}   // PNG fallback if Unity not loaded
  width={200}
  accent={statusColor}
/>
```

The host component:
- Checks `unityBridge.isAvailable()` on mount
- If yes → opens Unity activity, sends body type
- If no → renders existing `AvatarImage` PNG fallback

This means the **PNG path stays as the safety net** — if Unity fails to
load, OOMs on low-end devices, or isn't bundled in the iOS build, users
still see the current static avatar. Zero regression.

### Phase 4 — iOS (later)

Unity-as-Library for iOS exports a `.framework`, not an `.aar`. The
Capacitor plugin needs a separate Swift implementation. Out of scope
for v1 — Android-first.

### Phase 5 — Polish

- Body-type morph animation (interpolate blendshape weights when BMI
  changes day-over-day)
- "Day 90 future" view: same model with projected body type blend
- Tap-to-rotate camera gesture (drag horizontally on the Unity view)
- Memory: unload Unity scene on Twin card unmount to free ~150 MB GPU
- APK size: enable Android App Bundle splits + IL2CPP `arm64-v8a` only

## Cost summary

| Item                  | One-time                | Monthly         |
| --------------------- | ----------------------- | --------------- |
| Unity Personal        | Free (under $200k/y)    | ₹0              |
| Unity Editor + Hub    | Free                    | ₹0              |
| Character asset       | ₹0 (Mixamo) – ₹4k       | ₹0              |
| Contractor (optional) | ₹3–8 lakh               | —               |
| APK size              | +50–100 MB (one-time)   | —               |
| Server / runtime      | ₹0 (renders on-device)  | ₹0              |
| **Total**             | **₹0 – ₹8 lakh**        | **₹0**          |

(Compare: current PNG avatar = ₹0 one-time, ₹0 ongoing, +160 KB APK.)

## When to abandon Unity

Bail out of UaaL and stick with PNGs if:
- APK size hurts install-conversion in Play Console (track after first
  Unity build ships to internal testing)
- Battery drain complaints (Unity = GPU on whenever Twin card visible)
- Low-end Samsung devices OOM-crash the WebView when Unity inflates
- You can't justify the maintenance burden of two stacks (TS + C#)

The PNG path stays in the codebase as the always-working fallback, so
killing Unity later = delete one component import. No painted-in corner.
