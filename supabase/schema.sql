-- daktarbari schema — run in Supabase SQL editor
create extension if not exists "pgcrypto";

create table if not exists doctors (
  id uuid primary key default gen_random_uuid(),
  name_bn text not null,
  name_en text,
  specialty_bn text not null,
  bmdc_reg_no text,
  location_district text not null,
  location_upazila_area text not null,
  chamber_address_bn text not null,
  appointment_contact text not null,
  visiting_hours_bn text not null,
  visiting_fee_approx text not null,
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
  doctor_id uuid references doctors(id) on delete cascade,
  kind text not null check (kind in ('up','down','report')),
  reason text,
  created_at timestamptz not null default now()
);
alter table doctor_votes enable row level security;
drop policy if exists "anyone can insert vote" on doctor_votes;
create policy "anyone can insert vote" on doctor_votes for insert with check (true);
drop policy if exists "public read votes" on doctor_votes;
create policy "public read votes" on doctor_votes for select using (true);
