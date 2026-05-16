# Teampurex — Mobile app

React Native + Expo. Android-first. Talks to the same Supabase backend
as the web at `teampurex.com`.

## Phase A1 — what this is

Bare scaffold. Boots on Expo Go, shows the brand wordmark, confirms the
build chain works. No auth, no navigation, no backend calls yet.

Phase A2 adds Supabase auth and the login screen. A3 adds splash + icon
+ biometric unlock. A4 adds role-based home screens.

## Run it on your Android phone

### One-time setup

1. **Install Node.js** (v18 or v20) on your dev machine if you don't
   have it already. https://nodejs.org

2. **Install Expo Go on your Android phone:**
   https://play.google.com/store/apps/details?id=host.exp.exponent

   That's the app that runs our code while we're developing — it'll
   render the QR I generate from the dev server.

3. **Install dependencies** in this folder:

   ```bash
   cd mobile
   npm install
   ```

   First install takes 2-4 min depending on connection.

### Every time you want to see the app

From the repo root:

```bash
cd mobile
npx expo start
```

A QR code appears in your terminal. Open **Expo Go** on your phone and
scan it. The app loads.

> If your laptop and phone aren't on the same WiFi network, run
> `npx expo start --tunnel` instead. Slightly slower but works over
> mobile data or VPNs. Equivalent to `npm run tunnel`.

> If `expo start` errors with "Expo SDK version is out of date,"
> "incompatible Expo Go version," or "The required package
> `expo-foo` cannot be found," run `npx expo install --fix`.
> That auto-aligns every dependency in `package.json` with whatever
> SDK Expo CLI thinks you should be on, pulls any missing peer
> dependencies, and runs `npm install`. ~30 seconds.

### Hot reload

Save any file in `mobile/`. The app updates on your phone in <1 second.
Logs from `console.log` show up in the terminal where you ran
`expo start`.

## Project layout

```
mobile/
├── App.tsx                 ← Entry point. Replaced by NavigationContainer in Phase A4.
├── app.json                ← Expo config: name, slug, Android package id, splash, icon.
├── package.json            ← Dependencies pinned to Expo SDK 52.
├── tsconfig.json           ← TypeScript: strict, paths alias @/* → src/*
├── babel.config.js         ← babel-preset-expo
├── src/
│   ├── components/
│   │   ├── Wordmark.tsx    ← TEAM PURE X lockup, pure RN primitives (no SVG)
│   │   └── XMark.tsx       ← The accent green X monogram (SVG via react-native-svg)
│   └── theme/
│       └── colors.ts       ← Brand colours — same as web's globals.css
└── README.md
```

## What stays out of git

`.expo/`, `dist/`, `node_modules/`, and `.env*` are gitignored. The
Supabase keys land in `.env.local` once Phase A2 wires auth — copy
the same `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
values from the web's `.env.local` to the mobile one.

## Type-checking

```bash
npm run typecheck
```

Same `tsc --noEmit` we run on the web.

## Roadmap (in this repo)

| Phase | What ships | PR |
|---|---|---|
| **A1** | Scaffold boots, wordmark, X monogram | this PR |
| **A2** | Supabase auth, login / signup / forgot-password screens | next |
| **A3** | Splash + icon assets + biometric unlock | |
| **A4** | Role-based routing, placeholder Client / Trainer / Specialist home screens | |
| **B**  | Today's plan, per-set workout logging, daily metrics | |
| **C**  | Push notifications + coach ↔ client chat | |
| **D**  | Trainer side: today's roster, in-session mode | |

When you're ready to test on devices that aren't your own, we'll add
`eas build` for proper APK production. Phase A is fine on Expo Go.
