-- ════════════════════════════════════════════════════════════════════
-- PURE X — Public enquiry funnel
-- ════════════════════════════════════════════════════════════════════
--
-- Visitor lands on /apply, fills a 6-field enquiry form. Submission
-- inserts a row here. Admin sees it under /admin/applications, can
-- transition it through the status workflow, assign a specialist for
-- follow-up, attach notes.
--
-- The detailed 11-section "Transformation Application" form will
-- ship as a separate table in a follow-up migration (00016) —
-- gated behind the team's manual qualification of the enquiry.
--
-- Run order: after 00014_mother_strong_name_format_fix.sql
-- Idempotent.
-- ════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════
-- 1. Enquiries table
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),

  -- Identity (collected from the form)
  full_name text not null,
  whatsapp text not null check (whatsapp ~ '^[0-9]{10}$'),
  email text not null,

  -- Intent
  primary_goal text not null check (primary_goal in (
    'fat_loss',
    'muscle_gain',
    'strength_building',
    'athletic_performance',
    'hybrid_fitness',
    'marathon_running',
    'general_fitness',
    'postpartum_fitness',
    'mobility_flexibility',
    'lifestyle_transformation'
  )),
  start_timing text not null check (start_timing in (
    'immediately',
    'within_2_weeks',
    'within_month',
    'within_3_months',
    'just_exploring'
  )),
  message text,
  preferred_language text not null default 'en' check (preferred_language in ('en','hi')),

  -- Admin workflow
  status text not null default 'new' check (status in (
    'new',         -- just submitted, no team action yet
    'contacted',   -- team reached out (WhatsApp / phone)
    'qualified',   -- serious lead, ready for detailed application
    'converted',   -- became a paying client
    'rejected'     -- not a fit
  )),
  assigned_specialist_id uuid references public.profiles(id),
  admin_notes text,

  -- Source attribution (set automatically from referrer / utm params)
  source text,

  -- Meta
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  contacted_at timestamptz,
  converted_at timestamptz
);

create index if not exists idx_enquiries_status on public.enquiries(status);
create index if not exists idx_enquiries_created on public.enquiries(created_at desc);
create index if not exists idx_enquiries_assigned on public.enquiries(assigned_specialist_id);
create index if not exists idx_enquiries_whatsapp on public.enquiries(whatsapp);


-- ════════════════════════════════════════════════════════════════════
-- 2. updated_at trigger
-- ════════════════════════════════════════════════════════════════════

-- Reuses public.set_updated_at() from 00001_auth_foundation.sql
-- (also exists as touch_updated_at after 00013 — set_updated_at is
-- the canonical one across every environment, so we pin to that.)
drop trigger if exists trg_enquiries_touch on public.enquiries;
create trigger trg_enquiries_touch
  before update on public.enquiries
  for each row execute function public.set_updated_at();


-- ════════════════════════════════════════════════════════════════════
-- 3. RLS — public can insert, admin owns everything else
-- ════════════════════════════════════════════════════════════════════

alter table public.enquiries enable row level security;

-- Anyone (anon included) can submit an enquiry.
-- The server action uses the service role to bypass RLS anyway, but
-- this policy lets the column-level checks fire correctly during
-- inserts. We do NOT grant select to anon — the data is admin-only
-- once submitted.
drop policy if exists "Public can submit enquiries" on public.enquiries;
create policy "Public can submit enquiries"
  on public.enquiries for insert
  with check (true);

-- Admins can do everything else (read list, update status, etc.)
drop policy if exists "Admins manage enquiries" on public.enquiries;
create policy "Admins manage enquiries"
  on public.enquiries for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
