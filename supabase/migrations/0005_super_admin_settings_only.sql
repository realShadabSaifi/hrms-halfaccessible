create or replace function public.is_lead_or_admin()
returns boolean
language sql
stable
as $$
  select public.current_profile_role() in ('lead', 'admin')
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.current_profile_role() = 'admin'
$$;
