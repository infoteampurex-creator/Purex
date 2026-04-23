/**
 * Mock client dashboard data.
 *
 * Phase 2 MVP: all values entered manually by client or admin.
 * When Supabase is wired, replace imports in components with queries to
 * `client_daily_logs`, `client_tasks`, `client_workouts`, etc.
 *
 * Types are designed to match the eventual DB schema so migration is a
 * find-and-replace exercise, not a refactor.
 */

export interface DailyPlan {
  date: string;
  title: string;
  subtitle: string;
  tasksCompleted: number;
  tasksTotal: number;
  motivationalCopy: string;
}

export interface StatTile {
  id: 'calories' | 'steps' | 'sleep' | 'water' | 'workout' | 'mood';
  label: string;
  value: string;
  target?: string;
  unit?: string;
  progress: number; // 0-100
  accent: 'lime' | 'emerald' | 'amber' | 'magenta' | 'sky';
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
}

export interface Task {
  id: string;
  title: string;
  category: 'workout' | 'nutrition' | 'recovery' | 'lifestyle';
  time?: string;
  completed: boolean;
}

export interface WorkoutCard {
  id: string;
  name: string;
  category: string;
  duration: number; // minutes
  calories: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  focus: string;
  sets: number;
  reps: string;
  tags: string[];
  completed: boolean;
}

export interface MacroData {
  caloriesConsumed: number;
  caloriesTarget: number;
  protein: { current: number; target: number };
  carbs: { current: number; target: number };
  fats: { current: number; target: number };
  waterGlasses: number;
  waterTarget: number;
}

export interface ProgressSnapshot {
  currentWeight: number;
  startWeight: number;
  targetWeight: number;
  unit: 'kg' | 'lb';
  weeklyData: { day: string; value: number }[];
  lastCheckIn: string;
  nextCheckIn: string;
}

export interface UpcomingBooking {
  id: string;
  specialistName: string;
  specialistRole: string;
  specialistSlug: string;
  date: string;
  time: string;
  format: 'online' | 'in_person';
  status: 'confirmed' | 'pending' | 'rescheduled';
  daysAway: number;
}

// ───────────────────────── MOCK DATA ─────────────────────────

export const MOCK_CLIENT = {
  firstName: 'Arjun',
  fullName: 'Arjun M.',
  email: 'arjun@example.com',
  activePlan: 'Pure Elite',
  planStartDate: '2026-02-15',
  dayNumber: 67,
  assignedCoach: 'Siva Reddy',
  profileCompletion: 85,
};

export const MOCK_DAILY_PLAN: DailyPlan = {
  date: new Date().toISOString().split('T')[0],
  title: 'Lower Body Power',
  subtitle: 'Phase 2 · Strength Block · Week 10',
  tasksCompleted: 4,
  tasksTotal: 7,
  motivationalCopy: "Consistency compounds. Today's the day you don't skip.",
};

export const MOCK_STAT_TILES: StatTile[] = [
  {
    id: 'calories',
    label: 'Calories',
    value: '1,847',
    target: '2,400',
    unit: 'kcal',
    progress: 77,
    accent: 'lime',
    trend: 'flat',
    trendValue: 'on track',
  },
  {
    id: 'steps',
    label: 'Steps',
    value: '8,421',
    target: '10,000',
    progress: 84,
    accent: 'emerald',
    trend: 'up',
    trendValue: '+12%',
  },
  {
    id: 'sleep',
    label: 'Sleep',
    value: '7.2',
    target: '8',
    unit: 'hrs',
    progress: 90,
    accent: 'sky',
    trend: 'up',
    trendValue: '+0.4h',
  },
  {
    id: 'water',
    label: 'Water',
    value: '6',
    target: '8',
    unit: 'glasses',
    progress: 75,
    accent: 'amber',
    trend: 'flat',
  },
];

export const MOCK_TASKS: Task[] = [
  { id: 't1', title: 'Morning mobility (10 min)', category: 'recovery', time: '7:00 AM', completed: true },
  { id: 't2', title: 'Pre-workout meal logged', category: 'nutrition', time: '9:30 AM', completed: true },
  { id: 't3', title: 'Lower body power session', category: 'workout', time: '5:00 PM', completed: false },
  { id: 't4', title: 'Hit protein target (180g)', category: 'nutrition', completed: true },
  { id: 't5', title: 'Complete 10,000 steps', category: 'lifestyle', completed: false },
  { id: 't6', title: 'Evening stretch + foam roll', category: 'recovery', time: '9:00 PM', completed: false },
  { id: 't7', title: 'Lights out by 10:30 PM', category: 'lifestyle', time: '10:30 PM', completed: true },
];

export const MOCK_WORKOUT: WorkoutCard = {
  id: 'w1',
  name: 'Lower Body Power',
  category: 'Strength',
  duration: 60,
  calories: 420,
  difficulty: 'Advanced',
  focus: 'Quads · Glutes · Hamstrings',
  sets: 18,
  reps: '4-6',
  tags: ['Barbell', 'Compound', 'Heavy'],
  completed: false,
};

export const MOCK_WORKOUT_LIBRARY: WorkoutCard[] = [
  {
    id: 'w1',
    name: 'Lower Body Power',
    category: 'Strength',
    duration: 60,
    calories: 420,
    difficulty: 'Advanced',
    focus: 'Quads · Glutes · Hamstrings',
    sets: 18,
    reps: '4-6',
    tags: ['Barbell', 'Compound'],
    completed: false,
  },
  {
    id: 'w2',
    name: 'HYROX Simulation',
    category: 'HYROX',
    duration: 45,
    calories: 580,
    difficulty: 'Advanced',
    focus: 'Full Body · Endurance',
    sets: 8,
    reps: 'Stations',
    tags: ['HYROX', 'Conditioning'],
    completed: false,
  },
  {
    id: 'w3',
    name: 'Upper Push',
    category: 'Strength',
    duration: 50,
    calories: 340,
    difficulty: 'Intermediate',
    focus: 'Chest · Shoulders · Triceps',
    sets: 16,
    reps: '6-10',
    tags: ['Barbell', 'Dumbbell'],
    completed: true,
  },
  {
    id: 'w4',
    name: 'Zone 2 Cardio',
    category: 'Conditioning',
    duration: 40,
    calories: 380,
    difficulty: 'Beginner',
    focus: 'Aerobic Base',
    sets: 1,
    reps: '40 min',
    tags: ['Run', 'Recovery'],
    completed: true,
  },
];

export const MOCK_MACROS: MacroData = {
  caloriesConsumed: 1847,
  caloriesTarget: 2400,
  protein: { current: 142, target: 180 },
  carbs: { current: 210, target: 250 },
  fats: { current: 68, target: 80 },
  waterGlasses: 6,
  waterTarget: 8,
};

export const MOCK_PROGRESS: ProgressSnapshot = {
  currentWeight: 78.4,
  startWeight: 92.1,
  targetWeight: 75.0,
  unit: 'kg',
  weeklyData: [
    { day: 'Mon', value: 78.9 },
    { day: 'Tue', value: 78.7 },
    { day: 'Wed', value: 78.8 },
    { day: 'Thu', value: 78.5 },
    { day: 'Fri', value: 78.4 },
    { day: 'Sat', value: 78.3 },
    { day: 'Sun', value: 78.4 },
  ],
  lastCheckIn: '2026-04-18',
  nextCheckIn: '2026-04-25',
};

export const MOCK_UPCOMING_BOOKING: UpcomingBooking = {
  id: 'b1',
  specialistName: 'Krishna',
  specialistRole: 'Physiotherapist',
  specialistSlug: 'krishna',
  date: '2026-04-24',
  time: '6:30 PM',
  format: 'in_person',
  status: 'confirmed',
  daysAway: 2,
};
