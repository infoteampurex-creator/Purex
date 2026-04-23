# PURE X — Video Guide

Everything you need to know about ambient video on the site. This is **self-hosted** (no Mux/Cloudflare) for Phase 1 launch — files live in `/public/videos/`.

## Quick start

1. Drop an MP4 at `/public/videos/hero-ambient.mp4`
2. Drop a poster JPG at `/public/videos/posters/hero-poster.jpg`
3. Edit `/lib/videos.ts`:
   ```ts
   export const HERO_BACKGROUND_VIDEO: VideoSlot = {
     src: '/videos/hero-ambient.mp4',
     poster: '/videos/posters/hero-poster.jpg',
     opacity: 0.35,
     playbackRate: 0.7,
   };
   ```
4. Save — the video autoplays in the hero section.

No code changes needed anywhere else. The `AmbientVideo` component handles autoplay, loop, mobile detection, reduced-motion, and graceful fallback automatically.

---

## The 5 video slots

| Slot | Where it appears | Recommended content |
|---|---|---|
| `HERO_BACKGROUND_VIDEO` | Behind hero headline + Siva card | Dark gym establishing shot, slow camera move, no faces |
| `SIVA_HERO_VIDEO` | Inside Siva's 3D card (replaces his photo) | Slow-mo portrait — rope pull, kettlebell, battle ropes |
| `HYROX_SECTION_VIDEO` | Backdrop of HYROX section | Training montage — sled push, rowing, wall balls, etc. |
| `IRONMAN_SECTION_VIDEO` | Backdrop of IRONMAN section | Swim + bike + run action shots, intercut |
| `CTA_BACKGROUND_VIDEO` | Behind final "Book Discovery Call" band | Atmospheric/meditative — low motion, foggy gym, etc. |

---

## File specs

### Universal rules (apply to all slots)
- **Container**: MP4 with H.264 video codec
- **Audio**: **Remove entirely** (muted on web, saves ~20% size)
- **Bitrate**: 1.5-3 Mbps (web-optimized)
- **Duration**: 6-15 seconds, designed to loop seamlessly
- **Frame rate**: 24-30fps (don't go higher — wasted bytes)
- **Colorspace**: Rec.709 / sRGB (standard web)

### Per-slot specs

| Slot | Resolution | Duration | Target size | Playback rate |
|---|---|---|---|---|
| Hero background | 1280×720 | 8-12s | <8 MB | 0.7× (slow feel) |
| Siva hero card | 720×900 portrait | 4-8s | <5 MB | 1.0× (natural) |
| HYROX section | 1280×720 | 10-15s | <10 MB | 0.8× |
| IRONMAN section | 1280×720 | 10-15s | <10 MB | 0.8× |
| CTA band | 1280×720 | 8-12s | <6 MB | 0.5× (very slow) |

### Total budget
With all 5 slots filled: **~39 MB total**. Acceptable for a premium marketing site. Browsers only load videos when sections come into view (Intersection Observer), so the user doesn't download all 39 MB upfront — typically 8-15 MB over the first minute of browsing.

---

## Content direction per slot

### 1. Hero background (`HERO_BACKGROUND_VIDEO`)
**Purpose**: Establish "this is a dark, cinematic, premium gym environment" without distracting from the headline.

**Do**: Slow camera push through empty gym. Dramatic red/green rim lighting. Racked barbells in focus, equipment in background. Static tripod shots with subtle zoom work great.

**Don't**: People doing reps (too busy for backdrop). Fast camera movement. Bright overhead lighting. Anything with text or branding in the shot.

**Example mood references**: opening shots of a Netflix fitness docuseries, Equinox brand films, high-end sneaker commercials establishing the gym before cutting to action.

---

### 2. Siva hero card (`SIVA_HERO_VIDEO`)
**Purpose**: Replace the static photo with cinematic motion. Most impactful use of video on the whole site.

**Do**: Portrait-orientation (9:16 or 3:4). Siva doing something slow and powerful — unracking a barbell, mid-rope-pull, kettlebell Turkish get-up, walking toward camera through smoke/fog. Think cinematic boxer walk-out, not a training demo.

**Don't**: Talking head. Full reps. Anything too fast-paced — this is next to headline copy, so it should feel steady.

**Pro tip**: Shoot at 60fps, slow down to 30fps in post = silky slow-motion that feels premium.

---

### 3. HYROX section (`HYROX_SECTION_VIDEO`)
**Purpose**: Prove PURE X actually knows HYROX. Sells specialisation.

**Do**: Quick montage — 2 seconds each on SkiErg, sled push, rowing, wall balls. Rhythmic editing (cuts on beats, but no actual music). Close-ups on grip, cables, faces mid-effort, feet driving sled.

**Don't**: Show the full race course. Include logos of actual HYROX events (licensing). Talking head coaches explaining.

**If no access to a HYROX box**: Fallback on functional training — rowing machine, sandbag lunges, battle ropes. These look enough like HYROX training to sell the vibe.

---

### 4. IRONMAN section (`IRONMAN_SECTION_VIDEO`)
**Purpose**: Show endurance-sport specialty. This one needs different visuals than the gym — outdoor/pool/road.

**Do**: Intercut — pool lane from underwater, cyclist on road (GoPro-style mounted shot), runner silhouette at sunrise. Each discipline 3-4 seconds. Weather variety (rain, dusk) adds drama.

**Don't**: Actual race footage from IRONMAN-branded events (licensing). Stock footage that looks generic.

**If you can't shoot all three**: One well-shot cyclist POV clip works. The specifics of the visuals matter less than the feel of outdoor endurance.

---

### 5. CTA band (`CTA_BACKGROUND_VIDEO`)
**Purpose**: Last visual before the "Book" button. Needs to feel calm, not distracting.

**Do**: VERY slow motion. Empty gym at night with lights slowly flickering. Drifting fog/dust motes in a beam of light. Super slow pan across a weight stack. 0.5× playback rate makes almost any clip feel meditative.

**Don't**: Anything with people. Anything high-energy. You want the visitor focused on the button, not the video.

---

## Optimization workflow (required — don't skip)

### 1. Compress
Use **HandBrake** (free, handbrake.fr) or **FFmpeg**. Presets:

**HandBrake preset for web:**
- Preset: `Web > Gmail Large 3 Minutes 720p30`
- Encoder: H.264 (x264)
- Quality: Constant Quality RF 22
- Framerate: 30 (constant)
- Audio: **None** (remove tracks)

**FFmpeg command (if you prefer CLI):**
```bash
ffmpeg -i input.mov \
  -c:v libx264 -crf 22 -preset slow \
  -vf "scale=1280:-2,fps=30" \
  -pix_fmt yuv420p \
  -movflags +faststart \
  -an \
  output.mp4
```
- `-crf 22` = visually lossless at web sizes
- `-preset slow` = better compression (slower encode, once)
- `-pix_fmt yuv420p` = Safari/iOS compatibility
- `-movflags +faststart` = plays before fully downloaded
- `-an` = strip audio

### 2. Verify size
After compression, files should hit the targets in the table above. If they're too big:
- Lower CRF 22 → 24 (still looks good)
- Reduce to 24fps if not action-heavy
- Shorten duration (8s loop vs 15s)
- Drop to 960×540 for background videos (nobody notices at 35% opacity)

### 3. Generate poster
Extract a representative still:
```bash
ffmpeg -i your-video.mp4 -vf "select=eq(n\,60)" -vframes 1 poster.jpg
# Extracts frame 60 (2sec in at 30fps). Adjust as needed.
```
Then compress the poster to under 80KB with Squoosh or TinyPNG.

---

## How the component handles edge cases

### Reduced motion
If the user has `prefers-reduced-motion: reduce` set in their OS, the video component shows the poster image and skips video entirely. Respects accessibility without any extra code.

### Mobile bandwidth
By default, background videos (hero, HYROX, IRONMAN, CTA) are set to `desktopOnly: true`. Mobile visitors see the poster image only — they still get the visual without burning data. The Siva hero card video plays on mobile by default (it's the primary content).

To change this per-slot, edit `/lib/videos.ts`:
```ts
export const HYROX_SECTION_VIDEO: VideoSlot = {
  src: '/videos/hyrox-montage.mp4',
  desktopOnly: false,  // Show on mobile too
};
```

### Autoplay blocked
If the browser blocks autoplay (rare with muted videos), the component falls back to the poster image. No broken UI.

### Intersection observer
Videos only play when their container is visible in the viewport. As you scroll past a section, its video pauses. This saves ~80% of CPU cost vs. playing everything constantly.

### Load performance
- `preload="metadata"` — only fetches the first frame until playback starts
- Poster image loads instantly, video loads when section scrolls into view
- Under 5 MB files = 1-2 second load on average broadband

---

## Enabling a slot (the full recipe)

Let's say you want to enable the hero background video. Step by step:

### Step 1 — Get the source file
Record a 10-second gym shot, or source one from Pexels/Unsplash (both have free commercial licenses on stock video).

### Step 2 — Compress
Run through HandBrake or FFmpeg with the settings above. Verify file is under 8 MB.

### Step 3 — Extract poster
Generate a JPG from frame 1 of the video (see above).

### Step 4 — Drop into project
```
public/videos/hero-ambient.mp4
public/videos/posters/hero-poster.jpg
```

### Step 5 — Enable in config
Open `lib/videos.ts` and change `HERO_BACKGROUND_VIDEO` from `null` to:
```ts
export const HERO_BACKGROUND_VIDEO: VideoSlot = {
  src: '/videos/hero-ambient.mp4',
  poster: '/videos/posters/hero-poster.jpg',
  opacity: 0.35,
  playbackRate: 0.7,
};
```

### Step 6 — Test
Save, refresh browser. Video plays. Check in Chrome DevTools Network tab that the MP4 loads and isn't oversized.

### Step 7 — Test mobile
Open on phone or DevTools mobile emulator. Should show the poster image (not the video) because the default is `desktopOnly: true`.

---

## Future: migrating to Mux/Cloudflare Stream

When traffic grows and self-hosted becomes a bandwidth cost problem, migration is trivial:

1. Upload MP4 to Mux/Cloudflare Stream
2. Get the streaming URL (e.g. `https://stream.mux.com/abc123.m3u8`)
3. Change `src` in `/lib/videos.ts` to that URL
4. Ship

No component code changes. The `AmbientVideo` component already handles external URLs.

Reasonable migration thresholds:
- Mux: worth it above ~500 video views/day
- Cloudflare Stream: worth it above ~2K views/day
- Below that, self-hosted via Vercel's CDN is genuinely fine

---

## Troubleshooting

### Video doesn't play
- Check DevTools Console for errors
- Verify path is correct (case-sensitive, no typos)
- Check file is actually H.264 MP4 (not HEVC, not MKV renamed to .mp4)
- Try in Chrome first — Safari is stricter

### Video plays but looks bad
- Increase CRF quality (18-20 for visibly better)
- Bump resolution to 1920×1080 (just accept the ~12 MB file size)
- Check the original source — you can't compress your way out of a bad shoot

### Site feels sluggish after enabling
- Open DevTools Performance → record while scrolling
- If GPU usage spikes, videos are too high-res — scale down to 960×540
- Disable least-impactful video slots (CTA first)

### Mobile sees the same video as desktop
- Check `desktopOnly: true` is set for background slots
- Hard refresh (mobile browsers cache aggressively)

---

## Phase 2: video testimonials in transformation gallery

Not in Phase 1, but the `AmbientVideo` component is ready for this:

```ts
// When ready, transformation gallery can accept videoUrl on each card:
{
  slug: 'arjun-hyrox',
  videoUrl: '/videos/testimonials/arjun.mp4',  // 30-60s client testimonial
  videoPoster: '/transformations/arjun-after.jpg',
  // ... rest of transformation data
}
```

The gallery card detects `videoUrl` and renders a play-button overlay. Click opens a modal with the full video testimonial + booking CTA. Highest-converting use of video on fitness sites historically.
