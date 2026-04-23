-- ═══════════════════════════════════════════════════════════════════════
-- PURE X — Phase 2 Full Schema Migration
-- ═══════════════════════════════════════════════════════════════════════
--
-- Run AFTER 00001_auth_foundation.sql
--
-- Creates all admin-managed tables:
--   • experts             — specialist profiles
--   • services            — what each expert offers (consultation, etc.)
--   • bookings            — booking requests from marketing site + admin CRM
--   • form_submissions    — pre-consultation forms tied to bookings
--   • client_plans        — plan assignment (which client has which programme)
--   • client_daily_logs   — daily metrics (weight, calories, steps, sleep, water)
--   • client_tasks        — daily checklist items per client
--   • client_workouts     — assigned workouts with completion status
--   • client_progress_logs — check-in snapshots (weight changes, measurements)
--
-- RLS policies: clients see only their own data, admins see everything.
-- ═══════════════════════════════════════════════════════════════════════

-- ─── EXPERTS ─────────────────────────────────────────────────────────
create table if not exists public.experts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  title text not null,
  short_role text not null,
  bio_short text,
  bio_long text,
  credentials text[] default '{}',
  specialisms text[] default '{}',
  years_experience int,
  clients_trained int,
  location text,
  photo_url text,
  calendly_url text,
  is_active boolean default true,
  display_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_experts_slug on public.experts(slug);
create index if not exists idx_experts_active on public.experts(is_active);

drop trigger if exists tr_experts_updated on public.experts;
create trigger tr_experts_updated
  before update on public.experts
  for each row execute procedure public.set_updated_at();

-- ─── SERVICES ────────────────────────────────────────────────────────
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid references public.experts(id) on delete cascade,
  name text not null,
  description text,
  format text check (format in ('online', 'in_person', 'hybrid')) default 'hybrid',
  duration_minutes int default 60,
  price_display text,
  is_consultation boolean default false,
  form_template_id text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_services_expert on public.services(expert_id);

drop trigger if exists tr_services_updated on public.services;
create trigger tr_services_updated
  before update on public.services
  for each row execute procedure public.set_updated_at();

-- ─── BOOKINGS ────────────────────────────────────────────────────────
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference_id text unique not null default concat('PX-', upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),

  -- Booking submitter
  client_id uuid references public.profiles(id) on delete set null,
  client_name text not null,
  client_email text not null,
  client_phone text,

  -- What they booked
  expert_id uuid references public.experts(id) on delete set null,
  expert_slug text,  -- denormalized for display even if expert deleted
  service_id uuid references public.services(id) on delete set null,
  service_name text, -- denormalized

  -- Scheduling
  preferred_date date,
  preferred_time_slot text, -- e.g. 'morning', 'afternoon', 'evening', or 'ISO 9:30 AM'
  scheduled_datetime timestamptz, -- filled in after admin confirms

  -- Status workflow
  status text not null default 'new' check (status in ('new', 'contacted', 'scheduled', 'completed', 'cancelled', 'no_show')),
  source text default 'website', -- 'website', 'whatsapp', 'referral', 'admin_manual'
  notes text, -- admin-only notes

  -- Meta
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  contacted_at timestamptz,
  completed_at timestamptz
);

create index if not exists idx_bookings_status on public.bookings(status);
create index if not exists idx_bookings_expert on public.bookings(expert_id);
create index if not exists idx_bookings_client on public.bookings(client_id);
create index if not exists idx_bookings_created on public.bookings(created_at desc);
create index if not exists idx_bookings_reference on public.bookings(reference_id);

drop trigger if exists tr_bookings_updated on public.bookings;
create trigger tr_bookings_updated
  before update on public.bookings
  for each row execute procedure public.set_updated_at();

-- ─── FORM SUBMISSIONS ────────────────────────────────────────────────
-- Stores the pre-consult form responses, JSON-serialized
create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  expert_slug text not null,
  form_template_id text not null,   -- trainer, doctor, physio, etc.
  responses jsonb not null,         -- { "goals": "...", "injuries": "...", ... }
  created_at timestamptz default now()
);

create index if not exists idx_forms_booking on public.form_submissions(booking_id);
create index if not exists idx_forms_template on public.form_submissions(form_template_id);

-- ─── CLIENT PLANS ────────────────────────────────────────────────────
create table if not exists public.client_plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  plan_name text not null, -- 'Personal Transformation', 'Elite Couple', etc.
  plan_tier text check (plan_tier in ('fit_check', 'online_live', 'personal_transformation', 'elite_couple')),
  start_date date not null default current_date,
  end_date date,
  assigned_expert_id uuid references public.experts(id) on delete set null,
  price_paid_display text,
  status text default 'active' check (status in ('active', 'paused', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_plans_client on public.client_plans(client_id);
create index if not exists idx_plans_status on public.client_plans(status);

drop trigger if exists tr_plans_updated on public.client_plans;
create trigger tr_plans_updated
  before update on public.client_plans
  for each row execute procedure public.set_updated_at();

-- ─── CLIENT DAILY LOGS ───────────────────────────────────────────────
-- One row per client per day with all the dashboard metrics
create table if not exists public.client_daily_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null default current_date,

  -- Metrics
  weight_kg numeric(5,2),
  calories_consumed int,
  calories_target int,
  protein_g int,
  carbs_g int,
  fats_g int,
  water_glasses int,
  water_target int default 8,
  steps int,
  steps_target int default 10000,
  sleep_hours numeric(3,1),
  sleep_quality_1_5 int check (sleep_quality_1_5 between 1 and 5),
  mood_1_5 int check (mood_1_5 between 1 and 5),
  recovery_score int check (recovery_score between 0 and 100),

  -- Free-text
  daily_note text,

  -- Meta
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(client_id, log_date)
);

create index if not exists idx_logs_client_date on public.client_daily_logs(client_id, log_date desc);

drop trigger if exists tr_logs_updated on public.client_daily_logs;
create trigger tr_logs_updated
  before update on public.client_daily_logs
  for each row execute procedure public.set_updated_at();

-- ─── CLIENT TASKS ────────────────────────────────────────────────────
create table if not exists public.client_tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  task_date date not null default current_date,
  title text not null,
  category text check (category in ('workout', 'nutrition', 'recovery', 'lifestyle')) default 'lifestyle',
  scheduled_time text, -- display string like "7:00 AM"
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_tasks_client_date on public.client_tasks(client_id, task_date desc);
create index if not exists idx_tasks_completed on public.client_tasks(completed);

drop trigger if exists tr_tasks_updated on public.client_tasks;
create trigger tr_tasks_updated
  before update on public.client_tasks
  for each row execute procedure public.set_updated_at();

-- ─── CLIENT WORKOUTS ─────────────────────────────────────────────────
create table if not exists public.client_workouts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  workout_date date,
  name text not null,
  category text, -- 'Strength', 'HYROX', 'Conditioning', 'Mobility'
  duration_minutes int,
  calories int,
  difficulty text check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
  focus text, -- 'Quads · Glutes · Hamstrings'
  sets int,
  reps text, -- '4-6' or '10' or 'Stations'
  tags text[] default '{}',
  description text,
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_workouts_client on public.client_workouts(client_id, workout_date desc);

drop trigger if exists tr_workouts_updated on public.client_workouts;
create trigger tr_workouts_updated
  before update on public.client_workouts
  for each row execute procedure public.set_updated_at();

-- ─── CLIENT PROGRESS LOGS ────────────────────────────────────────────
-- Formal check-in snapshots with body measurements, photos, notes
create table if not exists public.client_progress_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  check_in_date date not null default current_date,
  weight_kg numeric(5,2),
  body_fat_percent numeric(4,1),
  waist_cm numeric(5,1),
  chest_cm numeric(5,1),
  hip_cm numeric(5,1),
  arms_cm numeric(5,1),
  thighs_cm numeric(5,1),
  before_photo_url text,
  after_photo_url text,
  coach_notes text,
  client_notes text,
  created_at timestamptz default now()
);

create index if not exists idx_progress_client on public.client_progress_logs(client_id, check_in_date desc);

-- ═══════════════════════════════════════════════════════════════════════
-- ROW-LEVEL SECURITY POLICIES
-- ═══════════════════════════════════════════════════════════════════════

-- Experts: public read (for marketing site), admin write
alter table public.experts enable row level security;
drop policy if exists "Experts public read" on public.experts;
create policy "Experts public read" on public.experts for select using (true);
drop policy if exists "Experts admin write" on public.experts;
create policy "Experts admin write" on public.experts for all using (public.is_admin(auth.uid()));

-- Services: public read, admin write
alter table public.services enable row level security;
drop policy if exists "Services public read" on public.services;
create policy "Services public read" on public.services for select using (true);
drop policy if exists "Services admin write" on public.services;
create policy "Services admin write" on public.services for all using (public.is_admin(auth.uid()));

-- Bookings: public can INSERT (for marketing booking form), admins read/update all, clients read own
alter table public.bookings enable row level security;
drop policy if exists "Anyone can create booking" on public.bookings;
create policy "Anyone can create booking" on public.bookings for insert with check (true);
drop policy if exists "Clients read own bookings" on public.bookings;
create policy "Clients read own bookings" on public.bookings for select
  using (auth.uid() = client_id or client_email = (select email from public.profiles where id = auth.uid()));
drop policy if exists "Admins manage bookings" on public.bookings;
create policy "Admins manage bookings" on public.bookings for all using (public.is_admin(auth.uid()));

-- Form submissions: anyone can insert (linked to booking), admins read all, clients read their own
alter table public.form_submissions enable row level security;
drop policy if exists "Anyone can submit form" on public.form_submissions;
create policy "Anyone can submit form" on public.form_submissions for insert with check (true);
drop policy if exists "Admins read all forms" on public.form_submissions;
create policy "Admins read all forms" on public.form_submissions for select using (public.is_admin(auth.uid()));

-- Client plans: clients read own, admins full access
alter table public.client_plans enable row level security;
drop policy if exists "Clients read own plan" on public.client_plans;
create policy "Clients read own plan" on public.client_plans for select using (auth.uid() = client_id);
drop policy if exists "Admins manage plans" on public.client_plans;
create policy "Admins manage plans" on public.client_plans for all using (public.is_admin(auth.uid()));

-- Client daily logs: clients read + update own, admins full access
alter table public.client_daily_logs enable row level security;
drop policy if exists "Clients manage own logs" on public.client_daily_logs;
create policy "Clients manage own logs" on public.client_daily_logs for all using (auth.uid() = client_id);
drop policy if exists "Admins manage all logs" on public.client_daily_logs;
create policy "Admins manage all logs" on public.client_daily_logs for all using (public.is_admin(auth.uid()));

-- Client tasks: same pattern
alter table public.client_tasks enable row level security;
drop policy if exists "Clients manage own tasks" on public.client_tasks;
create policy "Clients manage own tasks" on public.client_tasks for all using (auth.uid() = client_id);
drop policy if exists "Admins manage all tasks" on public.client_tasks;
create policy "Admins manage all tasks" on public.client_tasks for all using (public.is_admin(auth.uid()));

-- Client workouts: same pattern
alter table public.client_workouts enable row level security;
drop policy if exists "Clients manage own workouts" on public.client_workouts;
create policy "Clients manage own workouts" on public.client_workouts for all using (auth.uid() = client_id);
drop policy if exists "Admins manage all workouts" on public.client_workouts;
create policy "Admins manage all workouts" on public.client_workouts for all using (public.is_admin(auth.uid()));

-- Client progress logs: clients read own, admins full access
alter table public.client_progress_logs enable row level security;
drop policy if exists "Clients read own progress" on public.client_progress_logs;
create policy "Clients read own progress" on public.client_progress_logs for select using (auth.uid() = client_id);
drop policy if exists "Admins manage progress" on public.client_progress_logs;
create policy "Admins manage progress" on public.client_progress_logs for all using (public.is_admin(auth.uid()));

-- ═══════════════════════════════════════════════════════════════════════
-- SEED DATA — The 6 specialists
-- ═══════════════════════════════════════════════════════════════════════
insert into public.experts (slug, name, title, short_role, bio_short, credentials, specialisms, years_experience, clients_trained, location, display_order)
values
  ('siva-reddy', 'Siva Reddy', 'PT Head & Founder', 'PT Head', 'ICN medalist and engineer-turned-coach. Built every PURE X training programme from the ground up.', ARRAY['ICN Gold 2024', 'Powerlifting Trainer', 'Injury Rehab', 'INPTA Certified'], ARRAY['HYROX', 'Strength', 'Fat Loss', 'Injury Rehab'], 8, 100, 'Hyderabad', 1),
  ('chandralekha', 'Chandralekha', 'Consultant Doctor', 'Doctor', 'Government hospital clinician turning fitness into medically supervised health transformation.', ARRAY['MBBS', 'Govt. Hospital Practice', 'Sports Medicine Focus'], ARRAY['Medical Screening', 'Cardiovascular Health', 'Metabolic Assessment'], 10, 500, 'Hyderabad', 2),
  ('krishna', 'Krishna', 'Physiotherapist', 'Physio', '1,000+ clients. Prevention-first physiotherapy built into every training plan.', ARRAY['BPT', 'Sports Physio Certified', 'Manual Therapy'], ARRAY['Movement Assessment', 'Rehab', 'Injury Prevention'], 5, 1000, 'Hyderabad', 3),
  ('paula-konasionok', 'Paula Konasionok', 'Athletic Performance Coach', 'Athletic', 'CIMSPA-endorsed UK performance coach. HYROX and IRONMAN specialist.', ARRAY['CIMSPA UK', 'HYROX Coach', 'L3 Personal Training'], ARRAY['HYROX', 'IRONMAN', 'Endurance', 'Athletic Performance'], 7, 200, 'London', 4),
  ('amber-jasari', 'Amber Jasari', 'Mental Performance Specialist', 'Mental', 'London-based trauma-informed mind-body integration specialist.', ARRAY['CPBAB', 'Mental Performance Consulting', 'Trauma-Informed Practice'], ARRAY['Mental Performance', 'Stress Management', 'Mind-Body Integration'], 6, 150, 'London', 5),
  ('siva-jampana', 'Siva Jampana', 'Ops & Onboarding Head', 'Ops', 'HYROX Pro Doubles competitor and 20kg transformation. Runs operations and client onboarding.', ARRAY['HYROX Pro', 'Operations Management', 'Client Success'], ARRAY['Onboarding', 'Programme Management', 'HYROX Doubles'], 5, 300, 'Hyderabad', 6)
on conflict (slug) do update
  set name = excluded.name,
      title = excluded.title,
      short_role = excluded.short_role,
      bio_short = excluded.bio_short,
      credentials = excluded.credentials,
      specialisms = excluded.specialisms,
      updated_at = now();

-- ═══════════════════════════════════════════════════════════════════════
-- Done! Your schema is ready. Next: promote a user to admin.
--   update public.profiles set role = 'admin' where email = 'your@email.com';
-- ═══════════════════════════════════════════════════════════════════════
