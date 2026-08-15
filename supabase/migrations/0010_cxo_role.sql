alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('employee', 'lead', 'admin', 'super_admin', 'cxo'));

create or replace function public.is_lead_or_admin()
returns boolean
language sql
stable
as $$
  select public.current_profile_role() in ('lead', 'admin', 'cxo')
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.current_profile_role() in ('admin', 'cxo')
$$;
