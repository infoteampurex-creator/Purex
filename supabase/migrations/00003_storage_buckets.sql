-- ═══════════════════════════════════════════════════════════════════════
-- PURE X — Storage Buckets & Policies (Phase 2 Photo Uploads)
-- ═══════════════════════════════════════════════════════════════════════
--
-- Run AFTER 00001_auth_foundation.sql and 00002_admin_schema.sql
--
-- Creates two private storage buckets:
--   1. client-avatars       — profile headshots
--   2. client-progress      — transformation photos (front/side/back)
--
-- Both buckets are PRIVATE. Access is gated by RLS policies:
--   • Clients can upload + read their own files
--   • Admins can upload, read, and manage all files
--
-- File paths are organized as:
--   client-avatars/<client_id>/avatar.jpg
--   client-progress/<client_id>/<check_in_date>/<view>.jpg
--     where <view> is 'front' | 'side' | 'back'
-- ═══════════════════════════════════════════════════════════════════════

-- ─── 1. Create buckets ───
insert into storage.buckets (id, name, public)
values
  ('client-avatars', 'client-avatars', false),
  ('client-progress', 'client-progress', false)
on conflict (id) do nothing;

-- ─── 2. Helper: extract client_id from storage path ───
-- Path pattern is <client_id>/... for both buckets.
-- We compare the first path segment against the user's profile id.

-- ─── 3. RLS POLICIES on storage.objects ───

-- CLIENT-AVATARS bucket
-- Clients manage their own avatar (upload, replace, read, delete)
drop policy if exists "Clients manage own avatar" on storage.objects;
create policy "Clients manage own avatar"
  on storage.objects for all
  using (
    bucket_id = 'client-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'client-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins can manage ALL avatars
drop policy if exists "Admins manage all avatars" on storage.objects;
create policy "Admins manage all avatars"
  on storage.objects for all
  using (
    bucket_id = 'client-avatars'
    and public.is_admin(auth.uid())
  )
  with check (
    bucket_id = 'client-avatars'
    and public.is_admin(auth.uid())
  );

-- CLIENT-PROGRESS bucket
-- Clients read + upload their own progress photos
drop policy if exists "Clients manage own progress photos" on storage.objects;
create policy "Clients manage own progress photos"
  on storage.objects for all
  using (
    bucket_id = 'client-progress'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'client-progress'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins manage ALL progress photos
drop policy if exists "Admins manage all progress photos" on storage.objects;
create policy "Admins manage all progress photos"
  on storage.objects for all
  using (
    bucket_id = 'client-progress'
    and public.is_admin(auth.uid())
  )
  with check (
    bucket_id = 'client-progress'
    and public.is_admin(auth.uid())
  );

-- ─── 4. Add avatar_url column to profiles (if not already present) ───
-- profiles table already has avatar_url from 00001 migration, but ensure it exists
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'profiles' and column_name = 'avatar_url'
  ) then
    alter table public.profiles add column avatar_url text;
  end if;
end $$;

-- ═══════════════════════════════════════════════════════════════════════
-- After running this migration, the buckets appear under Supabase Dashboard
-- → Storage. You can verify RLS by:
--   1. Signing in as a non-admin user
--   2. Attempting to read another user's photos via API — should fail
--   3. Signing in as admin — should succeed
-- ═══════════════════════════════════════════════════════════════════════
