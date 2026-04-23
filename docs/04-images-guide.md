# PURE X — Image Upload Guide

Everything you need to know about adding images to the site.

## TL;DR — Where each image goes

```
public/
├── trainers/                             ← HERO SECTION (highest priority)
│   ├── trainer-siva-reddy.jpg            ← BIG featured card (3:4 portrait)
│   ├── trainer-chandralekha.jpg          ← Team thumbnail (square)
│   ├── trainer-krishna.jpg               ← Team thumbnail (square)
│   ├── trainer-paula.jpg                 ← Team thumbnail (square)
│   └── trainer-amber.jpg                 ← Team thumbnail (square)
│
├── hero/
│   └── hero-backdrop.jpg                 ← Optional full-section backdrop
│
├── experts/                              ← Meet-the-Team grid (6 cards)
│   ├── siva-reddy.jpg
│   ├── chandralekha.jpg
│   ├── krishna.jpg
│   ├── paula-konasionok.jpg
│   ├── amber-jasari.jpg
│   └── siva-jampana.jpg
│
└── transformations/                      ← Before/after pairs
    ├── arjun-before.jpg
    ├── arjun-after.jpg
    └── ...
```

All photos auto-load when filenames match. Missing = graceful fallback. No code changes needed.

---

## 1. Hero section photos (highest impact)

### 1a. Siva Reddy — FEATURED HERO CARD

This is the big 3D-tilting card on the right side of the hero. Siva is THE face of PURE X here.

**File:**
```
public/trainers/trainer-siva-reddy.jpg
```

**Specs:**
- **Aspect ratio**: 4:5 portrait (e.g. 900×1125) — the card is tall so vertical works best
- **Composition**: Siva front-and-center, face at upper third of frame, torso/arms visible
- **Lighting**: Dark gym, dramatic rim lighting (ideally neon red or green side-light, like the photo you already uploaded)
- **Background**: Dark gym space — the photo becomes the card, so background should feel cinematic not studio-flat
- **File size**: Under 200KB (WebP preferred)

**What the card shows:**
- "Training Today" live badge (top-left) + "PT Head" chip (top-right)
- Headline overlay: "Train with the **architect** of PURE X."
- Bio: "ICN Gold medalist. 40kg personal transformation. 100+ clients trained."
- Stat chips: `40kg Lost` · `100+ Clients` · `ICN Gold`
- CTA arrow → `/book/siva-reddy`

**3D interaction:** photo sits at `translateZ -40px` on hover, text floats forward at `+60px`. Mouse tilt is ±8° rotation. Card lifts 20px off the page on hover with neon green glow.

---

### 1b. Team thumbnails — 4 small cards below Siva

These are the horizontal strip of 4 square thumbnails UNDER the Siva card. They give credibility to "the integrated team" without competing with Siva visually.

**Files:**
```
public/trainers/trainer-chandralekha.jpg   → Doctor, "Medical Screening"
public/trainers/trainer-krishna.jpg        → Physio, "Movement & Rehab"
public/trainers/trainer-paula.jpg          → Athletic, "HYROX · IRONMAN"
public/trainers/trainer-amber.jpg          → Mental, "Mind-Body"
```

**Specs:**
- **Aspect ratio**: Square (600×600 or 800×800)
- **Composition**: Head + shoulders, centered
- **Lighting**: Consistent with Siva's photo for cohesion (or lean into each member's specialty vibe — Amber softer, Krishna clinical, etc.)
- **File size**: Under 100KB each

**What each thumbnail shows:**
- Role chip top (Doctor, Physio, Athletic, Mental) in each member's unique accent color
- Name + specialty at bottom
- Each clickable → `/book/{slug}`
- Each has its own color glow on hover (lime, emerald, amber, magenta — one per role)

**Fallback:** if files missing, shows colored initials (CL, KR, PK, AJ) with member's accent color.

---

## 2. Hero backdrop (optional)

**File:**
```
public/hero/hero-backdrop.jpg
```

**How to enable:**
Open `components/marketing/hero/Hero.tsx` and change:
```ts
const HERO_BACKDROP_IMAGE: string | null = null;
```
to:
```ts
const HERO_BACKDROP_IMAGE: string | null = '/hero/hero-backdrop.jpg';
```

Auto-receives brand tint, grain, scroll parallax, mouse-follow spotlight.

**Specs:**
- 1920×1080 minimum, 16:9 landscape
- Dark cinematic gym — low-key lighting
- Avoid subjects in center (headline sits there)
- Under 400KB

---

## 3. Expert photos (Meet-the-Team grid section)

Separate from the hero — this is the grid further down the page showing all 6 experts equally. Filenames must match the slug in `lib/constants.ts`:

```
public/experts/siva-reddy.jpg
public/experts/chandralekha.jpg
public/experts/krishna.jpg
public/experts/paula-konasionok.jpg
public/experts/amber-jasari.jpg
public/experts/siva-jampana.jpg
```

**Specs:**
- 600×800 portrait minimum
- Head-and-shoulders, eyes at upper third
- Dark background, professional lighting
- Under 100KB each

**Fallback:** gradient portrait with initials (each expert has unique color palette).

---

## 4. Transformation photos

```
public/transformations/{story-slug}-before.jpg
public/transformations/{story-slug}-after.jpg
```

Not wired yet — requires small code update in `TransformationGallery.tsx`.

**Specs:**
- 600×600 square
- Same pose/lighting/framing for before + after
- Under 80KB each

---

## 5. Image optimisation

**Compress before upload:**
- [Squoosh.app](https://squoosh.app) — browser-based, no upload
- [TinyPNG](https://tinypng.com) — batch JPEGs
- [ImageOptim](https://imageoptim.com) — Mac drag-and-drop

**File size targets:**
- Siva hero card: 150-200 KB
- Team thumbnails: 60-100 KB each
- Expert grid photos: 40-80 KB each
- Transformation photos: 30-60 KB each
- Hero backdrop: 150-400 KB

**Why it matters:** Next.js auto-serves WebP/AVIF to modern browsers, but the source file size determines quality ceiling. A 150KB JPEG → excellent. A 2MB JPEG → overkill that slows the site.

---

## 6. Quick test workflow

**Step 1:** Drop the 5 trainer photos:
```
public/trainers/trainer-siva-reddy.jpg       ← biggest impact
public/trainers/trainer-chandralekha.jpg
public/trainers/trainer-krishna.jpg
public/trainers/trainer-paula.jpg
public/trainers/trainer-amber.jpg
```

**Step 2:** Hard refresh browser (`Cmd+Shift+R` or `Ctrl+Shift+R`)

**Step 3:** Hover each card — tilt + glow + depth effects should fire.

**Debug if photos don't appear:**
- Check filenames exactly match (case-sensitive)
- Check files are in `public/trainers/` not `src/public/trainers/`
- Check browser DevTools Network tab for 404s
- Restart `npm run dev` if Next.js cache is stale
