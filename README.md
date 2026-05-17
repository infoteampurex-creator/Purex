# PURE X — Platform

Premium integrated health coaching platform for PURE X. Marketing site + booking flow + client dashboard.

**Tagline:** Train for Life. Not Just Aesthetics.

## What's in this build

### Phase 1 ✅
- Homepage with premium hero (cinematic backdrop + parallax + animated Siva feature card), experts grid, programs grid, **HYROX training section** (8 stations + 5 phases), **IRONMAN training section** (3 disciplines + 4 phases + race day), transformation gallery with modal, testimonials, CTA band
- **Full 5-step booking flow** with per-expert routing, dynamic pre-consultation forms, schedule picker, and server action submission
- Thank-you page with WhatsApp follow-up deep link and reference ID
- **Ambient video support** on 5 key sections (hero background, Siva card, HYROX, IRONMAN, CTA) — self-hosted MP4s in /public/videos/

### Phase 2 ✅ (Client dashboard + Auth — NEW)
- **Real Supabase auth** — login, signup, forgot-password, reset-password, session persistence, middleware-protected `/client/*` and `/admin/*` routes
- **Neon PURE X login page** — cinematic split-screen with pull-cord activation, dormant gray neon sign igniting to full green glow, ambient gym wash, dust motes
- **Premium mobile-app-inspired client dashboard** at `/client/dashboard`
- Mobile-first design with bottom nav, desktop gets sidebar navigation
- All modules built: welcome header, gradient daily-plan hero card with progress ring, stat tiles (calories/steps/sleep/water), task checklist, workout cards, nutrition card with macros bars, upcoming booking card, progress card with weight trend chart
- All data comes from `lib/data/client-mock.ts` — swap to Supabase when ready
- Sub-pages scaffolded: `/client/plan`, `/client/progress`, `/client/bookings`, `/client/profile`
- Auth setup guide: `docs/06-auth-setup.md`
- SQL migration: `supabase/migrations/00001_auth_foundation.sql`

### Phase 3 ✅ (Daily plans + templates + admin)
- **Daily plan system** — trainer plans 7-8 exercises per client per day; client logs per-set actuals (reps / weight / RPE). Schema in `00006`–`00009`.
- **Workout templates** — build once, apply to any client's day in one click. Schema in `00010`, seeded starters in `00011`.
- **Admin: client CRUD** wired against Supabase; admin-created accounts skip the moderation gate.
- **Moderated signup** — public signups land as `pending_approval`; admin approves / rejects with Resend-powered welcome / rejection emails (`00012`).

### Phase 4 ✅ (PUREX Mother Strong — NEW)
- **Free 60-day "10,000 Steps Challenge"** for mothers. Public registration → admin daily-entry grid → public leaderboard → personal progress page → gratitude card PNG generator.
- **Public registration** at `/mother-strong` (senior-friendly form, photo upload, honeypot, localStorage autosave, `?lang=hi` toggle).
- **Admin panel** at `/admin/mother-strong` with five tabs: Participants, Daily entry (60-day grid + bulk paste), Journey feed (photo posts), Config, Gratitude cards.
- **Public leaderboard** at `/mother-strong/leaderboard` (top-3 podium + ranks 4–50 + journey feed, ISR with `mother-strong-leaderboard` tag invalidation).
- **Personal progress** at `/mother-strong/my-progress?id=PX001-or-10-digit-number` — 60-day calendar + stats + rank.
- **Gratitude card** PNG via `next/og` at `/api/mother-strong/cards/[id]` — admin-only, 1200×630 brand card with stats.
- **Homepage teaser** showing live cohort stats with `unstable_cache`-friendly tag invalidation; homepage stays statically renderable.
- Schema in `00013_mother_strong.sql` + casing fix in `00014_mother_strong_name_format_fix.sql`.

### Still scaffolded (next items)
- 🚧 Calendly integration per specialist (component exists at `components/booking/CalendlyEmbed.tsx` + config at `lib/calendly.ts`, not yet wired into booking flow)
- 🚧 Individual expert profile pages

## Quick start

```bash
# 1. Install
npm install

# 2. Copy env template (not strictly required — Phase 1 runs on fallback data)
cp .env.local.example .env.local

# 3. Run
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

The site runs **without Supabase configured** — all content is loaded from `lib/constants.ts` which has the six real experts, four real programs, and sample transformations pre-loaded. Wire Supabase up when you're ready to manage content from an admin panel.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | Server components, streaming, route groups |
| Language | TypeScript | Type safety across the data layer |
| Styling | Tailwind CSS + custom tokens | Design-system-first approach, zero runtime cost |
| Animation | Framer Motion | 3D tilt, scroll reveals, modal transitions |
| Icons | lucide-react | Consistent, tree-shakeable icon set |
| Backend (planned) | Supabase | Postgres + Auth + Storage in one |
| Validation (planned) | Zod | Shared client/server schemas |

## Folder structure

```
app/
  (marketing)/          # Public-facing site
    layout.tsx          # Nav + Footer + WhatsApp FAB
    page.tsx            # Homepage
    {about,experts,programs,transformations,book,contact,faq,privacy,terms}/
  layout.tsx            # Root layout (fonts, metadata)
  not-found.tsx
  globals.css           # Tailwind + design tokens

components/
  marketing/
    Nav.tsx             # Scroll-aware top nav with mobile drawer
    Footer.tsx
    WhatsAppFab.tsx
    hero/
      Hero.tsx          # Main hero composition
      HeroCards.tsx     # 3D card stack
      HeroCard.tsx      # Individual tilt card
    sections/
      ExpertCard.tsx
      ExpertsGrid.tsx
      ProgramsGrid.tsx
      TransformationGallery.tsx  # With modal
      TestimonialStrip.tsx
      CtaBand.tsx
  shared/
    Logo.tsx
  ui/
    Button.tsx          # shadcn-style primitive

hooks/
  useMouseTilt.ts       # 3D tilt + glow tracking for hero cards

lib/
  constants.ts          # Brand + fallback data (experts, programs, transformations, FAQs)
  fonts.ts              # next/font setup (Inter Tight + Inter + JetBrains Mono)
  cn.ts                 # clsx + twMerge helper

docs/                   # Phase 1 planning docs
  01-architecture.md
  02-database-schema.md
  03-folder-structure.md
```

## Design system

**Colors** (Tailwind config)
- `bg` (#0a0c09) — primary background
- `bg-card` (#161a16) — elevated surfaces
- `accent` (#c6ff3d) — neon lime, the PURE X signature
- `text-muted` — secondary copy

**Fonts**
- **Inter Tight** (display/headlines, 500-800 weights)
- **Inter** (body/UI, 400-700)
- **JetBrains Mono** (labels, eyebrows, stats, 400-700)

No italics anywhere — PURE X reads as serious, professional, not playful.

## Hero interaction details

The card stack on the right side of the hero uses `useMouseTilt` (see `hooks/useMouseTilt.ts`):

- **8° max rotation** on X and Y axes based on cursor position
- **Layered depth** via `transform-style: preserve-3d` and `translateZ(30px)` on content when hovered
- **Mouse-follow spotlight** via a radial gradient tracking cursor position (`glowX`, `glowY` passed as percentages)
- **Staggered entrance** via Framer Motion `staggerChildren: 0.12, delayChildren: 0.3`
- **Fan-out stacking** when idle — each card rotates ±1.5° and overlaps the one above by 40px
- **Scale + border glow** on hover (`scale(1.02)` + `shadow-glow`)
- **Respects `prefers-reduced-motion`** via global CSS override

## Transformation gallery interactions

- Scroll-triggered reveal (once, -80px margin so it fires before they're in view)
- Before/after split via two gradient halves with vertical divider
- Hover state reveals swap icon in center
- Click opens modal with full story + stats + CTA
- Click outside modal or X button to close

## Wiring Supabase

1. Create a Supabase project.
2. **Run every file in `supabase/migrations/` in order** via the SQL editor:
   `00001` → `00002` → … → `00014`. They're idempotent; rerunning is safe.
3. Fill in `.env.local` (see `.env.local.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` — required for admin actions and the registerParticipant server action
   - `NEXT_PUBLIC_SITE_URL` — used by password-reset email callbacks
   - `RESEND_API_KEY` + `EMAIL_FROM` + `EMAIL_ADMIN_INBOX` — required for signup-approval emails
4. Create the first admin: sign up via `/signup`, then run this SQL once in Supabase:
   ```sql
   update public.profiles
     set is_admin = true, signup_status = 'approved'
     where id = (select id from auth.users where email = 'YOU@example.com');
   ```
5. Confirm with `/admin/dashboard`. New self-signups will now land in
   `/admin/leads` for you to approve.

### Mother Strong setup (Phase 4)
After running `00013` + `00014`:

1. Open `/admin/mother-strong` → **Config** tab. Set the cohort
   start date, daily goal (default 10,000), WhatsApp group invite
   link, and cohort label (e.g. "Mother's Day 2026").
2. Share `/mother-strong` with mothers — they self-register; you'll
   see them appear under the **Participants** tab in real time.
3. Each day, open the **Daily entry** tab. Type the step count into
   the cell for today; click anywhere outside to save. Or, for a
   week-ahead catch-up, use the per-row **bulk paste** button.
4. Drop journey-feed photos via **Journey feed** tab — they appear
   on `/mother-strong/leaderboard` and feed the cohort's public
   story.
5. After 60 days, switch any participant to **Completed** under the
   Participants tab, then download her **Gratitude card** PNG from
   the Cards tab and forward via WhatsApp.

#### Demo data for screenshots / QA
Need a populated cohort to demo the leaderboard before real registrations land? Run **`supabase/seeds/mother_strong_demo.sql`** in the SQL editor. It seeds 5 sample participants (WhatsApp numbers in the reserved `999900000X` range), realistic per-day step counts, 3 journey posts, and sets the cohort config to a 14-day-old start date. Idempotent — re-running is a no-op. Cleanup block at the bottom of the file removes it cleanly.

Detailed migration guide lives in `docs/` → follow `01-architecture.md` → `02-database-schema.md`.

## Native apps (Android + iOS) via Capacitor

The Teampurex mobile apps are native WebView wrappers around the
live website — same Next.js code, same Supabase backend, same
features, **two stores**. Hosted mode (loads
`https://www.teampurex.com` live) means no separate codebase, no
OTA tooling, one source of truth for both platforms.

**App identity (shared across both platforms):**
- Bundle id: `com.teampurex.app`
- App name: `Teampurex`
- Splash background: `#0a0c09` (brand black)
- Status bar style: dark (white icons on black)

### Android — one-time setup (~10 minutes after Android Studio is installed)

```bash
npm install                       # picks up @capacitor/* packages
npx cap add android               # scaffolds the android/ folder
npm run cap:sync:android          # applies capacitor.config.ts
npm run cap:open:android          # opens Android Studio
```

Then in Android Studio: **Build → Build Bundle(s) / APK(s) →
Build APK(s)** and install on your phone.

**Full Android runbook**: `docs/capacitor-setup.md` (prerequisites,
signing keystore setup, Play Store release, troubleshooting).

### iOS — Codemagic cloud build (no Mac required) or borrow-a-Mac

iOS builds require macOS. Two paths:

| Path | Cost | Pros | Cons |
|---|---|---|---|
| **Codemagic cloud builds** | Free tier 500 min/mo · $28/mo paid | No Mac needed; runs on every push to main | First-time setup ~30 min |
| **Borrow a Mac** | $0 if borrowed; $300-600 for used M1 mini | Familiar Xcode workflow | Need physical access |

**Both paths** require a one-time **Apple Developer Program** signup
(**$99 / year**) at https://developer.apple.com/programs/enroll.

**Full iOS runbook**: `docs/capacitor-ios-setup.md` (Apple Developer
enrolment, Codemagic config, App Store Connect setup, signing certs,
submission checklist, troubleshooting).

### Daily workflow (both platforms)

- **Web code change** → nothing to rebuild. Both apps load the live
  site on next open, automatic Vercel deploys propagate to both.
- **`capacitor.config.ts` change** →
  - Android: `npm run cap:sync:android` then rebuild APK
  - iOS: `npm run cap:sync:ios` then push to trigger Codemagic
    rebuild (or rebuild manually if you have a Mac)
- **New Capacitor plugin** → `npm install <plugin>` then
  `npm run cap:sync` (no platform suffix — syncs both) then rebuild.

## Known Phase 1 gaps (intentional)

These are documented in `docs/01-architecture.md` under "Non-goals".
What's still **deferred** today:
- No payment gateway (admin assigns plans manually)
- No real-time coach chat (Path B-minus deferral; planned v1.1)
- Health Connect (Android) + HealthKit (iOS) sync — Capacitor
  scaffolded but not yet wired (Phase 5)
- Push notifications — Capacitor scaffolded but not yet wired
  (Phase 6)
- iOS native HealthKit specifically — separate plugin from Android
  Health Connect; lands after the Android version

## Deployment

**Recommended:** Vercel (zero-config for Next.js)

```bash
# Vercel CLI
vercel deploy
```

Or connect the repo to Vercel dashboard for auto-deploy on push.

### Production env vars
Set the same keys from `.env.local.example` in Vercel → Project Settings → Environment Variables. Required for full functionality:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` *(server-only — keep secret)*
- `NEXT_PUBLIC_SITE_URL` *(your prod domain)*
- `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_ADMIN_INBOX` *(signup-approval emails)*
- `NEXT_PUBLIC_WHATSAPP_NUMBER` *(optional override)*

### Storage buckets
The migrations create these buckets automatically; if you set up an older Supabase project, double-check they exist under Storage:

| Bucket | Visibility | Used by |
|---|---|---|
| `client-avatars` | private | Profile headshots |
| `client-progress` | private | Transformation photos |
| `mother-strong-photos` | **public** | Participant photos + journey feed |

### Backups
Supabase auto-snapshots every 24h on free tier. For a manual export of just the Mother Strong cohort (handy before wiping a season):

```sql
copy (select * from public.mother_strong_participants) to stdout with csv header;
copy (select * from public.mother_strong_daily_entries) to stdout with csv header;
copy (select * from public.mother_strong_journey_posts) to stdout with csv header;
```

Run those in Supabase SQL editor with **Download CSV** enabled.

## Next steps for Phase 1 completion

In order of priority:

1. **Booking flow** (`app/(marketing)/book/[expertSlug]/*`) — 4-step flow with Supabase writes
2. **Expert profile pages** (`app/(marketing)/experts/[slug]/page.tsx`) — rich bio + services + CTA
3. **Admin panel** (`app/(admin)/admin/*`) — leads inbox, CRUD for all entities
4. **Auth UI** (`app/(auth)/login/page.tsx`) — the neon PURE X sign + pull cord concept
5. **Program detail pages** — individual programme deep-dives
6. **FAQ page** — accordion with categorization

Each of these has scaffolding hints in `docs/03-folder-structure.md`.

## License

Private. © PURE X.
