-- ═════════════════════════════════════════════════════════════════════
-- Migration 00028 — Client consent records
-- ─────────────────────────────────────────────────────────────────────
-- Legal-grade record of every consent the client has signed.
-- Designed for multi-jurisdiction compliance (UK GDPR, US state privacy
-- laws, UAE Federal Decree-Law 45/2021, India DPDP Act 2023):
--
--   • Versioned — when the consent text changes in code, we bump
--     CURRENT_CONSENT_VERSION and prompt the client to re-sign.
--   • Granular — separate boolean per consent type (data collection,
--     photos, marketing use, each communication channel). Required vs
--     optional is enforced in the server action, not in the schema, so
--     future versions can change what's required without migrating.
--   • Withdrawable — a row can be marked withdrawn with a timestamp +
--     optional reason. The "currently active" consent for a user is
--     the latest row of the current version with withdrawn_at IS NULL.
--   • Auditable — signed_at, IP, user agent stored for every record.
--
-- Many rows per user. RLS lets users read + insert their own; admins
-- can read all (for audit purposes) but cannot edit or delete records,
-- which would compromise the audit trail.
-- ═════════════════════════════════════════════════════════════════════

create table if not exists public.client_consent_records (
  id                            uuid primary key default gen_random_uuid(),
  user_id                       uuid not null references public.profiles(id) on delete cascade,

  consent_version               text not null,
  signed_at                     timestamptz not null default now(),
  signed_name                   text not null,

  -- Mandatory boxes (server action enforces these are true)
  agreed_to_terms               boolean not null,
  agreed_to_data_collection     boolean not null,

  -- Optional boxes
  agreed_to_progress_photos     boolean not null default false,
  agreed_to_marketing_use       boolean not null default false,
  agreed_to_whatsapp            boolean not null default false,
  agreed_to_email               boolean not null default false,
  agreed_to_phone               boolean not null default false,
  agreed_to_push                boolean not null default false,

  -- Audit
  ip_address                    text,
  user_agent                    text,

  -- Withdrawal (null = still active)
  withdrawn_at                  timestamptz,
  withdrawn_reason              text,

  created_at                    timestamptz not null default now()
);

create index if not exists idx_consent_user_active
  on public.client_consent_records (user_id, signed_at desc)
  where withdrawn_at is null;

create index if not exists idx_consent_version
  on public.client_consent_records (consent_version);

-- ─── RLS ────────────────────────────────────────────────────────────

alter table public.client_consent_records enable row level security;

-- Users read their own consent history
drop policy if exists "Users read own consent records" on public.client_consent_records;
create policy "Users read own consent records"
  on public.client_consent_records
  for select
  using (auth.uid() = user_id);

-- Users can insert their own records (signing)
drop policy if exists "Users sign own consent" on public.client_consent_records;
create policy "Users sign own consent"
  on public.client_consent_records
  for insert
  with check (auth.uid() = user_id);

-- Users can mark their own records withdrawn (right to withdraw)
drop policy if exists "Users withdraw own consent" on public.client_consent_records;
create policy "Users withdraw own consent"
  on public.client_consent_records
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Admins read everything for audit. NO insert/update/delete — keeps
-- the audit trail intact. Admin staff cannot fake or alter a consent.
drop policy if exists "Admins read all consent records" on public.client_consent_records;
create policy "Admins read all consent records"
  on public.client_consent_records
  for select
  using (public.is_admin(auth.uid()));

-- Force PostgREST schema reload.
notify pgrst, 'reload schema';
