-- ─────────────────────────────────────────────────────────────────
-- 00015 — Meal logging (Phase 1: manual entry, foundation for AI)
-- ─────────────────────────────────────────────────────────────────
--
-- Adds:
--   • client_meals table — individual meal entries (breakfast, lunch
--     etc.) with calories + macros + an optional photo_url + ai_raw
--     for the Phase 2 AI vision result.
--   • Missing columns on client_daily_logs:
--       fiber_g, fiber_target_g, calories_burned, carbs_target_g,
--       fats_target_g
--     so we can fully store the day's roll-up + targets.
--   • Trigger to auto-update client_daily_logs roll-up totals
--     whenever a meal is inserted/updated/deleted.
-- ─────────────────────────────────────────────────────────────────

-- ─── client_daily_logs: missing columns ──────────────────────────

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'client_daily_logs'
      and column_name = 'fiber_g'
  ) then
    alter table public.client_daily_logs add column fiber_g int;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'client_daily_logs'
      and column_name = 'fiber_target_g'
  ) then
    alter table public.client_daily_logs add column fiber_target_g int default 25;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'client_daily_logs'
      and column_name = 'calories_burned'
  ) then
    alter table public.client_daily_logs add column calories_burned int;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'client_daily_logs'
      and column_name = 'carbs_target_g'
  ) then
    alter table public.client_daily_logs add column carbs_target_g int;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'client_daily_logs'
      and column_name = 'fats_target_g'
  ) then
    alter table public.client_daily_logs add column fats_target_g int;
  end if;
end $$;

-- ─── client_meals ────────────────────────────────────────────────
-- One row per logged meal. Day-rollup trigger keeps client_daily_logs
-- in sync, so the Twin / fitness tiles / streak scoring keep working
-- against the same calories_consumed/protein_g/etc. columns they
-- already read.

create table if not exists public.client_meals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null default current_date,

  meal_type text not null
    check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack', 'other')),

  -- Optional human label ("Idli & sambar", "Grilled chicken bowl")
  name text,

  -- Macros — what one meal contributed. Roll-up trigger sums these
  -- into client_daily_logs.calories_consumed / protein_g / etc.
  calories int not null default 0,
  protein_g int not null default 0,
  carbs_g int not null default 0,
  fats_g int not null default 0,
  fiber_g int not null default 0,

  -- Phase 2 photo + AI fields
  photo_url text,        -- Supabase Storage URL (Phase 2)
  ai_raw jsonb,          -- raw AI vision response for debugging
  ai_confidence numeric(3,2) check (ai_confidence between 0 and 1),
  source text not null default 'manual'
    check (source in ('manual', 'ai_photo', 'health_connect')),

  -- Free-text notes from the user ("ate out", "high salt", etc.)
  note text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_meals_client_date
  on public.client_meals(client_id, log_date desc);

drop trigger if exists tr_meals_updated on public.client_meals;
create trigger tr_meals_updated
  before update on public.client_meals
  for each row execute procedure public.set_updated_at();

-- ─── Roll-up trigger ─────────────────────────────────────────────
-- After any meal write, recompute the day's totals and upsert into
-- client_daily_logs. Idempotent — running for the same date repeatedly
-- yields the same totals.

create or replace function public.rollup_client_meals_to_daily()
returns trigger
language plpgsql
security definer
as $$
declare
  v_client_id uuid;
  v_log_date  date;
  v_totals    record;
begin
  -- Pull the (client_id, log_date) from whichever row applies.
  -- DELETE → OLD; INSERT/UPDATE → NEW.
  if tg_op = 'DELETE' then
    v_client_id := OLD.client_id;
    v_log_date  := OLD.log_date;
  else
    v_client_id := NEW.client_id;
    v_log_date  := NEW.log_date;
  end if;

  -- Sum every meal for this client+day.
  select
    coalesce(sum(calories), 0) as cal,
    coalesce(sum(protein_g), 0) as protein,
    coalesce(sum(carbs_g),   0) as carbs,
    coalesce(sum(fats_g),    0) as fats,
    coalesce(sum(fiber_g),   0) as fiber
  into v_totals
  from public.client_meals
  where client_id = v_client_id
    and log_date  = v_log_date;

  -- Upsert into client_daily_logs. Other columns (steps, sleep, etc.)
  -- are untouched.
  insert into public.client_daily_logs (
    client_id, log_date,
    calories_consumed, protein_g, carbs_g, fats_g, fiber_g
  )
  values (
    v_client_id, v_log_date,
    v_totals.cal, v_totals.protein, v_totals.carbs, v_totals.fats, v_totals.fiber
  )
  on conflict (client_id, log_date) do update set
    calories_consumed = excluded.calories_consumed,
    protein_g         = excluded.protein_g,
    carbs_g           = excluded.carbs_g,
    fats_g            = excluded.fats_g,
    fiber_g           = excluded.fiber_g,
    updated_at        = now();

  return null; -- after-trigger return value is ignored
end;
$$;

drop trigger if exists tr_meals_rollup on public.client_meals;
create trigger tr_meals_rollup
  after insert or update or delete on public.client_meals
  for each row execute procedure public.rollup_client_meals_to_daily();

-- ─── RLS ─────────────────────────────────────────────────────────

alter table public.client_meals enable row level security;

drop policy if exists "Clients manage own meals" on public.client_meals;
create policy "Clients manage own meals" on public.client_meals
  for all using (auth.uid() = client_id);

drop policy if exists "Admins manage all meals" on public.client_meals;
create policy "Admins manage all meals" on public.client_meals
  for all using (public.is_admin(auth.uid()));
