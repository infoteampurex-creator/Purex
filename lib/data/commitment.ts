// ═══════════════════════════════════════════════════════════════════════
// 100-DAY COMMITMENT — the signature PURE X transformation contract
// ═══════════════════════════════════════════════════════════════════════
//
// Every Pure Core / Elite / Couple client signs a 100-day pact at activation.
// This file defines the contract data model, milestones, and mock data.

export interface CommitmentPact {
  id: string;
  clientId: string;
  clientName: string;
  // The dream — one sentence goal
  goalStatement: string;
  // Personal pledge — client's own words
  pledge: string;
  // Planned adherence targets (signed on Day 0)
  commitments: {
    workoutSessions: number;
    nutritionLogs: number;
    weeklyCalls: number;
    physioCheckIns: number;
    minStreakPercent: number; // e.g. 80 means must maintain 80%+ streak
  };
  // Witnessed by which coach
  witnessName: string;
  witnessSlug: string;
  // Client's drawn signature (SVG path or data URL)
  signatureDataUrl?: string | null;
  // Dates
  startDate: string;    // ISO — Day 1
  endDate: string;      // ISO — Day 100 (reveal day)
  signedAt: string;     // ISO — when the pact was signed
  // Live status
  status: 'active' | 'completed' | 'paused' | 'broken';
  // Running metrics
  metrics: {
    currentDay: number;
    daysComplete: number;
    streakPercent: number;        // % of days met commitment so far
    workoutsLogged: number;
    nutritionDaysLogged: number;
    callsCompleted: number;
    physioCheckInsCompleted: number;
    // Transformation photos
    baselinePhotoUrl?: string | null;
    day25PhotoUrl?: string | null;
    day50PhotoUrl?: string | null;
    day75PhotoUrl?: string | null;
    day100PhotoUrl?: string | null;
  };
}

// ─── Milestones ────────────────────────────────────────────────────────
export const COMMITMENT_MILESTONES = [
  {
    day: 25,
    label: 'First Quarter',
    description: 'First reflection — how does the system feel?',
    badge: 'Q1 Complete',
  },
  {
    day: 50,
    label: 'Halfway Home',
    description: 'Mid-pact reset. First transformation photo unlock.',
    badge: 'Halfway',
  },
  {
    day: 75,
    label: 'Final 25',
    description: 'Pressure phase. Leaderboard activates.',
    badge: 'Final 25',
  },
  {
    day: 100,
    label: 'Reveal Day',
    description: 'The Pact completes. Graduates join The 100 Club.',
    badge: '100 Club',
  },
] as const;

// ─── Mock active pact for the client dashboard ────────────────────────
export function getMockClientPact(): CommitmentPact {
  // Simulate a pact signed 27 days ago
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 27);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 99); // Day 100 is endDate

  return {
    id: 'pact-arjun-001',
    clientId: 'c1',
    clientName: 'Arjun M.',
    goalStatement:
      'Complete HYROX Open in under 80 minutes. Lose 6kg. Build the discipline my younger self never had.',
    pledge:
      'I am not starting a diet. I am becoming someone else — the person my future children will look up to.',
    commitments: {
      workoutSessions: 80,
      nutritionLogs: 700,
      weeklyCalls: 14,
      physioCheckIns: 8,
      minStreakPercent: 80,
    },
    witnessName: 'Siva Reddy',
    witnessSlug: 'siva-reddy',
    signatureDataUrl: null,
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
    signedAt: startDate.toISOString(),
    status: 'active',
    metrics: {
      currentDay: 27,
      daysComplete: 27,
      streakPercent: 89,
      workoutsLogged: 22,
      nutritionDaysLogged: 25,
      callsCompleted: 4,
      physioCheckInsCompleted: 2,
      baselinePhotoUrl: null,
    },
  };
}

// ─── Mock admin view of multiple active pacts ─────────────────────────
export function getMockAdminPacts() {
  return [
    {
      clientId: 'c1',
      clientName: 'Arjun M.',
      currentDay: 27,
      streakPercent: 89,
      status: 'on-track' as const,
      witnessName: 'Siva Reddy',
    },
    {
      clientId: 'c2',
      clientName: 'Priya R.',
      currentDay: 63,
      streakPercent: 94,
      status: 'on-track' as const,
      witnessName: 'Paula Konasionok',
    },
    {
      clientId: 'c3',
      clientName: 'Rohan K.',
      currentDay: 12,
      streakPercent: 75,
      status: 'at-risk' as const,
      witnessName: 'Siva Reddy',
    },
    {
      clientId: 'c4',
      clientName: 'Meera D.',
      currentDay: 98,
      streakPercent: 91,
      status: 'on-track' as const,
      witnessName: 'Siva Reddy',
    },
    {
      clientId: 'c5',
      clientName: 'Vikram S.',
      currentDay: 45,
      streakPercent: 68,
      status: 'at-risk' as const,
      witnessName: 'Paula Konasionok',
    },
  ];
}

// ─── 100 Club mock graduates ──────────────────────────────────────────
export function getMockGraduates() {
  return [
    {
      name: 'Arjun S.',
      goal: 'HYROX Open',
      completedDate: '2026-02-15',
      bodyFatChange: '-5.2%',
      initialLetters: 'AS',
    },
    {
      name: 'Priya M.',
      goal: 'Fat Loss · 15kg',
      completedDate: '2026-03-01',
      bodyFatChange: '-8.1%',
      initialLetters: 'PM',
    },
    {
      name: 'Rahul V.',
      goal: 'Strength + Rehab',
      completedDate: '2026-03-22',
      bodyFatChange: '-2.8%',
      initialLetters: 'RV',
    },
    {
      name: 'Sneha K.',
      goal: 'Post-pregnancy',
      completedDate: '2026-04-05',
      bodyFatChange: '-6.5%',
      initialLetters: 'SK',
    },
  ];
}
