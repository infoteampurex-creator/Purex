# PURE X — Phase 1 Database Schema

Postgres (Supabase). All tables prefixed implicitly by the `public` schema. All primary keys are `uuid` (Supabase default, `gen_random_uuid()`). All tables get `created_at` and `updated_at` timestamps with a shared trigger.

## Entity-relationship summary

```
profiles (auth users + admin flag)
experts ─────┬─ programs (m2m: expert_programs)
             └─ bookings ─── pre_consultation_forms
                    │
                    └─── leads (a lead becomes a booking)

transformations (expert_id optional — shows which expert led it)
testimonials
faqs (category-grouped)
homepage_content (key-value content store)
contact_submissions (generic inquiries)
```

## Tables

### profiles
Mirrors `auth.users` with app-level fields. One row per user.
```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin', 'super_admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### experts
The six coaches. Each has a public profile page.
```sql
create table experts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,                          -- e.g. 'siva-reddy'
  name text not null,                                 -- 'Siva Reddy'
  title text not null,                                -- 'Personal Training Head'
  short_role text,                                    -- 'PT Head' (card tag)
  photo_url text,                                     -- Supabase Storage URL
  thumbnail_url text,                                 -- Cropped square for cards
  bio_short text,                                     -- 1-2 sentences for cards
  bio_long text,                                      -- Full bio for profile page
  specialisms text[] default '{}',                    -- ['HYROX', 'Fat Loss', 'Injury Rehab']
  credentials text[] default '{}',                    -- ['ICN Gold 2024', 'Powerlifting Cert']
  years_experience int,
  clients_trained int,
  location text,                                      -- 'Hyderabad' / 'London'
  formats text[] default '{}',                        -- ['in_person', 'online']
  languages text[] default '{}',                      -- ['English', 'Telugu']
  pricing_placeholder text,                           -- 'From ₹X' or 'Inquire'
  availability_note text,                             -- 'Booking for July onwards'
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_experts_slug on experts(slug);
create index idx_experts_active on experts(is_active, sort_order);
```

### programs
The four plans: Fit Check, Online Live, Personal Transformation, Elite Couple.
```sql
create table programs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,                          -- 'personal-transformation'
  name text not null,                                 -- 'Personal Transformation'
  tag text,                                           -- 'Flagship' / 'Most Flexible'
  tagline text,                                       -- Short hero line
  description text,                                   -- Full description
  price_inr int,                                      -- 20000 (monthly unless duration_unit differs)
  price_display text,                                 -- '₹20,000/month' (for display flexibility)
  duration_months int,                                -- Typical commitment
  inclusions text[] default '{}',                     -- Bullet list of what's included
  is_featured boolean default false,                  -- Shown as "flagship" card
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### expert_programs (m2m)
Which experts lead which programs.
```sql
create table expert_programs (
  expert_id uuid references experts(id) on delete cascade,
  program_id uuid references programs(id) on delete cascade,
  is_lead boolean default false,                      -- Primary expert for this program
  primary key (expert_id, program_id)
);
```

### services
Per-expert bookable services. (Separate from programs because e.g. Krishna sells "60-min physio consultation" as its own booking unit.)
```sql
create table services (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid references experts(id) on delete cascade,
  name text not null,                                 -- '60-min Physio Assessment'
  description text,
  format text check (format in ('online', 'in_person', 'hybrid')),
  duration_minutes int,                               -- 60
  price_inr int,                                      -- Optional — can be 'inquire'
  price_display text,                                 -- 'Free' / '₹2,500' / 'Inquire'
  requires_pre_form boolean default true,
  is_consultation boolean default false,              -- The initial discovery call
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_services_expert on services(expert_id, is_active);
```

### leads
A lead = someone who expressed interest. May or may not book.
Created from: contact form, booking form, WhatsApp inquiry, expert page CTA.
```sql
create table leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  source text not null,                               -- 'contact_form' | 'booking' | 'expert_inquiry' | 'whatsapp'
  source_detail text,                                 -- Which expert/program page they came from
  expert_id uuid references experts(id) on delete set null,
  program_id uuid references programs(id) on delete set null,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'booked', 'lost', 'archived')),
  owner_id uuid references profiles(id),              -- Admin who owns this lead
  utm_source text,
  utm_medium text,
  utm_campaign text,
  ip_address inet,
  user_agent text,
  notes text,                                         -- Admin-only notes
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_leads_status on leads(status, created_at desc);
create index idx_leads_expert on leads(expert_id);
```

### bookings
A firm booking request for a service. Subset of leads where user chose an expert + service.
```sql
create table bookings (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  expert_id uuid references experts(id) on delete restrict,
  service_id uuid references services(id) on delete restrict,
  preferred_date date,                                -- User's first choice
  preferred_time_slot text,                           -- 'morning' | 'afternoon' | 'evening' | '09:00-10:00'
  alternate_date date,                                -- Fallback
  format text check (format in ('online', 'in_person', 'hybrid')),
  status text not null default 'requested' check (status in ('requested', 'confirmed', 'rescheduled', 'completed', 'cancelled', 'no_show')),
  confirmed_datetime timestamptz,                     -- When admin confirms
  meeting_link text,                                  -- Zoom/Meet link added by admin
  location_address text,                              -- For in-person
  admin_notes text,
  cancellation_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_bookings_status on bookings(status, preferred_date);
create index idx_bookings_expert on bookings(expert_id, preferred_date);
```

### pre_consultation_forms
The intake form a client fills before their consultation. Per-expert template + per-booking response.

Two tables for cleanliness:

```sql
-- Template: what questions does THIS expert ask?
create table form_templates (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid references experts(id) on delete cascade,
  name text not null,                                 -- 'Siva Reddy — Training Intake'
  fields jsonb not null,                              -- Array of field definitions (see below)
  is_default boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- fields schema (jsonb):
-- [
--   { "id": "q1", "type": "text", "label": "Current fitness level", "required": true },
--   { "id": "q2", "type": "select", "label": "Primary goal",
--     "options": ["Fat loss", "Muscle gain", "HYROX prep", "IRONMAN prep"], "required": true },
--   { "id": "q3", "type": "textarea", "label": "Injuries or conditions", "required": false },
--   { "id": "q4", "type": "checkbox-group", "label": "Available days", "options": ["Mon","Tue",...] }
-- ]

-- Response: what did THIS client answer?
create table form_responses (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  template_id uuid references form_templates(id) on delete restrict,
  answers jsonb not null,                             -- { "q1": "Intermediate", "q2": "HYROX prep", ... }
  completed_at timestamptz,                           -- Null if draft
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_form_responses_booking on form_responses(booking_id);
```

### transformations
Success stories for the gallery. Before/after photos + metrics.
```sql
create table transformations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,                          -- 'arjun-hyrox-16wk'
  client_name text not null,                          -- 'Arjun M.' (anonymized allowed)
  client_age int,
  expert_id uuid references experts(id) on delete set null,  -- Led by whom
  program_id uuid references programs(id) on delete set null,
  goal text,                                          -- 'HYROX prep'
  duration_weeks int,                                 -- 16
  before_photo_url text,
  after_photo_url text,
  headline text,                                      -- Short punchy line
  story text,                                         -- Long-form narrative
  stats jsonb default '[]',                           -- [{"label":"Body fat","value":"−8kg"},...]
  is_featured boolean default false,                  -- Top spot on gallery
  is_published boolean default true,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_transformations_published on transformations(is_published, sort_order);
```

### testimonials
Short quotes for various pages.
```sql
create table testimonials (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  client_role text,                                   -- 'HYROX finisher' / 'Elite Couple client'
  client_photo_url text,                              -- Optional
  quote text not null,
  rating int check (rating between 1 and 5),
  expert_id uuid references experts(id) on delete set null,
  program_id uuid references programs(id) on delete set null,
  is_featured boolean default false,
  is_published boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);
```

### faqs
Grouped by category.
```sql
create table faqs (
  id uuid primary key default gen_random_uuid(),
  category text not null,                             -- 'booking' | 'pricing' | 'training' | 'medical'
  question text not null,
  answer text not null,
  sort_order int default 0,
  is_published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_faqs_category on faqs(category, sort_order);
```

### homepage_content
A simple key-value store for editable homepage sections. Avoids rigid schema when marketing copy changes.
```sql
create table homepage_content (
  key text primary key,                               -- 'hero.headline' | 'hero.subcopy' | 'cta_band.title'
  value text,
  content_type text default 'text' check (content_type in ('text', 'html', 'image_url', 'number', 'json')),
  notes text,                                         -- Admin note: "Shown above the fold"
  updated_at timestamptz default now(),
  updated_by uuid references profiles(id)
);
```

### contact_submissions
Generic contact form submissions (not tied to a specific expert/program).
```sql
create table contact_submissions (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  status text default 'new' check (status in ('new', 'replied', 'archived')),
  created_at timestamptz default now()
);
```

## Shared triggers

```sql
-- Auto-update updated_at on row change
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply to tables with updated_at column
-- (repeat for each: experts, programs, services, leads, bookings, form_templates,
--  form_responses, transformations, homepage_content, profiles)
create trigger tr_experts_updated before update on experts
  for each row execute procedure set_updated_at();
```

## Row-Level Security

```sql
-- Public read for published content
alter table experts enable row level security;
create policy "Public reads active experts"
  on experts for select using (is_active = true);

alter table programs enable row level security;
create policy "Public reads active programs"
  on programs for select using (is_active = true);

alter table transformations enable row level security;
create policy "Public reads published transformations"
  on transformations for select using (is_published = true);

alter table testimonials enable row level security;
create policy "Public reads published testimonials"
  on testimonials for select using (is_published = true);

alter table faqs enable row level security;
create policy "Public reads published faqs"
  on faqs for select using (is_published = true);

-- Admin-only writes (via helper function)
create or replace function is_admin(uid uuid) returns boolean as $$
  select exists (
    select 1 from profiles
    where id = uid and role in ('admin', 'super_admin')
  );
$$ language sql security definer;

create policy "Admins write experts"
  on experts for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- Leads, bookings: public insert, admin read/update
alter table leads enable row level security;
create policy "Public inserts leads" on leads for insert with check (true);
create policy "Admins read all leads" on leads for select using (is_admin(auth.uid()));
create policy "Admins update leads" on leads for update using (is_admin(auth.uid()));

alter table bookings enable row level security;
create policy "Public inserts bookings" on bookings for insert with check (true);
create policy "Admins manage bookings" on bookings for all using (is_admin(auth.uid()));

-- Form responses: public insert (with booking_id they created), admin read
alter table form_responses enable row level security;
create policy "Public inserts form responses" on form_responses for insert with check (true);
create policy "Admins read form responses" on form_responses for select using (is_admin(auth.uid()));

-- Contact submissions
alter table contact_submissions enable row level security;
create policy "Public inserts contacts" on contact_submissions for insert with check (true);
create policy "Admins manage contacts" on contact_submissions for all using (is_admin(auth.uid()));
```

## Seed data needed on first deploy

- 6 experts (Siva Reddy, Chandralekha, Krishna, Paula Konasionok, Amber Jasari, Siva Jampana)
- 4 programs (Fit Check ₹5K, Online Live ₹10K, Personal Transformation ₹20K, Elite Couple ₹30K)
- Services per expert (discovery call, consultation, etc.)
- Default form template per expert
- 6–10 transformations
- 8–12 FAQs across categories
- Homepage content keys pre-populated

Seed script: `scripts/seed.ts` — idempotent, safe to re-run.
