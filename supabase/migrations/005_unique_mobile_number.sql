-- Enforce unique mobile number per investor/request (ignoring null/blank values)
-- Existing duplicate values must be cleaned before unique indexes can be created.

-- 1) Normalize obvious blanks
update public.investors
set phone = null
where phone is not null and btrim(phone) = '';

update public.registration_requests
set phone = null
where phone is not null and btrim(phone) = '';

-- 2) Keep the oldest record's phone and clear phone on duplicates.
-- Investors: keep earliest created_at/id per phone
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

-- Registration requests: keep earliest created_at/id per phone
with ranked_requests as (
  select
    id,
    row_number() over (
      partition by phone
      order by created_at asc, id asc
    ) as rn
  from public.registration_requests
  where phone is not null and btrim(phone) <> ''
)
update public.registration_requests rr
set phone = null
from ranked_requests r
where rr.id = r.id
  and r.rn > 1;

-- 3) Create uniqueness constraints via partial unique indexes.
create unique index if not exists uq_investors_phone
  on public.investors (phone)
  where phone is not null and btrim(phone) <> '';

create unique index if not exists uq_registration_requests_phone
  on public.registration_requests (phone)
  where phone is not null and btrim(phone) <> '';
