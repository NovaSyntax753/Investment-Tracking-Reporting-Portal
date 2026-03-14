-- Security + workflow support for registration approval lifecycle
-- 1) Store registration password as hash only
-- 2) Track verification timeline
-- 3) Allow active state after email verification

alter table public.registration_requests
  add column if not exists temp_password_hash text,
  add column if not exists verification_sent_at timestamptz,
  add column if not exists verification_expires_at timestamptz,
  add column if not exists verified_at timestamptz;

alter table public.registration_requests
  drop constraint if exists registration_requests_status_check;

alter table public.registration_requests
  add constraint registration_requests_status_check
  check (status in ('pending', 'approved', 'active', 'rejected'));
