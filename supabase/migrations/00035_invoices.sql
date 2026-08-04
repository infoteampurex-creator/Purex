-- Invoicing feature — foundation.
--
-- Three tables:
--
--   company_settings   — singleton table (one row) holding the
--                        billing entity's own details. Editable
--                        from /admin/settings/company. All fields
--                        optional except id + legal_name so the
--                        admin can start invoicing before UK VAT
--                        or India GST registration is complete.
--
--   invoices           — one row per invoice. Snapshots the
--                        client's + company's details at time of
--                        creation so future edits to either don't
--                        rewrite historical invoices (HMRC audit
--                        requirement — an invoice, once sent, must
--                        never change).
--
--   invoice_line_items — the itemised services on each invoice.
--                        Amount computed as quantity × unit_price.
--
-- All money values are stored as integers in the smallest currency
-- unit (pence for GBP, paise for INR) to avoid floating-point drift.
-- Rendered as decimal only in the UI.
--
-- Sequential invoice numbering (required by HMRC — invoice numbers
-- cannot skip) is handled via company_settings.next_invoice_number_uk
-- + next_invoice_number_india counters bumped inside a transaction
-- when the first draft is created.

-- ─── company_settings ───────────────────────────────────────

create table if not exists public.company_settings (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null default 'Team Purex',
  billing_email text,
  logo_url text,

  -- India billing entity
  india_address_lines text[],
  gst_number text,
  india_bank_name text,
  india_ifsc text,
  india_account_number text,
  india_account_holder text,
  india_upi_id text,

  -- UK billing entity (may be filled in later — everything optional)
  uk_address_lines text[],
  vat_number text,
  company_registration_number text,
  uk_bank_name text,
  uk_sort_code text,
  uk_account_number text,
  uk_account_holder text,

  -- Sequential invoice counters — bumped when a new draft is created.
  -- Format: "PX-YYYY-NNNN" — the counter resets to 1 each January
  -- (application-layer logic, not DB), the DB just tracks the running number.
  next_invoice_number_uk integer not null default 1,
  next_invoice_number_india integer not null default 1,

  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

-- Seed with a single row so the settings page always has something
-- to load. Admin edits this row in place.
insert into public.company_settings (legal_name)
values ('Team Purex')
on conflict do nothing;

alter table public.company_settings enable row level security;

create policy "admins read company settings"
  on public.company_settings for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'super_admin')
    )
  );

create policy "admins update company settings"
  on public.company_settings for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'super_admin')
    )
  );

-- ─── invoices ────────────────────────────────────────────────

create type invoice_status as enum ('draft', 'sent', 'paid', 'void');
create type invoice_currency as enum ('GBP', 'INR');

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,

  client_id uuid not null references auth.users(id) on delete restrict,
  status invoice_status not null default 'draft',
  currency invoice_currency not null,

  issue_date date not null default current_date,
  due_date date not null,
  payment_terms_days integer not null default 14,
  reference text,

  -- Money (in smallest unit — pence for GBP, paise for INR)
  subtotal_amount bigint not null default 0,
  vat_rate numeric(5,4) not null default 0, -- e.g. 0.2000 for 20%
  vat_amount bigint not null default 0,
  total_amount bigint not null default 0,

  -- Snapshots — captured at invoice creation and never edited after
  -- 'sent'. Editing the client's profile or company settings later
  -- doesn't rewrite historical invoices (audit requirement).
  bill_to_name text not null,
  bill_to_email text,
  bill_to_address text,

  bill_from_name text not null,
  bill_from_address text,
  bill_from_vat_number text,
  bill_from_gst_number text,
  bill_from_company_registration_number text,

  coach_note text,

  sent_at timestamptz,
  paid_at timestamptz,
  voided_at timestamptz,

  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoices_client_id_idx
  on public.invoices(client_id, issue_date desc);
create index if not exists invoices_status_idx
  on public.invoices(status, issue_date desc);
create index if not exists invoices_number_idx
  on public.invoices(invoice_number);

alter table public.invoices enable row level security;

-- Admins can do anything with invoices.
create policy "admins full access to invoices"
  on public.invoices for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'super_admin')
    )
  );

-- Clients read only their own, and only once sent (not while draft).
create policy "clients read own sent invoices"
  on public.invoices for select
  using (
    client_id = auth.uid()
    and status in ('sent', 'paid', 'void')
  );

-- ─── invoice_line_items ─────────────────────────────────────

create table if not exists public.invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  position integer not null default 0,

  description_title text not null,
  description_body text,

  quantity numeric(10,3) not null default 1,
  unit_price bigint not null,       -- in smallest currency unit
  line_total bigint not null,       -- quantity * unit_price, precomputed

  created_at timestamptz not null default now()
);

create index if not exists invoice_line_items_invoice_id_idx
  on public.invoice_line_items(invoice_id, position);

alter table public.invoice_line_items enable row level security;

-- Line items inherit the same visibility rules as their parent invoice.
create policy "line items follow parent invoice"
  on public.invoice_line_items for select
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_line_items.invoice_id
        and (
          i.client_id = auth.uid()
          and i.status in ('sent', 'paid', 'void')
        )
    )
  );

create policy "admins full access to line items"
  on public.invoice_line_items for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'super_admin')
    )
  );

-- ─── updated_at triggers ───────────────────────────────────

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists invoices_set_updated_at on public.invoices;
create trigger invoices_set_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

drop trigger if exists company_settings_set_updated_at on public.company_settings;
create trigger company_settings_set_updated_at
  before update on public.company_settings
  for each row execute function public.set_updated_at();
