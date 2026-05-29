-- ═════════════════════════════════════════════════════════════════════
-- Migration 00020 — Health Conditions persistence
-- ─────────────────────────────────────────────────────────────────────
-- Replaces the placeholder UI on the Health page. Adds a single
-- per-client profile row that the COACH owns (writes from admin),
-- and the CLIENT reads (read-only on /client/health). Storing as
-- text arrays + free-text notes — no separate lookup tables needed
-- at this scale, and trainers want freedom to enter "Type 2 Diabetes
-- (controlled)" rather than picking from a fixed list.
--
-- Per docs/product-vision.md §4 legal posture: this data drives
-- COACH plan adjustments, not app-generated medical advice. The
-- safety disclaimer copy on the Health page already covers the
-- non-medical framing.
-- ═════════════════════════════════════════════════════════════════════

create table if not exists public.client_health_profile (
  client_id uuid primary key references public.profiles(id) on delete cascade,

  -- Self-reported / coach-confirmed conditions. Free-text per item
  -- so trainers can record "Type 2 diabetes (HbA1c 6.4)" with context.
  conditions text[] default '{}'::text[],

  -- Food / drug / environmental allergies. Same pattern.
  allergies text[] default '{}'::text[],

  -- Active or historical injuries that affect training programming.
  injuries text[] default '{}'::text[],

  -- Current medications. Coach informational only — app does NOT
  -- generate medication advice (see safety disclaimer).
  medications text[] default '{}'::text[],

  -- Free-text coach notes (anything that doesn't fit above).
  coach_notes text,

  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

drop trigger if exists tr_health_profile_updated on public.client_health_profile;
create trigger tr_health_profile_updated
  before update on public.client_health_profile
  for each row execute procedure public.set_updated_at();

-- ─── RLS ────────────────────────────────────────────────────────────

alter table public.client_health_profile enable row level security;

-- Clients can READ their own row; cannot write (coaches manage it).
drop policy if exists "Clients read own health profile"
  on public.client_health_profile;
create policy "Clients read own health profile"
  on public.client_health_profile
  for select
  using (auth.uid() = client_id);

-- Admins (coaches) can manage all rows.
drop policy if exists "Admins manage all health profiles"
  on public.client_health_profile;
create policy "Admins manage all health profiles"
  on public.client_health_profile
  for all
  using (public.is_admin(auth.uid()));

-- Force PostgREST schema reload so the new table is queryable
-- immediately on production.
notify pgrst, 'reload schema';
