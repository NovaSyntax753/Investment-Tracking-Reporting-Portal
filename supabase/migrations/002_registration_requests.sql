-- Registration requests that must be approved by admin before login is possible

create table if not exists public.registration_requests (
  id                      uuid primary key default gen_random_uuid(),
  name                    text not null,
  email                   text not null unique,
  phone                   text,
  invested_amount         numeric(20, 2) not null default 0,
  fixed_return_value      numeric(20, 2) not null default 0,
  fixed_return_percentage numeric(8, 4) not null default 0,
  status                  text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  notes                   text,
  reviewed_at             timestamptz,
  reviewed_by             uuid references auth.users(id) on delete set null,
  investor_id             uuid references public.investors(id) on delete set null,
  created_at              timestamptz not null default now()
);

create index if not exists idx_registration_requests_status_created_at
  on public.registration_requests(status, created_at desc);

alter table public.registration_requests enable row level security;

-- Public can submit registration requests, but cannot read others.
create policy "registration_requests_insert_public" on public.registration_requests
  for insert with check (true);
