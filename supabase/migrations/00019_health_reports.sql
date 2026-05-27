-- ═════════════════════════════════════════════════════════════════════
-- Migration 00019 — Health Passport (upload-only foundation)
-- ─────────────────────────────────────────────────────────────────────
-- Data custodian + coach-workflow scaffolding for medical lab reports.
-- NO AI extraction, NO biomarker parsing, NO health-insight generation
-- at this stage (per docs/product-vision.md §4 — Indian SaMD /
-- telemedicine regulatory posture).
--
-- Phase 1 scope (this migration):
--   • Clients upload PDF / JPG / PNG reports to a private bucket
--   • Each upload creates a row in client_health_reports
--   • Coaches/admins can view all reports, add review notes
--   • RLS keeps clients' data private to themselves + their assigned
--     coaches
--
-- What this migration deliberately does NOT add:
--   • biomarker tables (HbA1c values, etc) — adding those creates
--     a derived-health-metric trail that crosses the SaMD line
--   • parser/extraction columns — same reason
--   • Health Action Plan tables — wait until legal review
-- ═════════════════════════════════════════════════════════════════════

-- ─── Storage bucket — private, PDF + image, capped at 10 MB ─────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'health-reports',
  'health-reports',
  false,                              -- private; signed URLs only
  10 * 1024 * 1024,                   -- 10 MB per file (lab PDFs run 1-5 MB)
  array[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/heic',
    'image/heif',
    'image/webp'
  ]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage RLS — same folder-scoped pattern as meal-photos.
-- Path convention: <client_id>/<uuid>.<ext>

drop policy if exists "Clients read own health reports" on storage.objects;
create policy "Clients read own health reports" on storage.objects
  for select
  using (
    bucket_id = 'health-reports'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Clients upload own health reports" on storage.objects;
create policy "Clients upload own health reports" on storage.objects
  for insert
  with check (
    bucket_id = 'health-reports'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Clients delete own health reports" on storage.objects;
create policy "Clients delete own health reports" on storage.objects
  for delete
  using (
    bucket_id = 'health-reports'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Admins manage all health reports" on storage.objects;
create policy "Admins manage all health reports" on storage.objects
  for all
  using (
    bucket_id = 'health-reports'
    and public.is_admin(auth.uid())
  );

-- ─── client_health_reports table ────────────────────────────────────

create table if not exists public.client_health_reports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,

  -- File metadata (raw storage)
  storage_path text not null,           -- path inside health-reports bucket
  original_filename text,               -- user-friendly display name
  mime_type text not null,
  file_size_bytes int not null check (file_size_bytes > 0),

  -- Report metadata (user-supplied at upload)
  report_label text,                    -- "March bloodwork", "Annual checkup", etc.
  report_date date,                     -- date on the lab report (if user supplies)

  -- Coach review (phase 1: just freeform note, no structured biomarkers)
  coach_review_note text,
  coach_reviewed_at timestamptz,
  coach_reviewed_by uuid references public.profiles(id),

  -- Lifecycle
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_health_reports_client_uploaded
  on public.client_health_reports(client_id, uploaded_at desc);

drop trigger if exists tr_health_reports_updated on public.client_health_reports;
create trigger tr_health_reports_updated
  before update on public.client_health_reports
  for each row execute procedure public.set_updated_at();

-- ─── RLS policies ───────────────────────────────────────────────────

alter table public.client_health_reports enable row level security;

-- Clients can see + manage their own reports
drop policy if exists "Clients manage own health reports"
  on public.client_health_reports;
create policy "Clients manage own health reports"
  on public.client_health_reports
  for all
  using (auth.uid() = client_id);

-- Admins (trainers/coaches) can see + manage all reports.
-- In Phase 2 we tighten this to "only assigned coach can see" but
-- for the small initial pilot all admins are equivalent.
drop policy if exists "Admins manage all health reports"
  on public.client_health_reports;
create policy "Admins manage all health reports"
  on public.client_health_reports
  for all
  using (public.is_admin(auth.uid()));

-- Force PostgREST to reload the schema cache so the new table is
-- queryable immediately on production. Without this the API returns
-- "relation does not exist" for ~60 seconds after the migration runs.
notify pgrst, 'reload schema';
