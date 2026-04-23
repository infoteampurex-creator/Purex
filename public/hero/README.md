# Hero Images

Two types of images go in this folder:

## 1. Hero backdrop (optional)
- **File**: `hero-backdrop.jpg` (or `.webp`)
- **Specs**: 1920×1080 minimum, landscape, <400KB, dark cinematic gym shot
- **How to enable**: Edit `components/marketing/hero/Hero.tsx` line 22, change
  `const HERO_BACKDROP_IMAGE: string | null = null;`
  to
  `const HERO_BACKDROP_IMAGE: string | null = '/hero/hero-backdrop.jpg';`

## 2. Trainer card photos (the 3D card stack on the right of the hero)
- **Files** (4 required):
  - `trainer-siva-reddy.jpg`
  - `trainer-paula-konasionok.jpg`
  - `trainer-krishna.jpg`
  - `trainer-amber-jasari.jpg`
- **Specs**: 1200×675 (16:9 landscape), <180KB each, cinematic gym lighting
- **Crop**: Face at upper-third, dark background, high contrast
- **How to enable**: Already enabled. Just drop the files in — they appear on next page load.
- **Fallback**: Missing files show a branded gradient silhouette placeholder (card-accent colored). Layout never breaks.

See `/docs/04-images-guide.md` for complete guidance on all image types.
