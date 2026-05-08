// ═══════════════════════════════════════════════════════════════════════
// PURE X SCORE — the integrated 0-100 daily health score
// ═══════════════════════════════════════════════════════════════════════
//
// Unlike other fitness platforms that silo data (steps, calories, sleep),
// the PURE X Score blends 5 pillars into a single daily number that
// reflects overall health progress.
//
// Each pillar contributes a weighted percentage:
//   Training Load      25%
//   Recovery Quality   20%
//   Mental Resilience  15%
//   Nutrition          25%
//   Medical Markers    15%

export type PillarKey =
  | 'training'
  | 'recovery'
  | 'mental'
  | 'nutrition'
  | 'medical';

export interface Pillar {
  key: PillarKey;
  label: string;
  weight: number;
  score: number; // 0-100
  description: string;
  status: 'peak' | 'strong' | 'steady' | 'watch' | 'risk';
  insight: string; // one-line AI-style explanation
  color: string;
}

export interface DayScore {
  date: string; // ISO YYYY-MM-DD
  total: number;
  pillars: Record<PillarKey, number>;
}

export interface PureXScore {
  total: number;        // 0-100 weighted score
  asOf: string;         // ISO datetime
  delta: number;        // change vs 7-day avg
  trend: 'up' | 'down' | 'flat';
  pillars: Pillar[];
  history: DayScore[];  // last 30 days for the graph
  morningInsight: string;
}

// ─── Pillar configuration ─────────────────────────────────────────────
export const PILLAR_CONFIG: Record<
  PillarKey,
  { label: string; weight: number; color: string; description: string }
> = {
  training: {
    label: 'Training Load',
    weight: 0.25,
    color: '#c6ff3d',
    description: 'Session consistency, volume, and effort quality',
  },
  recovery: {
    label: 'Recovery Quality',
    weight: 0.2,
    color: '#7dd3ff',
    description: 'Sleep duration, HRV, rest day adherence',
  },
  mental: {
    label: 'Mental Resilience',
    weight: 0.15,
    color: '#ff6b9d',
    description: 'Mood logs, stress markers, session attendance',
  },
  nutrition: {
    label: 'Nutrition',
    weight: 0.25,
    color: '#4dffb8',
    description: 'Food logging, protein target, hydration',
  },
  medical: {
    label: 'Medical Markers',
    weight: 0.15,
    color: '#ffb84d',
    description: 'Weight trend, resting HR, blood pressure',
  },
};

// ─── Status thresholds ────────────────────────────────────────────────
export function scoreStatus(score: number): Pillar['status'] {
  if (score >= 90) return 'peak';
  if (score >= 80) return 'strong';
  if (score >= 65) return 'steady';
  if (score >= 50) return 'watch';
  return 'risk';
}

export function statusLabel(status: Pillar['status']): string {
  return {
    peak: 'PEAK',
    strong: 'STRONG',
    steady: 'STEADY',
    watch: 'WATCH',
    risk: 'AT RISK',
  }[status];
}

export function statusColor(status: Pillar['status']): string {
  return {
    peak: '#c6ff3d',
    strong: '#4dffb8',
    steady: '#7dd3ff',
    watch: '#ffb84d',
    risk: '#ff6b5b',
  }[status];
}

// ─── Weighted total calculator ────────────────────────────────────────
export function calculateTotal(pillars: Record<PillarKey, number>): number {
  let total = 0;
  (Object.keys(pillars) as PillarKey[]).forEach((key) => {
    total += pillars[key] * PILLAR_CONFIG[key].weight;
  });
  return Math.round(total);
}

// ─── Mock data generator for client ───────────────────────────────────
export function getMockClientScore(): PureXScore | null {
  // Returns null until a real client has logged scoring data.
  // Previously generated demo scores around 78/100 — removed for production.
  return null;
}

// Old internals kept (unused) for reference if we restore demo mode.
function _unusedDemoScore(): PureXScore {
  // Today's pillar scores (plausible for a Day-27 client on track)
  const todayPillars: Record<PillarKey, number> = {
    training: 82,
    recovery: 71,
    mental: 65,
    nutrition: 88,
    medical: 79,
  };

  const total = calculateTotal(todayPillars);

  // Generate last 30 days of history with slight drift
  const history: DayScore[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    // Simulate progressive improvement with natural variance
    const base = 58 + (29 - i) * 0.8;
    const noise = (Math.sin(i * 1.3) + Math.cos(i * 0.7)) * 4;
    const pillarNoise = (k: number) => Math.sin(i * k) * 6;

    const p: Record<PillarKey, number> = {
      training: Math.max(40, Math.min(100, Math.round(base + noise + pillarNoise(1.1)))),
      recovery: Math.max(40, Math.min(100, Math.round(base - 4 + noise + pillarNoise(1.7)))),
      mental: Math.max(40, Math.min(100, Math.round(base - 8 + noise + pillarNoise(2.3)))),
      nutrition: Math.max(40, Math.min(100, Math.round(base + 6 + noise + pillarNoise(0.9)))),
      medical: Math.max(40, Math.min(100, Math.round(base + 2 + noise + pillarNoise(1.5)))),
    };

    history.push({
      date: d.toISOString().slice(0, 10),
      total: calculateTotal(p),
      pillars: p,
    });
  }

  // Overwrite last day to match today's pillars
  history[history.length - 1] = {
    date: new Date().toISOString().slice(0, 10),
    total,
    pillars: todayPillars,
  };

  // Delta vs 7-day avg
  const sevenDayAvg =
    history.slice(-8, -1).reduce((s, d) => s + d.total, 0) / 7;
  const delta = Math.round((total - sevenDayAvg) * 10) / 10;

  const pillars: Pillar[] = (Object.keys(todayPillars) as PillarKey[]).map((k) => {
    const score = todayPillars[k];
    const status = scoreStatus(score);
    return {
      key: k,
      label: PILLAR_CONFIG[k].label,
      weight: PILLAR_CONFIG[k].weight,
      score,
      description: PILLAR_CONFIG[k].description,
      color: PILLAR_CONFIG[k].color,
      status,
      insight: pillarInsight(k, score, status),
    };
  });

  return {
    total,
    asOf: new Date().toISOString(),
    delta,
    trend: delta > 1 ? 'up' : delta < -1 ? 'down' : 'flat',
    pillars,
    history,
    morningInsight: buildMorningInsight(pillars, total, delta),
  };
}

// ─── Per-pillar insight generator ────────────────────────────────────
function pillarInsight(
  key: PillarKey,
  score: number,
  status: Pillar['status']
): string {
  const insights: Record<PillarKey, Record<Pillar['status'], string>> = {
    training: {
      peak: 'Your volume and consistency are elite — hold the line, avoid overtraining.',
      strong: 'Excellent session quality. Ready to progress the load by 5%.',
      steady: 'Consistency is good. Consider adding one session this week.',
      watch: 'Volume dropped. Book a call with Siva Reddy to reset.',
      risk: 'Missed sessions accumulating — time for an honest check-in.',
    },
    recovery: {
      peak: 'Sleep and HRV are dialled in. Your body is fully loaded.',
      strong: 'Solid recovery. Consider a deeper mobility session tonight.',
      steady: 'Recovery is adequate. Prioritise an extra hour of sleep.',
      watch: 'Sleep trend declining. Reduce caffeine after 2pm.',
      risk: 'Poor recovery risks injury. Deload week recommended.',
    },
    mental: {
      peak: 'Mental state is rock solid. Use this for the hardest sessions.',
      strong: 'Feeling strong. Journal one win tonight.',
      steady: 'Mood is neutral. A 15-min walk outdoors will lift it.',
      watch: 'Stress markers elevated — flag this with your coach today.',
      risk: 'Mental resilience needs attention. Reach out to your coach today.',
    },
    nutrition: {
      peak: 'Protein, hydration, and logging are all on point.',
      strong: 'Consistent logging. Push protein to 1.8g/kg.',
      steady: 'Logging 5/7 days. Close the 2 gaps this week.',
      watch: 'Calorie variance too high. Return to consistent logging.',
      risk: 'Missed logs 4+ days. Nutrition is the foundation — rebuild here.',
    },
    medical: {
      peak: 'Every marker trending correctly. Next check-in on schedule.',
      strong: 'Weight and HR on target. Maintain current protocols.',
      steady: 'Steady progress on markers. Doctor review in 2 weeks.',
      watch: 'BP slightly elevated. Mention at next doctor call.',
      risk: 'Medical marker flag — Chandralekha will reach out.',
    },
  };

  return insights[key][status];
}

// ─── Morning brief builder ───────────────────────────────────────────
function buildMorningInsight(
  pillars: Pillar[],
  total: number,
  delta: number
): string {
  const weakest = [...pillars].sort((a, b) => a.score - b.score)[0];
  const strongest = [...pillars].sort((a, b) => b.score - a.score)[0];

  if (total >= 85) {
    return `Your score is ${total} — ${delta > 0 ? `up ${Math.abs(delta)} from last week` : 'holding strong'}. ${strongest.label} is your edge at ${strongest.score}. Protect it.`;
  }
  if (total >= 70) {
    return `Score: ${total}. ${strongest.label} leading at ${strongest.score}; ${weakest.label} needs attention at ${weakest.score}. ${weakest.insight}`;
  }
  return `Score: ${total}. ${weakest.label} has dropped to ${weakest.score}. ${weakest.insight}`;
}

// ─── Mock admin view of multiple client scores ────────────────────────
export function getMockAdminScores() {
  return [
    { clientId: 'c1', clientName: 'Arjun M.',  score: 77, delta: +2.3, trend: 'up' as const,   weakest: 'Mental' },
    { clientId: 'c2', clientName: 'Priya R.',  score: 91, delta: +0.7, trend: 'flat' as const, weakest: 'Medical' },
    { clientId: 'c3', clientName: 'Rohan K.',  score: 58, delta: -5.1, trend: 'down' as const, weakest: 'Nutrition' },
    { clientId: 'c4', clientName: 'Meera D.',  score: 86, delta: +1.9, trend: 'up' as const,   weakest: 'Recovery' },
    { clientId: 'c5', clientName: 'Vikram S.', score: 64, delta: -2.4, trend: 'down' as const, weakest: 'Training' },
  ];
}
