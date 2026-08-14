alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('employee', 'lead', 'admin', 'super_admin'));

create or replace function public.is_lead_or_admin()
returns boolean
language sql
stable
as $$
  select public.current_profile_role() in ('lead', 'admin', 'super_admin')
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.current_profile_role() in ('admin', 'super_admin')
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
as $$
  select public.current_profile_role() = 'super_admin'
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), ''),
    case
      when not exists (select 1 from public.profiles) then 'super_admin'
      else 'employee'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

update public.profiles
set role = 'super_admin'
where id = (
  select id from public.profiles order by joined_at asc, id asc limit 1
)
and not exists (select 1 from public.profiles where role = 'super_admin');

drop policy if exists app_settings_update on public.app_settings;
create policy app_settings_update on public.app_settings
  for update to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());
