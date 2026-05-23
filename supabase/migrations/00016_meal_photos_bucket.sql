-- ─────────────────────────────────────────────────────────────────
-- 00016 — meal-photos storage bucket (Phase 2: AI vision)
-- ─────────────────────────────────────────────────────────────────
--
-- A private Supabase Storage bucket for meal photos captured in the
-- mobile app. Path pattern: <client_id>/<log_date>/<uuid>.jpg
-- RLS enforces that clients can only see/upload their own photos.
-- ─────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'meal-photos',
  'meal-photos',
  false,                              -- private; signed URLs only
  5 * 1024 * 1024,                    -- 5 MB max per photo
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ─── RLS policies on storage.objects scoped to this bucket ──────

-- Clients can SELECT only photos in folders matching their auth.uid()
drop policy if exists "Clients read own meal photos" on storage.objects;
create policy "Clients read own meal photos" on storage.objects
  for select
  using (
    bucket_id = 'meal-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Clients can INSERT into folders matching their auth.uid()
drop policy if exists "Clients upload own meal photos" on storage.objects;
create policy "Clients upload own meal photos" on storage.objects
  for insert
  with check (
    bucket_id = 'meal-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Clients can DELETE their own photos
drop policy if exists "Clients delete own meal photos" on storage.objects;
create policy "Clients delete own meal photos" on storage.objects
  for delete
  using (
    bucket_id = 'meal-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins can do anything in the bucket
drop policy if exists "Admins manage all meal photos" on storage.objects;
create policy "Admins manage all meal photos" on storage.objects
  for all
  using (
    bucket_id = 'meal-photos'
    and public.is_admin(auth.uid())
  );
