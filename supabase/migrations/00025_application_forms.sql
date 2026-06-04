-- ════════════════════════════════════════════════════════════════════
-- PURE X — Detailed Transformation Application (Form B)
-- ════════════════════════════════════════════════════════════════════
--
-- Form B sits at /application. Filled by leads AFTER the team has
-- contacted them through the enquiry funnel (Form A → enquiries
-- table) and qualified them as serious. The team shares the form
-- link manually; the form is not linked from the public site.
--
-- Stores all 11 sections as a single JSONB payload. New sections /
-- fields can be added by updating lib/data/application-sections.ts
-- with zero schema changes.
--
-- Run order: after 00024_enquiries.sql (renamed from 00015).
-- Idempotent.
-- ════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════
-- 1. Application forms table
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.application_forms (
  id uuid primary key default gen_random_uuid(),

  -- Optional link back to the enquiry that triggered the application.
  -- When the team shares the link with ?ref=<enquiry_id>, we capture
  -- it here. Manual submissions without ref are still valid orphans.
  enquiry_id uuid references public.enquiries(id) on delete set null,

  -- Identity (collected from Section 1 + 2 of the form)
  full_name text not null,
  email text not null,
  whatsapp text,

  -- Everything else lives in JSONB so adding/removing form fields
  -- never requires a migration. Section 1, 2, 3, ... 11 each become
  -- a top-level key in payload (e.g. payload.personal_info,
  -- payload.goals, payload.lifestyle).
  payload jsonb not null default '{}',

  -- Admin workflow
  status text not null default 'submitted' check (status in (
    'submitted',  -- just arrived
    'reviewing',  -- coach is reading it
    'onboarded',  -- converted to client
    'archived'    -- not pursued
  )),
  admin_notes text,
  reviewed_by uuid references public.profiles(id),

  -- Meta
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists idx_application_status on public.application_forms(status);
create index if not exists idx_application_created on public.application_forms(created_at desc);
create index if not exists idx_application_enquiry on public.application_forms(enquiry_id);
create index if not exists idx_application_email on public.application_forms(email);


-- ════════════════════════════════════════════════════════════════════
-- 2. updated_at trigger (reuses set_updated_at from 00001)
-- ════════════════════════════════════════════════════════════════════

drop trigger if exists trg_application_forms_touch on public.application_forms;
create trigger trg_application_forms_touch
  before update on public.application_forms
  for each row execute function public.set_updated_at();


-- ════════════════════════════════════════════════════════════════════
-- 3. RLS — public can insert, admin manages everything else
-- ════════════════════════════════════════════════════════════════════

alter table public.application_forms enable row level security;

drop policy if exists "Public can submit applications" on public.application_forms;
create policy "Public can submit applications"
  on public.application_forms for insert
  with check (true);

drop policy if exists "Admins manage applications" on public.application_forms;
create policy "Admins manage applications"
  on public.application_forms for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
