create table public.app_settings (
  id smallint primary key default 1 check (id = 1),
  app_name text not null default 'halfAccessible',
  logo_path text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

insert into public.app_settings (id, app_name) values (1, 'halfAccessible');

alter table public.app_settings enable row level security;

create policy app_settings_select on public.app_settings
  for select to anon, authenticated
  using (true);

create policy app_settings_update on public.app_settings
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

create policy branding_public_read
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'branding');
