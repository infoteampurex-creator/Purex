-- ════════════════════════════════════════════════════════════════════
-- PURE X — Moderated signup flow
-- ════════════════════════════════════════════════════════════════════
--
-- Public signups should NOT auto-grant dashboard access. Every new
-- self-registered account lands as 'pending_approval'. An admin
-- approves (or rejects) before the user can use /client/*.
--
-- Accounts created via the admin "Add Client" modal are pre-approved
-- — they pass `admin_created: true` in user_metadata, and the trigger
-- sets signup_status='approved' on insert.
--
-- Run order: after 00011_seed_workout_templates.sql
-- Idempotent.
-- ════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════
-- 1. Add signup_status + audit columns to profiles
-- ════════════════════════════════════════════════════════════════════

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
      and column_name = 'signup_status'
  ) then
    alter table public.profiles
      add column signup_status text not null default 'approved'
        check (signup_status in ('pending_approval', 'approved', 'rejected'));
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
      and column_name = 'approved_at'
  ) then
    alter table public.profiles add column approved_at timestamptz;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
      and column_name = 'approved_by'
  ) then
    alter table public.profiles
      add column approved_by uuid references public.profiles(id) on delete set null;
  end if;
end $$;

-- Backfill: every existing profile gets 'approved' so we don't lock
-- anyone currently active out. The default on the column above also
-- handles new admin-created flows.
update public.profiles
   set signup_status = 'approved'
 where signup_status is null;

create index if not exists idx_profiles_signup_status
  on public.profiles(signup_status);


-- ════════════════════════════════════════════════════════════════════
-- 2. Update on-signup trigger so self-signups start as pending
-- ════════════════════════════════════════════════════════════════════
-- The original handle_new_user (00001) blindly inserted a profile row.
-- We now inspect auth.users.raw_user_meta_data:
--   - admin_created = true  → auto-approve (Add Client modal flow)
--   - otherwise             → pending_approval (public signup flow)
--
-- Existing accounts are unaffected because the trigger only fires on
-- INSERT into auth.users. Existing rows were backfilled above.

create or replace function public.handle_new_user()
returns trigger as $$
declare
  initial_status text := 'pending_approval';
begin
  -- Admin-created accounts mark themselves via user_metadata so we
  -- can short-circuit the approval gate.
  if coalesce((new.raw_user_meta_data->>'admin_created')::boolean, false) then
    initial_status := 'approved';
  end if;

  insert into public.profiles (id, email, full_name, signup_status, approved_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    initial_status,
    -- Record the auto-approval timestamp for admin-created users so
    -- the audit trail stays clean.
    case when initial_status = 'approved' then now() else null end
  )
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

-- (Trigger itself was already created in 00001 — function replacement
-- is enough; no need to drop/recreate the trigger binding.)


-- ════════════════════════════════════════════════════════════════════
-- DONE — what this leaves intact
-- ════════════════════════════════════════════════════════════════════
-- · Existing users keep working (backfilled to 'approved').
-- · createClientFromAdmin will be updated in app code to pass
--   admin_created=true; new admin-created users auto-approve.
-- · Public signup at /signup writes a pending row; middleware
--   redirects them to /pending-approval until an admin acts.
