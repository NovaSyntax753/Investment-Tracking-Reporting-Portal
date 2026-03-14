-- Enforce unique mobile number per investor/request (ignoring null/blank values)

create unique index if not exists uq_investors_phone
  on public.investors (phone)
  where phone is not null and btrim(phone) <> '';

create unique index if not exists uq_registration_requests_phone
  on public.registration_requests (phone)
  where phone is not null and btrim(phone) <> '';
