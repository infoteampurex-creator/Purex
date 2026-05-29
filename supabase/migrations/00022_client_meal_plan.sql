-- ═════════════════════════════════════════════════════════════════════
-- Migration 00022 — Coach-assigned diet plan (per client)
-- ─────────────────────────────────────────────────────────────────────
-- Mirrors the weekly_schedule pattern (00021), but for meals. Siva
-- writes ONE diet block per client (Breakfast / Lunch / Pre-Workout /
-- Dinner / Cooking Oil / Daily Macros / Notes) and the app stores it
-- as a recurring plan that stays valid until he edits it.
--
-- No materialization: clients already log meals into client_meals
-- free-form. The plan is rendered on the client's nutrition page as
-- "today's plan" and used to compute target compliance. When the coach
-- updates the plan, the new version takes effect immediately on the
-- client's next page load — no past data is touched.
--
-- Three tables, parent → child:
--   client_meal_plan          — header (1 row per client). Day-level
--                                macro targets + lifestyle notes
--                                (water / steps / sleep).
--   client_meal_plan_meals    — ordered meal sections (Breakfast, Lunch
--                                Pre-Workout, Dinner, …)
--   client_meal_plan_items    — ordered food items inside each meal
--                                (food_name + quantity text).
--
-- Per-item food_library_id is intentionally OMITTED for v1 — the
-- library lives in TS today (FOOD_SOURCES). When we DB-back the
-- library later, we add the FK in a new migration without disturbing
-- existing rows.
-- ═════════════════════════════════════════════════════════════════════

-- ─── client_meal_plan ───────────────────────────────────────────────

create table if not exists public.client_meal_plan (
  client_id uuid primary key references public.profiles(id) on delete cascade,
  name text,                                  -- e.g. "Cut Phase 1"

  -- Day-level macro targets. Min/max pair supports ranges like
  -- "310-315g carbs" the way coaches actually write them. Single-
  -- value targets just leave _max NULL (we treat min as the target).
  daily_calories int check (daily_calories between 0 and 10000),
  daily_carbs_g_min int check (daily_carbs_g_min between 0 and 1000),
  daily_carbs_g_max int check (daily_carbs_g_max between 0 and 1000),
  daily_protein_g_min int check (daily_protein_g_min between 0 and 500),
  daily_protein_g_max int check (daily_protein_g_max between 0 and 500),
  daily_fats_g_min int check (daily_fats_g_min between 0 and 500),
  daily_fats_g_max int check (daily_fats_g_max between 0 and 500),

  -- Lifestyle targets pulled from the trailing Notes section in
  -- pasted plans ("4 ltrs water", "10k steps", "7 hours sleep").
  daily_water_liters numeric(3,1) check (daily_water_liters between 0 and 20),
  daily_steps_target int check (daily_steps_target between 0 and 60000),
  daily_sleep_hours numeric(3,1) check (daily_sleep_hours between 0 and 16),

  -- The *Cooking Oil* block is daily-total, not per-meal — store it
  -- raw so we can show it as its own card on the client view.
  cooking_oil_note text,

  -- Anything else from the coach's Notes section that we didn't pull
  -- into a structured field. Preserved verbatim.
  notes text,

  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

drop trigger if exists tr_meal_plan_updated on public.client_meal_plan;
create trigger tr_meal_plan_updated
  before update on public.client_meal_plan
  for each row execute procedure public.set_updated_at();

-- ─── client_meal_plan_meals ────────────────────────────────────────

create table if not exists public.client_meal_plan_meals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,

  -- Coach-authored meal label. NOT constrained to the existing
  -- client_meals.meal_type enum — Siva uses "Pre-Workout" which
  -- doesn't fit breakfast/lunch/dinner/snack/other. Free text is the
  -- right call for the plan editor; the client's logging UI still
  -- enforces the DB enum when logging actuals against the plan.
  meal_name text not null,                    -- "Breakfast", "Pre-Workout"

  -- Display order in editor + client view.
  meal_order int not null default 0,

  -- Optional mapping to the enum so we can colour-code the meal card
  -- on the client view ('breakfast' / 'lunch' / etc.).
  meal_type text check (meal_type in ('breakfast','lunch','dinner','snack','pre_workout','post_workout','other')),

  -- Per-meal coach note (overrides / supplements the whole-plan note).
  notes text,

  created_at timestamptz default now()
);

create index if not exists idx_meal_plan_meals_client
  on public.client_meal_plan_meals(client_id, meal_order);

-- ─── client_meal_plan_items ────────────────────────────────────────

create table if not exists public.client_meal_plan_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.client_meal_plan_meals(id) on delete cascade,

  -- "Oats", "1 Whole Egg + 3 Egg Whites", "Olive Oil"
  food_name text not null,
  -- "60g", "150ml", "100g", "275g (cooked)", null for items without
  -- a stated quantity ("Salad to taste").
  quantity text,

  item_order int not null default 0,
  notes text,

  created_at timestamptz default now()
);

create index if not exists idx_meal_plan_items_meal
  on public.client_meal_plan_items(meal_id, item_order);

-- ─── RLS ───────────────────────────────────────────────────────────

alter table public.client_meal_plan enable row level security;
alter table public.client_meal_plan_meals enable row level security;
alter table public.client_meal_plan_items enable row level security;

-- Clients read their own plan + meals + items
drop policy if exists "Clients read own meal plan" on public.client_meal_plan;
create policy "Clients read own meal plan"
  on public.client_meal_plan for select
  using (auth.uid() = client_id);

drop policy if exists "Clients read own meal plan meals" on public.client_meal_plan_meals;
create policy "Clients read own meal plan meals"
  on public.client_meal_plan_meals for select
  using (auth.uid() = client_id);

drop policy if exists "Clients read own meal plan items" on public.client_meal_plan_items;
create policy "Clients read own meal plan items"
  on public.client_meal_plan_items for select
  using (exists (
    select 1 from public.client_meal_plan_meals m
    where m.id = client_meal_plan_items.meal_id
      and m.client_id = auth.uid()
  ));

-- Admins (coaches) manage everything
drop policy if exists "Admins manage all meal plans" on public.client_meal_plan;
create policy "Admins manage all meal plans"
  on public.client_meal_plan for all
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins manage all meal plan meals" on public.client_meal_plan_meals;
create policy "Admins manage all meal plan meals"
  on public.client_meal_plan_meals for all
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins manage all meal plan items" on public.client_meal_plan_items;
create policy "Admins manage all meal plan items"
  on public.client_meal_plan_items for all
  using (public.is_admin(auth.uid()));

-- Refresh PostgREST so the new tables are queryable immediately.
notify pgrst, 'reload schema';
