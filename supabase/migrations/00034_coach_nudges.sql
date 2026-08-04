-- Coach nudges — log of automated push notifications sent by the
-- coach-nudges cron. Two purposes:
--
--   1. Idempotence: prevent sending the same nudge twice within 24 h.
--      The cron may fire more than once per day (Vercel Cron
--      guarantees "at least once", not "exactly once"), and we
--      don't want to spam clients.
--
--   2. Audit: coach opens the client-detail page and sees "3
--      automated nudges sent in the last 14 days" so they know
--      the system's already reached out.
--
-- Every row = one nudge sent to one client. If the FCM send failed,
-- we still log the row with sent_ok=false so the retry logic
-- can pick it up on the next cron pass.

create table if not exists public.coach_nudges (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  rule_key text not null, -- e.g. 'inactivity_3d', 'streak_at_risk', 'workout_missed'
  title text not null,
  body text not null,
  sent_at timestamptz not null default now(),
  sent_ok boolean not null default true,
  fcm_error text
);

create index if not exists coach_nudges_client_id_sent_at_idx
  on public.coach_nudges(client_id, sent_at desc);

create index if not exists coach_nudges_rule_client_sent_idx
  on public.coach_nudges(rule_key, client_id, sent_at desc);

alter table public.coach_nudges enable row level security;

-- Only admins can read the nudge log. Clients can't see whether
-- they've been auto-nudged (the whole point is that it feels like
-- coaching, not surveillance).
create policy "admins read all nudges"
  on public.coach_nudges for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'super_admin')
    )
  );

-- Service role bypasses RLS entirely; that's how the cron writes.
-- No insert / update policy needed for regular users.

comment on table public.coach_nudges is
  'Log of automated coach nudges (push notifications). Used for de-duplication + audit trail. Service-role writes only.';
