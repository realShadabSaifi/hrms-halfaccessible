-- First auth user becomes admin. Later users stay employee unless an admin changes them.

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
      when not exists (select 1 from public.profiles) then 'admin'
      else 'employee'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

update public.profiles
set role = 'admin'
where id = (
  select id from public.profiles order by joined_at asc, id asc limit 1
)
and not exists (select 1 from public.profiles where role = 'admin');
