alter table public.profiles
  add column if not exists manager_id uuid references public.profiles (id) on delete set null;

create or replace function public.guard_manager_id()
returns trigger
language plpgsql
as $$
begin
  if old.manager_id is not distinct from new.manager_id then
    return new;
  end if;
  if auth.uid() is not null then
    raise exception 'cannot change manager';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_manager_id on public.profiles;
create trigger profiles_guard_manager_id
  before update on public.profiles
  for each row
  execute function public.guard_manager_id();

create or replace function public.set_profile_active(p_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not p_active then
    update public.profiles
    set manager_id = null
    where manager_id = p_id;
  end if;

  update public.profiles
  set active = p_active
  where id = p_id;

  if not found then
    raise exception 'missing';
  end if;
end;
$$;

revoke all on function public.set_profile_active(uuid, boolean) from public, anon, authenticated;
grant execute on function public.set_profile_active(uuid, boolean) to service_role;
