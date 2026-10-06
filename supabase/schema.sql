-- daktarbari schema — run in Supabase SQL editor (fresh install).
-- IDs are TEXT so local seeds (seed-01, qimp-01) and app UUIDs share one key
-- space — upsert on id never duplicates. photo_url stores /doctors/... path.
-- If you already ran the old uuid schema with no real data yet, drop first:
--   drop table if exists doctor_votes; drop table if exists doctors;

create extension if not exists "pgcrypto";

create table if not exists doctors (
  id text primary key default (gen_random_uuid()::text),
  name_bn text not null,
  name_en text,
  specialty_bn text not null,
  bmdc_reg_no text,
  location_district text not null,
  location_upazila_area text not null,
  chamber_address_bn text not null,
  appointment_contact text not null default '',
  visiting_hours_bn text not null default '',
  visiting_fee_approx text not null default '',
  photo_url text,
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED')),
  upvotes int not null default 0,
  downvotes int not null default 0,
  reports int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_doctors_status on doctors(status);
create index if not exists idx_doctors_district on doctors(location_district);
create index if not exists idx_doctors_area on doctors(location_upazila_area);
create index if not exists idx_doctors_specialty on doctors(specialty_bn);

-- Public read: APPROVED only
alter table doctors enable row level security;
drop policy if exists "public read approved" on doctors;
create policy "public read approved" on doctors
  for select using (status = 'APPROVED');

-- Votes log for transparency (one row per vote/report)
create table if not exists doctor_votes (
  id uuid primary key default gen_random_uuid(),
  doctor_id text not null,
  kind text not null check (kind in ('up','down','report')),
  reason text,
  created_at timestamptz not null default now()
);
alter table doctor_votes enable row level security;
drop policy if exists "anyone can insert vote" on doctor_votes;
create policy "anyone can insert vote" on doctor_votes for insert with check (true);
drop policy if exists "public read votes" on doctor_votes;
create policy "public read votes" on doctor_votes for select using (true);

-- Community phone verification: anyone confirms the number or suggests a fix.
-- doctor_id is TEXT so seed/qimp ids work before they are approved.
create table if not exists phone_verifications (
  id uuid primary key default gen_random_uuid(),
  doctor_id text not null,
  action text not null check (action in ('confirm','correct')),
  phone text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists idx_phone_verif_doctor on phone_verifications(doctor_id);
alter table phone_verifications enable row level security;
drop policy if exists "anyone can insert verification" on phone_verifications;
create policy "anyone can insert verification" on phone_verifications for insert with check (true);
drop policy if exists "public read verifications" on phone_verifications;
create policy "public read verifications" on phone_verifications for select using (true);
