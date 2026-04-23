/**
 * Admin mock data for UI development.
 * When Supabase is wired, replace imports with real queries.
 * Types mirror eventual DB schema in /supabase/migrations/00002_admin_schema.sql
 */

export interface AdminBooking {
  id: string;
  referenceId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  expertName: string;
  expertSlug: string;
  serviceName: string;
  preferredDate?: string;
  preferredTimeSlot?: string;
  scheduledDatetime?: string;
  status: 'new' | 'contacted' | 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  source: 'website' | 'whatsapp' | 'referral' | 'admin_manual';
  notes?: string;
  hasPreConsultForm: boolean;
  createdAt: string;
}

export interface AdminClient {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string; // Profile headshot URL (null falls back to initials)
  activePlan?: string;
  planTier?: 'fit_check' | 'online_live' | 'personal_transformation' | 'elite_couple';
  planStartDate?: string;
  assignedCoachName?: string;
  assignedCoachSlug?: string;
  dayNumber?: number;
  lastCheckIn?: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled' | 'onboarding';
  totalBookings: number;
  joinedAt: string;
}

export interface AdminSpecialist {
  id: string;
  slug: string;
  name: string;
  title: string;
  shortRole: string;
  location: string;
  clientsTrained: number;
  activeClients: number;
  calendlyUrl?: string;
  isActive: boolean;
}

// ────────────────────────────── MOCK DATA ──────────────────────────────

export const MOCK_BOOKINGS: AdminBooking[] = [
  {
    id: 'b1',
    referenceId: 'PX-A3B7F92C',
    clientName: 'Rakesh Mehta',
    clientEmail: 'rakesh.m@gmail.com',
    clientPhone: '+91 98765 43210',
    expertName: 'Siva Reddy',
    expertSlug: 'siva-reddy',
    serviceName: 'Pure Elite Discovery',
    preferredDate: '2026-04-28',
    preferredTimeSlot: 'evening',
    status: 'new',
    source: 'website',
    hasPreConsultForm: true,
    createdAt: '2026-04-23T09:12:00Z',
  },
  {
    id: 'b2',
    referenceId: 'PX-D7E2A18F',
    clientName: 'Meera Kapoor',
    clientEmail: 'meera.kapoor@outlook.com',
    clientPhone: '+91 87654 32109',
    expertName: 'Dr. Chandralekha',
    expertSlug: 'chandralekha',
    serviceName: 'Medical Screening Consultation',
    preferredDate: '2026-04-29',
    preferredTimeSlot: 'morning',
    status: 'new',
    source: 'website',
    hasPreConsultForm: true,
    createdAt: '2026-04-23T07:45:00Z',
  },
  {
    id: 'b3',
    referenceId: 'PX-F88C3B21',
    clientName: 'Arjun & Priya Iyer',
    clientEmail: 'arjun.iyer@gmail.com',
    clientPhone: '+91 76543 21098',
    expertName: 'Siva Reddy',
    expertSlug: 'siva-reddy',
    serviceName: 'Pure Elite Training',
    preferredDate: '2026-04-30',
    preferredTimeSlot: 'afternoon',
    status: 'new',
    source: 'website',
    hasPreConsultForm: false,
    createdAt: '2026-04-22T18:30:00Z',
  },
  {
    id: 'b4',
    referenceId: 'PX-8A7D92CC',
    clientName: 'Vikram Reddy',
    clientEmail: 'v.reddy1989@gmail.com',
    clientPhone: '+91 65432 10987',
    expertName: 'Krishna',
    expertSlug: 'krishna',
    serviceName: 'Physio Assessment',
    preferredDate: '2026-04-24',
    scheduledDatetime: '2026-04-24T16:30:00Z',
    status: 'scheduled',
    source: 'website',
    hasPreConsultForm: true,
    notes: 'Shoulder impingement, reported during onboarding call.',
    createdAt: '2026-04-20T14:00:00Z',
  },
  {
    id: 'b5',
    referenceId: 'PX-11B4E8A9',
    clientName: 'Nisha Patel',
    clientEmail: 'nisha.p@example.com',
    clientPhone: '+91 54321 09876',
    expertName: 'Paula Konasionok',
    expertSlug: 'paula-konasionok',
    serviceName: 'HYROX Preparation',
    preferredDate: '2026-04-25',
    scheduledDatetime: '2026-04-25T10:00:00Z',
    status: 'scheduled',
    source: 'referral',
    hasPreConsultForm: true,
    notes: 'Referred by Rohan P. — HYROX Singles goal for November.',
    createdAt: '2026-04-19T11:20:00Z',
  },
  {
    id: 'b6',
    referenceId: 'PX-66C19D3E',
    clientName: 'Tarun Singh',
    clientEmail: 'tarun@example.com',
    expertName: 'Siva Jampana',
    expertSlug: 'siva-jampana',
    serviceName: 'Discovery Call',
    scheduledDatetime: '2026-04-21T15:00:00Z',
    status: 'completed',
    source: 'website',
    hasPreConsultForm: false,
    notes: 'Signed up for Online Live plan. Starts Monday.',
    createdAt: '2026-04-18T09:00:00Z',
  },
  {
    id: 'b7',
    referenceId: 'PX-22F03ABC',
    clientName: 'Kavya Rao',
    clientEmail: 'kavya@example.com',
    expertName: 'Amber Jasari',
    expertSlug: 'amber-jasari',
    serviceName: 'Mental Performance Session',
    scheduledDatetime: '2026-04-20T19:00:00Z',
    status: 'completed',
    source: 'website',
    hasPreConsultForm: true,
    createdAt: '2026-04-15T13:45:00Z',
  },
  {
    id: 'b8',
    referenceId: 'PX-99D7452F',
    clientName: 'Deepak Kumar',
    clientEmail: 'deepak.k@example.com',
    expertName: 'Chandralekha',
    expertSlug: 'chandralekha',
    serviceName: 'Medical Screening',
    preferredDate: '2026-04-22',
    status: 'cancelled',
    source: 'website',
    hasPreConsultForm: true,
    notes: 'Client cancelled — rescheduling for May.',
    createdAt: '2026-04-17T10:00:00Z',
  },
];

export const MOCK_CLIENTS: AdminClient[] = [
  {
    id: 'c1',
    fullName: 'Arjun M.',
    email: 'arjun.m@example.com',
    phone: '+91 98765 11111',
    activePlan: 'Pure Elite',
    planTier: 'personal_transformation',
    planStartDate: '2026-02-15',
    assignedCoachName: 'Siva Reddy',
    assignedCoachSlug: 'siva-reddy',
    dayNumber: 67,
    lastCheckIn: '2026-04-18',
    status: 'active',
    totalBookings: 8,
    joinedAt: '2026-02-15',
  },
  {
    id: 'c2',
    fullName: 'Priya Reddy',
    email: 'priya.r@example.com',
    phone: '+91 98765 22222',
    activePlan: 'Pure Elite',
    planTier: 'elite_couple',
    planStartDate: '2026-01-20',
    assignedCoachName: 'Paula Konasionok',
    assignedCoachSlug: 'paula-konasionok',
    dayNumber: 93,
    lastCheckIn: '2026-04-21',
    status: 'active',
    totalBookings: 12,
    joinedAt: '2026-01-20',
  },
  {
    id: 'c3',
    fullName: 'Rohan P.',
    email: 'rohan.p@example.com',
    phone: '+91 98765 33333',
    activePlan: 'Pure Elite',
    planTier: 'elite_couple',
    planStartDate: '2026-01-20',
    assignedCoachName: 'Paula Konasionok',
    assignedCoachSlug: 'paula-konasionok',
    dayNumber: 93,
    lastCheckIn: '2026-04-22',
    status: 'active',
    totalBookings: 12,
    joinedAt: '2026-01-20',
  },
  {
    id: 'c4',
    fullName: 'Karthik Venkat',
    email: 'karthik.v@example.com',
    activePlan: 'Pure Core',
    planTier: 'online_live',
    planStartDate: '2026-03-10',
    assignedCoachName: 'Siva Reddy',
    assignedCoachSlug: 'siva-reddy',
    dayNumber: 44,
    lastCheckIn: '2026-04-19',
    status: 'active',
    totalBookings: 5,
    joinedAt: '2026-03-10',
  },
  {
    id: 'c5',
    fullName: 'Anita Desai',
    email: 'anita.d@example.com',
    planTier: 'fit_check',
    status: 'onboarding',
    totalBookings: 1,
    joinedAt: '2026-04-21',
  },
  {
    id: 'c6',
    fullName: 'Tarun Singh',
    email: 'tarun@example.com',
    activePlan: 'Pure Core',
    planTier: 'online_live',
    planStartDate: '2026-04-22',
    assignedCoachName: 'Siva Jampana',
    assignedCoachSlug: 'siva-jampana',
    dayNumber: 2,
    status: 'onboarding',
    totalBookings: 1,
    joinedAt: '2026-04-21',
  },
  {
    id: 'c7',
    fullName: 'Kavya Rao',
    email: 'kavya@example.com',
    activePlan: 'Pure Elite',
    planTier: 'personal_transformation',
    planStartDate: '2026-02-01',
    assignedCoachName: 'Amber Jasari',
    assignedCoachSlug: 'amber-jasari',
    dayNumber: 81,
    lastCheckIn: '2026-04-20',
    status: 'active',
    totalBookings: 6,
    joinedAt: '2026-02-01',
  },
];

export const MOCK_SPECIALISTS: AdminSpecialist[] = [
  {
    id: 's1',
    slug: 'siva-reddy',
    name: 'Siva Reddy',
    title: 'PT Head & Founder',
    shortRole: 'PT Head',
    location: 'Hyderabad',
    clientsTrained: 100,
    activeClients: 12,
    calendlyUrl: 'https://calendly.com/purex-siva-reddy/30min',
    isActive: true,
  },
  {
    id: 's2',
    slug: 'chandralekha',
    name: 'Dr. Chandralekha',
    title: 'Consultant Doctor',
    shortRole: 'Doctor',
    location: 'Hyderabad',
    clientsTrained: 500,
    activeClients: 18,
    calendlyUrl: 'https://calendly.com/purex-chandralekha/30min',
    isActive: true,
  },
  {
    id: 's3',
    slug: 'krishna',
    name: 'Krishna',
    title: 'Physiotherapist',
    shortRole: 'Physio',
    location: 'Hyderabad',
    clientsTrained: 1000,
    activeClients: 22,
    calendlyUrl: 'https://calendly.com/purex-krishna/30min',
    isActive: true,
  },
  {
    id: 's4',
    slug: 'paula-konasionok',
    name: 'Paula Konasionok',
    title: 'Athletic Performance Coach',
    shortRole: 'Athletic',
    location: 'London',
    clientsTrained: 200,
    activeClients: 9,
    calendlyUrl: 'https://calendly.com/purex-paula/30min',
    isActive: true,
  },
  {
    id: 's5',
    slug: 'amber-jasari',
    name: 'Amber Jasari',
    title: 'Mental Performance Specialist',
    shortRole: 'Mental',
    location: 'London',
    clientsTrained: 150,
    activeClients: 7,
    calendlyUrl: 'https://calendly.com/purex-amber/30min',
    isActive: true,
  },
  {
    id: 's6',
    slug: 'siva-jampana',
    name: 'Siva Jampana',
    title: 'Ops & Onboarding Head',
    shortRole: 'Ops',
    location: 'Hyderabad',
    clientsTrained: 300,
    activeClients: 14,
    calendlyUrl: 'https://calendly.com/purex-siva-jampana/30min',
    isActive: true,
  },
];

// Helper to format relative time
export function relativeTime(isoString: string): string {
  const then = new Date(isoString).getTime();
  const now = Date.now();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

// ═══════════════════════════════════════════════════════════════════════
// CLIENT DETAIL MOCKS — for /admin/clients/[id]
// ═══════════════════════════════════════════════════════════════════════

export interface AdminClientTask {
  id: string;
  title: string;
  category: 'workout' | 'nutrition' | 'recovery' | 'lifestyle';
  scheduledTime?: string;
  completed: boolean;
  completedAt?: string;
  taskDate: string;
}

export interface AdminClientDailyLog {
  id: string;
  logDate: string;
  weightKg?: number;
  caloriesConsumed?: number;
  caloriesTarget?: number;
  proteinG?: number;
  carbsG?: number;
  fatsG?: number;
  waterGlasses?: number;
  waterTarget: number;
  steps?: number;
  stepsTarget: number;
  sleepHours?: number;
  sleepQuality?: number;
  mood?: number;
  recoveryScore?: number;
  dailyNote?: string;
}

export interface AdminClientWorkout {
  id: string;
  name: string;
  category: string;
  workoutDate?: string;
  durationMinutes?: number;
  calories?: number;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  focus?: string;
  completed: boolean;
}

export interface AdminSuggestedApp {
  id: string;
  name: string;
  icon: string;
  category: 'Nutrition' | 'Training' | 'Recovery' | 'Mindfulness' | 'Tracking';
  description: string;
  deepLink?: string;
}

export interface AdminInternalAction {
  id: string;
  name: string;
  icon: string;
  category: 'Book' | 'Assign' | 'Schedule' | 'Resource';
  description: string;
  actionType: 'book_consultation' | 'assign_workout' | 'assign_plan' | 'schedule_checkin' | 'share_resource';
}

export const SUGGESTED_APPS: AdminSuggestedApp[] = [
  {
    id: 'a1',
    name: 'MyFitnessPal',
    icon: '🍽️',
    category: 'Nutrition',
    description: 'Calorie and macro tracking',
    deepLink: 'https://www.myfitnesspal.com',
  },
  {
    id: 'a2',
    name: 'Strava',
    icon: '🏃',
    category: 'Training',
    description: 'Cardio and running tracking',
    deepLink: 'https://www.strava.com',
  },
  {
    id: 'a3',
    name: 'WHOOP',
    icon: '⌚',
    category: 'Recovery',
    description: 'Recovery and strain monitoring',
    deepLink: 'https://www.whoop.com',
  },
  {
    id: 'a4',
    name: 'Hevy',
    icon: '💪',
    category: 'Training',
    description: 'Gym workout logging',
    deepLink: 'https://www.hevyapp.com',
  },
  {
    id: 'a5',
    name: 'Headspace',
    icon: '🧘',
    category: 'Mindfulness',
    description: 'Meditation and sleep',
    deepLink: 'https://www.headspace.com',
  },
  {
    id: 'a6',
    name: 'Apple Health',
    icon: '❤️',
    category: 'Tracking',
    description: 'All-round health metrics',
    deepLink: 'https://www.apple.com/ios/health',
  },
];

export const INTERNAL_ACTIONS: AdminInternalAction[] = [
  {
    id: 'i1',
    name: 'Book Physio Session',
    icon: '🩺',
    category: 'Book',
    description: 'Schedule with Krishna',
    actionType: 'book_consultation',
  },
  {
    id: 'i2',
    name: 'Book Medical Screening',
    icon: '⚕️',
    category: 'Book',
    description: 'With Dr. Chandralekha',
    actionType: 'book_consultation',
  },
  {
    id: 'i3',
    name: 'Book Mental Performance',
    icon: '🧠',
    category: 'Book',
    description: 'Session with Amber',
    actionType: 'book_consultation',
  },
  {
    id: 'i4',
    name: 'Assign HYROX Block',
    icon: '🏋️',
    category: 'Assign',
    description: '8-week HYROX preparation cycle',
    actionType: 'assign_plan',
  },
  {
    id: 'i5',
    name: 'Assign Mobility Flow',
    icon: '🧘‍♂️',
    category: 'Assign',
    description: '20min daily mobility routine',
    actionType: 'assign_workout',
  },
  {
    id: 'i6',
    name: 'Schedule Weekly Check-in',
    icon: '📅',
    category: 'Schedule',
    description: 'Recurring 15min call',
    actionType: 'schedule_checkin',
  },
  {
    id: 'i7',
    name: 'Share Nutrition Guide',
    icon: '📄',
    category: 'Resource',
    description: 'PURE X macro guidelines PDF',
    actionType: 'share_resource',
  },
  {
    id: 'i8',
    name: 'Share Recovery Protocol',
    icon: '🛌',
    category: 'Resource',
    description: 'Sleep + stretching protocol',
    actionType: 'share_resource',
  },
];

export function getMockClientTasks(clientId: string): AdminClientTask[] {
  // Returns today's tasks for the given client
  return [
    {
      id: `${clientId}-t1`,
      title: 'Morning cardio — 30min zone 2',
      category: 'workout',
      scheduledTime: '6:30 AM',
      completed: true,
      completedAt: '2026-04-23T06:42:00Z',
      taskDate: '2026-04-23',
    },
    {
      id: `${clientId}-t2`,
      title: 'Hit protein target — 180g',
      category: 'nutrition',
      completed: true,
      completedAt: '2026-04-23T19:30:00Z',
      taskDate: '2026-04-23',
    },
    {
      id: `${clientId}-t3`,
      title: 'Upper body strength session',
      category: 'workout',
      scheduledTime: '6:00 PM',
      completed: false,
      taskDate: '2026-04-23',
    },
    {
      id: `${clientId}-t4`,
      title: '10 min mobility flow',
      category: 'recovery',
      scheduledTime: 'Before bed',
      completed: false,
      taskDate: '2026-04-23',
    },
    {
      id: `${clientId}-t5`,
      title: '8 hours sleep',
      category: 'lifestyle',
      completed: false,
      taskDate: '2026-04-23',
    },
  ];
}

export function getMockClientRecentLogs(clientId: string): AdminClientDailyLog[] {
  // Returns last 7 days of logs
  return [
    {
      id: `${clientId}-l1`,
      logDate: '2026-04-23',
      weightKg: 78.4,
      caloriesConsumed: 1920,
      caloriesTarget: 2200,
      proteinG: 165,
      carbsG: 180,
      fatsG: 68,
      waterGlasses: 6,
      waterTarget: 8,
      steps: 8420,
      stepsTarget: 10000,
      sleepHours: 7.5,
      sleepQuality: 4,
      mood: 4,
      recoveryScore: 78,
    },
    {
      id: `${clientId}-l2`,
      logDate: '2026-04-22',
      weightKg: 78.6,
      caloriesConsumed: 2150,
      caloriesTarget: 2200,
      proteinG: 172,
      waterGlasses: 8,
      waterTarget: 8,
      steps: 11200,
      stepsTarget: 10000,
      sleepHours: 6.8,
      sleepQuality: 3,
      mood: 4,
      recoveryScore: 72,
    },
    {
      id: `${clientId}-l3`,
      logDate: '2026-04-21',
      weightKg: 78.9,
      caloriesConsumed: 2080,
      caloriesTarget: 2200,
      waterGlasses: 7,
      waterTarget: 8,
      steps: 9840,
      stepsTarget: 10000,
      sleepHours: 8.2,
      sleepQuality: 5,
      mood: 5,
      recoveryScore: 88,
    },
    {
      id: `${clientId}-l4`,
      logDate: '2026-04-20',
      weightKg: 79.1,
      waterGlasses: 5,
      waterTarget: 8,
      steps: 6200,
      stepsTarget: 10000,
      sleepHours: 7.2,
      recoveryScore: 68,
    },
    {
      id: `${clientId}-l5`,
      logDate: '2026-04-19',
      weightKg: 79.3,
      caloriesConsumed: 2240,
      caloriesTarget: 2200,
      waterGlasses: 8,
      waterTarget: 8,
      steps: 12400,
      stepsTarget: 10000,
      sleepHours: 7.8,
      recoveryScore: 82,
    },
  ];
}

export function getMockClientWorkouts(clientId: string): AdminClientWorkout[] {
  return [
    {
      id: `${clientId}-w1`,
      name: 'Upper Body Hypertrophy',
      category: 'Strength',
      workoutDate: '2026-04-23',
      durationMinutes: 60,
      difficulty: 'Intermediate',
      focus: 'Chest · Shoulders · Triceps',
      completed: false,
    },
    {
      id: `${clientId}-w2`,
      name: 'HYROX Simulation — Round 3',
      category: 'HYROX',
      workoutDate: '2026-04-22',
      durationMinutes: 45,
      calories: 520,
      difficulty: 'Advanced',
      focus: '4 stations · full intensity',
      completed: true,
    },
    {
      id: `${clientId}-w3`,
      name: 'Lower Body Power',
      category: 'Strength',
      workoutDate: '2026-04-21',
      durationMinutes: 55,
      calories: 380,
      difficulty: 'Intermediate',
      focus: 'Quads · Glutes · Hamstrings',
      completed: true,
    },
  ];
}

export function getClientBookings(clientEmail: string): AdminBooking[] {
  return MOCK_BOOKINGS.filter((b) => b.clientEmail === clientEmail);
}

// ═══════════════════════════════════════════════════════════════════════
// TRANSFORMATION / PROGRESS PHOTOS — for /admin/clients/[id] Photos tab
// ═══════════════════════════════════════════════════════════════════════

export interface AdminClientPhotoSet {
  id: string;
  checkInDate: string;   // ISO date
  weightKg?: number;
  bodyFatPercent?: number;
  frontPhotoUrl?: string;
  sidePhotoUrl?: string;
  backPhotoUrl?: string;
  coachNotes?: string;
  isBaseline?: boolean; // true for the first check-in (used as "before" reference)
}

export function getMockClientPhotos(clientId: string): AdminClientPhotoSet[] {
  // Reverse chronological — most recent first
  return [
    {
      id: `${clientId}-p3`,
      checkInDate: '2026-04-15',
      weightKg: 78.4,
      bodyFatPercent: 16.2,
      frontPhotoUrl: undefined, // null = show placeholder
      sidePhotoUrl: undefined,
      backPhotoUrl: undefined,
      coachNotes:
        'Clear definition improvement in deltoids and upper back. Glute engagement in side profile now visible. Recommend maintaining current macro split for another 2 weeks before cut adjustment.',
    },
    {
      id: `${clientId}-p2`,
      checkInDate: '2026-03-15',
      weightKg: 81.2,
      bodyFatPercent: 19.0,
      frontPhotoUrl: undefined,
      sidePhotoUrl: undefined,
      backPhotoUrl: undefined,
      coachNotes:
        'Weight holding steady at target reduction pace (~1kg/week). Visible reduction in midsection. Shoulders starting to show deltoid cap definition.',
    },
    {
      id: `${clientId}-p1`,
      checkInDate: '2026-02-15',
      weightKg: 85.6,
      bodyFatPercent: 22.5,
      frontPhotoUrl: undefined,
      sidePhotoUrl: undefined,
      backPhotoUrl: undefined,
      coachNotes:
        'Baseline check-in at programme start. Good base muscle mass, visible abdominal softening. Plan: aggressive first 4 weeks, maintenance calories from week 5 onwards.',
      isBaseline: true,
    },
  ];
}
