-- ════════════════════════════════════════════════════════════════════
-- PURE X — Phase 3A: Hybrid Athlete Management System
-- ════════════════════════════════════════════════════════════════════
--
-- Adds the data foundation for trainer-driven daily entry.
-- Trainers manually enter client data; clients see it in real-time.
--
-- This migration is ADDITIVE — it doesn't modify existing tables.
-- All new tables build on top of `profiles` and the Phase 2 schema.
--
-- Run order: after 00003_storage_buckets.sql
-- ════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════
-- 1. PROFILES — extend with trainer flag
-- ════════════════════════════════════════════════════════════════════

-- Add is_trainer column if it doesn't exist
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'is_trainer'
  ) then
    alter table public.profiles add column is_trainer boolean default false;
  end if;
end $$;

-- Add first_name column if missing (used by WelcomeHeader)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'first_name'
  ) then
    alter table public.profiles add column first_name text;
  end if;
end $$;


-- ════════════════════════════════════════════════════════════════════
-- 2. TRAINER ↔ CLIENT ASSIGNMENTS
-- ════════════════════════════════════════════════════════════════════
-- A trainer is assigned to one or more clients. RLS uses this table to
-- decide which clients a trainer can read/write.

create table if not exists public.trainer_client_assignments (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  assigned_at timestamptz default now(),
  unassigned_at timestamptz,
  is_primary boolean default false,
  notes text,

  unique(trainer_id, client_id)
);

create index if not exists idx_tca_trainer on public.trainer_client_assignments(trainer_id);
create index if not exists idx_tca_client on public.trainer_client_assignments(client_id);
create index if not exists idx_tca_active on public.trainer_client_assignments(unassigned_at)
  where unassigned_at is null;


-- ════════════════════════════════════════════════════════════════════
-- 3. WORKOUT LOGS (executed sessions with exercise-by-exercise detail)
-- ════════════════════════════════════════════════════════════════════
-- One row per workout session. Linked to client_workouts (the plan)
-- when one was assigned, but also stands alone if trainer logs ad-hoc.

create table if not exists public.client_workout_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  trainer_id uuid references public.profiles(id) on delete set null,
  log_date date not null default current_date,

  -- Optional link to assigned workout
  workout_id uuid references public.client_workouts(id) on delete set null,

  -- Workout meta
  workout_type text, -- 'Strength', 'HYROX', 'Conditioning', 'Mobility', 'Sport'
  muscle_group text, -- 'Push', 'Pull', 'Legs', 'Full Body'
  duration_minutes int,
  calories_burned int,
  perceived_exertion_1_10 int check (perceived_exertion_1_10 between 1 and 10),
  rest_seconds_avg int,

  -- Trainer assessment
  completion_status text check (completion_status in ('completed', 'partial', 'skipped')) default 'completed',
  trainer_comment text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_workout_logs_client_date on public.client_workout_logs(client_id, log_date desc);
create index if not exists idx_workout_logs_trainer on public.client_workout_logs(trainer_id);


-- ════════════════════════════════════════════════════════════════════
-- 4. EXERCISE LOGS (one row per exercise inside a workout)
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.client_exercise_logs (
  id uuid primary key default gen_random_uuid(),
  workout_log_id uuid not null references public.client_workout_logs(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,

  -- The exercise itself
  exercise_name text not null, -- 'Back Squat', 'Bench Press', 'Burpees'
  sequence_number int default 1, -- order within the workout

  -- Performance numbers
  sets int,
  reps text, -- text because it can be '5x5' or 'AMRAP' or '8-10'
  weight_kg numeric(6,2),
  weight_unit text default 'kg' check (weight_unit in ('kg', 'lb', 'bw')),

  -- Per-set detail (optional, JSON for flexibility)
  set_breakdown jsonb, -- e.g. [{set:1, reps:8, weight:80}, {set:2, reps:6, weight:85}]

  rest_seconds int,
  tempo text, -- '3-1-1-0' style tempo notation
  rpe int check (rpe between 1 and 10), -- Rate of perceived exertion
  notes text,

  created_at timestamptz default now()
);

create index if not exists idx_exercise_logs_workout on public.client_exercise_logs(workout_log_id);
create index if not exists idx_exercise_logs_client on public.client_exercise_logs(client_id);
create index if not exists idx_exercise_logs_name on public.client_exercise_logs(exercise_name);


-- ════════════════════════════════════════════════════════════════════
-- 5. CARDIO LOGS (running, cycling, swimming, hybrid)
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.client_cardio_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  trainer_id uuid references public.profiles(id) on delete set null,
  log_date date not null default current_date,

  -- Activity type
  activity text not null check (activity in (
    'running', 'cycling', 'swimming', 'rowing', 'walking',
    'hyrox_circuit', 'erg', 'incline_walk', 'other'
  )),

  -- Distance + time
  distance_km numeric(7,3),
  duration_minutes int,
  pace_per_km text, -- '5:30' format
  speed_kmh numeric(5,2),

  -- Cycling/rowing specific
  resistance_level int,
  power_avg_watts int,

  -- Swimming specific
  laps int,
  pool_length_m int,
  stroke text,

  -- Performance + intensity
  vo2_max numeric(4,1),
  heart_rate_avg int,
  heart_rate_max int,
  zone_distribution jsonb, -- e.g. {z1: 12, z2: 20, z3: 8} minutes per zone
  endurance_score int check (endurance_score between 0 and 100),

  -- Energy
  calories_burned int,

  -- Trainer notes
  trainer_comment text,

  created_at timestamptz default now()
);

create index if not exists idx_cardio_logs_client_date on public.client_cardio_logs(client_id, log_date desc);
create index if not exists idx_cardio_logs_activity on public.client_cardio_logs(activity);


-- ════════════════════════════════════════════════════════════════════
-- 6. NUTRITION LOGS (daily macro + compliance)
-- ════════════════════════════════════════════════════════════════════
-- Note: client_daily_logs already has calories/macros/water as a quick
-- summary. This table allows for richer nutrition tracking when needed
-- (per-meal logging in the future). For now it stays denormalized.

create table if not exists public.client_nutrition_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  trainer_id uuid references public.profiles(id) on delete set null,
  log_date date not null default current_date,

  -- Macro totals
  calories int,
  calories_target int,
  protein_g int,
  protein_target_g int,
  carbs_g int,
  carbs_target_g int,
  fats_g int,
  fats_target_g int,
  fibre_g int,

  -- Hydration
  water_litres numeric(3,1),
  water_target_litres numeric(3,1) default 3.0,

  -- Compliance (% of plan adhered to)
  meal_compliance_pct int check (meal_compliance_pct between 0 and 100),
  meals_logged int,
  meals_planned int,

  -- Quality flags
  ate_processed_food boolean,
  alcohol_units int default 0,

  -- Trainer/coach notes
  trainer_comment text,
  client_note text,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(client_id, log_date)
);

create index if not exists idx_nutrition_logs_client_date on public.client_nutrition_logs(client_id, log_date desc);


-- ════════════════════════════════════════════════════════════════════
-- 7. RECOVERY LOGS (sleep, soreness, stress, readiness)
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.client_recovery_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  trainer_id uuid references public.profiles(id) on delete set null,
  log_date date not null default current_date,

  -- Sleep
  sleep_hours numeric(3,1),
  sleep_quality_1_5 int check (sleep_quality_1_5 between 1 and 5),
  bedtime time,
  wake_time time,
  woke_up_count int default 0,

  -- Subjective metrics
  recovery_score_0_100 int check (recovery_score_0_100 between 0 and 100),
  mobility_status text check (mobility_status in ('excellent', 'good', 'okay', 'limited', 'restricted')),
  soreness_level_1_5 int check (soreness_level_1_5 between 1 and 5),
  stress_level_1_5 int check (stress_level_1_5 between 1 and 5),
  energy_level_1_5 int check (energy_level_1_5 between 1 and 5),

  -- Body affected (for soreness mapping)
  sore_areas text[], -- ['lower_back', 'quads', 'shoulders']

  -- Recovery activities done
  did_mobility boolean,
  did_stretching boolean,
  did_meditation boolean,
  did_sauna boolean,
  did_ice_bath boolean,

  trainer_comment text,
  client_note text,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(client_id, log_date)
);

create index if not exists idx_recovery_logs_client_date on public.client_recovery_logs(client_id, log_date desc);


-- ════════════════════════════════════════════════════════════════════
-- 8. BODY MEASUREMENTS (weekly/monthly checkpoints)
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.client_body_measurements (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  trainer_id uuid references public.profiles(id) on delete set null,
  measured_at date not null default current_date,

  -- Core
  weight_kg numeric(5,2),
  body_fat_pct numeric(4,1),
  muscle_mass_kg numeric(5,2),
  bmi numeric(4,1),

  -- Circumferences (cm)
  chest_cm numeric(4,1),
  waist_cm numeric(4,1),
  hips_cm numeric(4,1),
  left_arm_cm numeric(4,1),
  right_arm_cm numeric(4,1),
  left_thigh_cm numeric(4,1),
  right_thigh_cm numeric(4,1),
  calf_cm numeric(4,1),
  neck_cm numeric(4,1),

  -- Performance markers
  resting_heart_rate int,
  blood_pressure_systolic int,
  blood_pressure_diastolic int,

  -- Photo references (linked to client_photos table from earlier)
  front_photo_url text,
  side_photo_url text,
  back_photo_url text,

  trainer_comment text,

  created_at timestamptz default now()
);

create index if not exists idx_measurements_client_date on public.client_body_measurements(client_id, measured_at desc);


-- ════════════════════════════════════════════════════════════════════
-- 9. TRAINER NOTES (daily coaching observations + instructions)
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.client_trainer_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  note_date date not null default current_date,

  -- Note categories
  motivation_note text,
  weak_areas text,
  improvement_suggestions text,
  injury_notes text,
  next_day_instructions text,

  -- Visibility
  visible_to_client boolean default true,

  -- Priority
  priority text check (priority in ('low', 'normal', 'high', 'urgent')) default 'normal',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_trainer_notes_client on public.client_trainer_notes(client_id, note_date desc);
create index if not exists idx_trainer_notes_priority on public.client_trainer_notes(priority)
  where priority in ('high', 'urgent');


-- ════════════════════════════════════════════════════════════════════
-- 10. HYBRID ATHLETE SCORES (daily computed snapshot)
-- ════════════════════════════════════════════════════════════════════
-- Computed from the day's logs and stored for trending.

create table if not exists public.client_hybrid_scores (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  score_date date not null default current_date,

  -- Component scores (0-100)
  strength_score int check (strength_score between 0 and 100),
  endurance_score int check (endurance_score between 0 and 100),
  recovery_score int check (recovery_score between 0 and 100),
  consistency_score int check (consistency_score between 0 and 100),
  mobility_score int check (mobility_score between 0 and 100),
  nutrition_score int check (nutrition_score between 0 and 100),

  -- Composite
  hybrid_athlete_score int check (hybrid_athlete_score between 0 and 100),

  -- Athlete level (computed bucket)
  athlete_level text check (athlete_level in (
    'rookie', 'performer', 'advanced', 'elite', 'hybrid_beast'
  )),

  -- Streak info
  current_streak_days int default 0,
  longest_streak_days int default 0,

  created_at timestamptz default now(),

  unique(client_id, score_date)
);

create index if not exists idx_hybrid_scores_client_date on public.client_hybrid_scores(client_id, score_date desc);
create index if not exists idx_hybrid_scores_level on public.client_hybrid_scores(athlete_level);


-- ════════════════════════════════════════════════════════════════════
-- 11. ACHIEVEMENTS (badges earned)
-- ════════════════════════════════════════════════════════════════════
-- Schema only — UI deferred to Phase 3E. Trainers can manually award
-- but most achievements will be auto-unlocked by background jobs later.

create table if not exists public.client_achievements (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,

  -- Achievement details
  achievement_key text not null, -- '7_day_streak', '10k_steps', 'hybrid_warrior', etc.
  achievement_name text not null, -- '7 Day Streak'
  achievement_description text,
  achievement_icon text, -- icon identifier (lucide name or custom)
  achievement_tier text check (achievement_tier in ('bronze', 'silver', 'gold', 'platinum')) default 'bronze',

  earned_at timestamptz default now(),
  awarded_by uuid references public.profiles(id) on delete set null, -- if manually awarded

  unique(client_id, achievement_key)
);

create index if not exists idx_achievements_client on public.client_achievements(client_id, earned_at desc);


-- ════════════════════════════════════════════════════════════════════
-- 12. CHALLENGES (multi-day goals)
-- ════════════════════════════════════════════════════════════════════
-- Schema only — UI deferred to Phase 3E.

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),

  -- Challenge details
  slug text not null unique,
  name text not null,
  description text,
  duration_days int not null,
  challenge_type text, -- 'fat_loss', 'hybrid', 'streak', 'volume', 'race_prep'
  target_metric text, -- what we're measuring
  target_value numeric,

  -- Visual
  icon text,
  hero_image_url text,
  accent_color text default '#c6ff3d',

  -- Lifecycle
  is_active boolean default true,
  starts_at timestamptz,
  ends_at timestamptz,

  created_at timestamptz default now()
);

create table if not exists public.client_challenge_enrollments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,

  enrolled_at timestamptz default now(),
  current_day int default 0,
  current_value numeric default 0,
  status text check (status in ('active', 'completed', 'abandoned', 'paused')) default 'active',
  completed_at timestamptz,

  unique(client_id, challenge_id)
);

create index if not exists idx_enrollments_client on public.client_challenge_enrollments(client_id);
create index if not exists idx_enrollments_status on public.client_challenge_enrollments(status);


-- ════════════════════════════════════════════════════════════════════
-- 13. ROW LEVEL SECURITY (RLS)
-- ════════════════════════════════════════════════════════════════════
-- The security model:
--   - Clients can READ their own data only (no writes — trainers enter)
--   - Trainers can READ + WRITE assigned clients' data
--   - Admins have full access
--
-- The is_trainer flag is a column on profiles. The is_admin status is
-- determined by the existing public.is_admin(uid) function (created in
-- 00001_auth_foundation.sql) which checks profiles.role.

-- Enable RLS on every new table
alter table public.trainer_client_assignments enable row level security;
alter table public.client_workout_logs        enable row level security;
alter table public.client_exercise_logs       enable row level security;
alter table public.client_cardio_logs         enable row level security;
alter table public.client_nutrition_logs      enable row level security;
alter table public.client_recovery_logs       enable row level security;
alter table public.client_body_measurements   enable row level security;
alter table public.client_trainer_notes       enable row level security;
alter table public.client_hybrid_scores       enable row level security;
alter table public.client_achievements        enable row level security;
alter table public.challenges                 enable row level security;
alter table public.client_challenge_enrollments enable row level security;

-- ─── Helper function: is the current user a trainer of the given client? ───
create or replace function public.is_trainer_of(target_client_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.trainer_client_assignments
    where trainer_id = auth.uid()
      and client_id = target_client_id
      and unassigned_at is null
  );
$$;

-- ─── Helper: is current user admin or trainer (any client)? ───
create or replace function public.is_admin_or_trainer()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    public.is_admin(auth.uid())
    or (select is_trainer from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ─── Helper: is current user admin? (proxies the existing is_admin function) ───
create or replace function public.is_admin_user()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(public.is_admin(auth.uid()), false);
$$;

-- ════════════════════════════════════════════════════════════════════
-- POLICY TEMPLATES
-- ════════════════════════════════════════════════════════════════════
-- For each "client_*" table, we apply the same 4-policy pattern:
--   1. Client can SELECT their own rows
--   2. Trainer can SELECT assigned client's rows
--   3. Trainer can INSERT/UPDATE/DELETE assigned client's rows
--   4. Admin has full access (separate policy via is_admin_user)
-- ════════════════════════════════════════════════════════════════════

-- ─── trainer_client_assignments ───
drop policy if exists "Trainers see own assignments" on public.trainer_client_assignments;
create policy "Trainers see own assignments" on public.trainer_client_assignments
  for select using (trainer_id = auth.uid() or client_id = auth.uid() or public.is_admin_user());

drop policy if exists "Admins manage assignments" on public.trainer_client_assignments;
create policy "Admins manage assignments" on public.trainer_client_assignments
  for all using (public.is_admin_user())
  with check (public.is_admin_user());

-- ─── client_workout_logs ───
drop policy if exists "Read own or assigned workouts" on public.client_workout_logs;
create policy "Read own or assigned workouts" on public.client_workout_logs
  for select using (
    client_id = auth.uid()
    or public.is_trainer_of(client_id)
    or public.is_admin_user()
  );

drop policy if exists "Trainers write workouts" on public.client_workout_logs;
create policy "Trainers write workouts" on public.client_workout_logs
  for insert with check (public.is_trainer_of(client_id) or public.is_admin_user());

drop policy if exists "Trainers update workouts" on public.client_workout_logs;
create policy "Trainers update workouts" on public.client_workout_logs
  for update using (public.is_trainer_of(client_id) or public.is_admin_user())
  with check (public.is_trainer_of(client_id) or public.is_admin_user());

drop policy if exists "Trainers delete workouts" on public.client_workout_logs;
create policy "Trainers delete workouts" on public.client_workout_logs
  for delete using (public.is_trainer_of(client_id) or public.is_admin_user());

-- ─── client_exercise_logs ───
drop policy if exists "Read own or assigned exercises" on public.client_exercise_logs;
create policy "Read own or assigned exercises" on public.client_exercise_logs
  for select using (
    client_id = auth.uid()
    or public.is_trainer_of(client_id)
    or public.is_admin_user()
  );

drop policy if exists "Trainers manage exercises" on public.client_exercise_logs;
create policy "Trainers manage exercises" on public.client_exercise_logs
  for all using (public.is_trainer_of(client_id) or public.is_admin_user())
  with check (public.is_trainer_of(client_id) or public.is_admin_user());

-- ─── client_cardio_logs ───
drop policy if exists "Read own or assigned cardio" on public.client_cardio_logs;
create policy "Read own or assigned cardio" on public.client_cardio_logs
  for select using (
    client_id = auth.uid()
    or public.is_trainer_of(client_id)
    or public.is_admin_user()
  );

drop policy if exists "Trainers manage cardio" on public.client_cardio_logs;
create policy "Trainers manage cardio" on public.client_cardio_logs
  for all using (public.is_trainer_of(client_id) or public.is_admin_user())
  with check (public.is_trainer_of(client_id) or public.is_admin_user());

-- ─── client_nutrition_logs ───
drop policy if exists "Read own or assigned nutrition" on public.client_nutrition_logs;
create policy "Read own or assigned nutrition" on public.client_nutrition_logs
  for select using (
    client_id = auth.uid()
    or public.is_trainer_of(client_id)
    or public.is_admin_user()
  );

drop policy if exists "Trainers manage nutrition" on public.client_nutrition_logs;
create policy "Trainers manage nutrition" on public.client_nutrition_logs
  for all using (public.is_trainer_of(client_id) or public.is_admin_user())
  with check (public.is_trainer_of(client_id) or public.is_admin_user());

-- ─── client_recovery_logs ───
drop policy if exists "Read own or assigned recovery" on public.client_recovery_logs;
create policy "Read own or assigned recovery" on public.client_recovery_logs
  for select using (
    client_id = auth.uid()
    or public.is_trainer_of(client_id)
    or public.is_admin_user()
  );

drop policy if exists "Trainers manage recovery" on public.client_recovery_logs;
create policy "Trainers manage recovery" on public.client_recovery_logs
  for all using (public.is_trainer_of(client_id) or public.is_admin_user())
  with check (public.is_trainer_of(client_id) or public.is_admin_user());

-- ─── client_body_measurements ───
drop policy if exists "Read own or assigned measurements" on public.client_body_measurements;
create policy "Read own or assigned measurements" on public.client_body_measurements
  for select using (
    client_id = auth.uid()
    or public.is_trainer_of(client_id)
    or public.is_admin_user()
  );

drop policy if exists "Trainers manage measurements" on public.client_body_measurements;
create policy "Trainers manage measurements" on public.client_body_measurements
  for all using (public.is_trainer_of(client_id) or public.is_admin_user())
  with check (public.is_trainer_of(client_id) or public.is_admin_user());

-- ─── client_trainer_notes ───
-- Special: clients only see notes where visible_to_client = true
drop policy if exists "Clients see own visible notes" on public.client_trainer_notes;
create policy "Clients see own visible notes" on public.client_trainer_notes
  for select using (
    (client_id = auth.uid() and visible_to_client = true)
    or public.is_trainer_of(client_id)
    or public.is_admin_user()
  );

drop policy if exists "Trainers manage notes" on public.client_trainer_notes;
create policy "Trainers manage notes" on public.client_trainer_notes
  for all using (public.is_trainer_of(client_id) or public.is_admin_user())
  with check (public.is_trainer_of(client_id) or public.is_admin_user());

-- ─── client_hybrid_scores ───
drop policy if exists "Read own or assigned scores" on public.client_hybrid_scores;
create policy "Read own or assigned scores" on public.client_hybrid_scores
  for select using (
    client_id = auth.uid()
    or public.is_trainer_of(client_id)
    or public.is_admin_user()
  );

drop policy if exists "System writes scores" on public.client_hybrid_scores;
create policy "System writes scores" on public.client_hybrid_scores
  for all using (public.is_trainer_of(client_id) or public.is_admin_user())
  with check (public.is_trainer_of(client_id) or public.is_admin_user());

-- ─── client_achievements ───
drop policy if exists "Read own or assigned achievements" on public.client_achievements;
create policy "Read own or assigned achievements" on public.client_achievements
  for select using (
    client_id = auth.uid()
    or public.is_trainer_of(client_id)
    or public.is_admin_user()
  );

drop policy if exists "Trainers manage achievements" on public.client_achievements;
create policy "Trainers manage achievements" on public.client_achievements
  for all using (public.is_trainer_of(client_id) or public.is_admin_user())
  with check (public.is_trainer_of(client_id) or public.is_admin_user());

-- ─── challenges (catalog — readable by everyone authenticated) ───
drop policy if exists "Authenticated read challenges" on public.challenges;
create policy "Authenticated read challenges" on public.challenges
  for select using (auth.uid() is not null);

drop policy if exists "Admins manage challenges" on public.challenges;
create policy "Admins manage challenges" on public.challenges
  for all using (public.is_admin_user())
  with check (public.is_admin_user());

-- ─── client_challenge_enrollments ───
drop policy if exists "Read own or assigned enrollments" on public.client_challenge_enrollments;
create policy "Read own or assigned enrollments" on public.client_challenge_enrollments
  for select using (
    client_id = auth.uid()
    or public.is_trainer_of(client_id)
    or public.is_admin_user()
  );

drop policy if exists "Trainers manage enrollments" on public.client_challenge_enrollments;
create policy "Trainers manage enrollments" on public.client_challenge_enrollments
  for all using (public.is_trainer_of(client_id) or public.is_admin_user())
  with check (public.is_trainer_of(client_id) or public.is_admin_user());


-- ════════════════════════════════════════════════════════════════════
-- 14. UPDATED_AT TRIGGERS
-- ════════════════════════════════════════════════════════════════════
-- Auto-update the updated_at column on row updates.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_workout_logs_updated on public.client_workout_logs;
create trigger trg_workout_logs_updated before update on public.client_workout_logs
  for each row execute function public.set_updated_at();

drop trigger if exists trg_nutrition_logs_updated on public.client_nutrition_logs;
create trigger trg_nutrition_logs_updated before update on public.client_nutrition_logs
  for each row execute function public.set_updated_at();

drop trigger if exists trg_recovery_logs_updated on public.client_recovery_logs;
create trigger trg_recovery_logs_updated before update on public.client_recovery_logs
  for each row execute function public.set_updated_at();

drop trigger if exists trg_trainer_notes_updated on public.client_trainer_notes;
create trigger trg_trainer_notes_updated before update on public.client_trainer_notes
  for each row execute function public.set_updated_at();


-- ════════════════════════════════════════════════════════════════════
-- 15. SEED — sample challenges (optional, can be deleted)
-- ════════════════════════════════════════════════════════════════════

insert into public.challenges (slug, name, description, duration_days, challenge_type, target_metric, target_value, icon, accent_color, is_active)
values
  ('30_day_fat_loss', '30 Day Fat Loss', 'Lose 2kg in 30 days through structured training and nutrition.', 30, 'fat_loss', 'weight_loss_kg', 2.0, 'Flame', '#ffb84d', true),
  ('10k_daily_steps', '10K Daily Steps', 'Hit 10,000 steps every day for 30 days.', 30, 'streak', 'steps_per_day', 10000, 'Footprints', '#7dd3ff', true),
  ('hybrid_beast_30', 'Hybrid Beast 30', 'Complete 30 hybrid workouts in 30 days.', 30, 'hybrid', 'hybrid_workouts', 30, 'Zap', '#c6ff3d', true),
  ('iron_conditioning', 'Iron Conditioning', '100km run + 200km bike + 5km swim in 8 weeks.', 56, 'race_prep', 'composite_distance', 305, 'Activity', '#ff6b9d', true)
on conflict (slug) do nothing;


-- ════════════════════════════════════════════════════════════════════
-- DONE
-- ════════════════════════════════════════════════════════════════════
-- Summary of new tables:
--   trainer_client_assignments
--   client_workout_logs
--   client_exercise_logs
--   client_cardio_logs
--   client_nutrition_logs
--   client_recovery_logs
--   client_body_measurements
--   client_trainer_notes
--   client_hybrid_scores
--   client_achievements
--   challenges
--   client_challenge_enrollments
--
-- Plus profiles.is_trainer column added.
-- Plus 4 sample challenges seeded.
-- Plus full RLS — clients read their own only, trainers read+write
-- their assigned clients only.
-- ════════════════════════════════════════════════════════════════════
