-- Trust + engagement migration (2026-10).
-- Decisions: instant-live with unverified badge, DB-wins over Sheet,
-- hybrid verification (consensus auto-applies low-risk fields).
-- SAFE to run multiple times (all IF NOT EXISTS / ON CONFLICT DO NOTHING).

create extension if not exists "pgcrypto";

-- 1) Doctors: verified badge, consult availability, weekly schedule (jsonb)
alter table doctors add column if not exists verified boolean not null default false;
alter table doctors add column if not exists consult_available boolean not null default true;
-- schedule shape: {"off": ["Friday"], "note": "শুক্রবার বন্ধ"} (all text, honest)
alter table doctors add column if not exists schedule jsonb not null default '{}';
create index if not exists idx_doctors_verified on doctors(verified);

-- Backfill: everything already APPROVED was human-approved → verified.
update doctors set verified = true where status = 'APPROVED' and verified = false;

-- 2) Verification review state + fraud signals
alter table doctor_verifications add column if not exists reviewed boolean not null default false;
alter table doctor_verifications add column if not exists ip_hash text not null default '';
alter table doctor_votes add column if not exists ip_hash text not null default '';
create index if not exists idx_doctor_verif_reviewed on doctor_verifications(reviewed);

-- 3) Admin audit trail (admin is service_role; actor recorded when named admins exist)
create table if not exists admin_actions (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  doctor_id text,
  detail text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists idx_admin_actions_created on admin_actions(created_at desc);
alter table admin_actions enable row level security;

-- 4) Sync observability (DB-wins: Sheet is a mirror + bulk-import source)
create table if not exists sync_logs (
  id uuid primary key default gen_random_uuid(),
  direction text not null,
  total int not null default 0,
  ok_count int not null default 0,
  error text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists idx_sync_logs_created on sync_logs(created_at desc);
alter table sync_logs enable row level security;

-- 5) Serial / consultation requests (chamber visit or online consult)
create table if not exists serial_requests (
  id uuid primary key default gen_random_uuid(),
  doctor_id text not null,
  kind text not null default 'chamber' check (kind in ('chamber','online')),
  patient_name text not null,
  patient_phone text not null,
  preferred_date text not null default '',
  note text not null default '',
  ip_hash text not null default '',
  status text not null default 'PENDING' check (status in ('PENDING','CONFIRMED','CANCELLED')),
  created_at timestamptz not null default now()
);
create index if not exists idx_serial_doctor on serial_requests(doctor_id);
create index if not exists idx_serial_status on serial_requests(status);
alter table serial_requests enable row level security;
drop policy if exists "anyone can request serial" on serial_requests;
create policy "anyone can request serial" on serial_requests for insert with check (true);
drop policy if exists "public read own serials" on serial_requests;
create policy "public read own serials" on serial_requests for select using (false);

-- 6) Reviews + ratings (moderated: PENDING until admin approves)
create table if not exists doctor_reviews (
  id uuid primary key default gen_random_uuid(),
  doctor_id text not null,
  rating int not null check (rating between 1 and 5),
  comment text not null default '',
  patient_name text not null default '',
  ip_hash text not null default '',
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED')),
  created_at timestamptz not null default now()
);
create index if not exists idx_reviews_doctor on doctor_reviews(doctor_id);
create index if not exists idx_reviews_status on doctor_reviews(status);
alter table doctor_reviews enable row level security;
drop policy if exists "anyone can review" on doctor_reviews;
create policy "anyone can review" on doctor_reviews for insert with check (true);
drop policy if exists "public read approved reviews" on doctor_reviews;
create policy "public read approved reviews" on doctor_reviews for select using (status = 'APPROVED');

-- 7) Profile claims (doctor claims own profile; admin verifies via phone)
create table if not exists profile_claims (
  id uuid primary key default gen_random_uuid(),
  doctor_id text not null,
  claimant_name text not null,
  claimant_phone text not null,
  note text not null default '',
  ip_hash text not null default '',
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED')),
  created_at timestamptz not null default now()
);
create index if not exists idx_claims_doctor on profile_claims(doctor_id);
alter table profile_claims enable row level security;
drop policy if exists "anyone can claim" on profile_claims;
create policy "anyone can claim" on profile_claims for insert with check (true);

-- 8) User activity events (views, call/WhatsApp taps, searches)
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  doctor_id text,
  query text not null default '',
  meta text not null default '',
  ip_hash text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists idx_events_kind on events(kind);
create index if not exists idx_events_doctor on events(doctor_id);
create index if not exists idx_events_created on events(created_at desc);
alter table events enable row level security;
drop policy if exists "anyone can track" on events;
create policy "anyone can track" on events for insert with check (true);
