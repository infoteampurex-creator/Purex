# Teampurex Android App — Capacitor Setup

This document is the runbook for getting a signed Teampurex APK on
your phone. One-time setup is ~30 minutes (mostly Android Studio's
first-run downloads). After that, rebuilding the app is a 2-minute
loop.

The mobile app **is** the website — a native Android WebView pointed
at `https://www.teampurex.com`. Every feature on the live site works
automatically: client dashboard, daily plan, Mother Strong, the new
PureX Twin and Future Clone, Supabase auth, server actions. No
separate codebase.

---

## Prerequisites (one-time, ~30 min)

### 1. Android Studio
- Download from https://developer.android.com/studio
- Run the installer, accept the defaults.
- First launch downloads the **Android SDK** + **SDK Build Tools**
  + **Platform-Tools** (~3 GB). Let it finish.
- Open **Tools → SDK Manager** and confirm "Android 14.0 (API 34)"
  or newer is installed under SDK Platforms.

### 2. Java JDK 17+ (usually bundled with Android Studio)
- Android Studio ships its own JDK ("Embedded JDK"). Use that — no
  separate install needed.
- To verify in Android Studio: **File → Settings → Build, Execution,
  Deployment → Build Tools → Gradle → Gradle JDK**. Should show
  "Embedded JDK 17" or similar.

### 3. Enable USB Debugging on your phone (if you want to push the
APK directly from your laptop)
- Settings → About phone → tap "Build number" 7 times → unlocks
  "Developer options".
- Settings → System → Developer options → enable **USB debugging**.
- Plug your phone into the laptop. Accept the "Allow USB debugging?"
  prompt on the phone.

*(If you skip this, you can still install the APK by transferring
the file to your phone via WhatsApp / email / Google Drive and
tapping it from a file manager — Android will install it after
asking you to allow "install unknown apps" for that source.)*

---

## First-time setup of the Android project (one-time, ~10 min)

From the repo root in your terminal:

```bash
# 1. Install Capacitor + Next deps (pulls @capacitor/core/cli/android etc.)
npm install

# 2. Generate the android/ folder. Capacitor scaffolds a full
#    Android Studio project here, including AndroidManifest, Gradle
#    config, Java source, and the Teampurex app icon defaults.
npx cap add android

# 3. Sync the capacitor.config.ts settings into android/.
#    Run this any time you change capacitor.config.ts in the future.
npx cap sync android

# 4. Open the project in Android Studio.
npm run cap:open
```

Android Studio opens. First time, it indexes the project and
downloads any missing Gradle dependencies (~3–5 minutes). When the
status bar at the bottom is idle, you're ready.

---

## Build and install your first APK

Inside Android Studio:

1. **Top menu → Build → Build Bundle(s) / APK(s) → Build APK(s)**.
2. Wait for "BUILD SUCCESSFUL" in the bottom panel (~30s).
3. A notification appears: "APK(s) generated successfully — locate".
   Click **locate** to open the file in Windows Explorer.
4. The APK is at:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

**Install on phone (two options):**

- **USB:** with phone plugged in, in Android Studio click the green
  "Run" arrow in the top toolbar. Select your phone from the device
  dropdown. Android Studio installs and launches the app.

- **File transfer:** copy `app-debug.apk` to your phone (WhatsApp to
  yourself, Google Drive, USB-C MTP). Open it from your phone's file
  manager. Android prompts to install — say yes.

Once installed, the Teampurex icon appears on your home screen. Tap
it. The splash screen shows for ~1.5 seconds, then the live
`teampurex.com` loads inside a fullscreen WebView. Log in with your
Supabase credentials and you're on the client dashboard with the
PureX Twin and Future Clone cards visible.

---

## Daily workflow (after the first build)

When you change **web code** (any `.tsx`, `.ts` file in `app/` or
`components/`):

```bash
# Nothing! The app loads teampurex.com live — your Vercel deploys
# show up automatically the next time the app opens.
```

When you change **capacitor.config.ts** (e.g. update splash colour,
add a plugin, change appId):

```bash
# 1. Sync the new config into android/
npm run cap:sync

# 2. Rebuild the APK in Android Studio (Build → Build APK(s))

# 3. Reinstall on phone
```

When you add a **new Capacitor plugin** (e.g.
`@capacitor/push-notifications` later):

```bash
npm install @capacitor/push-notifications
npm run cap:sync             # links the native bindings
# Rebuild APK in Android Studio
```

---

## Signing a release APK (for Google Play submission)

The `app-debug.apk` we built above is unsigned and only installs on
devices with "Install unknown apps" enabled. For Play Store
submission, we need a **signed release APK** (or App Bundle / AAB).

### One-time: generate a signing keystore

```bash
keytool -genkey -v \
  -keystore teampurex-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias teampurex
```

It asks for:
- a keystore password (save somewhere safe — losing it means you can
  never update the app on Play Store)
- your name, organisation, locality (any answers — only you see)

The file `teampurex-release-key.jks` is generated. **Move it to a
safe folder OUTSIDE the repo** (the `.gitignore` excludes `*.jks` and
`*.keystore` but be paranoid).

### Configure Gradle to sign with it

Create `android/keystore.properties` (gitignored by default in our
config — never commit):

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEYSTORE_PASSWORD
keyAlias=teampurex
storeFile=/c/path/to/teampurex-release-key.jks
```

In `android/app/build.gradle`, add a `signingConfigs` block above
`buildTypes` (Capacitor's first-run scaffold doesn't include this;
add it once):

```gradle
android {
  // ... existing config ...

  signingConfigs {
    release {
      def keystorePropertiesFile = rootProject.file("keystore.properties")
      if (keystorePropertiesFile.exists()) {
        def keystoreProperties = new Properties()
        keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
        storeFile file(keystoreProperties['storeFile'])
        storePassword keystoreProperties['storePassword']
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
      }
    }
  }

  buildTypes {
    release {
      signingConfig signingConfigs.release
      // ... existing release config ...
    }
  }
}
```

### Build the signed AAB for Play Store

Inside Android Studio:
- **Build → Generate Signed Bundle / APK → Android App Bundle**
- Select your keystore + passwords
- Build variant: `release`
- The signed `.aab` lands at
  `android/app/build/outputs/bundle/release/app-release.aab`

Upload that file to Play Console → Internal Testing track → Add
release → upload AAB → fill in release notes → roll out.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Could not find or load main class org.gradle.wrapper.GradleWrapperMain` | First-run Gradle download incomplete | Inside Android Studio: **File → Invalidate Caches / Restart** |
| `SDK location not found` | `local.properties` missing or has stale path | Android Studio offers to fix automatically; or create `android/local.properties` with `sdk.dir=/path/to/Android/Sdk` |
| App opens but shows "Page not found" | Wrong URL in `capacitor.config.ts` | Edit `server.url` → run `npm run cap:sync` → rebuild |
| App opens but shows a white screen on phone | No internet, or WebView blocked from loading https | Check phone has data. Confirm `androidScheme: 'https'` in config. |
| `cap sync` errors with "webDir does not exist" | `out/` directory missing | Recreate: `mkdir -p out && touch out/.gitkeep` |
| Splash screen shows for >5s, then white | The site is unreachable (DNS, blocked, slow) | Confirm `https://www.teampurex.com/` loads in your phone's browser. Plain WebView can't bypass network issues. |

---

## What this app currently does

Because we run in hosted mode, **everything on the live website
works inside the app, with no extra wiring**:

- ✅ Login / signup / password reset
- ✅ Client dashboard (PureX Twin + Future Clone cards, daily plan,
  workouts, tasks)
- ✅ Per-set workout logging
- ✅ Mother Strong (registration when open, leaderboard, my-progress)
- ✅ Admin panel (`/admin/*`)
- ✅ Diagnostic (`/admin/diagnostic`)

What's **not yet** wired (native plugins — separate PRs):
- ⏳ Health Connect sync (Phase 5)
- ⏳ Push notifications (Phase 6)
- ⏳ Biometric (fingerprint) unlock for repeat opens
- ⏳ Camera plugin for profile photo upload from the app

These need actual Capacitor plugins (`@capacitor/health-connect`,
`@capacitor/push-notifications`, etc.) installed + bridged.
Documented in the roadmap, not in this PR.

---

## Why hosted mode (not bundled)

Standard Capacitor apps bundle a static export of the web app into
the APK, so the app works offline. For Teampurex we deliberately
chose **hosted mode** (loads `https://www.teampurex.com` live) for
v1 because:

1. **Next.js stays fully dynamic.** Server actions, Supabase
   server-rendered auth via cookies, ISR pages, `revalidatePath` —
   all of it works untouched. Static export would force us to refactor
   half the codebase.
2. **One source of truth.** Fix a bug on the web → app picks it up
   on next open. No "ship the web fix, then rebuild the APK" loop.
3. **Smaller APK** (~3 MB vs ~15 MB bundled).
4. **No OTA-update tooling needed.** OTA = the ability to ship JS
   fixes without going through Play Store review. With hosted mode
   the WebView re-fetches the live HTML; with bundled mode you'd
   need something like Capgo or App Center.

The trade-off is **the app needs internet on first load**. For a
coaching app where the user is at the gym (cellular) or at home
(WiFi), this is fine. If we later want offline workout logging, we
can layer in service-worker caching of specific routes — additive,
not a rewrite.
