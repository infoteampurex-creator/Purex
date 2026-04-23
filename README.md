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

### Still scaffolded (next Phase 2 items)
- 🚧 Calendly integration per specialist (component exists at `components/booking/CalendlyEmbed.tsx` + config at `lib/calendly.ts`, not yet wired into booking flow)
- 🚧 Admin panel for managing clients, bookings, content
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

## Wiring Supabase (when ready)

1. Create a Supabase project
2. Run `docs/02-database-schema.md` SQL in the SQL editor
3. Fill in `.env.local` with your URL + keys
4. Replace `FALLBACK_EXPERTS` etc. imports with actual Supabase queries in `lib/data/`
5. Build the admin panel to edit content

Detailed migration guide lives in `docs/` — follow `01-architecture.md` → `02-database-schema.md` → (new file) `04-supabase-setup.md`.

## Known Phase 1 gaps (intentional)

These are documented in `docs/01-architecture.md` under "Non-goals":
- No client dashboard after login
- No workout/meal logging
- No progress graphs, streaks, adherence
- No payment gateway (admin assigns plans manually)
- No real-time coach chat
- No mobile app

## Deployment

**Recommended:** Vercel (zero-config for Next.js)

```bash
# Vercel CLI
vercel deploy
```

Or connect the repo to Vercel dashboard for auto-deploy on push.

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
