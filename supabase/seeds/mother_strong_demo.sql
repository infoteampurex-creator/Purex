-- ════════════════════════════════════════════════════════════════════
-- PUREX Mother Strong — demo seed
-- ════════════════════════════════════════════════════════════════════
--
-- Seeds 5 sample participants with realistic daily-entry patterns and
-- 3 sample journey posts. Useful for QA, screenshots, and demoing
-- the leaderboard / personal-progress / homepage-teaser without
-- waiting for real registrations.
--
-- Idempotent: every demo row uses a WhatsApp number in the
-- 99990000XX range. Re-running this file will skip rows that already
-- exist (insert ... on conflict do nothing).
--
-- Run order: AFTER migrations 00013 + 00014. Run from the Supabase
-- SQL editor in production or via psql locally.
--
-- To remove the seed: see the cleanup block at the bottom.
-- ════════════════════════════════════════════════════════════════════

begin;

-- ─── 1. Config — set up a 60-day cohort starting 14 days ago ───
update public.mother_strong_config
  set
    challenge_start_date = (current_date - interval '14 days')::date,
    daily_goal = 10000,
    cohort_label = coalesce(cohort_label, 'Demo cohort'),
    whatsapp_group_link = coalesce(whatsapp_group_link, 'https://chat.whatsapp.com/example')
  where id = 1;

-- If no config row exists yet (fresh DB), insert one.
insert into public.mother_strong_config
  (id, challenge_start_date, daily_goal, cohort_label, whatsapp_group_link)
  values
  (1, (current_date - interval '14 days')::date, 10000,
   'Demo cohort', 'https://chat.whatsapp.com/example')
on conflict (id) do nothing;


-- ─── 2. Five sample participants ───
-- Each starts a different number of days ago so the leaderboard
-- shows mixed progress (rank 1 has the most days elapsed).
--
-- Names are realistic Indian Pan-state mix. WhatsApp numbers in the
-- reserved 9999000001..9999000005 range so we can identify + remove
-- seed rows cleanly.

insert into public.mother_strong_participants
  (full_name, whatsapp, age, city, state, show_photo_publicly,
   height_cm, weight_kg, goal, emergency_contact_name,
   emergency_contact_number, preferred_language,
   start_date, end_date, status)
values
  -- 1. Sravya — top of board, started 30 days ago, hits goal most days
  ('Sravya Kumari', '9999000001', 42, 'Hyderabad', 'Telangana', true,
   162, 64.5, 'general_fitness', 'Vinay Kumar',
   '9876543210', 'en',
   (current_date - interval '30 days')::date,
   (current_date - interval '30 days' + interval '59 days')::date,
   'active'),
  -- 2. Anjali — strong, started 20 days ago
  ('Anjali Sharma', '9999000002', 38, 'Pune', 'Maharashtra', true,
   158, 58.2, 'weight_loss', 'Ravi Sharma',
   '9876543211', 'en',
   (current_date - interval '20 days')::date,
   (current_date - interval '20 days' + interval '59 days')::date,
   'active'),
  -- 3. Priya — registered 10 days ago, mid-board
  ('Priya Ramesh', '9999000003', 45, 'Bengaluru', 'Karnataka', false, -- opted out of public photo
   165, 72.0, 'hormonal_balance', 'Ramesh Iyer',
   '9876543212', 'en',
   (current_date - interval '10 days')::date,
   (current_date - interval '10 days' + interval '59 days')::date,
   'active'),
  -- 4. Lakshmi — registered 5 days ago, still warming up
  ('Lakshmi Naidu', '9999000004', 51, 'Visakhapatnam', 'Andhra Pradesh', true,
   155, 66.8, 'doctors_advice', 'Suresh Naidu',
   '9876543213', 'en',
   (current_date - interval '5 days')::date,
   (current_date - interval '5 days' + interval '59 days')::date,
   'active'),
  -- 5. Meera — registered today, no entries yet
  ('Meera Iyer', '9999000005', 60, 'Chennai', 'Tamil Nadu', true,
   160, 62.0, 'stress_mental_health', 'Krishnan Iyer',
   '9876543214', 'en',
   current_date,
   (current_date + interval '59 days')::date,
   'active')
on conflict (whatsapp) do nothing;


-- ─── 3. Daily entries ───
-- Generate per-participant entry rows. Patterns:
--   Sravya: 30 days, hits 10K on ~85% of them, occasional 7-9K days
--   Anjali: 20 days, hits 10K on ~75%
--   Priya:  10 days, hits 10K on ~55%
--   Lakshmi: 5 days, all hit but lower target (around 8-12K)
--   Meera:  0 entries (just registered)

-- Helper: insert N days of entries for one participant, with a
-- "hit-rate" probability. Uses generate_series and a deterministic
-- pseudo-random function so seed reruns produce the same numbers.

do $$
declare
  p_sravya  uuid := (select id from public.mother_strong_participants where whatsapp = '9999000001');
  p_anjali  uuid := (select id from public.mother_strong_participants where whatsapp = '9999000002');
  p_priya   uuid := (select id from public.mother_strong_participants where whatsapp = '9999000003');
  p_lakshmi uuid := (select id from public.mother_strong_participants where whatsapp = '9999000004');
begin
  -- Sravya: 30 days, mostly hitting goal
  if p_sravya is not null then
    insert into public.mother_strong_daily_entries (participant_id, day_number, step_count)
    select
      p_sravya,
      d,
      case
        -- Days 5 and 18 are misses (~7K-8K), the rest are 10K-13K
        when d in (5, 18) then 7500 + ((d * 113) % 800)
        when d % 9 = 0    then 8800 + ((d * 197) % 500)
        else                   10200 + ((d * 311) % 2900)
      end
    from generate_series(1, 30) as d
    on conflict (participant_id, day_number) do nothing;
  end if;

  -- Anjali: 20 days, hits 10K most days, two misses
  if p_anjali is not null then
    insert into public.mother_strong_daily_entries (participant_id, day_number, step_count)
    select
      p_anjali,
      d,
      case
        when d in (4, 12) then 6800 + ((d * 89)  % 600)
        when d % 7 = 0    then 9100 + ((d * 137) % 600)
        else                   10100 + ((d * 233) % 2200)
      end
    from generate_series(1, 20) as d
    on conflict (participant_id, day_number) do nothing;
  end if;

  -- Priya: 10 days, mixed. About half hit goal.
  if p_priya is not null then
    insert into public.mother_strong_daily_entries (participant_id, day_number, step_count)
    select
      p_priya,
      d,
      case
        when d % 2 = 0 then 10300 + ((d * 167) % 1900)
        else                7400 + ((d * 211) % 1900)
      end
    from generate_series(1, 10) as d
    on conflict (participant_id, day_number) do nothing;
  end if;

  -- Lakshmi: 5 days, all hits but lower target around 10-12K
  if p_lakshmi is not null then
    insert into public.mother_strong_daily_entries (participant_id, day_number, step_count)
    select
      p_lakshmi,
      d,
      10100 + ((d * 313) % 1900)
    from generate_series(1, 5) as d
    on conflict (participant_id, day_number) do nothing;
  end if;
end $$;


-- ─── 4. Journey posts ───
-- Three demo posts using placehold.co (a free placeholder image
-- service). In production these would be admin-uploaded photos in
-- the mother-strong-photos storage bucket; for the seed we use
-- external URLs so this file has no dependencies on Storage state.

insert into public.mother_strong_journey_posts
  (participant_id, caption, image_url, day_number, posted_at)
select
  (select id from public.mother_strong_participants where whatsapp = '9999000001'),
  'Day 10 — Lumbini Park, Hyderabad. Morning walk in light drizzle. The cohort group is alive on WhatsApp.',
  'https://placehold.co/1200x1200/1f2a16/c6ff3d?text=Day+10+%E2%80%94+Lumbini+Park',
  10,
  now() - interval '4 days'
where not exists (
  select 1 from public.mother_strong_journey_posts
  where image_url like 'https://placehold.co/%Day+10%'
);

insert into public.mother_strong_journey_posts
  (participant_id, caption, image_url, day_number, posted_at)
select
  (select id from public.mother_strong_participants where whatsapp = '9999000002'),
  'First week wrap-up — Anjali clocked 70K steps. Whole cohort cheering.',
  'https://placehold.co/1200x1200/1f2a16/c6ff3d?text=Week+1+Wrap',
  7,
  now() - interval '12 days'
where not exists (
  select 1 from public.mother_strong_journey_posts
  where image_url like 'https://placehold.co/%Week+1+Wrap%'
);

insert into public.mother_strong_journey_posts
  (participant_id, caption, image_url, day_number, posted_at)
select
  null, -- not tied to a single participant
  'Welcome to the new joiners this week. Five mothers, five cities, one cohort.',
  'https://placehold.co/1200x1200/1f2a16/c6ff3d?text=Welcome+New+Joiners',
  null,
  now() - interval '1 day'
where not exists (
  select 1 from public.mother_strong_journey_posts
  where image_url like 'https://placehold.co/%Welcome+New+Joiners%'
);


-- ─── 5. Confirm + print ───
do $$
declare
  c integer;
  ids text;
begin
  select count(*) into c from public.mother_strong_participants where whatsapp like '9999000%';
  select string_agg(display_id, ', ') into ids
    from public.mother_strong_participants where whatsapp like '9999000%';
  raise notice '── Mother Strong demo seed complete ──';
  raise notice 'Participants seeded: % (display_ids: %)', c, ids;
  raise notice 'Daily entries: % rows',
    (select count(*) from public.mother_strong_daily_entries de
       join public.mother_strong_participants p on p.id = de.participant_id
       where p.whatsapp like '9999000%');
  raise notice 'Journey posts: % rows',
    (select count(*) from public.mother_strong_journey_posts
       where image_url like 'https://placehold.co/%');
end $$;

commit;


-- ════════════════════════════════════════════════════════════════════
-- CLEANUP (uncomment + run to remove the demo data)
-- ════════════════════════════════════════════════════════════════════
--
-- begin;
--   delete from public.mother_strong_journey_posts
--     where image_url like 'https://placehold.co/%';
--   delete from public.mother_strong_daily_entries
--     where participant_id in (
--       select id from public.mother_strong_participants
--       where whatsapp like '9999000%'
--     );
--   delete from public.mother_strong_participants
--     where whatsapp like '9999000%';
-- commit;
-- ════════════════════════════════════════════════════════════════════
