/**
 * ═══════════════════════════════════════════════════════════════════════
 * PURE X — Video Configuration
 * ═══════════════════════════════════════════════════════════════════════
 *
 * One central place to configure all ambient video across the site.
 * Each slot can be:
 *   - null → no video, component uses static fallback
 *   - { src, poster, ... } → video plays with given settings
 *
 * Self-hosted videos go in /public/videos/ (5-15MB limit recommended)
 * External streaming: use absolute URLs from Mux/Cloudflare/Vimeo/etc.
 *
 * HOW TO ENABLE A VIDEO:
 * Just set the slot value. Example:
 *
 *   export const HERO_BACKGROUND_VIDEO: VideoSlot = {
 *     src: '/videos/hero-gym-ambient.mp4',
 *     poster: '/videos/posters/hero-gym-poster.jpg',
 *     opacity: 0.35,
 *     playbackRate: 0.7,
 *   };
 *
 * Components read these values and render video automatically.
 * ═══════════════════════════════════════════════════════════════════════
 */

export interface VideoSlot {
  src: string;
  poster?: string;
  opacity?: number;
  playbackRate?: number;
  objectPosition?: string;
  desktopOnly?: boolean;
}

/**
 * HERO — Background ambient footage behind the whole hero section.
 * Recommended: dark gym establishing shot, slow camera push,
 * 6-12 seconds looped, no faces, low-motion.
 * Specs: 1920x1080 MP4, H.264, <8MB, playback 0.6-0.8x.
 */
export const HERO_BACKGROUND_VIDEO: VideoSlot | null = null;
// Example:
// export const HERO_BACKGROUND_VIDEO: VideoSlot = {
//   src: '/videos/hero-ambient.mp4',
//   poster: '/hero/hero-backdrop.jpg',
//   opacity: 0.35,
//   playbackRate: 0.7,
// };

/**
 * SIVA HERO CARD — Optional video in place of Siva's static photo.
 * Recommended: 4:5 portrait, slow-mo dramatic movement
 * (rope pull, battle rope, kettlebell swing at half speed).
 * Specs: 720x900 MP4, H.264, <5MB, 4-8 sec loop.
 */
export const SIVA_HERO_VIDEO: VideoSlot | null = null;
// Example:
// export const SIVA_HERO_VIDEO: VideoSlot = {
//   src: '/videos/siva-hero-loop.mp4',
//   poster: '/trainers/trainer-siva-reddy.jpg',
//   opacity: 1,
//   objectPosition: 'center 20%',
// };

/**
 * HYROX SECTION — Background footage (sled push, rowing, wall balls, etc.)
 * Recommended: Mix of all 8 stations, rhythmic editing.
 * Specs: 1920x1080 MP4, 10-15 seconds, <10MB.
 */
export const HYROX_SECTION_VIDEO: VideoSlot | null = null;
// Example:
// export const HYROX_SECTION_VIDEO: VideoSlot = {
//   src: '/videos/hyrox-montage.mp4',
//   poster: '/videos/posters/hyrox-poster.jpg',
//   opacity: 0.2,
// };

/**
 * IRONMAN SECTION — Swim/bike/run action footage.
 * Specs: 1920x1080 MP4, 8-12 seconds, <8MB.
 */
export const IRONMAN_SECTION_VIDEO: VideoSlot | null = null;
// Example:
// export const IRONMAN_SECTION_VIDEO: VideoSlot = {
//   src: '/videos/ironman-montage.mp4',
//   poster: '/videos/posters/ironman-poster.jpg',
//   opacity: 0.2,
// };

/**
 * CTA BAND — Subtle motivational clip behind final call-to-action.
 * Recommended: very slow, atmospheric. Low motion on purpose.
 * Specs: 1920x1080 MP4, <6MB.
 */
export const CTA_BACKGROUND_VIDEO: VideoSlot | null = null;
// Example:
// export const CTA_BACKGROUND_VIDEO: VideoSlot = {
//   src: '/videos/cta-atmospheric.mp4',
//   poster: '/videos/posters/cta-poster.jpg',
//   opacity: 0.15,
//   playbackRate: 0.5,
// };
