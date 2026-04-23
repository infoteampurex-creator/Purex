# PURE X — Self-Hosted Videos

Drop video files here. Each slot is configured in /lib/videos.ts

## Suggested file names (match the config defaults)
- hero-ambient.mp4          (Hero background)
- siva-hero-loop.mp4        (Siva's card, replaces photo)
- hyrox-montage.mp4         (HYROX section backdrop)
- ironman-montage.mp4       (IRONMAN section backdrop)
- cta-atmospheric.mp4       (CTA band backdrop)

## Poster images (shown before video loads)
Store in: /public/videos/posters/
Use: hero-gym-poster.jpg, hyrox-poster.jpg, etc.

## File size targets (keep these tight!)
- Hero background:  <8 MB  (largest, most visible)
- Siva hero card:   <5 MB  (portrait format)
- Section backdrops: <10 MB each
- CTA atmospheric:  <6 MB

## Format requirements
- Container: MP4 (H.264 codec for max compatibility)
- Resolution: 1280x720 for backgrounds, 720x900 for portrait
- Frame rate: 24-30fps
- Bitrate: 1.5-3 Mbps (web-optimized)
- Duration: 6-15 seconds (seamless loop preferred)
- AUDIO: Remove entirely (muted on web anyway, saves ~20% size)

See /docs/05-video-guide.md for complete specs and optimization workflow.
