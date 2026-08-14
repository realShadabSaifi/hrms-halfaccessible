create table public.company_holidays (
  id uuid primary key default gen_random_uuid(),
  holiday_on date not null,
  title text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index company_holidays_on on public.company_holidays (holiday_on);

alter table public.company_holidays enable row level security;

create policy company_holidays_select on public.company_holidays
  for select to authenticated
  using (true);
