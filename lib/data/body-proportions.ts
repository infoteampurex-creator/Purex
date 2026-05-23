/**
 * Body-proportions derivation — turns raw measurements into SVG
 * scale factors the TwinSilhouette can morph against.
 *
 * Two layers:
 *   1. BodyType (lean / athletic / solid / heavy) — coarse base
 *      shape derived from BMI. Picks which silhouette path set to
 *      render. Stable across small weight fluctuations.
 *   2. ScaleFactors — fine-grained per-region multipliers derived
 *      from individual measurements (chest, waist, hips, biceps,
 *      thighs). Applied as SVG group transforms on top of the base
 *      shape so the silhouette tracks your real body.
 *
 * Both fall back gracefully when data is sparse — even with just
 * height + weight you get a coherent BMI-band silhouette.
 */

import type { BodyMeasurements, Gender } from './body-measurements';

export type BodyType = 'lean' | 'athletic' | 'solid' | 'heavy';

export interface BodyProportions {
  bodyType: BodyType;
  /** Computed BMI when height + weight available; null otherwise. */
  bmi: number | null;
  /** Width multipliers, 1.0 = neutral (typical adult median).
   *  Each clamped to [0.7, 1.5] so the silhouette stays anatomically
   *  recognisable even with extreme inputs. */
  shoulderScale: number;
  chestScale: number;
  waistScale: number;
  hipScale: number;
  bicepScale: number;
  thighScale: number;
  calfScale: number;
  neckScale: number;
}

const DEFAULT_PROPORTIONS: BodyProportions = {
  bodyType: 'athletic',
  bmi: null,
  shoulderScale: 1,
  chestScale: 1,
  waistScale: 1,
  hipScale: 1,
  bicepScale: 1,
  thighScale: 1,
  calfScale: 1,
  neckScale: 1,
};

// Median adult body-site values in cm — what `scale = 1.0` represents.
// Calibrated separately per gender. Athletic adult baseline; the actual
// distribution skews higher for heavy / lower for lean and the body-
// type tier handles that.
const MEDIANS: Record<'male' | 'female' | 'neutral', {
  shoulder: number; // approximated as chest/2 for SVG; we accept chest
  chest: number;
  waist: number;
  hips: number;
  bicep: number;
  thigh: number;
  calf: number;
  neck: number;
}> = {
  male: {
    shoulder: 110, chest: 100, waist: 85, hips: 100,
    bicep: 32, thigh: 55, calf: 38, neck: 39,
  },
  female: {
    shoulder: 95, chest: 90, waist: 72, hips: 100,
    bicep: 28, thigh: 55, calf: 35, neck: 33,
  },
  neutral: {
    shoulder: 102, chest: 95, waist: 78, hips: 100,
    bicep: 30, thigh: 55, calf: 36, neck: 36,
  },
};

function clamp(v: number, min = 0.7, max = 1.5): number {
  return Math.max(min, Math.min(max, v));
}

function bmiToType(bmi: number): BodyType {
  if (bmi < 21) return 'lean';
  if (bmi < 26) return 'athletic';
  if (bmi < 31) return 'solid';
  return 'heavy';
}

function avgArm(m: BodyMeasurements | null): number | null {
  if (!m) return null;
  const l = m.bicepLeftCm;
  const r = m.bicepRightCm;
  if (l == null && r == null) return null;
  if (l == null) return r;
  if (r == null) return l;
  return (l + r) / 2;
}

function avgThigh(m: BodyMeasurements | null): number | null {
  if (!m) return null;
  const l = m.thighLeftCm;
  const r = m.thighRightCm;
  if (l == null && r == null) return null;
  if (l == null) return r;
  if (r == null) return l;
  return (l + r) / 2;
}

function avgCalf(m: BodyMeasurements | null): number | null {
  if (!m) return null;
  const l = m.calfLeftCm;
  const r = m.calfRightCm;
  if (l == null && r == null) return null;
  if (l == null) return r;
  if (r == null) return l;
  return (l + r) / 2;
}

/**
 * Derive a parametric body shape from the user's logged data.
 * Returns sensible defaults when measurements are missing — even
 * with just (height_cm, weight_kg) we can compute BMI band.
 */
export function deriveBodyProportions(
  measurements: BodyMeasurements | null,
  heightCm: number | null,
  gender: Gender | null
): BodyProportions {
  const g: 'male' | 'female' | 'neutral' =
    gender === 'male' ? 'male' : gender === 'female' ? 'female' : 'neutral';
  const medians = MEDIANS[g];

  // BMI when we have both height and weight
  const weightKg = measurements?.weightKg ?? null;
  let bmi: number | null = null;
  if (heightCm && weightKg && heightCm > 0) {
    const heightM = heightCm / 100;
    bmi = weightKg / (heightM * heightM);
  }
  const bodyType: BodyType = bmi != null ? bmiToType(bmi) : 'athletic';

  // Individual measurement → scale
  const scaleFromMeasurement = (cm: number | null, median: number): number => {
    if (cm == null) {
      // No measurement: fall back to the body-type's expected scale
      return BODY_TYPE_FALLBACK_SCALES[bodyType];
    }
    return clamp(cm / median);
  };

  return {
    bodyType,
    bmi,
    shoulderScale: scaleFromMeasurement(measurements?.chestCm ?? null, medians.shoulder),
    chestScale: scaleFromMeasurement(measurements?.chestCm ?? null, medians.chest),
    waistScale: scaleFromMeasurement(measurements?.waistCm ?? null, medians.waist),
    hipScale: scaleFromMeasurement(measurements?.hipsCm ?? null, medians.hips),
    bicepScale: scaleFromMeasurement(avgArm(measurements), medians.bicep),
    thighScale: scaleFromMeasurement(avgThigh(measurements), medians.thigh),
    calfScale: scaleFromMeasurement(avgCalf(measurements), medians.calf),
    neckScale: scaleFromMeasurement(measurements?.neckCm ?? null, medians.neck),
  };
}

/**
 * When we don't have a specific measurement, we shift the scale based
 * on the BMI band so the silhouette still reads as the right body type.
 * Lean = narrower overall, heavy = wider.
 */
const BODY_TYPE_FALLBACK_SCALES: Record<BodyType, number> = {
  lean: 0.92,
  athletic: 1.0,
  solid: 1.15,
  heavy: 1.30,
};

export { DEFAULT_PROPORTIONS };

// ─── Projection for Future Clone ───────────────────────────────────

/**
 * Project the user's current body towards their Day-90 self.
 * Conservative — assumes consistent training:
 *   • Waist trims 5%
 *   • Hips trim 2%
 *   • Shoulders + chest widen 4%
 *   • Biceps + thighs grow 6%
 *   • BMI shifts one band down (heavy → solid → athletic → lean)
 *     but never below lean.
 */
export function projectBodyProportions(
  current: BodyProportions
): BodyProportions {
  const TYPE_ORDER: BodyType[] = ['lean', 'athletic', 'solid', 'heavy'];
  const idx = TYPE_ORDER.indexOf(current.bodyType);
  const projectedType = TYPE_ORDER[Math.max(0, idx - 1)];

  return {
    bodyType: projectedType,
    bmi: current.bmi,
    shoulderScale: clamp(current.shoulderScale * 1.04),
    chestScale: clamp(current.chestScale * 1.04),
    waistScale: clamp(current.waistScale * 0.95),
    hipScale: clamp(current.hipScale * 0.98),
    bicepScale: clamp(current.bicepScale * 1.06),
    thighScale: clamp(current.thighScale * 1.06),
    calfScale: clamp(current.calfScale * 1.03),
    neckScale: clamp(current.neckScale * 1.0),
  };
}
