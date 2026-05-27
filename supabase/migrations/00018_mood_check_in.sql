-- ═════════════════════════════════════════════════════════════════════
-- Migration 00018 — Morning mood check-in
-- ─────────────────────────────────────────────────────────────────────
-- Adds a named mood state to client_daily_logs (one of 8 chip values
-- the user picks each morning). The existing mood_1_5 column stays —
-- it's still used by trainer-side aggregate dashboards. mood_state
-- powers the dashboard's "How is your body today?" check-in card and
-- (Phase 2) adapts Today's Mission copy based on the user's report.
-- ═════════════════════════════════════════════════════════════════════

alter table public.client_daily_logs
  add column if not exists mood_state text;

-- Constrain to the 8 supported values. Easy to extend later by
-- dropping + recreating this constraint; not worth a separate
-- mood_states lookup table at this scale.
alter table public.client_daily_logs
  drop constraint if exists client_daily_logs_mood_state_check;
alter table public.client_daily_logs
  add constraint client_daily_logs_mood_state_check
  check (
    mood_state is null
    or mood_state in (
      'fresh',
      'tired',
      'sore',
      'stressed',
      'bloated',
      'acidity',
      'low_energy',
      'motivated'
    )
  );

-- Force PostgREST to reload the schema cache so the new column is
-- queryable immediately on production. Without this the API returns
-- "column does not exist" for ~60 seconds after the migration runs.
notify pgrst, 'reload schema';
