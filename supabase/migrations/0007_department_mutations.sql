create or replace function public.rename_department(p_id uuid, p_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  old_name text;
begin
  select name into old_name
  from public.departments
  where id = p_id
  for update;

  if not found then
    raise exception 'missing';
  end if;

  update public.departments
  set name = p_name
  where id = p_id;

  update public.profiles
  set department = p_name
  where department = old_name;
end;
$$;

create or replace function public.remove_department(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  dept_name text;
  in_use int;
  total_count int;
begin
  lock table public.departments in share row exclusive mode;

  select name into dept_name
  from public.departments
  where id = p_id
  for update;

  if not found then
    raise exception 'missing';
  end if;

  perform id from public.profiles where department = dept_name for update;

  select count(*)::int into in_use
  from public.profiles
  where department = dept_name;

  if in_use > 0 then
    raise exception 'move people first';
  end if;

  select count(*)::int into total_count
  from public.departments;

  if total_count <= 1 then
    raise exception 'keep at least one';
  end if;

  delete from public.departments
  where id = p_id;
end;
$$;

revoke all on function public.rename_department(uuid, text) from public, anon, authenticated;
revoke all on function public.remove_department(uuid) from public, anon, authenticated;
grant execute on function public.rename_department(uuid, text) to service_role;
grant execute on function public.remove_department(uuid) to service_role;
