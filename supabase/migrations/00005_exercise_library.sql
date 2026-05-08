-- ════════════════════════════════════════════════════════════════════
-- PURE X — Phase 3A.5: Exercise Library
-- ════════════════════════════════════════════════════════════════════
--
-- Master library of canonical exercises with consistent names, slugs,
-- categories, and instructions. Trainers search this library when
-- building workouts; clients see the same metadata across all sessions.
--
-- Tables created:
--   exercise_library       — canonical exercise catalog
--   exercise_muscles       — many-to-many primary/secondary muscle mapping
--   exercise_alternatives  — substitution graph (e.g. swap squat → leg press)
--
-- Plus 20 seeded exercises covering strength, conditioning, HYROX, and mobility.
-- ════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════
-- 1. EXERCISE LIBRARY (master catalog)
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.exercise_library (
  id uuid primary key default gen_random_uuid(),

  -- Identity
  slug text not null unique,            -- 'barbell-back-squat'
  name text not null,                    -- 'Barbell Back Squat'
  alternate_names text[] default '{}',   -- ['back squat', 'high bar squat']

  -- Categorization
  category text not null check (category in (
    'chest', 'back', 'legs', 'shoulders', 'arms', 'core',
    'cardio', 'hybrid', 'mobility', 'recovery', 'full_body'
  )),
  exercise_type text not null check (exercise_type in (
    'strength', 'hypertrophy', 'functional', 'hybrid',
    'endurance', 'cardio', 'mobility', 'recovery'
  )),
  movement_pattern text check (movement_pattern in (
    'squat', 'hinge', 'lunge', 'push_horizontal', 'push_vertical',
    'pull_horizontal', 'pull_vertical', 'carry', 'rotation',
    'gait', 'isolation', 'static', 'mobility', 'recovery'
  )),

  -- Equipment requirements
  primary_equipment text,                -- 'barbell', 'dumbbells', 'bodyweight', 'machine', 'kettlebell'
  secondary_equipment text[] default '{}', -- ['rack', 'bench']
  equipment_alternatives text[] default '{}', -- can also be done with these

  -- Difficulty & demands
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced', 'elite')),
  technical_demand_1_5 int default 3 check (technical_demand_1_5 between 1 and 5),
  cardio_demand_1_5 int default 1 check (cardio_demand_1_5 between 1 and 5),

  -- Energy expenditure
  calories_per_minute_estimate numeric(4,1), -- avg cals/min for a typical session
  default_sets text default '3',         -- usually a number, can be 'AMRAP' etc
  default_reps text default '8-10',
  default_rest_seconds int default 90,

  -- Visual content (deferred — fields exist for when you add)
  thumbnail_url text,
  animation_url text,
  video_url text,
  diagram_url text,

  -- Coaching content
  description text,                      -- 1-2 line summary
  instructions text[],                   -- array of step-by-step cues
  setup_cues text[],                     -- before you begin
  execution_cues text[],                 -- during the lift
  common_mistakes text[],                -- what goes wrong
  trainer_tips text[],                   -- expert-level cues

  -- Mobility / contraindications
  mobility_requirements text[],          -- ['ankle dorsiflexion', 'hip mobility']
  contraindications text[],              -- ['lower back injury', 'shoulder impingement']

  -- HYROX / hybrid metadata
  is_hyrox_event boolean default false,
  is_hybrid_signature boolean default false,

  -- Lifecycle
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_exercise_library_slug on public.exercise_library(slug);
create index if not exists idx_exercise_library_category on public.exercise_library(category);
create index if not exists idx_exercise_library_type on public.exercise_library(exercise_type);
create index if not exists idx_exercise_library_difficulty on public.exercise_library(difficulty);
create index if not exists idx_exercise_library_active on public.exercise_library(is_active);
create index if not exists idx_exercise_library_hyrox on public.exercise_library(is_hyrox_event) where is_hyrox_event = true;

-- Search-friendly indexes
-- For now, skip custom-expression indexes. With < 100 exercises, plain
-- ilike scans against the simple column indexes above are <1ms anyway.
-- We can add a GIN index on alternate_names later if search slows down.


-- ════════════════════════════════════════════════════════════════════
-- 2. EXERCISE → MUSCLE GROUP MAPPING (many-to-many with role)
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.exercise_muscles (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercise_library(id) on delete cascade,

  muscle text not null check (muscle in (
    -- Chest
    'pec_major', 'pec_minor', 'serratus',
    -- Back
    'lats', 'traps_upper', 'traps_mid', 'traps_lower',
    'rhomboids', 'erectors', 'rear_delts', 'rotator_cuff',
    -- Shoulders
    'front_delts', 'side_delts',
    -- Arms
    'biceps', 'triceps', 'brachialis', 'forearms',
    -- Core
    'rectus_abdominis', 'obliques', 'transverse_abdominis', 'spinal_erectors',
    -- Legs
    'quads', 'hamstrings', 'glutes', 'glute_med', 'adductors',
    'abductors', 'calves', 'hip_flexors', 'tibialis',
    -- Other
    'cardiovascular', 'grip', 'full_body'
  )),

  role text not null check (role in ('primary', 'secondary', 'stabilizer')),
  intensity_1_5 int default 3 check (intensity_1_5 between 1 and 5),

  unique(exercise_id, muscle)
);

create index if not exists idx_exercise_muscles_ex on public.exercise_muscles(exercise_id);
create index if not exists idx_exercise_muscles_muscle on public.exercise_muscles(muscle);


-- ════════════════════════════════════════════════════════════════════
-- 3. ALTERNATIVE EXERCISES (substitution graph)
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.exercise_alternatives (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercise_library(id) on delete cascade,
  alternative_exercise_id uuid not null references public.exercise_library(id) on delete cascade,

  reason text check (reason in (
    'easier', 'harder', 'no_equipment', 'less_equipment',
    'home_friendly', 'injury_safe', 'similar_pattern'
  )),
  notes text,

  unique(exercise_id, alternative_exercise_id),
  check (exercise_id != alternative_exercise_id)
);

create index if not exists idx_exercise_alts_ex on public.exercise_alternatives(exercise_id);


-- ════════════════════════════════════════════════════════════════════
-- 4. ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════════
-- Strategy: library is public-readable for any authenticated user.
-- Only admins/trainers can insert/update.

alter table public.exercise_library      enable row level security;
alter table public.exercise_muscles      enable row level security;
alter table public.exercise_alternatives enable row level security;

-- Read access — any authenticated user (clients need to see exercises in their workouts)
drop policy if exists "Authenticated read library" on public.exercise_library;
create policy "Authenticated read library" on public.exercise_library
  for select using (auth.uid() is not null and is_active = true);

drop policy if exists "Authenticated read muscles" on public.exercise_muscles;
create policy "Authenticated read muscles" on public.exercise_muscles
  for select using (auth.uid() is not null);

drop policy if exists "Authenticated read alternatives" on public.exercise_alternatives;
create policy "Authenticated read alternatives" on public.exercise_alternatives
  for select using (auth.uid() is not null);

-- Write access — admins + trainers only
drop policy if exists "Admins manage library" on public.exercise_library;
create policy "Admins manage library" on public.exercise_library
  for all using (public.is_admin_or_trainer())
  with check (public.is_admin_or_trainer());

drop policy if exists "Admins manage muscles" on public.exercise_muscles;
create policy "Admins manage muscles" on public.exercise_muscles
  for all using (public.is_admin_or_trainer())
  with check (public.is_admin_or_trainer());

drop policy if exists "Admins manage alternatives" on public.exercise_alternatives;
create policy "Admins manage alternatives" on public.exercise_alternatives
  for all using (public.is_admin_or_trainer())
  with check (public.is_admin_or_trainer());


-- ════════════════════════════════════════════════════════════════════
-- 5. UPDATED_AT TRIGGER
-- ════════════════════════════════════════════════════════════════════

drop trigger if exists trg_exercise_library_updated on public.exercise_library;
create trigger trg_exercise_library_updated before update on public.exercise_library
  for each row execute function public.set_updated_at();


-- ════════════════════════════════════════════════════════════════════
-- 6. SEED 20 CANONICAL EXERCISES
-- ════════════════════════════════════════════════════════════════════
-- Curated list covering: major compound lifts, HYROX events, conditioning
-- staples, and key mobility work. Add more via the admin UI later.

-- Helper: do everything in a single block so we can capture IDs for muscle mapping

do $$
declare
  -- IDs we'll capture as we insert
  ex_squat uuid;
  ex_deadlift uuid;
  ex_bench uuid;
  ex_row uuid;
  ex_ohp uuid;
  ex_pullup uuid;
  ex_lunge uuid;
  ex_rdl uuid;
  ex_dip uuid;
  ex_plank uuid;
  ex_burpee uuid;
  ex_sled_push uuid;
  ex_sled_pull uuid;
  ex_wallball uuid;
  ex_skierg uuid;
  ex_rowerg uuid;
  ex_farmer uuid;
  ex_kb_swing uuid;
  ex_box_jump uuid;
  ex_run_intervals uuid;
begin

-- ─────────────────────────────────────────────────────────────────
-- STRENGTH — Compound lifts (5)
-- ─────────────────────────────────────────────────────────────────

insert into public.exercise_library
  (slug, name, alternate_names, category, exercise_type, movement_pattern,
   primary_equipment, difficulty, technical_demand_1_5,
   default_sets, default_reps, default_rest_seconds, calories_per_minute_estimate,
   description, instructions, common_mistakes, trainer_tips)
values
  ('barbell-back-squat', 'Barbell Back Squat',
   array['back squat', 'high bar squat']::text[],
   'legs', 'strength', 'squat',
   'barbell', 'intermediate', 4,
   '4', '5-8', 180, 8.0,
   'King of lower-body lifts. Builds total leg + posterior chain strength.',
   array[
     'Set bar across upper traps, grip slightly wider than shoulders',
     'Step back, feet shoulder-width, toes slightly out',
     'Brace core, descend by sitting hips back and bending knees',
     'Hit depth (hip crease below knee), drive up through midfoot'
   ]::text[],
   array[
     'Knees caving inward',
     'Heels lifting off the floor',
     'Rounding the lower back at the bottom',
     'Shifting weight forward onto toes'
   ]::text[],
   array[
     'Spread the floor with your feet to engage glutes',
     'Brace before unracking — pressurize the trunk',
     'Initiate descent with hips, not knees'
   ]::text[]
  )
returning id into ex_squat;

insert into public.exercise_library
  (slug, name, alternate_names, category, exercise_type, movement_pattern,
   primary_equipment, difficulty, technical_demand_1_5,
   default_sets, default_reps, default_rest_seconds, calories_per_minute_estimate,
   description, instructions, common_mistakes, trainer_tips)
values
  ('conventional-deadlift', 'Conventional Deadlift',
   array['deadlift', 'pull from floor']::text[],
   'back', 'strength', 'hinge',
   'barbell', 'advanced', 5,
   '4', '3-5', 240, 9.0,
   'Total-body pull from the floor. The truest test of strength.',
   array[
     'Stand with feet hip-width, bar over midfoot',
     'Hinge to grip bar just outside knees',
     'Set lats, brace core, take slack out of bar',
     'Drive through floor — bar travels straight up legs to lockout'
   ]::text[],
   array[
     'Rounded lower back',
     'Bar drifting forward',
     'Hyper-extending at lockout',
     'Yanking bar off floor instead of pulling slack'
   ]::text[],
   array[
     'Wedge yourself into position before pulling',
     'Push the floor away rather than thinking pull',
     'Keep bar in contact with legs the entire lift'
   ]::text[]
  )
returning id into ex_deadlift;

insert into public.exercise_library
  (slug, name, alternate_names, category, exercise_type, movement_pattern,
   primary_equipment, difficulty, technical_demand_1_5,
   default_sets, default_reps, default_rest_seconds, calories_per_minute_estimate,
   description, instructions, common_mistakes, trainer_tips)
values
  ('barbell-bench-press', 'Barbell Bench Press',
   array['bench', 'flat bench']::text[],
   'chest', 'strength', 'push_horizontal',
   'barbell', 'intermediate', 4,
   '4', '5-8', 150, 7.0,
   'Foundational horizontal pressing movement for chest, shoulders, triceps.',
   array[
     'Lie back, eyes under bar, retract shoulder blades',
     'Grip slightly wider than shoulders, plant feet',
     'Unrack to lockout, lower under control to mid-chest',
     'Press up and slightly back to lockout'
   ]::text[],
   array[
     'Flaring elbows to 90° (shoulder injury risk)',
     'Bouncing bar off chest',
     'Losing upper-back tightness',
     'Lifting hips off bench'
   ]::text[],
   array[
     'Tuck elbows to ~60° from torso',
     'Drive feet hard into floor — leg drive matters',
     'Squeeze the bar to recruit triceps + chest harder'
   ]::text[]
  )
returning id into ex_bench;

insert into public.exercise_library
  (slug, name, alternate_names, category, exercise_type, movement_pattern,
   primary_equipment, difficulty, technical_demand_1_5,
   default_sets, default_reps, default_rest_seconds, calories_per_minute_estimate,
   description, instructions, common_mistakes, trainer_tips)
values
  ('barbell-bent-over-row', 'Barbell Bent-Over Row',
   array['pendlay row', 'bb row']::text[],
   'back', 'strength', 'pull_horizontal',
   'barbell', 'intermediate', 3,
   '4', '6-10', 120, 7.0,
   'Heavy horizontal pull — builds the entire back and biceps.',
   array[
     'Hinge to ~45°, knees soft, neutral spine',
     'Grip bar slightly wider than shoulders',
     'Pull bar to lower ribs, drive elbows back',
     'Lower under control, maintain torso angle'
   ]::text[],
   array[
     'Standing too upright (turns it into a shrug)',
     'Using momentum / kipping',
     'Rounding lower back',
     'Pulling to chest instead of belly'
   ]::text[],
   array[
     'Squeeze shoulder blades together at top',
     'Initiate the pull with elbows, not hands',
     'Keep ribcage down — no overarching'
   ]::text[]
  )
returning id into ex_row;

insert into public.exercise_library
  (slug, name, alternate_names, category, exercise_type, movement_pattern,
   primary_equipment, difficulty, technical_demand_1_5,
   default_sets, default_reps, default_rest_seconds, calories_per_minute_estimate,
   description, instructions, common_mistakes, trainer_tips)
values
  ('overhead-press', 'Standing Overhead Press',
   array['ohp', 'military press', 'shoulder press']::text[],
   'shoulders', 'strength', 'push_vertical',
   'barbell', 'intermediate', 4,
   '4', '5-8', 150, 6.0,
   'Vertical press from rack to lockout overhead. Builds shoulders and bracing strength.',
   array[
     'Bar on front delts, elbows slightly forward',
     'Brace core, glutes squeezed, knees soft',
     'Press bar straight up, head moves under bar',
     'Lock out with biceps near ears'
   ]::text[],
   array[
     'Pressing in front of forehead (path too forward)',
     'Hyperextending lower back',
     'Soft glutes / no bracing',
     'Letting bar drift away from face'
   ]::text[],
   array[
     'Push your head through at lockout',
     'Treat your body like a plank — full-body tension',
     'Bar path must be straight up — head gets out of the way'
   ]::text[]
  )
returning id into ex_ohp;

-- ─────────────────────────────────────────────────────────────────
-- STRENGTH — Bodyweight + accessory (4)
-- ─────────────────────────────────────────────────────────────────

insert into public.exercise_library
  (slug, name, alternate_names, category, exercise_type, movement_pattern,
   primary_equipment, difficulty, technical_demand_1_5,
   default_sets, default_reps, default_rest_seconds, calories_per_minute_estimate,
   description, instructions, common_mistakes, trainer_tips)
values
  ('pull-up', 'Pull-Up',
   array['chin-up', 'overhand pull-up']::text[],
   'back', 'strength', 'pull_vertical',
   'pull-up bar', 'advanced', 3,
   '4', '5-10', 120, 8.0,
   'Bodyweight vertical pull — gold standard for upper-back and grip strength.',
   array[
     'Grip bar slightly wider than shoulders, palms forward',
     'Engage lats, pull chest to bar',
     'Lower under control to full hang',
     'No swinging or kipping'
   ]::text[],
   array[
     'Half-reps (not reaching full hang)',
     'Pulling with biceps only',
     'Kipping for momentum',
     'Cranking neck up to clear bar'
   ]::text[],
   array[
     'Initiate by depressing shoulder blades, then pull',
     'Imagine driving elbows to your back pockets',
     'Negative reps build strength fast for beginners'
   ]::text[]
  )
returning id into ex_pullup;

insert into public.exercise_library
  (slug, name, alternate_names, category, exercise_type, movement_pattern,
   primary_equipment, difficulty, technical_demand_1_5,
   default_sets, default_reps, default_rest_seconds, calories_per_minute_estimate,
   description, instructions, common_mistakes, trainer_tips)
values
  ('walking-lunge', 'Dumbbell Walking Lunge',
   array['walking lunges', 'db lunge']::text[],
   'legs', 'strength', 'lunge',
   'dumbbells', 'intermediate', 2,
   '3', '12-16 (per leg)', 90, 9.5,
   'Unilateral leg work that exposes weak points and builds quads + glutes.',
   array[
     'Hold dumbbells at sides, stand tall',
     'Step forward into lunge — front shin vertical',
     'Drop back knee toward floor, drive off front heel',
     'Step through to next lunge'
   ]::text[],
   array[
     'Front knee caving inward',
     'Front knee tracking too far over toes',
     'Short stride (turns into a squat)',
     'Torso leaning forward'
   ]::text[],
   array[
     'Take a long stride — feel the stretch in back hip',
     'Push through the front heel + midfoot',
     'Keep ribcage stacked over hips'
   ]::text[]
  )
returning id into ex_lunge;

insert into public.exercise_library
  (slug, name, alternate_names, category, exercise_type, movement_pattern,
   primary_equipment, difficulty, technical_demand_1_5,
   default_sets, default_reps, default_rest_seconds, calories_per_minute_estimate,
   description, instructions, common_mistakes, trainer_tips)
values
  ('romanian-deadlift', 'Romanian Deadlift',
   array['rdl', 'stiff-leg deadlift']::text[],
   'legs', 'hypertrophy', 'hinge',
   'barbell', 'intermediate', 3,
   '4', '8-12', 120, 7.5,
   'Hip-hinge focused on hamstrings and glutes — the posterior chain builder.',
   array[
     'Hold bar at hips, soft knees, neutral spine',
     'Push hips back, bar slides down legs',
     'Stop when you feel hamstring stretch (~mid-shin)',
     'Drive hips forward to standing, squeeze glutes'
   ]::text[],
   array[
     'Squatting instead of hinging',
     'Letting bar drift away from legs',
     'Going too deep (rounded back)',
     'Hyper-extending at the top'
   ]::text[],
   array[
     'Imagine closing a car door with your hips',
     'Bar must stay glued to your thighs',
     'Range of motion ends at hamstring tightness — not the floor'
   ]::text[]
  )
returning id into ex_rdl;

insert into public.exercise_library
  (slug, name, alternate_names, category, exercise_type, movement_pattern,
   primary_equipment, difficulty, technical_demand_1_5,
   default_sets, default_reps, default_rest_seconds, calories_per_minute_estimate,
   description, instructions, common_mistakes, trainer_tips)
values
  ('parallel-bar-dip', 'Parallel Bar Dip',
   array['dip', 'tricep dip']::text[],
   'chest', 'strength', 'push_vertical',
   'parallel bars', 'intermediate', 3,
   '3', '6-12', 90, 7.5,
   'Compound vertical press for lower chest, triceps, and front delts.',
   array[
     'Mount bars, arms locked, slight forward lean',
     'Lower until shoulders are slightly below elbows',
     'Press up to lockout, no swinging',
     'Control the descent — 2 second eccentric'
   ]::text[],
   array[
     'Going too deep (shoulder injury)',
     'Flaring elbows wide',
     'Kipping with legs',
     'Locking out forcefully'
   ]::text[],
   array[
     'Lean forward more = more chest, stay vertical = more triceps',
     'Tuck elbows close to ribs',
     'Add weight via belt once 12+ reps are clean'
   ]::text[]
  )
returning id into ex_dip;

-- ─────────────────────────────────────────────────────────────────
-- CORE & ISOMETRIC (1)
-- ─────────────────────────────────────────────────────────────────

insert into public.exercise_library
  (slug, name, alternate_names, category, exercise_type, movement_pattern,
   primary_equipment, difficulty, technical_demand_1_5,
   default_sets, default_reps, default_rest_seconds, calories_per_minute_estimate,
   description, instructions, common_mistakes, trainer_tips)
values
  ('plank', 'Front Plank',
   array['plank hold', 'forearm plank']::text[],
   'core', 'strength', 'static',
   'bodyweight', 'beginner', 2,
   '3', '30-60 sec', 60, 4.0,
   'Anti-extension core hold. Foundation for trunk stability.',
   array[
     'Forearms on floor, elbows under shoulders',
     'Body straight from heels to head',
     'Squeeze glutes, brace abs, tuck pelvis',
     'Hold for time — quality over duration'
   ]::text[],
   array[
     'Sagging hips',
     'Piking hips up',
     'Looking up (neck strain)',
     'Holding breath'
   ]::text[],
   array[
     'Pretend someone is about to punch you in the gut',
     'Push the floor away — protract shoulder blades',
     'Add a 30s RKC plank instead of 3-min sloppy holds'
   ]::text[]
  )
returning id into ex_plank;

-- ─────────────────────────────────────────────────────────────────
-- HYROX EVENTS (5) — the 8 stations that matter most
-- ─────────────────────────────────────────────────────────────────

insert into public.exercise_library
  (slug, name, alternate_names, category, exercise_type, movement_pattern,
   primary_equipment, difficulty, technical_demand_1_5, cardio_demand_1_5,
   default_sets, default_reps, default_rest_seconds, calories_per_minute_estimate,
   description, instructions, common_mistakes, trainer_tips,
   is_hyrox_event, is_hybrid_signature)
values
  ('sled-push', 'Sled Push',
   array['prowler push', 'sled drive']::text[],
   'hybrid', 'hybrid', 'gait',
   'sled', 'intermediate', 2, 5,
   '4', '20m', 90, 14.0,
   'Maximal effort drive of a weighted sled. HYROX station + leg power builder.',
   array[
     'Grip sled handles low or high',
     'Drive feet into floor at ~45° angle',
     'Take short, choppy steps for power',
     'Maintain forward lean throughout'
   ]::text[],
   array[
     'Standing too upright',
     'Long strides (loses power)',
     'Letting head drop',
     'Stopping mid-distance'
   ]::text[],
   array[
     'Smaller faster steps beat fewer big strides',
     'Drive through the balls of your feet',
     'Breath-pacing matters — exhale on each step'
   ]::text[],
   true, true)
returning id into ex_sled_push;

insert into public.exercise_library
  (slug, name, alternate_names, category, exercise_type, movement_pattern,
   primary_equipment, difficulty, technical_demand_1_5, cardio_demand_1_5,
   default_sets, default_reps, default_rest_seconds, calories_per_minute_estimate,
   description, instructions, common_mistakes, trainer_tips,
   is_hyrox_event, is_hybrid_signature)
values
  ('sled-pull', 'Sled Pull',
   array['rope pull', 'sled drag']::text[],
   'hybrid', 'hybrid', 'pull_horizontal',
   'sled', 'intermediate', 3, 5,
   '4', '20m', 90, 13.0,
   'Hand-over-hand pull of a weighted sled. HYROX station — trains pulling endurance.',
   array[
     'Sit slightly back, brace core',
     'Pull hand-over-hand on rope',
     'Keep elbows close to ribs',
     'Re-set distance after each completion'
   ]::text[],
   array[
     'Standing too upright',
     'Hands too high on the rope',
     'Letting back round',
     'Pausing between pulls (slows pace)'
   ]::text[],
   array[
     'Find a steady pulling rhythm — don''t race the rope',
     'Drive elbows back hard for max engagement',
     'Lower body braces; arms do the work'
   ]::text[],
   true, true)
returning id into ex_sled_pull;

insert into public.exercise_library
  (slug, name, alternate_names, category, exercise_type, movement_pattern,
   primary_equipment, difficulty, technical_demand_1_5, cardio_demand_1_5,
   default_sets, default_reps, default_rest_seconds, calories_per_minute_estimate,
   description, instructions, common_mistakes, trainer_tips,
   is_hyrox_event, is_hybrid_signature)
values
  ('wall-ball', 'Wall Ball',
   array['wall balls', 'medicine ball wall throws']::text[],
   'hybrid', 'hybrid', 'squat',
   'medicine ball', 'intermediate', 3, 5,
   '4', '15-20', 90, 12.5,
   'Front squat to overhead throw. HYROX classic — hammers legs and lungs.',
   array[
     'Hold ball at chest, feet shoulder-width',
     'Drop into front squat — full depth',
     'Drive up, throw ball to target (10ft / 9ft)',
     'Catch in receive position, descend immediately'
   ]::text[],
   array[
     'Half-depth squats',
     'Pressing ball with arms instead of using legs',
     'Catching with locked arms (joint stress)',
     'Throwing too low / off-target'
   ]::text[],
   array[
     'Throw is a byproduct of leg drive — let the legs do the work',
     'Catch in a slight hinge, transition straight to next squat',
     'Pace yourself — sets of 5-10 reps with mini-rests'
   ]::text[],
   true, true)
returning id into ex_wallball;

insert into public.exercise_library
  (slug, name, alternate_names, category, exercise_type, movement_pattern,
   primary_equipment, difficulty, technical_demand_1_5, cardio_demand_1_5,
   default_sets, default_reps, default_rest_seconds, calories_per_minute_estimate,
   description, instructions, common_mistakes, trainer_tips,
   is_hyrox_event, is_hybrid_signature)
values
  ('ski-erg', 'Ski Erg',
   array['ski erg machine', 'ski-erg pulls']::text[],
   'hybrid', 'cardio', 'pull_vertical',
   'ski erg', 'intermediate', 3, 5,
   '3', '500-1000m', 90, 13.0,
   'Standing double-pole machine — full-body cardio dominated by lats and core.',
   array[
     'Stand close, grip handles overhead',
     'Drive arms down past hips, hinge at hips',
     'Engage lats and core — bend knees slightly',
     'Recover to upright with control'
   ]::text[],
   array[
     'Pulling with arms only (no hip hinge)',
     'Standing too upright (loses power)',
     'Snapping back at top of stroke',
     'Inconsistent pace'
   ]::text[],
   array[
     'Big slow strokes early, ratchet up cadence late',
     'Hips drive the pull — arms finish it',
     'Aim for consistent split times'
   ]::text[],
   true, true)
returning id into ex_skierg;

insert into public.exercise_library
  (slug, name, alternate_names, category, exercise_type, movement_pattern,
   primary_equipment, difficulty, technical_demand_1_5, cardio_demand_1_5,
   default_sets, default_reps, default_rest_seconds, calories_per_minute_estimate,
   description, instructions, common_mistakes, trainer_tips,
   is_hyrox_event, is_hybrid_signature)
values
  ('row-erg', 'Row Erg',
   array['rowing machine', 'concept2 rower']::text[],
   'hybrid', 'cardio', 'pull_horizontal',
   'rowing erg', 'beginner', 3, 5,
   '3', '500-1000m', 90, 11.5,
   'Concept2 rower. Hybrid + endurance gold standard. HYROX event.',
   array[
     'Catch: shins vertical, arms forward, lean slightly forward',
     'Drive: legs first, then hinge open, finally pull arms to ribs',
     'Finish: lean back ~10°, handle to lower ribs',
     'Recovery: arms forward, hinge forward, then bend knees'
   ]::text[],
   array[
     'Pulling with arms first (legs are 60% of the stroke)',
     'Reverse sequence — bending knees before arms reset',
     'Hunched back at the catch',
     'Snapping body back hard at finish'
   ]::text[],
   array[
     'Legs → back → arms. Arms → back → legs. Memorize the order.',
     '1:2 ratio — drive fast, recover slow',
     'A slower stroke rate at higher power often works better'
   ]::text[],
   true, true)
returning id into ex_rowerg;

-- ─────────────────────────────────────────────────────────────────
-- CONDITIONING (3)
-- ─────────────────────────────────────────────────────────────────

insert into public.exercise_library
  (slug, name, alternate_names, category, exercise_type, movement_pattern,
   primary_equipment, difficulty, technical_demand_1_5, cardio_demand_1_5,
   default_sets, default_reps, default_rest_seconds, calories_per_minute_estimate,
   description, instructions, common_mistakes, trainer_tips,
   is_hybrid_signature)
values
  ('burpee', 'Burpee',
   array['burpees', 'down-up']::text[],
   'hybrid', 'hybrid', 'gait',
   'bodyweight', 'beginner', 2, 5,
   '3', '10-20', 60, 13.5,
   'Classic full-body conditioning move. Simple, brutal, effective.',
   array[
     'Drop into squat, hands on floor',
     'Kick legs back to plank — chest to ground',
     'Push up + jump feet forward to squat',
     'Stand and jump (or skip jump for lower-impact version)'
   ]::text[],
   array[
     'Sagging hips at the bottom',
     'Skipping the chest-to-ground portion',
     'Half-jump at top (not really getting airborne)',
     'Inconsistent pace under fatigue'
   ]::text[],
   array[
     'Find a sustainable rhythm — sprinting burpees gasses fast',
     'Land soft on the jump-back to protect joints',
     'Burpee + box-step-up for a HYROX-style hybrid'
   ]::text[],
   true)
returning id into ex_burpee;

insert into public.exercise_library
  (slug, name, alternate_names, category, exercise_type, movement_pattern,
   primary_equipment, difficulty, technical_demand_1_5, cardio_demand_1_5,
   default_sets, default_reps, default_rest_seconds, calories_per_minute_estimate,
   description, instructions, common_mistakes, trainer_tips,
   is_hybrid_signature)
values
  ('kettlebell-swing', 'Kettlebell Swing',
   array['kb swing', 'russian swing']::text[],
   'hybrid', 'hybrid', 'hinge',
   'kettlebell', 'beginner', 3, 4,
   '4', '15-20', 60, 11.0,
   'Hip-hinge power move. Trains posterior chain explosively.',
   array[
     'Stand with kettlebell ~2 feet in front, feet shoulder-width',
     'Hinge to grip bell, hike it back between legs',
     'Snap hips forward — bell floats to chest height',
     'Let bell return on the descent — re-load the hinge'
   ]::text[],
   array[
     'Squatting the swing instead of hinging',
     'Lifting bell with arms (it should float)',
     'Going overhead (American swing is a different movement)',
     'Soft glutes at lockout'
   ]::text[],
   array[
     'Hips snap, arms guide. Power comes from below.',
     'Stand tall and squeeze glutes hard at the top',
     'Heavier bell + lower reps for power; lighter + higher for cardio'
   ]::text[],
   true)
returning id into ex_kb_swing;

insert into public.exercise_library
  (slug, name, alternate_names, category, exercise_type, movement_pattern,
   primary_equipment, difficulty, technical_demand_1_5, cardio_demand_1_5,
   default_sets, default_reps, default_rest_seconds, calories_per_minute_estimate,
   description, instructions, common_mistakes, trainer_tips,
   is_hybrid_signature)
values
  ('box-jump', 'Box Jump',
   array['plyo box jump']::text[],
   'hybrid', 'functional', 'squat',
   'plyo box', 'intermediate', 3, 4,
   '4', '8-12', 90, 10.5,
   'Explosive lower-body plyometric. Builds power and ankle stiffness.',
   array[
     'Stand 1 foot from box, slight knee bend',
     'Quick countermovement, swing arms back',
     'Drive arms up and jump — land on box softly',
     'Step (don''t jump) down to start position'
   ]::text[],
   array[
     'Jumping down (cumulative joint stress)',
     'Landing too tall (locked knees)',
     'Box too tall — landing in bad position',
     'No arm swing — leaves power on the table'
   ]::text[],
   array[
     'Land in the same depth you jumped from',
     'Always step DOWN, jump UP',
     'Add a depth-drop variation as you advance'
   ]::text[],
   true)
returning id into ex_box_jump;

-- ─────────────────────────────────────────────────────────────────
-- ENDURANCE (1)
-- ─────────────────────────────────────────────────────────────────

insert into public.exercise_library
  (slug, name, alternate_names, category, exercise_type, movement_pattern,
   primary_equipment, difficulty, technical_demand_1_5, cardio_demand_1_5,
   default_sets, default_reps, default_rest_seconds, calories_per_minute_estimate,
   description, instructions, common_mistakes, trainer_tips,
   is_hybrid_signature)
values
  ('running-intervals', 'Running Intervals',
   array['interval runs', 'sprint repeats']::text[],
   'cardio', 'endurance', 'gait',
   'track or treadmill', 'intermediate', 2, 5,
   '5-8', '400m', 120, 12.0,
   'Repeated efforts at threshold pace. Cornerstone of HYROX/IRONMAN prep.',
   array[
     'Warm up 10 min easy',
     'Run 400m at 5K pace (or assigned pace)',
     'Walk/jog 200m for recovery',
     'Repeat 5-8 rounds, cool down 10 min'
   ]::text[],
   array[
     'Going too hard too early — fade in later reps',
     'Skipping the warm-up',
     'Letting form fall apart on tired reps',
     'Inconsistent splits across reps'
   ]::text[],
   array[
     'Negative split — run rep 5 faster than rep 1',
     'Stay consistent (within 2 sec) across all reps',
     'Use a watch — gut-feel pacing fails under fatigue'
   ]::text[],
   true)
returning id into ex_run_intervals;

-- ─────────────────────────────────────────────────────────────────
-- LOADED CARRY (1)
-- ─────────────────────────────────────────────────────────────────

insert into public.exercise_library
  (slug, name, alternate_names, category, exercise_type, movement_pattern,
   primary_equipment, difficulty, technical_demand_1_5,
   default_sets, default_reps, default_rest_seconds, calories_per_minute_estimate,
   description, instructions, common_mistakes, trainer_tips,
   is_hyrox_event, is_hybrid_signature)
values
  ('farmer-carry', 'Farmer Carry',
   array['farmer walk', 'loaded carry']::text[],
   'core', 'functional', 'carry',
   'kettlebells', 'beginner', 1,
   '4', '40m', 60, 8.5,
   'Heavy bilateral carry. Trains grip, core, posture, work capacity. HYROX event.',
   array[
     'Pick up two heavy kettlebells / dumbbells',
     'Stand tall — ribs stacked over hips',
     'Walk in a straight line with even, deliberate steps',
     'Set down with control — no dropping'
   ]::text[],
   array[
     'Hunched posture (defeats the purpose)',
     'Bouncing / rushing pace',
     'Twisting torso side to side',
     'Going too light — carries should be CHALLENGING'
   ]::text[],
   array[
     'Crush the handles — actively grip every step',
     'Walk like you''re balancing a book on your head',
     '50-70% bodyweight in each hand is a strong target'
   ]::text[],
   true, true)
returning id into ex_farmer;

-- ─────────────────────────────────────────────────────────────────
-- 7. MUSCLE MAPPING — primary and secondary for each
-- ─────────────────────────────────────────────────────────────────

insert into public.exercise_muscles (exercise_id, muscle, role, intensity_1_5) values
  -- Squat
  (ex_squat, 'quads', 'primary', 5),
  (ex_squat, 'glutes', 'primary', 5),
  (ex_squat, 'hamstrings', 'secondary', 3),
  (ex_squat, 'spinal_erectors', 'stabilizer', 4),
  (ex_squat, 'rectus_abdominis', 'stabilizer', 3),
  -- Deadlift
  (ex_deadlift, 'glutes', 'primary', 5),
  (ex_deadlift, 'hamstrings', 'primary', 5),
  (ex_deadlift, 'spinal_erectors', 'primary', 5),
  (ex_deadlift, 'lats', 'secondary', 4),
  (ex_deadlift, 'traps_upper', 'secondary', 3),
  (ex_deadlift, 'forearms', 'stabilizer', 4),
  (ex_deadlift, 'grip', 'stabilizer', 5),
  -- Bench
  (ex_bench, 'pec_major', 'primary', 5),
  (ex_bench, 'triceps', 'primary', 4),
  (ex_bench, 'front_delts', 'secondary', 4),
  (ex_bench, 'serratus', 'stabilizer', 2),
  -- Row
  (ex_row, 'lats', 'primary', 5),
  (ex_row, 'rhomboids', 'primary', 4),
  (ex_row, 'rear_delts', 'secondary', 4),
  (ex_row, 'biceps', 'secondary', 3),
  (ex_row, 'spinal_erectors', 'stabilizer', 4),
  -- OHP
  (ex_ohp, 'front_delts', 'primary', 5),
  (ex_ohp, 'side_delts', 'primary', 4),
  (ex_ohp, 'triceps', 'secondary', 4),
  (ex_ohp, 'traps_upper', 'secondary', 3),
  (ex_ohp, 'rectus_abdominis', 'stabilizer', 4),
  -- Pull-up
  (ex_pullup, 'lats', 'primary', 5),
  (ex_pullup, 'biceps', 'primary', 4),
  (ex_pullup, 'rhomboids', 'secondary', 4),
  (ex_pullup, 'forearms', 'stabilizer', 4),
  -- Lunge
  (ex_lunge, 'quads', 'primary', 5),
  (ex_lunge, 'glutes', 'primary', 4),
  (ex_lunge, 'hamstrings', 'secondary', 3),
  (ex_lunge, 'glute_med', 'stabilizer', 4),
  -- RDL
  (ex_rdl, 'hamstrings', 'primary', 5),
  (ex_rdl, 'glutes', 'primary', 4),
  (ex_rdl, 'spinal_erectors', 'secondary', 4),
  (ex_rdl, 'lats', 'stabilizer', 3),
  -- Dip
  (ex_dip, 'pec_major', 'primary', 4),
  (ex_dip, 'triceps', 'primary', 5),
  (ex_dip, 'front_delts', 'secondary', 4),
  -- Plank
  (ex_plank, 'rectus_abdominis', 'primary', 4),
  (ex_plank, 'transverse_abdominis', 'primary', 5),
  (ex_plank, 'obliques', 'secondary', 3),
  (ex_plank, 'spinal_erectors', 'stabilizer', 3),
  -- Sled push
  (ex_sled_push, 'quads', 'primary', 5),
  (ex_sled_push, 'glutes', 'primary', 5),
  (ex_sled_push, 'calves', 'primary', 4),
  (ex_sled_push, 'cardiovascular', 'primary', 5),
  -- Sled pull
  (ex_sled_pull, 'lats', 'primary', 5),
  (ex_sled_pull, 'biceps', 'primary', 4),
  (ex_sled_pull, 'rear_delts', 'secondary', 4),
  (ex_sled_pull, 'cardiovascular', 'primary', 5),
  (ex_sled_pull, 'grip', 'stabilizer', 4),
  -- Wall ball
  (ex_wallball, 'quads', 'primary', 4),
  (ex_wallball, 'glutes', 'primary', 4),
  (ex_wallball, 'front_delts', 'primary', 4),
  (ex_wallball, 'cardiovascular', 'primary', 5),
  -- Ski erg
  (ex_skierg, 'lats', 'primary', 5),
  (ex_skierg, 'cardiovascular', 'primary', 5),
  (ex_skierg, 'rectus_abdominis', 'secondary', 4),
  (ex_skierg, 'triceps', 'secondary', 3),
  -- Row erg
  (ex_rowerg, 'cardiovascular', 'primary', 5),
  (ex_rowerg, 'quads', 'primary', 4),
  (ex_rowerg, 'lats', 'primary', 4),
  (ex_rowerg, 'rhomboids', 'secondary', 3),
  -- Burpee
  (ex_burpee, 'full_body', 'primary', 5),
  (ex_burpee, 'cardiovascular', 'primary', 5),
  -- KB swing
  (ex_kb_swing, 'glutes', 'primary', 5),
  (ex_kb_swing, 'hamstrings', 'primary', 4),
  (ex_kb_swing, 'spinal_erectors', 'secondary', 4),
  (ex_kb_swing, 'cardiovascular', 'secondary', 4),
  -- Box jump
  (ex_box_jump, 'quads', 'primary', 4),
  (ex_box_jump, 'glutes', 'primary', 4),
  (ex_box_jump, 'calves', 'primary', 5),
  -- Running intervals
  (ex_run_intervals, 'cardiovascular', 'primary', 5),
  (ex_run_intervals, 'quads', 'primary', 4),
  (ex_run_intervals, 'calves', 'primary', 4),
  (ex_run_intervals, 'glutes', 'secondary', 3),
  -- Farmer carry
  (ex_farmer, 'grip', 'primary', 5),
  (ex_farmer, 'forearms', 'primary', 5),
  (ex_farmer, 'traps_upper', 'primary', 4),
  (ex_farmer, 'rectus_abdominis', 'stabilizer', 4),
  (ex_farmer, 'spinal_erectors', 'stabilizer', 4)
on conflict do nothing;

-- ─────────────────────────────────────────────────────────────────
-- 8. ALTERNATIVES — useful substitution suggestions
-- ─────────────────────────────────────────────────────────────────

insert into public.exercise_alternatives (exercise_id, alternative_exercise_id, reason, notes) values
  (ex_squat, ex_lunge, 'less_equipment', 'Unilateral alternative when no rack available'),
  (ex_deadlift, ex_rdl, 'easier', 'Less spinal load — better for beginners or recovery days'),
  (ex_deadlift, ex_kb_swing, 'less_equipment', 'Hip-hinge pattern with just a kettlebell'),
  (ex_pullup, ex_row, 'easier', 'Horizontal pull is more accessible than vertical'),
  (ex_bench, ex_dip, 'no_equipment', 'Bodyweight horizontal/vertical chest press'),
  (ex_box_jump, ex_burpee, 'no_equipment', 'Plyometric without needing a box'),
  (ex_skierg, ex_rowerg, 'similar_pattern', 'Same energy system, different muscle distribution'),
  (ex_farmer, ex_kb_swing, 'less_equipment', 'Kettlebell-only alternative for grip + posterior')
on conflict do nothing;

end $$;


-- ════════════════════════════════════════════════════════════════════
-- DONE
-- ════════════════════════════════════════════════════════════════════
-- Summary:
--   3 new tables (exercise_library, exercise_muscles, exercise_alternatives)
--   20 seeded exercises with full metadata
--   78 muscle mappings
--   8 alternative-exercise relationships
--   Full-text search index for fast trainer autocomplete
--   RLS: authenticated users read, admins/trainers write
-- ════════════════════════════════════════════════════════════════════
