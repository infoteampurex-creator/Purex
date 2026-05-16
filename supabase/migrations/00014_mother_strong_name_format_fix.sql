-- ════════════════════════════════════════════════════════════════════
-- PURE X — Mother Strong public-name casing fix
-- ════════════════════════════════════════════════════════════════════
--
-- Bug: the original mother_strong_leaderboard view took left(name, 1)
-- on a reversed last-token expression, which yielded the LAST
-- character of the surname in lowercase (so "Test More" → "Test m.").
--
-- Fix: extract the last whitespace-separated token using regexp,
-- take its first character, uppercase it. "Test More" → "Test M."
--
-- Run order: after 00013_mother_strong.sql
-- Idempotent (CREATE OR REPLACE VIEW).
-- ════════════════════════════════════════════════════════════════════

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
