-- Lets the login screen tell "no account with this email" apart from "wrong password".
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste this file → Run.
--
-- Trade-off: anyone can check whether an email has a ClickIt account. Returns only true/false —
-- no other account data is exposed.

create or replace function public.email_registered(p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from auth.users
    where lower(email) = lower(trim(p_email))
  )
$$;

revoke all on function public.email_registered(text) from public;
grant execute on function public.email_registered(text) to anon, authenticated;
