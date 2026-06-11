-- ================================================================
-- Y&C Lease Management — Supabase Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard
-- ================================================================

-- Enum for brands
create type brand_type as enum ('wendys', 'tacobell', 'starbucks');

-- ── Locations ────────────────────────────────────────────────────
create table locations (
  id           uuid        primary key default gen_random_uuid(),
  brand        brand_type  not null,
  store_number text,
  display_name text        not null,   -- "Wendy's · 2596 · South Road"
  short_name   text,                   -- "South Road"
  address      text,
  city         text,
  state        text,
  zip          text,
  coming_soon  boolean     not null default true,
  maps_url     text,
  created_at   timestamptz not null default now()
);

-- ── Leases ───────────────────────────────────────────────────────
create table leases (
  id                    uuid        primary key default gen_random_uuid(),
  location_id           uuid        not null references locations(id) on delete cascade,
  lessee                text,
  lessor                text,
  possession_date       date,
  commencement_date     date,
  expiry_date           date,
  term_type             text,       -- "Fixed", "Month-to-Month", etc
  square_footage        numeric(12,2),
  base_rent_monthly     numeric(12,2),
  cam_estimated_monthly numeric(12,2),
  pro_rata_share        numeric(8,4), -- e.g. 0.0412 = 4.12%
  status                text        not null default 'active'
                          check (status in ('active', 'expired', 'pending')),
  extracted_at          timestamptz,
  created_at            timestamptz not null default now(),
  unique (location_id),              -- one active lease per location
  check (commencement_date is null or expiry_date is null or commencement_date <= expiry_date)
);

-- ── Lease Files ──────────────────────────────────────────────────
create table lease_files (
  id               uuid        primary key default gen_random_uuid(),
  lease_id         uuid        references leases(id) on delete set null,
  location_id      uuid        not null references locations(id) on delete cascade,
  file_name        text        not null,
  storage_bucket   text        not null default 'leases',
  storage_path     text        not null unique,
  file_size_bytes  bigint,
  mime_type        text        default 'application/pdf',
  uploaded_at      timestamptz not null default now()
);

-- ── CAM Line Items ───────────────────────────────────────────────
create table cam_line_items (
  id               uuid     primary key default gen_random_uuid(),
  lease_id         uuid     not null references leases(id) on delete cascade,
  year             int      not null,
  category         text     not null,
  landlord_billed  numeric(12,2),
  tenant_share     numeric(12,2),
  notes            text,
  created_at       timestamptz not null default now()
);

-- ── Rent Schedule ────────────────────────────────────────────────
create table rent_schedule (
  id                    uuid     primary key default gen_random_uuid(),
  lease_id              uuid     not null references leases(id) on delete cascade,
  period_label          text,
  period_start          date,
  period_end            date,
  base_rent_monthly     numeric(12,2),
  base_rent_annual      numeric(12,2)
    generated always as (base_rent_monthly * 12) stored,
  cam_estimated_monthly numeric(12,2),
  total_monthly         numeric(12,2)
    generated always as (base_rent_monthly + cam_estimated_monthly) stored,
  notes                 text,
  sort_order            int      not null default 0,
  created_at            timestamptz not null default now(),
  check (period_start is null or period_end is null or period_start <= period_end)
);

-- ── Critical Dates ───────────────────────────────────────────────
create table critical_dates (
  id                   uuid primary key default gen_random_uuid(),
  lease_id             uuid not null references leases(id) on delete cascade,
  event_type           text not null,  -- "Renewal Option", "Notice Deadline", etc
  event_date           date,
  notice_required_days int,
  notes                text,
  created_at           timestamptz not null default now()
);

-- ── Clause Library ───────────────────────────────────────────────
create table clauses (
  id              uuid        primary key default gen_random_uuid(),
  lease_id        uuid        not null references leases(id) on delete cascade,
  clause_type     text        not null,  -- "CAM", "Assignment", "HVAC", etc
  title           text        not null,
  content         text        not null,
  page_reference  text,                  -- "p. 14, §8.3"
  created_at      timestamptz not null default now()
);

-- ── Indexes ──────────────────────────────────────────────────────
create index locations_brand_idx          on locations(brand);
create index leases_location_id_idx       on leases(location_id);
create index lease_files_location_id_idx  on lease_files(location_id);
create index lease_files_lease_id_idx     on lease_files(lease_id);
create index cam_line_items_lease_id_idx  on cam_line_items(lease_id);
create index rent_schedule_lease_id_idx   on rent_schedule(lease_id, sort_order);
create index critical_dates_lease_id_idx  on critical_dates(lease_id);
create index clauses_lease_id_idx         on clauses(lease_id);

-- ── Row Level Security ───────────────────────────────────────────
-- Enable RLS on all tables (required for Supabase anon key to work safely)
alter table locations     enable row level security;
alter table leases        enable row level security;
alter table lease_files   enable row level security;
alter table cam_line_items enable row level security;
alter table rent_schedule  enable row level security;
alter table critical_dates enable row level security;
alter table clauses        enable row level security;

-- Internal tool — allow all operations for authenticated users.
-- Tighten per-user policies when auth is added.
create policy "auth_all" on locations     for all to authenticated using (true) with check (true);
create policy "auth_all" on leases        for all to authenticated using (true) with check (true);
create policy "auth_all" on lease_files   for all to authenticated using (true) with check (true);
create policy "auth_all" on cam_line_items for all to authenticated using (true) with check (true);
create policy "auth_all" on rent_schedule  for all to authenticated using (true) with check (true);
create policy "auth_all" on critical_dates for all to authenticated using (true) with check (true);
create policy "auth_all" on clauses        for all to authenticated using (true) with check (true);

-- ── Storage Bucket ───────────────────────────────────────────────
-- Run in Supabase Dashboard → Storage → New bucket, or via SQL:
-- insert into storage.buckets (id, name, public) values ('leases', 'leases', false);
