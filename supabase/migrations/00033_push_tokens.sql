-- FCM push notification tokens — one row per (user, device).
--
-- A single user can have multiple tokens: they install the app on
-- their phone AND tablet, or reinstall (FCM reissues a fresh token
-- per install). We keep them all so a coach's "send nudge" hits
-- every device the client owns.
--
-- On token rotation (FCM rotates tokens over the lifetime of an
-- install), the app POSTs the new token to /api/push/register and
-- we upsert on the token column — an already-existing token has
-- its `last_seen_at` refreshed; a genuinely new token creates a
-- new row.
--
-- Cleanup: rows whose send returns FCM error UNREGISTERED are
-- deleted from the send path (see lib/data/fcm-send.ts). We don't
-- otherwise expire — an idle 6-month-old token is fine to keep;
-- FCM handles retries and delivery.

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('android', 'ios', 'web')),
  device_label text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists push_tokens_user_id_idx
  on public.push_tokens(user_id);

alter table public.push_tokens enable row level security;

-- Clients can only see / manage their own tokens.
create policy "clients read own push tokens"
  on public.push_tokens for select
  using (auth.uid() = user_id);

create policy "clients insert own push tokens"
  on public.push_tokens for insert
  with check (auth.uid() = user_id);

create policy "clients update own push tokens"
  on public.push_tokens for update
  using (auth.uid() = user_id);

create policy "clients delete own push tokens"
  on public.push_tokens for delete
  using (auth.uid() = user_id);

-- Admin service-role bypass is implicit — service_role bypasses RLS
-- entirely, which is how the FCM send-side (from admin) reads any
-- user's tokens without a per-user JWT.

comment on table public.push_tokens is
  'FCM push notification device tokens. One row per (user, device). Cleaned up on FCM UNREGISTERED response.';
