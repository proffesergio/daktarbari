-- Phase-3 migration (2026-10): self-edit portal, notifications, named admins,
-- OTP claims, review votes, persistent rate limiting.
-- SAFE to run multiple times.

create extension if not exists "pgcrypto";

-- 1) Doctor-scoped tokens (self-edit portal + chamber inbox links)
create table if not exists doctor_tokens (
  token text primary key,
  doctor_id text not null,
  scope text not null check (scope in ('edit','inbox')),
  expires_at timestamptz not null,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_doctor_tokens_doctor on doctor_tokens(doctor_id);
alter table doctor_tokens enable row level security;

-- 2) Outbound notification queue (SMS/WhatsApp; provider-pluggable)
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('sms','whatsapp','note')),
  to_phone text not null default '',
  body text not null default '',
  status text not null default 'QUEUED' check (status in ('QUEUED','SENT','FAILED')),
  error text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_status on notifications(status);
alter table notifications enable row level security;

-- 3) Named admins (per-person tokens; master ADMIN_TOKEN still works)
create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  token_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table admins enable row level security;

-- Audit trail records the actor going forward.
-- Self-sufficient: creates the table (with actor) if the trust-engagement
-- migration was never run, otherwise just adds the missing column.
create table if not exists admin_actions (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  doctor_id text,
  detail text not null default '',
  actor text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists idx_admin_actions_created on admin_actions(created_at desc);
alter table admin_actions enable row level security;
alter table admin_actions add column if not exists actor text not null default '';

-- 4) OTP for phone-verified claims
create table if not exists otp_requests (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code_hash text not null,
  attempts int not null default 0,
  consumed boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_otp_phone on otp_requests(phone);
alter table otp_requests enable row level security;

-- 5) Review helpfulness votes (one per IP per review)
create table if not exists review_votes (
  review_id uuid not null,
  ip_hash text not null,
  created_at timestamptz not null default now(),
  primary key (review_id, ip_hash)
);
alter table review_votes enable row level security;

-- 6) Persistent rate-limit buckets (multi-instance safe)
create table if not exists rate_hits (
  ip_hash text not null,
  tag text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_rate_hits_lookup on rate_hits(ip_hash, tag, created_at);
alter table rate_hits enable row level security;
