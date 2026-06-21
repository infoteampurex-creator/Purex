-- ═════════════════════════════════════════════════════════════════════
-- Migration 00030 — Health reports: file-on-device, data-on-server
-- ─────────────────────────────────────────────────────────────────────
-- Privacy policy: the original PDF / image of a lab report stays on
-- the client's device. Only the extracted structured data (markers,
-- interpretation, summary) lives in Supabase. This reduces:
--   • PHI / sensitive document exposure surface
--   • Storage liability + GDPR/DPDP data-minimisation footprint
--   • App Store / Play Store data-collection disclosures
--
-- Schema impact: the file-side columns (storage_path, mime_type,
-- file_size_bytes) become NULLABLE so a row can exist without ever
-- having a corresponding object in Storage. Historical rows that
-- were uploaded before this change still have these columns
-- populated — the UI conditionally shows the "View" button only
-- when storage_path is set.
--
-- Old health-reports storage objects can be expired manually
-- (Storage → health-reports bucket) once the team is comfortable.
-- ═════════════════════════════════════════════════════════════════════

-- ─── Make file-related columns nullable ────────────────────────────

alter table public.client_health_reports
  alter column storage_path drop not null;

alter table public.client_health_reports
  alter column mime_type drop not null;

alter table public.client_health_reports
  alter column file_size_bytes drop not null;

-- The existing check (file_size_bytes > 0) must allow NULL since a
-- row without a file has no byte count. Replace it.
alter table public.client_health_reports
  drop constraint if exists client_health_reports_file_size_bytes_check;

alter table public.client_health_reports
  add constraint client_health_reports_file_size_bytes_check
    check (file_size_bytes is null or file_size_bytes > 0);

-- Refresh PostgREST so the new nullability is reflected in the API.
notify pgrst, 'reload schema';
