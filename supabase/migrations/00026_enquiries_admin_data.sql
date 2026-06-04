-- ════════════════════════════════════════════════════════════════════
-- PURE X — Enquiries: admin-captured discovery fields
-- ════════════════════════════════════════════════════════════════════
--
-- Adds a JSONB column the admin team fills in during the discovery
-- call (lead temperature, plan discussed, objections, next step,
-- etc.). Using JSONB instead of typed columns means we can iterate
-- on what we capture without writing migrations every time.
--
-- Run order: after the previously-applied enquiries table.
-- Idempotent.
-- ════════════════════════════════════════════════════════════════════

alter table public.enquiries
  add column if not exists admin_data jsonb not null default '{}';

-- A small index to help filters later (e.g. WHERE admin_data->>'temperature' = 'hot')
create index if not exists idx_enquiries_admin_data_gin
  on public.enquiries using gin (admin_data);
