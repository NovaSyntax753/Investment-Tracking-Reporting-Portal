-- Investment Tracking & Reporting Portal
-- Initial Schema + RLS Policies
-- Run this in Supabase SQL Editor

-- ─────────────────────────────────────────
-- 1. TABLES
-- ─────────────────────────────────────────

create table if not exists public.investors (
  id                      uuid primary key references auth.users(id) on delete cascade,
  name                    text not null,
  email                   text not null unique,
  phone                   text,
  invested_amount         numeric(20, 2) not null default 0,
  fixed_return_value      numeric(20, 2) not null default 0,
  fixed_return_percentage numeric(8, 4) not null default 0,
  is_active               boolean not null default true,
  created_at              timestamptz not null default now()
);

create table if not exists public.daily_updates (
  id          uuid primary key default gen_random_uuid(),
  investor_id uuid not null references public.investors(id) on delete cascade,
  eod_amount  numeric(20, 2) not null,
  trade_notes text,
  update_date date not null default current_date,
  created_at  timestamptz not null default now()
);

create table if not exists public.monthly_reports (
  id           uuid primary key default gen_random_uuid(),
  investor_id  uuid not null references public.investors(id) on delete cascade,
  report_month text not null,               -- e.g. "June 2025"
  document_url text not null,               -- Supabase Storage path
  uploaded_at  timestamptz not null default now(),
  notified     boolean not null default false
);

create table if not exists public.contacts (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  message    text not null,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- 2. INDEXES
-- ─────────────────────────────────────────

create index if not exists idx_daily_updates_investor_date
  on public.daily_updates(investor_id, update_date desc);

create index if not exists idx_monthly_reports_investor
  on public.monthly_reports(investor_id, uploaded_at desc);

-- ─────────────────────────────────────────
-- 3. ROW LEVEL SECURITY
-- ─────────────────────────────────────────

alter table public.investors       enable row level security;
alter table public.daily_updates   enable row level security;
alter table public.monthly_reports enable row level security;
alter table public.contacts        enable row level security;

-- investors: each user can only read their own row
create policy "investors_select_own" on public.investors
  for select using (auth.uid() = id);

-- daily_updates: each investor reads only their own rows
create policy "daily_updates_select_own" on public.daily_updates
  for select using (auth.uid() = investor_id);

-- monthly_reports: each investor reads only their own rows
create policy "monthly_reports_select_own" on public.monthly_reports
  for select using (auth.uid() = investor_id);

-- contacts: anyone can insert (public contact form); no public reads
create policy "contacts_insert_public" on public.contacts
  for insert with check (true);

-- ─────────────────────────────────────────
-- 4. STORAGE BUCKET (run after creating the bucket in Supabase dashboard)
-- ─────────────────────────────────────────
-- Create a private bucket named: monthly-reports
-- Then add a storage policy so investors can download only their own files:
--
-- CREATE POLICY "investors_read_own_reports"
-- ON storage.objects FOR SELECT
-- USING (
--   bucket_id = 'monthly-reports'
--   AND (storage.foldername(name))[1] = auth.uid()::text
-- );
