/**
 * Avatar PNG selection — picks the right body-type avatar based on
 * the user's gender + body type derived from their measurements.
 *
 * Assets generated via Gemini Pro and stored at public/twin/avatars/.
 * Each is a ~35-50 KB optimized PNG at 640px wide. Mobile-bundle safe.
 */

import type { Gender } from './body-measurements';
import type { BodyType } from './body-proportions';

const AVATAR_BASE = '/twin/avatars';

const AVATAR_PATHS: Record<'male' | 'female', Record<BodyType, string>> = {
  male: {
    lean: `${AVATAR_BASE}/male-lean.png`,
    athletic: `${AVATAR_BASE}/male-athletic.png`,
    solid: `${AVATAR_BASE}/male-solid.png`,
    heavy: `${AVATAR_BASE}/male-heavy.png`,
  },
  female: {
    lean: `${AVATAR_BASE}/female-lean.png`,
    athletic: `${AVATAR_BASE}/female-athletic.png`,
    solid: `${AVATAR_BASE}/female-solid.png`,
    heavy: `${AVATAR_BASE}/female-heavy.png`,
  },
};

const TYPE_ORDER: BodyType[] = ['lean', 'athletic', 'solid', 'heavy'];

/**
 * Resolve avatar path. Falls back to male/athletic if gender is null
 * (acceptable neutral default since the silhouettes are similar enough
 * before the user picks a gender at onboarding).
 */
export function avatarFor(
  gender: Gender | null,
  bodyType: BodyType
): string {
  const g: 'male' | 'female' = gender === 'female' ? 'female' : 'male';
  return AVATAR_PATHS[g][bodyType];
}

/**
 * Avatar one body-type tier slimmer than current — used by the
 * Future Clone "Day 90 projection". heavy→solid→athletic→lean.
 * Caps at lean (no going beyond).
 */
export function projectedAvatarFor(
  gender: Gender | null,
  currentType: BodyType
): string {
  const g: 'male' | 'female' = gender === 'female' ? 'female' : 'male';
  const idx = TYPE_ORDER.indexOf(currentType);
  const projectedType = TYPE_ORDER[Math.max(0, idx - 1)];
  return AVATAR_PATHS[g][projectedType];
}

/** Pretty label for a body type, used in card subtitles. */
export function bodyTypeLabel(t: BodyType): string {
  return { lean: 'Lean', athletic: 'Athletic', solid: 'Solid', heavy: 'Heavy build' }[t];
}
