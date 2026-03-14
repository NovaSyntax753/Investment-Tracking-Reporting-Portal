-- Add temporary password storage to registration_requests
-- The password chosen by the user during registration is stored here
-- and used when the admin approves the request to create the auth user.
-- It is cleared (set to NULL) immediately after approval.

alter table public.registration_requests
  add column if not exists temp_password text;
