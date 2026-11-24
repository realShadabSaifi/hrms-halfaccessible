-- Office geofence (one circle, set by the super admin) and punch in / punch out sessions.
-- Safe to re-run: it was first applied by hand on production.

create table if not exists public.office_location (
  id smallint primary key default 1 check (id = 1),
  label text not null default 'office',
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  radius_m integer not null default 150 check (radius_m between 20 and 5000),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

alter table public.office_location enable row level security;

drop policy if exists office_location_select on public.office_location;
create policy office_location_select on public.office_location
  for select to authenticated
  using (true);

drop policy if exists office_location_write on public.office_location;
create policy office_location_write on public.office_location
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  punch_in_at timestamptz not null default now(),
  punch_in_lat double precision not null,
  punch_in_lng double precision not null,
  punch_in_distance_m integer not null,
  punch_out_at timestamptz,
  punch_out_lat double precision,
  punch_out_lng double precision,
  punch_out_distance_m integer,
  check (punch_out_at is null or punch_out_at >= punch_in_at)
);

-- at most one open session per person
create unique index if not exists attendance_sessions_one_open
  on public.attendance_sessions (user_id)
  where punch_out_at is null;

create index if not exists attendance_sessions_user_in
  on public.attendance_sessions (user_id, punch_in_at desc);

alter table public.attendance_sessions enable row level security;

-- people read their own punches; admins read everyone's.
-- writes go through the server (service role) after the geofence check.
drop policy if exists attendance_sessions_select on public.attendance_sessions;
create policy attendance_sessions_select on public.attendance_sessions
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
