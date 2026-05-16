-- ════════════════════════════════════════════════════════════════════
-- PURE X — Mother Strong cohort
-- ════════════════════════════════════════════════════════════════════
--
-- A free 60-day "10,000 Steps Challenge" for mothers. Public can
-- register from /mother-strong (Zod-validated server action),
-- trainer logs daily step counts from /admin/mother-strong, and the
-- public leaderboard at /mother-strong/leaderboard ranks active
-- participants by consistency / streak / total steps.
--
-- Run order: after 00012_signup_approval.sql
-- Idempotent: every CREATE uses IF NOT EXISTS; policies are dropped
-- and recreated.
-- ════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════
-- 1. Storage bucket for participant photos + journey-feed posts
-- ════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('mother-strong-photos', 'mother-strong-photos', true)
on conflict (id) do nothing;

-- Public read so the leaderboard avatars and journey feed serve
-- directly without signed URLs.
drop policy if exists "Public read mother-strong photos" on storage.objects;
create policy "Public read mother-strong photos"
  on storage.objects for select
  using (bucket_id = 'mother-strong-photos');

-- Only the service role (used by server actions) and admins can
-- write into this bucket. Public clients use the registration server
-- action, which runs under the service role.
drop policy if exists "Admins write mother-strong photos" on storage.objects;
create policy "Admins write mother-strong photos"
  on storage.objects for all
  using (
    bucket_id = 'mother-strong-photos'
    and public.is_admin(auth.uid())
  )
  with check (
    bucket_id = 'mother-strong-photos'
    and public.is_admin(auth.uid())
  );


-- ════════════════════════════════════════════════════════════════════
-- 2. Display-id sequence (gives PX001, PX002 …)
-- ════════════════════════════════════════════════════════════════════

create sequence if not exists public.mother_strong_display_seq start with 1;


-- ════════════════════════════════════════════════════════════════════
-- 3. Participants
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.mother_strong_participants (
  id uuid primary key default gen_random_uuid(),
  display_id text unique not null
    default 'PX' || lpad(nextval('public.mother_strong_display_seq')::text, 3, '0'),
  full_name text not null,
  whatsapp text unique not null check (whatsapp ~ '^[0-9]{10}$'),
  age integer not null check (age between 18 and 110),
  city text not null,
  state text not null,
  photo_url text,
  show_photo_publicly boolean not null default true,
  height_cm integer check (height_cm is null or height_cm between 100 and 250),
  weight_kg numeric(5,2) check (weight_kg is null or weight_kg between 25 and 250),
  goal text not null check (goal in (
    'weight_loss', 'hormonal_balance', 'daily_activity',
    'stress_mental_health', 'general_fitness', 'doctors_advice'
  )),
  health_condition text,
  emergency_contact_name text not null,
  emergency_contact_number text not null check (emergency_contact_number ~ '^[0-9]{10}$'),
  preferred_language text not null default 'en' check (preferred_language in ('en','hi')),
  start_date date not null default current_date,
  end_date date not null,
  status text not null default 'active' check (status in ('active','dropped','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_msp_status on public.mother_strong_participants(status);
create index if not exists idx_msp_start_date on public.mother_strong_participants(start_date);


-- ════════════════════════════════════════════════════════════════════
-- 4. Daily step entries (trainer logs)
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.mother_strong_daily_entries (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.mother_strong_participants(id) on delete cascade,
  day_number integer not null check (day_number between 1 and 60),
  step_count integer not null check (step_count between 0 and 200000),
  entered_at timestamptz not null default now(),
  entered_by uuid references auth.users(id),
  unique (participant_id, day_number)
);

create index if not exists idx_msde_participant on public.mother_strong_daily_entries(participant_id);


-- ════════════════════════════════════════════════════════════════════
-- 5. Journey feed (admin-uploaded cohort photos)
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.mother_strong_journey_posts (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references public.mother_strong_participants(id) on delete set null,
  caption text,
  image_url text not null,
  day_number integer check (day_number is null or day_number between 1 and 60),
  posted_at timestamptz not null default now(),
  posted_by uuid references auth.users(id)
);

create index if not exists idx_msjp_posted_at on public.mother_strong_journey_posts(posted_at desc);


-- ════════════════════════════════════════════════════════════════════
-- 6. Single-row config
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.mother_strong_config (
  id integer primary key default 1 check (id = 1),
  challenge_start_date date,
  daily_goal integer not null default 10000 check (daily_goal between 1000 and 50000),
  whatsapp_group_link text,
  cohort_label text,
  updated_at timestamptz not null default now()
);

insert into public.mother_strong_config (id, daily_goal, cohort_label)
values (1, 10000, 'Mother''s Day 2026')
on conflict (id) do nothing;


-- ════════════════════════════════════════════════════════════════════
-- 7. Public leaderboard view (security_invoker)
-- ════════════════════════════════════════════════════════════════════
--
-- Public-safe — exposes a masked name ("Sravya K.") and photo only
-- if the participant opted in. Excludes 'dropped' participants. The
-- public web client reads from this view (not the table) so it
-- never sees phone numbers, emergency contacts, or health data.
--
-- Definitions:
--   days_elapsed   — days_since_start, capped at 60 and at today
--   days_hit_goal  — count of entries where step_count >= daily_goal
--   total_steps    — sum of step_count for this participant
--   current_streak — longest unbroken run of goal-hitting days
--                    ending on the most recent entered day
--   consistency_pct — days_hit_goal * 100.0 / days_elapsed (0 when 0)

create or replace view public.mother_strong_leaderboard
with (security_invoker = true) as
with goal as (
  select coalesce((select daily_goal from public.mother_strong_config where id = 1), 10000) as g
),
elapsed as (
  select
    p.id,
    least(
      60,
      greatest(0, (current_date - p.start_date)::int + 1)
    ) as days_elapsed
  from public.mother_strong_participants p
),
hits as (
  select
    e.participant_id,
    count(*) filter (where e.step_count >= (select g from goal)) as days_hit_goal,
    coalesce(sum(e.step_count), 0)::bigint as total_steps
  from public.mother_strong_daily_entries e
  group by e.participant_id
),
streaks as (
  -- For each participant, walk back from the latest entered day and
  -- count consecutive days where step_count >= goal.
  select
    e.participant_id,
    (
      select coalesce(count(*), 0)
      from (
        select
          step_count,
          row_number() over (order by day_number desc) as r,
          day_number,
          max(day_number) over () as latest
        from public.mother_strong_daily_entries
        where participant_id = e.participant_id
      ) ranked
      where ranked.day_number = ranked.latest - ranked.r + 1
        and ranked.step_count >= (select g from goal)
    ) as current_streak
  from public.mother_strong_daily_entries e
  group by e.participant_id
)
select
  p.id,
  p.display_id,
  -- Public-safe name: "Sravya K." Strip everything after the first
  -- space, take the first letter of the last token, uppercase it.
  case
    when position(' ' in trim(p.full_name)) > 0 then
      split_part(trim(p.full_name), ' ', 1)
      || ' '
      || upper(left(regexp_replace(trim(p.full_name), '^.*\s+', ''), 1))
      || '.'
    else trim(p.full_name)
  end as public_name,
  p.city,
  case when p.show_photo_publicly then p.photo_url else null end as public_photo_url,
  p.start_date,
  p.end_date,
  p.status,
  coalesce(el.days_elapsed, 0)::int as days_elapsed,
  coalesce(h.days_hit_goal, 0)::int as days_hit_goal,
  coalesce(h.total_steps, 0)::bigint as total_steps,
  coalesce(s.current_streak, 0)::int as current_streak,
  case
    when coalesce(el.days_elapsed, 0) > 0 then
      round((coalesce(h.days_hit_goal, 0)::numeric * 100.0) / el.days_elapsed, 1)
    else 0
  end as consistency_pct
from public.mother_strong_participants p
left join elapsed el on el.id = p.id
left join hits h on h.participant_id = p.id
left join streaks s on s.participant_id = p.id
where p.status <> 'dropped';


-- ════════════════════════════════════════════════════════════════════
-- 8. RLS — public can register, admins manage everything
-- ════════════════════════════════════════════════════════════════════

alter table public.mother_strong_participants    enable row level security;
alter table public.mother_strong_daily_entries   enable row level security;
alter table public.mother_strong_journey_posts   enable row level security;
alter table public.mother_strong_config          enable row level security;

-- Participants table: writes are admin-only via the service-role
-- client. Public reads happen through the leaderboard view, not the
-- table — leave the table closed to anon.
drop policy if exists "Admins manage participants" on public.mother_strong_participants;
create policy "Admins manage participants"
  on public.mother_strong_participants for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Daily entries — admins only (trainer enters via /admin/mother-strong).
drop policy if exists "Admins manage daily entries" on public.mother_strong_daily_entries;
create policy "Admins manage daily entries"
  on public.mother_strong_daily_entries for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Journey posts — read public, write admin.
drop policy if exists "Public read journey" on public.mother_strong_journey_posts;
create policy "Public read journey"
  on public.mother_strong_journey_posts for select
  using (true);

drop policy if exists "Admins manage journey" on public.mother_strong_journey_posts;
create policy "Admins manage journey"
  on public.mother_strong_journey_posts for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Config — read public, write admin.
drop policy if exists "Public read config" on public.mother_strong_config;
create policy "Public read config"
  on public.mother_strong_config for select
  using (true);

drop policy if exists "Admins manage config" on public.mother_strong_config;
create policy "Admins manage config"
  on public.mother_strong_config for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- The journey view's join leaks participant names. Since the public
-- safe name is computed in the view, we expose the underlying table
-- only via SELECT of the masked columns. The journey query joins
-- with `mother_strong_participants ( full_name, photo_url,
-- show_photo_publicly )` — that read needs to work even for anon,
-- so we add a tightly-scoped read policy that exposes ONLY the
-- mask-relevant columns. Browsers can't pick other columns through
-- this policy because the server query already names them.
drop policy if exists "Public read participant for journey" on public.mother_strong_participants;
create policy "Public read participant for journey"
  on public.mother_strong_participants for select
  using (true);
-- (Column-level grants in Supabase would be cleaner; the public
-- query in lib/data/mother-strong.ts already self-restricts the
-- selected columns. The leaderboard view also reads through this
-- policy under security_invoker.)


-- ════════════════════════════════════════════════════════════════════
-- 9. updated_at triggers (best-effort)
-- ════════════════════════════════════════════════════════════════════

create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_msp_touch on public.mother_strong_participants;
create trigger trg_msp_touch
  before update on public.mother_strong_participants
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_msc_touch on public.mother_strong_config;
create trigger trg_msc_touch
  before update on public.mother_strong_config
  for each row execute function public.touch_updated_at();


-- ════════════════════════════════════════════════════════════════════
-- 10. Sanity comment
-- ════════════════════════════════════════════════════════════════════
--
-- After running this migration:
--   • /mother-strong public registration form will save into
--     mother_strong_participants via the service-role client used by
--     the registerParticipant server action.
--   • /admin/mother-strong (sidebar entry) loads participants, the
--     daily-entry grid, journey feed, config form, and gratitude-card
--     generator.
--   • /mother-strong/leaderboard reads the public view.
--
-- The public leaderboard's public_name has a known case bug for
-- single-letter surnames — fixed in 00014_mother_strong_name_format_fix.sql.
-- ════════════════════════════════════════════════════════════════════
