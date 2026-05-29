-- ═════════════════════════════════════════════════════════════════════
-- Migration 00023 — Lab report AI extraction columns
-- ─────────────────────────────────────────────────────────────────────
-- Adds Gemini-extracted structured data to client_health_reports so
-- the client's Health page can surface "your blood markers" instead
-- of just a list of PDF files.
--
-- Workflow:
--   1. User uploads PDF/image (existing flow)
--   2. uploadHealthReport server action fires extractHealthReport
--      after the insert (best-effort; errors don't block upload)
--   3. extractHealthReport calls Gemini vision with the file +
--      a strict JSON schema, parses the response, and writes:
--        - extraction_status: pending → processing → done|failed
--        - extracted_at: timestamp
--        - extracted_data: full JSON (markers + interpretation)
--        - extracted_summary: 1-line readable summary
--        - extraction_error: error message when status='failed'
--
-- The client's Health page reads extracted_data across reports and
-- renders a deduplicated "latest markers" view.
-- ═════════════════════════════════════════════════════════════════════

alter table public.client_health_reports
  add column if not exists extraction_status text
    not null default 'pending'
    check (extraction_status in ('pending', 'processing', 'done', 'failed', 'skipped'));

alter table public.client_health_reports
  add column if not exists extracted_at timestamptz;

alter table public.client_health_reports
  add column if not exists extracted_data jsonb;

alter table public.client_health_reports
  add column if not exists extracted_summary text;

alter table public.client_health_reports
  add column if not exists extraction_error text;

-- Index on status so the (future) cron / retry job can find pending +
-- failed rows fast.
create index if not exists idx_health_reports_extraction_status
  on public.client_health_reports(extraction_status)
  where extraction_status in ('pending', 'failed');

-- Refresh PostgREST so the new columns are queryable immediately.
notify pgrst, 'reload schema';
