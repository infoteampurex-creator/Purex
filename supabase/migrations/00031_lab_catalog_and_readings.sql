-- ═════════════════════════════════════════════════════════════════════
-- Migration 00031 — Lab catalog + manual marker entry
-- ─────────────────────────────────────────────────────────────────────
-- Replaces the failed AI-extraction approach (Gemini → dropped) with
-- structured manual entry against a known catalog of Indian-lab panels
-- and markers. Both admin (coach) and client can enter values.
--
-- What this migration does:
--   1. Creates lab_panels (11 rows) and lab_markers (~120 rows)
--      seeded with Indian-lab reference ranges (gender-adjusted where
--      relevant)
--   2. Creates client_health_marker_readings for actual client values
--      per report, per marker
--   3. Strips extraction + file-storage columns from
--      client_health_reports (they were never load-bearing again after
--      PR #74 anyway)
--   4. Locks it all down with RLS
--
-- The client_health_reports row now represents "a lab visit" — a
-- date-scoped container for the readings taken from one blood draw.
-- ═════════════════════════════════════════════════════════════════════

-- ─── Lab catalog tables ─────────────────────────────────────────────

create table if not exists public.lab_panels (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  category text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.lab_markers (
  id uuid primary key default gen_random_uuid(),
  panel_id uuid not null references public.lab_panels(id) on delete cascade,
  slug text not null,
  name text not null,
  short_name text,
  unit text,
  -- Reference range (male / default). Either bound can be null when
  -- only one side of the range matters (e.g. HbA1c has only an upper
  -- bound).
  ref_low numeric,
  ref_high numeric,
  -- Female-specific range when it differs meaningfully. NULL means
  -- "same as ref_low / ref_high".
  ref_low_female numeric,
  ref_high_female numeric,
  -- Higher-is-better markers (HDL, Vitamin D, eGFR) flip the "high"
  -- direction — status logic reads this to color a "high" value green
  -- instead of red.
  higher_is_better boolean not null default false,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (panel_id, slug)
);

create index if not exists idx_lab_markers_panel
  on public.lab_markers(panel_id, display_order);

-- ─── Client marker readings ─────────────────────────────────────────

create table if not exists public.client_health_marker_readings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  report_id uuid not null references public.client_health_reports(id) on delete cascade,
  marker_id uuid not null references public.lab_markers(id) on delete restrict,
  value numeric not null,
  notes text,
  entered_by uuid references public.profiles(id),
  entered_at timestamptz not null default now(),
  unique (report_id, marker_id)
);

create index if not exists idx_marker_readings_client_marker
  on public.client_health_marker_readings(client_id, marker_id, entered_at desc);

create index if not exists idx_marker_readings_report
  on public.client_health_marker_readings(report_id);

-- ─── Strip old columns from client_health_reports ───────────────────
-- These are all extraction/storage-era columns. Nothing reads them
-- once the new UI ships.

alter table public.client_health_reports drop column if exists storage_path;
alter table public.client_health_reports drop column if exists mime_type;
alter table public.client_health_reports drop column if exists file_size_bytes;
alter table public.client_health_reports drop column if exists original_filename;
alter table public.client_health_reports drop column if exists extraction_status;
alter table public.client_health_reports drop column if exists extracted_at;
alter table public.client_health_reports drop column if exists extracted_data;
alter table public.client_health_reports drop column if exists extracted_summary;
alter table public.client_health_reports drop column if exists extraction_error;

drop index if exists idx_health_reports_extraction_status;

-- New column: who entered this report (admin or client).
alter table public.client_health_reports
  add column if not exists entered_by uuid references public.profiles(id);

-- ─── RLS ────────────────────────────────────────────────────────────

alter table public.lab_panels enable row level security;
alter table public.lab_markers enable row level security;
alter table public.client_health_marker_readings enable row level security;

-- Catalog is world-readable (any authenticated user).
drop policy if exists "Anyone reads lab panels" on public.lab_panels;
create policy "Anyone reads lab panels"
  on public.lab_panels for select using (auth.uid() is not null);

drop policy if exists "Admins manage lab panels" on public.lab_panels;
create policy "Admins manage lab panels"
  on public.lab_panels for all using (public.is_admin(auth.uid()));

drop policy if exists "Anyone reads lab markers" on public.lab_markers;
create policy "Anyone reads lab markers"
  on public.lab_markers for select using (auth.uid() is not null);

drop policy if exists "Admins manage lab markers" on public.lab_markers;
create policy "Admins manage lab markers"
  on public.lab_markers for all using (public.is_admin(auth.uid()));

-- Readings: client owns their own; admins see everyone.
drop policy if exists "Clients manage own marker readings"
  on public.client_health_marker_readings;
create policy "Clients manage own marker readings"
  on public.client_health_marker_readings
  for all using (auth.uid() = client_id);

drop policy if exists "Admins manage all marker readings"
  on public.client_health_marker_readings;
create policy "Admins manage all marker readings"
  on public.client_health_marker_readings
  for all using (public.is_admin(auth.uid()));

-- ─── Seed data — 11 panels + ~120 markers ───────────────────────────
-- Reference ranges tuned for Indian lab standards (Dr Lal Pathlabs,
-- Apollo, Thyrocare, SRL, Metropolis). Ranges are conservative
-- adult-normal; pregnancy/pediatric/geriatric variants NOT covered.

insert into public.lab_panels (slug, name, category, display_order, description) values
  ('diabetes',       'Diabetes',              'metabolic',    1, 'Blood sugar control and insulin sensitivity'),
  ('lipid_profile',  'Lipid Profile',         'cardiac',      2, 'Cholesterol, triglycerides, cardiac risk'),
  ('thyroid',        'Thyroid Function',      'endocrine',    3, 'TSH, T3, T4, autoimmune markers'),
  ('liver',          'Liver Function (LFT)',  'organ',        4, 'Enzymes, bilirubin, proteins'),
  ('kidney',         'Kidney Function (KFT)', 'organ',        5, 'Urea, creatinine, uric acid, eGFR'),
  ('cbc',            'Complete Blood Count',  'blood',        6, 'RBC, WBC, platelets, hemoglobin, differentials'),
  ('iron',           'Iron Studies',          'blood',        7, 'Iron, ferritin, TIBC, transferrin saturation'),
  ('vitamins',       'Vitamins',              'nutrition',    8, 'Vitamin D, B12, folate, vitamin C'),
  ('minerals',       'Minerals & Electrolytes','nutrition',   9, 'Sodium, potassium, calcium, magnesium, zinc'),
  ('hormones',       'Hormones',              'endocrine',   10, 'Sex hormones (male + female), cortisol, prolactin'),
  ('inflammation',   'Inflammation & Cardiac','cardiac',     11, 'CRP, hs-CRP, ESR, homocysteine, cardiac markers')
on conflict (slug) do nothing;

-- Helper: insert marker with the panel slug.
-- Use a temp function scope so we don't leak sig.
do $seed$
declare
  m record;
begin
  -- Wipe existing markers if re-running the migration in dev.
  -- (In prod this is a first-run, so this is a no-op.)
  delete from public.lab_markers
    where panel_id in (select id from public.lab_panels);

  -- ── 1. Diabetes ────────────────────────────────────────────────
  insert into public.lab_markers (panel_id, slug, name, short_name, unit, ref_low, ref_high, higher_is_better, display_order)
  select p.id, x.slug, x.name, x.short_name, x.unit, x.ref_low, x.ref_high, false, x.ord
  from public.lab_panels p, (values
    ('fbs',            'Fasting Blood Sugar',       'FBS',    'mg/dL',  70::numeric, 100::numeric, 1),
    ('ppbs',           'Postprandial Blood Sugar',  'PPBS',   'mg/dL',  null::numeric, 140::numeric, 2),
    ('hba1c',          'HbA1c',                     'HbA1c',  '%',      null::numeric, 5.7::numeric, 3),
    ('fasting_insulin','Fasting Insulin',           'Insulin','μIU/mL', 3::numeric,  25::numeric,  4),
    ('homa_ir',        'HOMA-IR',                   'HOMA-IR', null,    null::numeric, 2.5::numeric, 5)
  ) as x(slug, name, short_name, unit, ref_low, ref_high, ord)
  where p.slug = 'diabetes';

  -- ── 2. Lipid Profile ───────────────────────────────────────────
  insert into public.lab_markers (panel_id, slug, name, short_name, unit, ref_low, ref_high, ref_low_female, ref_high_female, higher_is_better, display_order)
  select p.id, x.slug, x.name, x.short_name, x.unit, x.ref_low, x.ref_high, x.ref_low_f, x.ref_high_f, x.hib, x.ord
  from public.lab_panels p, (values
    ('total_cholesterol','Total Cholesterol','TC',    'mg/dL', null::numeric, 200::numeric, null::numeric, null::numeric, false, 1),
    ('ldl_cholesterol',  'LDL Cholesterol',  'LDL',   'mg/dL', null::numeric, 100::numeric, null::numeric, null::numeric, false, 2),
    ('hdl_cholesterol',  'HDL Cholesterol',  'HDL',   'mg/dL', 40::numeric,   null::numeric, 50::numeric,  null::numeric, true,  3),
    ('triglycerides',    'Triglycerides',    'TG',    'mg/dL', null::numeric, 150::numeric, null::numeric, null::numeric, false, 4),
    ('vldl_cholesterol', 'VLDL Cholesterol', 'VLDL',  'mg/dL', null::numeric, 30::numeric,  null::numeric, null::numeric, false, 5),
    ('non_hdl',          'Non-HDL Cholesterol','Non-HDL','mg/dL', null::numeric, 130::numeric, null::numeric, null::numeric, false, 6),
    ('tc_hdl_ratio',     'TC / HDL Ratio',   'TC/HDL', null,   null::numeric, 5::numeric,   null::numeric, null::numeric, false, 7)
  ) as x(slug, name, short_name, unit, ref_low, ref_high, ref_low_f, ref_high_f, hib, ord)
  where p.slug = 'lipid_profile';

  -- ── 3. Thyroid ──────────────────────────────────────────────────
  insert into public.lab_markers (panel_id, slug, name, short_name, unit, ref_low, ref_high, higher_is_better, display_order)
  select p.id, x.slug, x.name, x.short_name, x.unit, x.ref_low, x.ref_high, false, x.ord
  from public.lab_panels p, (values
    ('tsh',              'TSH',                'TSH',   'mIU/L',  0.4::numeric,  4.0::numeric, 1),
    ('free_t3',          'Free T3',            'FT3',   'pg/mL',  2.0::numeric,  4.4::numeric, 2),
    ('free_t4',          'Free T4',            'FT4',   'ng/dL',  0.82::numeric, 1.77::numeric, 3),
    ('anti_tpo',         'Anti-TPO Antibodies','a-TPO', 'IU/mL',  null::numeric, 35::numeric,  4),
    ('anti_thyroglobulin','Anti-Thyroglobulin','a-Tg',  'IU/mL',  null::numeric, 115::numeric, 5)
  ) as x(slug, name, short_name, unit, ref_low, ref_high, ord)
  where p.slug = 'thyroid';

  -- ── 4. Liver Function ───────────────────────────────────────────
  insert into public.lab_markers (panel_id, slug, name, short_name, unit, ref_low, ref_high, higher_is_better, display_order)
  select p.id, x.slug, x.name, x.short_name, x.unit, x.ref_low, x.ref_high, false, x.ord
  from public.lab_panels p, (values
    ('sgpt_alt',      'SGPT (ALT)',       'ALT',    'U/L',   7::numeric,   56::numeric,  1),
    ('sgot_ast',      'SGOT (AST)',       'AST',    'U/L',   10::numeric,  40::numeric,  2),
    ('alp',           'Alkaline Phosphatase','ALP', 'U/L',   44::numeric,  147::numeric, 3),
    ('ggt',           'GGT',              'GGT',    'U/L',   8::numeric,   61::numeric,  4),
    ('total_bilirubin','Total Bilirubin', 'T.Bili', 'mg/dL', 0.1::numeric, 1.2::numeric, 5),
    ('direct_bilirubin','Direct Bilirubin','D.Bili','mg/dL', null::numeric,0.3::numeric, 6),
    ('total_protein', 'Total Protein',    'TP',     'g/dL',  6.0::numeric, 8.3::numeric, 7),
    ('albumin',       'Albumin',          'Alb',    'g/dL',  3.5::numeric, 5.5::numeric, 8),
    ('globulin',      'Globulin',         'Glob',   'g/dL',  2.0::numeric, 3.5::numeric, 9),
    ('ag_ratio',      'A/G Ratio',        'A/G',    null,    1.1::numeric, 2.5::numeric, 10)
  ) as x(slug, name, short_name, unit, ref_low, ref_high, ord)
  where p.slug = 'liver';

  -- ── 5. Kidney Function ──────────────────────────────────────────
  insert into public.lab_markers (panel_id, slug, name, short_name, unit, ref_low, ref_high, ref_low_female, ref_high_female, higher_is_better, display_order)
  select p.id, x.slug, x.name, x.short_name, x.unit, x.ref_low, x.ref_high, x.ref_low_f, x.ref_high_f, x.hib, x.ord
  from public.lab_panels p, (values
    ('urea',       'Blood Urea',   'Urea',       'mg/dL',        15::numeric,  40::numeric,  null::numeric, null::numeric, false, 1),
    ('creatinine', 'Creatinine',   'Creat',      'mg/dL',        0.6::numeric, 1.2::numeric, 0.5::numeric,  1.1::numeric,  false, 2),
    ('bun',        'BUN',          'BUN',        'mg/dL',        7::numeric,   20::numeric,  null::numeric, null::numeric, false, 3),
    ('uric_acid',  'Uric Acid',    'UA',         'mg/dL',        3.5::numeric, 7.2::numeric, 2.6::numeric,  6.0::numeric,  false, 4),
    ('egfr',       'eGFR',         'eGFR',       'mL/min/1.73m²',90::numeric,  null::numeric,null::numeric, null::numeric, true,  5)
  ) as x(slug, name, short_name, unit, ref_low, ref_high, ref_low_f, ref_high_f, hib, ord)
  where p.slug = 'kidney';

  -- ── 6. Complete Blood Count ─────────────────────────────────────
  insert into public.lab_markers (panel_id, slug, name, short_name, unit, ref_low, ref_high, ref_low_female, ref_high_female, higher_is_better, display_order)
  select p.id, x.slug, x.name, x.short_name, x.unit, x.ref_low, x.ref_high, x.ref_low_f, x.ref_high_f, x.hib, x.ord
  from public.lab_panels p, (values
    ('hemoglobin',    'Hemoglobin',       'Hb',      'g/dL',   13.5::numeric,  17.5::numeric,  12.0::numeric,  15.5::numeric, false, 1),
    ('rbc_count',     'RBC Count',        'RBC',     'M/μL',   4.5::numeric,   5.9::numeric,   4.0::numeric,   5.2::numeric,  false, 2),
    ('hematocrit',    'Hematocrit',       'HCT',     '%',      41::numeric,    53::numeric,    36::numeric,    46::numeric,   false, 3),
    ('mcv',           'MCV',              'MCV',     'fL',     80::numeric,    100::numeric,   null::numeric,  null::numeric, false, 4),
    ('mch',           'MCH',              'MCH',     'pg',     27::numeric,    33::numeric,    null::numeric,  null::numeric, false, 5),
    ('mchc',          'MCHC',             'MCHC',    'g/dL',   32::numeric,    36::numeric,    null::numeric,  null::numeric, false, 6),
    ('rdw',           'RDW',              'RDW',     '%',      11.5::numeric,  14.5::numeric,  null::numeric,  null::numeric, false, 7),
    ('wbc_count',     'WBC Count',        'WBC',     '/μL',    4000::numeric,  11000::numeric, null::numeric,  null::numeric, false, 8),
    ('neutrophils',   'Neutrophils',      'Neut',    '%',      40::numeric,    70::numeric,    null::numeric,  null::numeric, false, 9),
    ('lymphocytes',   'Lymphocytes',      'Lymph',   '%',      20::numeric,    45::numeric,    null::numeric,  null::numeric, false, 10),
    ('monocytes',     'Monocytes',        'Mono',    '%',      2::numeric,     10::numeric,    null::numeric,  null::numeric, false, 11),
    ('eosinophils',   'Eosinophils',      'Eos',     '%',      1::numeric,     6::numeric,     null::numeric,  null::numeric, false, 12),
    ('basophils',     'Basophils',        'Baso',    '%',      0::numeric,     2::numeric,     null::numeric,  null::numeric, false, 13),
    ('platelet_count','Platelet Count',   'Plt',     '/μL',    150000::numeric,450000::numeric,null::numeric,  null::numeric, false, 14)
  ) as x(slug, name, short_name, unit, ref_low, ref_high, ref_low_f, ref_high_f, hib, ord)
  where p.slug = 'cbc';

  -- ── 7. Iron Studies ─────────────────────────────────────────────
  insert into public.lab_markers (panel_id, slug, name, short_name, unit, ref_low, ref_high, ref_low_female, ref_high_female, higher_is_better, display_order)
  select p.id, x.slug, x.name, x.short_name, x.unit, x.ref_low, x.ref_high, x.ref_low_f, x.ref_high_f, false, x.ord
  from public.lab_panels p, (values
    ('serum_iron',        'Serum Iron',            'Fe',      'μg/dL', 65::numeric, 176::numeric, 50::numeric, 170::numeric, 1),
    ('tibc',              'TIBC',                  'TIBC',    'μg/dL', 240::numeric,450::numeric, null::numeric,null::numeric, 2),
    ('transferrin_sat',   'Transferrin Saturation','TSat',    '%',     20::numeric, 50::numeric,  null::numeric,null::numeric, 3),
    ('ferritin',          'Ferritin',              'Ferritin','ng/mL', 30::numeric, 400::numeric, 15::numeric,  150::numeric, 4)
  ) as x(slug, name, short_name, unit, ref_low, ref_high, ref_low_f, ref_high_f, ord)
  where p.slug = 'iron';

  -- ── 8. Vitamins ─────────────────────────────────────────────────
  insert into public.lab_markers (panel_id, slug, name, short_name, unit, ref_low, ref_high, higher_is_better, display_order)
  select p.id, x.slug, x.name, x.short_name, x.unit, x.ref_low, x.ref_high, x.hib, x.ord
  from public.lab_panels p, (values
    ('vitamin_d',   'Vitamin D (25-OH)', 'Vit D',  'ng/mL', 30::numeric,  100::numeric, true,  1),
    ('vitamin_b12', 'Vitamin B12',       'B12',    'pg/mL', 200::numeric, 900::numeric, false, 2),
    ('folate',      'Folate',            'Folate', 'ng/mL', 3::numeric,   17::numeric,  false, 3),
    ('vitamin_c',   'Vitamin C',         'Vit C',  'mg/dL', 0.4::numeric, 2.0::numeric, false, 4)
  ) as x(slug, name, short_name, unit, ref_low, ref_high, hib, ord)
  where p.slug = 'vitamins';

  -- ── 9. Minerals & Electrolytes ──────────────────────────────────
  insert into public.lab_markers (panel_id, slug, name, short_name, unit, ref_low, ref_high, higher_is_better, display_order)
  select p.id, x.slug, x.name, x.short_name, x.unit, x.ref_low, x.ref_high, false, x.ord
  from public.lab_panels p, (values
    ('sodium',       'Sodium',         'Na',   'mEq/L', 135::numeric, 145::numeric,  1),
    ('potassium',    'Potassium',      'K',    'mEq/L', 3.5::numeric, 5.0::numeric,  2),
    ('chloride',     'Chloride',       'Cl',   'mEq/L', 96::numeric,  106::numeric,  3),
    ('calcium',      'Calcium',        'Ca',   'mg/dL', 8.5::numeric, 10.5::numeric, 4),
    ('ionized_calcium','Ionized Calcium','iCa','mg/dL', 4.5::numeric, 5.5::numeric,  5),
    ('magnesium',    'Magnesium',      'Mg',   'mg/dL', 1.7::numeric, 2.2::numeric,  6),
    ('phosphorus',   'Phosphorus',     'PO4',  'mg/dL', 2.5::numeric, 4.5::numeric,  7),
    ('zinc',         'Zinc',           'Zn',   'μg/dL', 70::numeric,  120::numeric,  8)
  ) as x(slug, name, short_name, unit, ref_low, ref_high, ord)
  where p.slug = 'minerals';

  -- ── 10. Hormones (male + female — gender-adjusted where relevant)
  insert into public.lab_markers (panel_id, slug, name, short_name, unit, ref_low, ref_high, ref_low_female, ref_high_female, higher_is_better, display_order)
  select p.id, x.slug, x.name, x.short_name, x.unit, x.ref_low, x.ref_high, x.ref_low_f, x.ref_high_f, false, x.ord
  from public.lab_panels p, (values
    -- Male markers
    ('testosterone_total','Testosterone (Total)','T-total','ng/dL', 300::numeric,  1000::numeric, 15::numeric,  70::numeric,   1),
    ('testosterone_free', 'Testosterone (Free)', 'T-free', 'pg/mL', 5::numeric,    21::numeric,   0.3::numeric, 3.2::numeric,  2),
    ('dhea_s',            'DHEA-S',              'DHEA-S', 'μg/dL', 100::numeric,  500::numeric,  35::numeric,  430::numeric,  3),
    ('cortisol',          'Cortisol (AM)',       'Cort',   'μg/dL', 6::numeric,    23::numeric,   null::numeric,null::numeric, 4),
    ('prolactin',         'Prolactin',           'PRL',    'ng/mL', 4::numeric,    15::numeric,   4::numeric,   23::numeric,   5),
    -- Female-only markers (male ranges left null so form hides them for male clients)
    ('estradiol',         'Estradiol',           'E2',     'pg/mL', null::numeric, null::numeric, 30::numeric,  400::numeric,  6),
    ('progesterone',      'Progesterone',        'P4',     'ng/mL', null::numeric, null::numeric, 0.2::numeric, 25::numeric,   7),
    ('lh',                'LH',                  'LH',     'mIU/mL',null::numeric, null::numeric, 5::numeric,   25::numeric,   8),
    ('fsh',               'FSH',                 'FSH',    'mIU/mL',null::numeric, null::numeric, 3::numeric,   20::numeric,   9),
    ('amh',               'AMH',                 'AMH',    'ng/mL', null::numeric, null::numeric, 1::numeric,   4::numeric,   10)
  ) as x(slug, name, short_name, unit, ref_low, ref_high, ref_low_f, ref_high_f, ord)
  where p.slug = 'hormones';

  -- ── 11. Inflammation & Cardiac ──────────────────────────────────
  insert into public.lab_markers (panel_id, slug, name, short_name, unit, ref_low, ref_high, ref_low_female, ref_high_female, higher_is_better, display_order)
  select p.id, x.slug, x.name, x.short_name, x.unit, x.ref_low, x.ref_high, x.ref_low_f, x.ref_high_f, false, x.ord
  from public.lab_panels p, (values
    ('crp',           'CRP',                  'CRP',    'mg/L',   null::numeric, 1::numeric,    null::numeric, null::numeric, 1),
    ('hs_crp',        'hs-CRP',               'hs-CRP', 'mg/L',   null::numeric, 3::numeric,    null::numeric, null::numeric, 2),
    ('esr',           'ESR',                  'ESR',    'mm/hr',  null::numeric, 20::numeric,   null::numeric, 30::numeric,   3),
    ('homocysteine',  'Homocysteine',         'Hcy',    'μmol/L', 5::numeric,    15::numeric,   null::numeric, null::numeric, 4),
    ('lipoprotein_a', 'Lipoprotein(a)',       'Lp(a)',  'mg/dL',  null::numeric, 30::numeric,   null::numeric, null::numeric, 5),
    ('troponin_i',    'Troponin I',           'TnI',    'ng/mL',  null::numeric, 0.04::numeric, null::numeric, null::numeric, 6),
    ('bnp',           'BNP',                  'BNP',    'pg/mL',  null::numeric, 100::numeric,  null::numeric, null::numeric, 7),
    ('nt_probnp',     'NT-proBNP',            'NT-pBNP','pg/mL',  null::numeric, 300::numeric,  null::numeric, null::numeric, 8)
  ) as x(slug, name, short_name, unit, ref_low, ref_high, ref_low_f, ref_high_f, ord)
  where p.slug = 'inflammation';
end
$seed$;

-- Refresh PostgREST so the new tables + columns are queryable immediately.
notify pgrst, 'reload schema';
