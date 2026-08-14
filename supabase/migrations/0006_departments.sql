create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort int not null,
  created_at timestamptz not null default now()
);

create unique index departments_name_lower on public.departments (lower(name));

insert into public.departments (name, sort) values
  ('Engineering', 1),
  ('Design', 2),
  ('Product', 3),
  ('HR', 4),
  ('Marketing', 5)
on conflict ((lower(name))) do nothing;

alter table public.departments enable row level security;

create policy departments_select on public.departments
  for select to authenticated
  using (true);
