-- Current production flow: admin-created investor credentials + auto monthly report fields.

-- 1) Investor identity + phone uniqueness support
alter table public.investors
  add column if not exists investor_code text;

-- Backfill existing rows with stable generated codes if missing.
update public.investors
set investor_code = 'INV-' || upper(substr(replace(id::text, '-', ''), 1, 8))
where investor_code is null;

create unique index if not exists uq_investors_investor_code
  on public.investors (investor_code);

-- Normalize blank phone values and enforce uniqueness for active phone values.
update public.investors
set phone = null
where phone is not null and btrim(phone) = '';

with ranked_investors as (
  select
    id,
    row_number() over (
      partition by phone
      order by created_at asc, id asc
    ) as rn
  from public.investors
  where phone is not null and btrim(phone) <> ''
)
update public.investors i
set phone = null
from ranked_investors r
where i.id = r.id
  and r.rn > 1;

create unique index if not exists uq_investors_phone
  on public.investors (phone)
  where phone is not null and btrim(phone) <> '';

-- 2) Monthly reports: allow auto-generated summary rows without PDF files.
alter table public.monthly_reports
  alter column document_url drop not null;

alter table public.monthly_reports
  add column if not exists month_start date,
  add column if not exists month_end date,
  add column if not exists opening_amount numeric(20, 2),
  add column if not exists closing_amount numeric(20, 2),
  add column if not exists highest_amount numeric(20, 2),
  add column if not exists lowest_amount numeric(20, 2),
  add column if not exists average_amount numeric(20, 2),
  add column if not exists pnl_amount numeric(20, 2),
  add column if not exists pnl_percentage numeric(10, 4),
  add column if not exists trading_days integer,
  add column if not exists auto_generated boolean not null default false,
  add column if not exists generated_at timestamptz not null default now(),
  add column if not exists delivered_at timestamptz;

create unique index if not exists uq_monthly_reports_investor_month
  on public.monthly_reports (investor_id, report_month);
