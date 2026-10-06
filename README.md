# ডাক্তার বাড়ি (daktarbari) — বাংলাদেশের ডাক্তার ডিরেক্টরি

Bangla-first, elder-friendly. Next.js App Router + Supabase + Google Sheets.

## Local dev
```bash
npm install --include=dev
cp .env.example .env.local  # fill values
npm run dev
```

## Setup
1. Supabase: run `supabase/schema.sql` in SQL editor.
2. Google Sheet: create tabs `Pending`, `Approved`, `Reports`. Share with service account email (Editor).
3. Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_TOKEN`, `GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `CRON_SECRET`.

## Deploy (Vercel)
- Import repo, add same env vars, deploy.
- Cron runs `/api/revalidate?secret=$CRON_SECRET` daily 2am (see `vercel.json`).
- Admin: `/admin/login` with `ADMIN_TOKEN`.

## Flow
`Form /add` → Postgres `PENDING` + Sheets `Pending` → Admin Approve → `APPROVED` (+ Sheets `Approved`) → public list.
Votes: `doctor_votes` log + counters. Reports surface in `/admin`.
