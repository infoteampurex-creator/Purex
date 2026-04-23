// ═══════════════════════════════════════════════════════════════════════
// DIGITAL TWIN — projected "future you" based on current trajectory
// ═══════════════════════════════════════════════════════════════════════
//
// The Digital Twin shows a silhouette projection of the client at
// milestones — Day 30, 60, 100, 365 — adjusted by real adherence data.
//
// High adherence (85%+ streak) → projections near theoretical best.
// Low adherence (<60% streak) → projections close to current state.
//
// This creates honesty in the projection: future-you is not a fantasy,
// it's a mirror of today's choices.

export type TwinGoal = 'fat-loss' | 'hyrox' | 'strength' | 'rehab' | 'endurance';

export interface TwinBaseline {
  weightKg: number;
  bodyFatPercent: number;
  vo2max: number;
  strengthIndex: number; // 0-100 composite of main lifts
  heightCm: number;
}

export interface TwinProjection {
  day: number; // 0, 30, 60, 100, 365
  weightKg: number;
  bodyFatPercent: number;
  vo2max: number;
  strengthIndex: number;
  // SVG silhouette parameters (for rendering)
  silhouette: {
    torsoWidth: number;    // relative body width ratio
    waist: number;         // waist narrow-ness
    shoulders: number;     // shoulder breadth
    legMass: number;       // leg width
    posture: number;       // 0 = slouched, 1 = upright
    glow: number;          // 0 = dim, 1 = athletic radiance
  };
  label: string;
  // Key callouts at this milestone
  callouts: string[];
}

export interface DigitalTwin {
  clientName: string;
  goal: TwinGoal;
  goalLabel: string;
  baseline: TwinBaseline;
  adherenceScore: number; // 0-100, drives projection strength
  currentDay: number;
  projections: TwinProjection[]; // [Day0, Day30, Day60, Day100, Day365]
  daysToReveal: number;
}

// ─── Adherence multiplier ────────────────────────────────────────────
// At 100% adherence, client hits full theoretical progress.
// At 0% adherence, no change from baseline.
// The curve is slightly non-linear — compliance below 60% has steep
// drop-off, rewarding real commitment.
function adherenceMultiplier(score: number): number {
  const normalised = Math.max(0, Math.min(100, score)) / 100;
  // Quadratic-ish curve: 100% -> 1.0, 80% -> 0.72, 60% -> 0.45, 40% -> 0.22
  return Math.pow(normalised, 1.5);
}

// ─── Goal-specific theoretical deltas over 100 days ──────────────────
const GOAL_MAX_DELTAS: Record<
  TwinGoal,
  {
    weightKgDelta: number;         // negative = loss
    bodyFatDelta: number;          // negative = reduction
    vo2maxDelta: number;           // positive = gain
    strengthDelta: number;         // positive = gain
    label: string;
    calloutsByStage: string[][];   // callouts per milestone [Day30, Day60, Day100, Day365]
  }
> = {
  'fat-loss': {
    weightKgDelta: -8,
    bodyFatDelta: -6,
    vo2maxDelta: 4,
    strengthDelta: 6,
    label: 'Fat Loss · 100-Day',
    calloutsByStage: [
      ['Waistline visibly tighter', 'Clothes fit better', 'Energy is steady all day'],
      ['6kg down · sustainable', 'Body fat dropping', 'Sleep deeper · HRV up'],
      ['Transformation visible in photos', 'Full wardrobe fits differently', 'Strength gained alongside fat loss'],
      ['Long-term lifestyle locked in', 'Body fat at athletic range', 'Low risk of rebound'],
    ],
  },
  hyrox: {
    weightKgDelta: -4,
    bodyFatDelta: -4,
    vo2maxDelta: 10,
    strengthDelta: 14,
    label: 'HYROX · Race Ready',
    calloutsByStage: [
      ['Base conditioning built', 'Wall balls · strict form', 'Sled push mastered'],
      ['Mid-race pacing dialled in', 'Run/station transitions smooth', 'VO2 max climbing'],
      ['Race-ready for HYROX Open', 'Sub-80 min possible', 'Peaking without breaking'],
      ['Pro-tier performance window', 'Top 25% open category', 'Year-round race readiness'],
    ],
  },
  strength: {
    weightKgDelta: 2,
    bodyFatDelta: -3,
    vo2maxDelta: 3,
    strengthDelta: 22,
    label: 'Strength · Powerlifting',
    calloutsByStage: [
      ['Technique refined on big 3', 'Volume building steadily', 'Joint resilience up'],
      ['PRs within reach', 'Posture transformed', 'Recovery between sessions improved'],
      ['New PR in squat, bench, deadlift', 'Added 15-20% to main lifts', 'Physique denser & more powerful'],
      ['Competing in your weight class', 'Lifetime strength ceiling raised', 'Injury-resistant'],
    ],
  },
  rehab: {
    weightKgDelta: -2,
    bodyFatDelta: -2,
    vo2maxDelta: 3,
    strengthDelta: 10,
    label: 'Rehab · Return-to-Lift',
    calloutsByStage: [
      ['Pain-free daily movement', 'Stability restored', 'Confidence returning'],
      ['Back under the bar', 'Full range of motion', 'Pain-free training'],
      ['Stronger than pre-injury', 'Movement quality transformed', 'Preventive habits locked in'],
      ['Injury-resistant physique', 'Training age reset', 'Longevity-first athlete'],
    ],
  },
  endurance: {
    weightKgDelta: -5,
    bodyFatDelta: -4,
    vo2maxDelta: 12,
    strengthDelta: 4,
    label: 'Endurance · IRONMAN Ready',
    calloutsByStage: [
      ['Aerobic base laid', 'Zone 2 mastered', 'Fatigue resistance up'],
      ['Long sessions feel light', 'Fuelling dialled in', 'Bike + run synced'],
      ['Race-ready for half distance', 'Swim-bike-run chain smooth', 'Mental toughness forged'],
      ['Full IRONMAN in sight', 'Life-long endurance base', 'Metabolic flexibility established'],
    ],
  },
};

// ─── Silhouette morph — derives body proportions from metrics ────────
function deriveSilhouette(
  goal: TwinGoal,
  baseline: TwinBaseline,
  weight: number,
  bodyFat: number,
  strength: number,
  vo2: number
): TwinProjection['silhouette'] {
  // Body fat reduction → tighter waist (amplified for visual impact)
  const fatReductionProgress = (baseline.bodyFatPercent - bodyFat) / 8;
  // Strength progress → broader shoulders (amplified)
  const strengthProgress = (strength - baseline.strengthIndex) / 20;
  // Overall fitness → posture + glow
  const overallProgress =
    fatReductionProgress * 0.4 + strengthProgress * 0.4 + (vo2 / 55) * 0.2;

  return {
    torsoWidth: clamp(1.0 - fatReductionProgress * 0.16, 0.75, 1.12),
    waist: clamp(1.0 - fatReductionProgress * 0.28, 0.55, 1.1),
    shoulders: clamp(1.0 + strengthProgress * 0.22, 0.92, 1.35),
    legMass: clamp(1.0 + strengthProgress * 0.1, 0.95, 1.22),
    posture: clamp(0.35 + overallProgress * 0.7, 0, 1),
    glow: clamp(overallProgress, 0, 1),
  };
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// ─── Core projection builder ─────────────────────────────────────────
export function buildProjections(
  baseline: TwinBaseline,
  goal: TwinGoal,
  adherence: number
): TwinProjection[] {
  const mul = adherenceMultiplier(adherence);
  const spec = GOAL_MAX_DELTAS[goal];

  const milestones = [0, 30, 60, 100, 365];

  return milestones.map((day, idx) => {
    // Progress curve: Day 0 = 0, Day 100 = 1.0, Day 365 = 1.4
    const progressFactor =
      day === 0 ? 0 : day === 365 ? 1.4 : day / 100;

    const effectiveMul = mul * progressFactor;

    const weight = baseline.weightKg + spec.weightKgDelta * effectiveMul;
    const bodyFat = baseline.bodyFatPercent + spec.bodyFatDelta * effectiveMul;
    const vo2 = baseline.vo2max + spec.vo2maxDelta * effectiveMul;
    const strength = baseline.strengthIndex + spec.strengthDelta * effectiveMul;

    const silhouette = deriveSilhouette(
      goal,
      baseline,
      weight,
      bodyFat,
      strength,
      vo2
    );

    return {
      day,
      weightKg: Math.round(weight * 10) / 10,
      bodyFatPercent: Math.round(bodyFat * 10) / 10,
      vo2max: Math.round(vo2),
      strengthIndex: Math.round(strength),
      silhouette,
      label:
        day === 0
          ? 'Today'
          : day === 100
            ? 'Reveal Day'
            : day === 365
              ? '1 Year'
              : `Day ${day}`,
      callouts:
        idx === 0
          ? []
          : spec.calloutsByStage[idx - 1] || [],
    };
  });
}

// ─── Mock twin for the client dashboard ──────────────────────────────
export function getMockClientTwin(): DigitalTwin {
  const baseline: TwinBaseline = {
    weightKg: 85,
    bodyFatPercent: 22,
    vo2max: 42,
    strengthIndex: 58,
    heightCm: 178,
  };

  const adherence = 89; // matches the mock Score widget
  const goal: TwinGoal = 'hyrox';

  return {
    clientName: 'Arjun M.',
    goal,
    goalLabel: GOAL_MAX_DELTAS[goal].label,
    baseline,
    adherenceScore: adherence,
    currentDay: 27,
    daysToReveal: 73,
    projections: buildProjections(baseline, goal, adherence),
  };
}
