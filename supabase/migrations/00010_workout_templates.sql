-- ════════════════════════════════════════════════════════════════════
-- PURE X — Phase 6: Reusable workout templates
-- ════════════════════════════════════════════════════════════════════
--
-- 15 clients × 7 days × 7-8 exercises is too many decisions to make
-- one row at a time. A trainer can build a small library of named
-- templates ("Chest Day A", "Pull Hypertrophy") once, then assigning
-- a daily plan becomes "pick a template + tweak" instead of typing
-- everything from scratch.
--
-- Tables:
--   workout_templates           — header (name, category, muscle group,
--                                  trainer notes, ownership)
--   workout_template_exercises  — children (planned exercise rows,
--                                  ordered)
--
-- Apply flow: a server action reads a template and INSERTs the rows
-- into client_workouts + client_workout_exercises for a target
-- (client_id, plan_date). Templates themselves are untouched.
--
-- Run order: after 00009_per_set_actuals.sql
-- Idempotent.
-- ════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════
-- 1. workout_templates
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),

  -- Identity
  name text not null,                                  -- 'Chest Day A'
  category text,                                       -- 'Strength' | 'HYROX' | 'Conditioning' | 'Mobility' | 'Cardio' | 'Sport' | 'Rest'
  target_muscle_group text,                            -- 'Push (Chest · Shoulders · Triceps)'
  description text,
  trainer_notes text,                                  -- default coaching notes copied into the plan
  next_day_instructions text,

  -- Suggested intensity
  estimated_duration_minutes int,
  difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')),

  -- Ownership
  created_by uuid references public.profiles(id) on delete set null,
  /** When false, only the creator (and admins) sees this template. Default true so any trainer can pick from a shared pool. */
  is_shared boolean not null default true,

  -- Lifecycle
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_workout_templates_active
  on public.workout_templates(is_active);
create index if not exists idx_workout_templates_created_by
  on public.workout_templates(created_by);
create index if not exists idx_workout_templates_category
  on public.workout_templates(category);

drop trigger if exists tr_workout_templates_updated on public.workout_templates;
create trigger tr_workout_templates_updated
  before update on public.workout_templates
  for each row execute procedure public.set_updated_at();


-- ════════════════════════════════════════════════════════════════════
-- 2. workout_template_exercises
-- ════════════════════════════════════════════════════════════════════
-- Same shape as client_workout_exercises minus the client-specific FK.

create table if not exists public.workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null
    references public.workout_templates(id) on delete cascade,

  exercise_name text not null,
  target_muscle text,
  exercise_library_id uuid references public.exercise_library(id) on delete set null,

  sets int,
  reps text,
  target_weight_kg numeric(6,2),
  rest_seconds int,
  tempo text,
  rpe_target int check (rpe_target between 1 and 10),

  trainer_instruction text,
  exercise_order int not null default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_workout_template_exercises_template
  on public.workout_template_exercises(template_id, exercise_order);

drop trigger if exists tr_workout_template_exercises_updated
  on public.workout_template_exercises;
create trigger tr_workout_template_exercises_updated
  before update on public.workout_template_exercises
  for each row execute procedure public.set_updated_at();


-- ════════════════════════════════════════════════════════════════════
-- 3. RLS
-- ════════════════════════════════════════════════════════════════════
-- Templates are trainer/admin-only. Clients have no business reading
-- them. Trainers can read shared templates + their own; can write
-- their own. Admins can do anything.

alter table public.workout_templates enable row level security;

drop policy if exists "Trainers read shared and own templates"
  on public.workout_templates;
create policy "Trainers read shared and own templates"
  on public.workout_templates
  for select
  using (
    public.is_admin_user()
    or (
      -- Any authenticated trainer can read shared templates.
      is_shared = true
      and exists (
        select 1 from public.profiles
        where id = auth.uid() and (is_trainer = true or role in ('admin', 'super_admin'))
      )
    )
    or created_by = auth.uid()
  );

drop policy if exists "Trainers manage own templates"
  on public.workout_templates;
create policy "Trainers manage own templates"
  on public.workout_templates
  for all
  using (
    public.is_admin_user()
    or created_by = auth.uid()
  )
  with check (
    public.is_admin_user()
    or created_by = auth.uid()
  );


alter table public.workout_template_exercises enable row level security;

-- For the children, defer to the parent template's permissions via
-- an exists() subquery.
drop policy if exists "Read template exercises if template visible"
  on public.workout_template_exercises;
create policy "Read template exercises if template visible"
  on public.workout_template_exercises
  for select
  using (
    exists (
      select 1 from public.workout_templates t
      where t.id = workout_template_exercises.template_id
        and (
          public.is_admin_user()
          or (
            t.is_shared = true
            and exists (
              select 1 from public.profiles p
              where p.id = auth.uid()
                and (p.is_trainer = true or p.role in ('admin', 'super_admin'))
            )
          )
          or t.created_by = auth.uid()
        )
    )
  );

drop policy if exists "Manage template exercises if template owned"
  on public.workout_template_exercises;
create policy "Manage template exercises if template owned"
  on public.workout_template_exercises
  for all
  using (
    exists (
      select 1 from public.workout_templates t
      where t.id = workout_template_exercises.template_id
        and (public.is_admin_user() or t.created_by = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.workout_templates t
      where t.id = workout_template_exercises.template_id
        and (public.is_admin_user() or t.created_by = auth.uid())
    )
  );


-- ════════════════════════════════════════════════════════════════════
-- DONE
-- ════════════════════════════════════════════════════════════════════
