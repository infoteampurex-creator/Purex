# PURE X — Phase 1 Architecture

## Scope of Phase 1

Phase 1 is a **conversion-focused marketing site** with lead capture, consultation booking, and admin management. It is explicitly NOT the client app. No workout tracking, no adherence graphs, no streaks, no payment gateway, no coach-intervention engine.

## What Phase 1 ships

| Capability | Description | Consumer-facing | Admin-facing |
|---|---|---|---|
| Brand storytelling | Homepage, About, Programs, Meet the Experts | ✓ | — |
| Lead generation | Contact forms, inquiry CTAs, WhatsApp deep-link | ✓ | Lead inbox |
| Consultation booking | 4-step booking flow per expert | ✓ | Booking inbox |
| Pre-consultation forms | Expert-specific intake forms | ✓ | View responses |
| Expert discovery | Listing + per-expert profile pages | ✓ | Manage profiles |
| Content management | Testimonials, FAQs, Programs, Homepage copy | — | CRUD |
| Auth foundation | Login/signup UI, admin-role only active | Partial | Admin session |

## Technical architecture

### Single Next.js 14 app, two route groups

```
app/
├── (marketing)/     → Public-facing site (home, programs, experts, etc.)
├── (admin)/         → Admin panel (/admin/*, role-gated)
└── (auth)/          → Login, signup, forgot-password UI
```

Why single app: shares design system, components, Supabase client, and build pipeline. Separating marketing and admin into two apps adds deployment complexity for no Phase 1 benefit. We can split later if `/admin` traffic grows.

### Route groups avoid shared layout bleed

Marketing pages have the public nav + footer. Admin pages have the admin shell (sidebar, topbar, no footer). Auth pages have neither — they're full-screen. Next 14 route groups handle this cleanly.

### Rendering strategy

- **Marketing pages** → Static by default, revalidated on admin content changes (`revalidateTag`). Maximum speed, SEO-friendly, zero server cost for most requests.
- **Booking flow** → Client components for the multi-step UI, server actions for submission.
- **Admin panel** → Server components where possible, client components only for interactive tables and forms. Middleware checks admin role before rendering.
- **Expert profile pages** → Statically generated at build with `generateStaticParams`, revalidated when admin edits a profile.

### Backend

Supabase for:
- Postgres database (schema below)
- Auth (email + password, Google OAuth optional)
- Row-level security for admin-only tables
- File storage for expert photos, transformation images

Server actions for all mutations. No API routes needed in Phase 1 (except webhooks later).

### External integrations

- **WhatsApp Business** — deep-link to pre-filled message: `https://wa.me/91XXXXXXXXXX?text=...`
- **Email** — transactional via Resend. Booking confirmations, admin notifications.
- **Image CDN** — Supabase Storage with `next/image` loader.

## Non-goals for Phase 1 (explicitly deferred)

- Client dashboard after login
- Workout logging, meal tracking
- Progress charts, streak counters
- Stripe/Razorpay integration
- Real-time coach chat
- Mobile app (React Native or otherwise)
- Notifications (beyond transactional email)
- HYROX/IRONMAN training program viewers
- Wearable integrations

## Deployment

- **Hosting**: Vercel (Next.js native)
- **Database**: Supabase Cloud (Mumbai region for India latency)
- **Domain**: purex.co.in (suggested) + purex.fitness redirect
- **Analytics**: Vercel Analytics + PostHog (optional)

## Security baseline for Phase 1

- Admin routes protected by Supabase session check in middleware
- Admin role stored in `profiles.role` column, verified server-side
- Public form submissions rate-limited via Upstash (100/hr per IP)
- Form inputs sanitized + validated with Zod schemas
- No client-side API keys; server actions only
- CSRF protection via Next.js built-in mechanisms
