-- Migration: division + fee_min for sophisticated search + universal verification
-- SAFE to run before OR after schema.sql (creates base tables if missing).
-- Fresh install? Just run supabase/schema.sql (already includes everything below).

create extension if not exists "pgcrypto";

-- Ensure base table exists (fixes 42P01: relation "doctors" does not exist)
create table if not exists doctors (
  id text primary key default (gen_random_uuid()::text),
  name_bn text not null,
  name_en text,
  specialty_bn text not null,
  bmdc_reg_no text,
  location_division text not null default '',
  location_district text not null,
  location_upazila_area text not null,
  chamber_address_bn text not null,
  appointment_contact text not null default '',
  visiting_hours_bn text not null default '',
  visiting_fee_approx text not null default '',
  fee_min int,
  photo_url text,
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED')),
  upvotes int not null default 0,
  downvotes int not null default 0,
  reports int not null default 0,
  created_at timestamptz not null default now()
);

alter table doctors add column if not exists location_division text default '';
alter table doctors add column if not exists fee_min int;

create index if not exists idx_doctors_division on doctors(location_division);
create index if not exists idx_doctors_fee on doctors(fee_min);

-- Universal verification: phone/chamber/fee/hours/bmdc/general
-- doctor_id is TEXT so seed ids work pre-approval.
create table if not exists doctor_verifications (
  id uuid primary key default gen_random_uuid(),
  doctor_id text not null,
  target text not null check (target in ('phone','chamber','fee','hours','bmdc','general')),
  action text not null check (action in ('confirm','correct')),
  note text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists idx_doctor_verif_doctor on doctor_verifications(doctor_id);
create index if not exists idx_doctor_verif_target on doctor_verifications(target);
alter table doctor_verifications enable row level security;
drop policy if exists "anyone can insert doctor verification" on doctor_verifications;
create policy "anyone can insert doctor verification" on doctor_verifications for insert with check (true);
drop policy if exists "public read doctor verifications" on doctor_verifications;
create policy "public read doctor verifications" on doctor_verifications for select using (true);

-- Facilities: hospitals + diagnostics (admin-managed, public read)
create table if not exists facilities (
  id text primary key,
  kind text not null check (kind in ('hospital','diagnostic')),
  name_bn text not null,
  name_en text,
  division_bn text not null default '',
  district_bn text not null default '',
  upazila_area text not null default '',
  address_bn text not null default '',
  phone text not null default '',
  hours_bn text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists idx_facilities_kind on facilities(kind);
create index if not exists idx_facilities_district on facilities(district_bn);
alter table facilities enable row level security;
drop policy if exists "public read facilities" on facilities;
create policy "public read facilities" on facilities for select using (true);
