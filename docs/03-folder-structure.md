# PURE X — Phase 1 Folder Structure

```
purex/
├── app/
│   ├── (marketing)/                          # Public site, shared nav+footer
│   │   ├── layout.tsx                        # Marketing shell
│   │   ├── page.tsx                          # Homepage
│   │   ├── about/page.tsx
│   │   ├── programs/
│   │   │   ├── page.tsx                      # All programs
│   │   │   └── [slug]/page.tsx               # Individual program
│   │   ├── experts/
│   │   │   ├── page.tsx                      # All experts grid
│   │   │   └── [slug]/page.tsx               # Individual expert profile
│   │   ├── transformations/
│   │   │   ├── page.tsx                      # Gallery
│   │   │   └── [slug]/page.tsx               # Individual story
│   │   ├── book/
│   │   │   ├── page.tsx                      # Entry: choose expert
│   │   │   └── [expertSlug]/
│   │   │       ├── page.tsx                  # Step 1: choose service
│   │   │       ├── form/page.tsx             # Step 2: pre-consult form
│   │   │       ├── schedule/page.tsx         # Step 3: preferred slot
│   │   │       └── confirm/page.tsx          # Step 4: review + submit
│   │   ├── contact/page.tsx
│   │   ├── faq/page.tsx
│   │   ├── privacy/page.tsx
│   │   ├── terms/page.tsx
│   │   └── thank-you/page.tsx                # Post-booking
│   │
│   ├── (admin)/
│   │   ├── layout.tsx                        # Admin shell (sidebar, auth-gated)
│   │   └── admin/
│   │       ├── page.tsx                      # Dashboard summary
│   │       ├── leads/
│   │       │   ├── page.tsx                  # Leads inbox (table + filters)
│   │       │   └── [id]/page.tsx             # Lead detail + notes
│   │       ├── bookings/
│   │       │   ├── page.tsx                  # Bookings inbox
│   │       │   └── [id]/page.tsx             # Booking detail + form response
│   │       ├── experts/
│   │       │   ├── page.tsx                  # List
│   │       │   ├── new/page.tsx              # Create
│   │       │   └── [id]/page.tsx             # Edit
│   │       ├── programs/
│   │       │   ├── page.tsx
│   │       │   └── [id]/page.tsx
│   │       ├── services/page.tsx             # Per-expert services
│   │       ├── transformations/
│   │       │   ├── page.tsx
│   │       │   ├── new/page.tsx
│   │       │   └── [id]/page.tsx
│   │       ├── testimonials/page.tsx
│   │       ├── faqs/page.tsx
│   │       ├── homepage/page.tsx             # Edit homepage content keys
│   │       └── forms/                        # Form template editor
│   │           ├── page.tsx
│   │           └── [id]/page.tsx
│   │
│   ├── (auth)/
│   │   ├── layout.tsx                        # Auth shell (full-screen, no nav)
│   │   ├── login/page.tsx                    # Neon sign UI
│   │   ├── signup/page.tsx                   # Signup (future-ready)
│   │   └── forgot-password/page.tsx
│   │
│   ├── api/                                  # Webhooks only in Phase 1
│   │   └── webhooks/
│   │       └── resend/route.ts               # Email delivery events
│   │
│   ├── layout.tsx                            # Root layout (fonts, providers)
│   ├── globals.css                           # Tailwind base + CSS vars
│   └── not-found.tsx
│
├── components/
│   ├── ui/                                   # shadcn/ui primitives
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── dialog.tsx
│   │   ├── textarea.tsx
│   │   ├── checkbox.tsx
│   │   ├── badge.tsx
│   │   └── ...
│   │
│   ├── marketing/                            # Public-site components
│   │   ├── Nav.tsx
│   │   ├── Footer.tsx
│   │   ├── MobileDrawer.tsx
│   │   ├── WhatsAppFab.tsx
│   │   ├── StickyBookingBar.tsx              # Mobile
│   │   ├── hero/
│   │   │   ├── Hero.tsx
│   │   │   ├── HeroHeadline.tsx
│   │   │   ├── HeroCards.tsx                 # 3D tilt cards
│   │   │   └── HeroCard.tsx                  # Individual card
│   │   ├── sections/
│   │   │   ├── ExpertsGrid.tsx
│   │   │   ├── ExpertCard.tsx
│   │   │   ├── ProgramsGrid.tsx
│   │   │   ├── ProgramCard.tsx
│   │   │   ├── TransformationGallery.tsx
│   │   │   ├── TransformationCard.tsx
│   │   │   ├── TestimonialStrip.tsx
│   │   │   ├── FaqAccordion.tsx
│   │   │   └── CtaBand.tsx
│   │   ├── booking/
│   │   │   ├── BookingStepper.tsx            # Progress indicator
│   │   │   ├── ServicePicker.tsx
│   │   │   ├── PreConsultForm.tsx            # Renders dynamic form from template
│   │   │   ├── SlotPicker.tsx
│   │   │   └── BookingReview.tsx
│   │   └── expert/
│   │       ├── ExpertHero.tsx
│   │       ├── ExpertCredentials.tsx
│   │       ├── ExpertServices.tsx
│   │       └── ExpertBookingCta.tsx
│   │
│   ├── admin/
│   │   ├── AdminShell.tsx                    # Sidebar + topbar layout
│   │   ├── AdminSidebar.tsx
│   │   ├── AdminTopbar.tsx
│   │   ├── DashboardCards.tsx                # Summary KPIs
│   │   ├── DataTable.tsx                     # Reusable table (leads, bookings)
│   │   ├── LeadStatusBadge.tsx
│   │   ├── BookingStatusBadge.tsx
│   │   ├── ExpertForm.tsx                    # Create/edit expert
│   │   ├── ProgramForm.tsx
│   │   ├── TransformationForm.tsx
│   │   ├── FormTemplateEditor.tsx            # Drag-drop form builder
│   │   └── HomepageContentEditor.tsx
│   │
│   └── shared/
│       ├── Logo.tsx
│       ├── NeonPureXSign.tsx                 # Neon sign SVG + animation
│       ├── PullCord.tsx                      # Interactive cord for login
│       ├── ImageWithFallback.tsx
│       └── MotionProvider.tsx                # Framer Motion config
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                         # Browser client
│   │   ├── server.ts                         # Server client with cookies
│   │   ├── middleware.ts                     # Session refresh
│   │   └── types.ts                          # Generated from schema
│   ├── actions/                              # Server actions
│   │   ├── bookings.ts                       # createBooking, updateStatus
│   │   ├── leads.ts                          # createLead, updateLead
│   │   ├── contacts.ts                       # submitContact
│   │   ├── experts.ts                        # Admin CRUD
│   │   ├── programs.ts
│   │   ├── transformations.ts
│   │   ├── homepage.ts                       # updateHomepageContent
│   │   └── auth.ts                           # signIn, signOut
│   ├── data/                                 # Read-only query helpers
│   │   ├── experts.ts                        # getExperts, getExpertBySlug
│   │   ├── programs.ts
│   │   ├── transformations.ts
│   │   ├── faqs.ts
│   │   └── homepage.ts
│   ├── validations/                          # Zod schemas
│   │   ├── booking.ts
│   │   ├── lead.ts
│   │   ├── contact.ts
│   │   ├── expert.ts
│   │   └── form-fields.ts
│   ├── email/
│   │   ├── resend.ts                         # Client
│   │   └── templates/
│   │       ├── booking-confirmation.tsx      # React Email template
│   │       ├── admin-new-lead.tsx
│   │       └── admin-new-booking.tsx
│   ├── constants.ts                          # Phone numbers, brand copy
│   ├── fonts.ts                              # next/font setup
│   ├── cn.ts                                 # className helper
│   └── utils.ts
│
├── hooks/
│   ├── useMediaQuery.ts
│   ├── useMouseTilt.ts                       # Hero card 3D tilt
│   └── useScrollProgress.ts
│
├── public/
│   ├── fonts/                                # Self-hosted fonts if needed
│   ├── brand/
│   │   ├── logo.svg
│   │   ├── logo-mark.svg
│   │   └── og-image.jpg
│   ├── experts/                              # Expert photos (or CDN)
│   └── transformations/                      # Before/after images
│
├── scripts/
│   ├── seed.ts                               # Seed database
│   └── generate-types.ts                     # Supabase type gen
│
├── supabase/
│   ├── migrations/
│   │   ├── 00001_initial_schema.sql
│   │   ├── 00002_rls_policies.sql
│   │   └── 00003_seed_data.sql
│   └── config.toml
│
├── docs/                                     # Live in repo for devs
│   ├── 01-architecture.md
│   ├── 02-database-schema.md
│   ├── 03-folder-structure.md
│   ├── 04-setup-guide.md
│   ├── 05-booking-flow.md
│   └── 06-admin-guide.md
│
├── middleware.ts                             # Auth + admin route protection
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── .env.local.example
├── .gitignore
└── README.md
```

## Key architectural choices

1. **Route groups for isolation** — `(marketing)`, `(admin)`, `(auth)` each have their own layout.
2. **Feature-oriented component folders** — components grouped by use-case (`booking/`, `expert/`) not just by UI type.
3. **Server actions in `lib/actions/`** — all mutations go through these, not through route handlers.
4. **Read queries in `lib/data/`** — kept separate from actions so components can import cleanly.
5. **Validation schemas in `lib/validations/`** — Zod schemas used on both client and server, no duplication.
6. **Migrations in `supabase/migrations/`** — version-controlled schema, applied via Supabase CLI.
