# PURE X Unity 3D Avatar — Phase 1 Weekend Checklist

> **Scope:** ONE male avatar, idle animation only, opens full-screen on tap.
> **Time:** 12-15 hours (one focused weekend).
> **Tools:** All free (MakeHuman, Mixamo, Unity 2022.3 LTS, Blender optional).
>
> Keep this open on a second monitor / phone while you work. Tick boxes as you go.

---

## Pre-weekend (Friday night, ~1 hour)

- [ ] Free up ~30 GB disk space
- [ ] Download Unity Hub: https://unity.com/download
- [ ] In Unity Hub → Installs → Add → **Unity 2022.3.45f1 LTS**
  - [ ] Check ✓ Android Build Support
  - [ ] Check ✓ OpenJDK (under Android module)
  - [ ] Check ✓ Android SDK & NDK Tools (under Android module)
- [ ] Leave install running overnight (~20-30 min, 10 GB)
- [ ] Download MakeHuman 1.3: http://www.makehumancommunity.org/content/downloads.html
- [ ] Create Adobe ID for Mixamo: https://mixamo.com (Sign In → Create Account)
- [ ] Optional: Download Blender 4.0 from https://www.blender.org/download/

---

## Step 1 — MakeHuman (Saturday morning, ~3-4 hours)

Build the male character.

- [ ] Launch MakeHuman → start with default human
- [ ] **Modelling → Macro → Race** tab:
  - [ ] Asian: **0.55**
  - [ ] African: **0.30**
  - [ ] Caucasian: **0.15**
- [ ] **Modelling → Macro → Gender**: Male **1.0**
- [ ] **Modelling → Macro → Age**: slider to **0.4** (reads ~28-30 yrs)
- [ ] **Modelling → Macro → Weight**: slider to **0.55**
- [ ] **Modelling → Macro → Muscle**: slider to **0.65**
- [ ] **Modelling → Macro → Height**: slider to **0.55** (~1.75m)
- [ ] **Modelling → Face**: nose width +0.2, eye spacing -0.1
- [ ] **Skin** tab: pick "asian_male_average_skin" or "african_skin" — should look medium warm brown
- [ ] **Hair** tab: pick "short01" or "short_hair_male02" (dark)
- [ ] **Beard** tab: pick "stubble01" (optional)
- [ ] **Clothes** tab: pick "tshirt01" (top) + "shorts02" (bottom)
- [ ] **Pose/Animate** tab → Skeleton: **"game_engine"** ⚠️ Critical for Mecanim
- [ ] **File → Export**:
  - [ ] Format: Filmbox (.fbx)
  - [ ] Mesh format: Binary
  - [ ] Feet on ground: ✓
  - [ ] Scale: **0.1**
  - [ ] Filename: `purex_male_v1.fbx`
  - [ ] Save to: `~/Documents/PureX/`

**Verify:** FBX file is ~3 MB, opens in any FBX viewer showing your character in T-pose.

---

## Step 2 — Mixamo (Saturday afternoon, ~30 min)

Auto-rig + idle animation.

- [ ] Go to mixamo.com → Sign In
- [ ] Top right → **Upload Character** → drag `purex_male_v1.fbx`
- [ ] Click joints when prompted (chin, wrists, elbows, knees, groin)
- [ ] Skeleton LOD: **Standard Skeleton** (50 bones)
- [ ] Click Next → preview walk → Next → wait ~30 sec
- [ ] Top search bar: **"Idle"**
- [ ] Pick **"Idle (Variation 1)"** — clean breathing animation
- [ ] Right panel: In Place ✓, Character Arm-Space: 30
- [ ] Top right → **Download**:
  - [ ] Format: FBX Binary (.fbx)
  - [ ] Skin: **With Skin**
  - [ ] FPS: **30**
  - [ ] Keyframe Reduction: **None**
- [ ] Save as `purex_male_idle.fbx` (~5-6 MB)

---

## Step 3 — Unity setup (Saturday evening, ~4 hours)

### Create project

- [ ] Unity Hub → Projects → New Project
- [ ] Template: **3D (URP)**
- [ ] Name: `purex-unity-avatar`
- [ ] Location: **outside** purex-phase1 (e.g., `~/Documents/PureX/purex-unity-avatar/`)
- [ ] Create

### Initialize git in the new Unity project

- [ ] In terminal: `cd ~/Documents/PureX/purex-unity-avatar`
- [ ] `git init`
- [ ] Copy `purex-phase1/docs/unity/gitignore-for-unity-project.txt` → `.gitignore`
- [ ] (Later: create GitHub repo + push)

### Build target → Android

- [ ] File → Build Settings → Platform: Android → **Switch Platform**
- [ ] Player Settings:
  - [ ] Company Name: Teampurex
  - [ ] Product Name: PureXAvatar
  - [ ] Other Settings → Color Space: **Linear**
  - [ ] Other Settings → Auto Graphics API: ✗ → Add Vulkan, then OpenGLES3
  - [ ] Other Settings → Scripting Backend: **IL2CPP**
  - [ ] Other Settings → Target Architectures: ✓ ARM64 only (uncheck ARMv7)
  - [ ] Other Settings → API Compatibility: .NET Standard 2.1
  - [ ] Other Settings → Minimum API Level: **26**
  - [ ] Other Settings → Target API Level: **35**

### URP setup

- [ ] `Assets/Settings/` → Create → Rendering → URP Asset → name `URP-Mobile`
- [ ] Edit → Project Settings → Graphics → SRP Settings: drag `URP-Mobile`
- [ ] Edit → Project Settings → Quality: delete all levels except Medium, rename to Mobile, assign `URP-Mobile`
- [ ] Click `URP-Mobile` → Inspector:
  - [ ] Render Scale: **0.85**
  - [ ] HDR: ✗
  - [ ] MSAA: **2×**
  - [ ] Main Light Shadows: ✓
  - [ ] Additional Lights: Disabled
  - [ ] Shadows Max Distance: **15**
  - [ ] Shadows Cascade Count: **1**
  - [ ] Post-processing: ✓
  - [ ] SRP Batcher: ✓

### Scene setup

- [ ] File → New Scene → 3D (URP) → Save As `Assets/Scenes/PureXAvatar.unity`
- [ ] Window → Rendering → Lighting:
  - [ ] Environment → Skybox Material: **None**
  - [ ] Environment Lighting → Source: Color, Color: `#0d0f0c`, Intensity: 0.4
  - [ ] Auto Generate Lighting: ✗

### Import character

- [ ] Drag `purex_male_idle.fbx` → `Assets/Characters/Male/` (create folders)
- [ ] Click FBX → Inspector → Rig tab:
  - [ ] Animation Type: **Humanoid**
  - [ ] Avatar Definition: Create From This Model
  - [ ] Apply
- [ ] Materials tab → Extract Materials → save to `Assets/Characters/Male/Materials/`
- [ ] Materials tab → Extract Textures → save to `Assets/Characters/Male/Textures/`
- [ ] Animation tab → find `mixamo.com` clip:
  - [ ] Loop Time: ✓
  - [ ] Loop Pose: ✓
  - [ ] Root Transform Position (Y) → Bake Into Pose: ✓
  - [ ] Root Transform Position (XZ) → Bake Into Pose: ✓
  - [ ] Root Transform Rotation → Bake Into Pose: ✓
  - [ ] Apply

### Place character

- [ ] Drag FBX into Hierarchy
- [ ] Position: (0, 0, 0), Rotation: (0, 0, 0), Scale: (1, 1, 1)
- [ ] Verify feet are on ground plane

### Animator Controller

- [ ] Right-click `Assets/Characters/Male/` → Create → Animator Controller → name `MaleAvatar.controller`
- [ ] Double-click to open Animator
- [ ] Drag `mixamo.com` clip into Animator graph
- [ ] Right-click the new state → Set as Default State (turns orange)
- [ ] Hierarchy → click character → Inspector → Animator component:
  - [ ] Controller: drag `MaleAvatar.controller`
  - [ ] Avatar: auto-populated

### Camera

- [ ] Click "Main Camera" in Hierarchy:
  - [ ] Position: (0, 1.3, 3.5)
  - [ ] Rotation: (5, 180, 0)
  - [ ] Field of View: **30**
  - [ ] Clipping Planes: Near 0.1, Far 50
  - [ ] Clear Flags: Solid Color, Background: `#0a0c09`
  - [ ] Rendering → HDR: ✗
  - [ ] Rendering → MSAA: Use Pipeline Settings

### Lights — delete default, build 3-point

- [ ] Delete default Directional Light
- [ ] Create → Light → Directional Light → name `KeyLight`
  - [ ] Position: (3, 5, 2), Rotation: (50, 220, 0)
  - [ ] Color: `#ffeec4`, Intensity: **1.5**
  - [ ] Shadow Type: Soft Shadows
- [ ] Create → Light → Directional Light → name `FillLight`
  - [ ] Rotation: (20, 60, 0)
  - [ ] Color: `#7dd3ff` (PureX cyan), Intensity: **0.35**
  - [ ] Shadow Type: **No Shadows**
- [ ] Create → Light → Directional Light → name `RimLight`
  - [ ] Rotation: (-10, 0, 0)
  - [ ] Color: `#ffd24d` (PureX gold), Intensity: **0.7**
  - [ ] Shadow Type: **No Shadows**

### Holographic ring

- [ ] GameObject → 3D Object → Quad → name `HoloRing`
- [ ] Position: (0, 0.01, 0), Rotation: (90, 0, 0), Scale: (1.3, 1.3, 1)
- [ ] Create → Material → name `HoloRing_Mat`
  - [ ] Shader: Universal Render Pipeline/Unlit
  - [ ] Base Map: a white ring PNG on transparent (256×256, ring outline 30-40% radius)
  - [ ] Tint: `#c6ff3d` (PureX neon green)
  - [ ] Surface Type: Transparent
  - [ ] Blending Mode: Additive
- [ ] Drag material onto `HoloRing`

### Scripts

- [ ] Create empty GameObject in Hierarchy → name **`PureXBridge`** (EXACT name)
- [ ] Copy these C# files into `Assets/Scripts/`:
  - [ ] `PureXBridge.cs` (from `purex-phase1/docs/unity/scripts/`)
  - [ ] `PureXLifecycle.cs` (from `purex-phase1/docs/unity/scripts/`)
  - [ ] `HoloRingPulse.cs` (from `purex-phase1/docs/unity/scripts/`)
- [ ] Drag `PureXBridge.cs` onto the `PureXBridge` GameObject
- [ ] Drag `PureXLifecycle.cs` onto the same GameObject
- [ ] Drag `HoloRingPulse.cs` onto the `HoloRing` GameObject
- [ ] In `PureXBridge` Inspector: drag the character's Animator into the `animator` field

### Press Play

- [ ] Click Play button in Unity Editor
- [ ] **You should see your Indian male character breathing in a dark scene with warm key light + cyan fill + gold rim from behind, standing on a pulsing green ring**
- [ ] If yes — hard part done. Continue to Step 4.
- [ ] If no — debug. See "Common errors" section below.

---

## Step 4 — Export Unity as Android library (Sunday morning, ~30 min)

- [ ] File → Build Settings → Scenes In Build: drag `PureXAvatar.unity` in
- [ ] **Export Project: ✓** (critical)
- [ ] Click Export
- [ ] Pick output folder: `~/Documents/PureX/unity-export/`
- [ ] Wait 3-5 min for Unity to build

Output structure should have:
```
unity-export/
├─ build.gradle
├─ settings.gradle
├─ launcher/        ← discard this
└─ unityLibrary/    ← THIS is what you copy
```

---

## Step 5 — Drop into Capacitor app (Sunday afternoon, ~30 min)

- [ ] In terminal:
  ```bash
  cp -r ~/Documents/PureX/unity-export/unityLibrary \
        ~/Desktop/Team\ purex-1/purex-phase1/android/unityLibrary
  ```

- [ ] Edit `android/settings.gradle` — add at top:
  ```gradle
  include ':unityLibrary'
  project(':unityLibrary').projectDir = new File('./unityLibrary')
  ```

- [ ] Edit `android/app/build.gradle` — uncomment the line in `dependencies {}`:
  ```gradle
  implementation project(':unityLibrary')
  ```

- [ ] Edit `android/app/src/main/AndroidManifest.xml` — add inside `<application>`:
  ```xml
  <activity
      android:name="com.unity3d.player.UnityPlayerActivity"
      android:theme="@style/UnityThemeSelector"
      android:configChanges="mcc|mnc|locale|touchscreen|keyboard|keyboardHidden|navigation|orientation|screenLayout|uiMode|screenSize|smallestScreenSize|fontScale|layoutDirection|density"
      android:hardwareAccelerated="true"
      android:exported="false" />
  ```

- [ ] Add launch button to your React app. In `components/client/twin/TwinDashboardCardApp.tsx`:
  ```tsx
  import { unityBridge } from '@/lib/plugins/unity-bridge';

  <button
    onClick={() => unityBridge.start('athletic', 'idle')}
    className="px-4 py-2 rounded-full font-mono text-sm"
    style={{ background: '#c6ff3d', color: '#0a0c09' }}
  >
    Open 3D Twin
  </button>
  ```

---

## Step 6 — Build APK and test (Sunday afternoon, ~1 hour)

- [ ] In `purex-phase1` repo:
  ```bash
  npx cap sync android
  cd android
  ./gradlew assembleDebug
  ```
- [ ] First build with Unity will take **5-10 minutes** (IL2CPP compile)
- [ ] APK lands at `android/app/build/outputs/apk/debug/app-debug.apk`
- [ ] Copy APK to phone (WhatsApp/Drive)
- [ ] Install (Android will warn about size — accept)
- [ ] Open app → sign in → dashboard
- [ ] Tap "Open 3D Twin" button
- [ ] **Expected:** screen goes black ~1.5s → your character appears in dark scene, breathing, on green ring
- [ ] Press Android back button → returns to dashboard

---

## Common errors and fixes

| Symptom | Cause | Fix |
|---|---|---|
| Button does nothing | Bridge can't find Unity classes | Check `app/build.gradle` has `implementation project(':unityLibrary')` uncommented; rerun `npx cap sync android` |
| App crashes when tapping button | UnityPlayerActivity missing from manifest | Add the `<activity>` block from Step 5 |
| Black screen, never shows character | Animator default state not set | In Unity: Animator → right-click idle state → Set as Default State; re-export |
| Character T-pose, no idle motion | Rig set to Generic, not Humanoid | Re-import FBX as Humanoid; reapply |
| Character is purple (no texture) | Materials use Standard shader not URP | Right-click character → Edit → Render Pipeline → Universal Render Pipeline → Upgrade Materials |
| Build fails "Duplicate class kotlin.x" | Kotlin version clash | Your repo already excludes legacy stdlib in root build.gradle — should be fine |
| APK swells past 200MB | Built ARMv7 + ARM64 | Player Settings → Target Architectures → uncheck ARMv7 |
| Battery drops 15%/hour in 3D view | targetFrameRate not set | Verify `PureXLifecycle.cs` is attached and active |
| Unity Activity won't return to app | Back button intercepted by Unity | Press home + reopen app from launcher |

---

## What you have at the end

- ✅ Real 3D character rendered by Unity in your Capacitor app
- ✅ Dashboard unchanged (instant load preserved)
- ✅ Reusable bridge — Phase 2 (body morphs, female avatar, more animations) plugs into this
- ✅ One commit you can revert cleanly

Then send the APK to your 5 testers.
