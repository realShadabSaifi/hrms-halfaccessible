-- halfAccessible portal schema + RLS

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  designation text not null default '',
  department text not null default '',
  skills text[] not null default '{}',
  bio text not null default '',
  avatar_color text not null default '#7048B6',
  role text not null default 'employee' check (role in ('employee', 'lead', 'admin')),
  active boolean not null default true,
  joined_at date not null default current_date,
  totp_verified_at timestamptz,
  ann_seen_at timestamptz
);

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

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

create table public.totp_credentials (
  user_id uuid primary key references auth.users (id) on delete cascade,
  secret_ciphertext bytea not null,
  secret_iv bytea not null,
  verified_at timestamptz,
  failed_attempts int not null default 0,
  locked_until timestamptz
);

create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('sick', 'personal', 'festival', 'emergency', 'other')),
  starts_on date not null,
  ends_on date not null,
  reason text not null default '',
  handoff text not null default '',
  emergency boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decision_note text not null default '',
  decided_by uuid references public.profiles (id),
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.burger_holidays (
  id uuid primary key default gen_random_uuid(),
  proposed_by uuid not null references public.profiles (id) on delete cascade,
  holiday_on date not null,
  title text not null,
  reason text not null,
  voting_closes_at timestamptz not null,
  status text not null default 'voting' check (status in ('voting', 'approved', 'rejected')),
  admin_override boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.burger_votes (
  holiday_id uuid not null references public.burger_holidays (id) on delete cascade,
  voter_id uuid not null references public.profiles (id) on delete cascade,
  choice text not null check (choice in ('yes', 'no')),
  created_at timestamptz not null default now(),
  primary key (holiday_id, voter_id)
);

create table public.anonymous_messages (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.anon_upvotes (
  message_id uuid not null references public.anonymous_messages (id) on delete cascade,
  session_hash text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, session_hash)
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  category text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.announcement_reactions (
  announcement_id uuid not null references public.announcements (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (announcement_id, user_id, emoji)
);

create table public.party_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  occasion text not null,
  vibe text not null,
  preferred_on date,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.trip_polls (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  open boolean not null default true,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.trip_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.trip_polls (id) on delete cascade,
  name text not null
);

create table public.trip_votes (
  option_id uuid not null references public.trip_options (id) on delete cascade,
  voter_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (option_id, voter_id)
);

create table public.cxo_windows (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text not null,
  tagline text not null,
  avatar_color text not null,
  window_label text not null,
  slots_remaining int not null default 0 check (slots_remaining >= 0)
);

create table public.cxo_bookings (
  id uuid primary key default gen_random_uuid(),
  cxo_id uuid not null references public.cxo_windows (id) on delete cascade,
  booker_id uuid not null references public.profiles (id) on delete cascade,
  topic text not null,
  note text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  verb text not null,
  body text not null,
  created_at timestamptz not null default now()
);

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
    'employee'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (id, full_name, role)
select
  id,
  coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1), ''),
  'employee'
from auth.users
on conflict (id) do nothing;

create or replace function public.enforce_one_trip_vote()
returns trigger
language plpgsql
as $$
declare
  poll uuid;
begin
  select poll_id into poll from public.trip_options where id = new.option_id;
  delete from public.trip_votes tv
    using public.trip_options o
    where tv.option_id = o.id
      and o.poll_id = poll
      and tv.voter_id = new.voter_id
      and tv.option_id <> new.option_id;
  return new;
end;
$$;

create trigger trip_vote_switch
  before insert on public.trip_votes
  for each row execute function public.enforce_one_trip_vote();

alter table public.profiles enable row level security;
alter table public.totp_credentials enable row level security;
alter table public.leave_requests enable row level security;
alter table public.burger_holidays enable row level security;
alter table public.burger_votes enable row level security;
alter table public.anonymous_messages enable row level security;
alter table public.anon_upvotes enable row level security;
alter table public.announcements enable row level security;
alter table public.announcement_reactions enable row level security;
alter table public.party_requests enable row level security;
alter table public.trip_polls enable row level security;
alter table public.trip_options enable row level security;
alter table public.trip_votes enable row level security;
alter table public.cxo_windows enable row level security;
alter table public.cxo_bookings enable row level security;
alter table public.activity_events enable row level security;

-- totp_credentials: no policies for anon/authenticated (service role bypasses RLS)

create policy profiles_select on public.profiles
  for select to authenticated
  using (true);

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.current_profile_role());

create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy profiles_insert_admin on public.profiles
  for insert to authenticated
  with check (public.is_admin());

create policy leaves_select on public.leave_requests
  for select to authenticated
  using (requester_id = auth.uid() or public.is_lead_or_admin());

create policy leaves_insert on public.leave_requests
  for insert to authenticated
  with check (requester_id = auth.uid());

create policy leaves_update_lead on public.leave_requests
  for update to authenticated
  using (public.is_lead_or_admin())
  with check (public.is_lead_or_admin());

create policy burgers_select on public.burger_holidays
  for select to authenticated using (true);
create policy burgers_insert on public.burger_holidays
  for insert to authenticated with check (proposed_by = auth.uid());
create policy burgers_update_admin on public.burger_holidays
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy burger_votes_select on public.burger_votes
  for select to authenticated using (true);
create policy burger_votes_insert on public.burger_votes
  for insert to authenticated with check (voter_id = auth.uid());
create policy burger_votes_update on public.burger_votes
  for update to authenticated using (voter_id = auth.uid()) with check (voter_id = auth.uid());

create policy anon_msg_select on public.anonymous_messages
  for select to anon, authenticated using (true);
create policy anon_msg_insert on public.anonymous_messages
  for insert to anon, authenticated with check (true);
-- no update/delete policies

create policy anon_up_select on public.anon_upvotes
  for select to anon, authenticated using (true);
create policy anon_up_insert on public.anon_upvotes
  for insert to anon, authenticated with check (true);

create policy ann_select on public.announcements
  for select to authenticated using (true);
create policy ann_insert on public.announcements
  for insert to authenticated with check (public.is_lead_or_admin());

create policy ann_react_select on public.announcement_reactions
  for select to authenticated using (true);
create policy ann_react_insert on public.announcement_reactions
  for insert to authenticated with check (user_id = auth.uid());
create policy ann_react_delete on public.announcement_reactions
  for delete to authenticated using (user_id = auth.uid());

create policy party_select on public.party_requests
  for select to authenticated using (true);
create policy party_insert on public.party_requests
  for insert to authenticated with check (requester_id = auth.uid());
create policy party_update on public.party_requests
  for update to authenticated using (public.is_lead_or_admin()) with check (public.is_lead_or_admin());

create policy trip_polls_all on public.trip_polls
  for select to authenticated using (true);
create policy trip_polls_update on public.trip_polls
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy trip_polls_insert on public.trip_polls
  for insert to authenticated with check (public.is_admin());

create policy trip_options_select on public.trip_options
  for select to authenticated using (true);
create policy trip_votes_select on public.trip_votes
  for select to authenticated using (true);
create policy trip_votes_insert on public.trip_votes
  for insert to authenticated with check (voter_id = auth.uid());
create policy trip_votes_delete on public.trip_votes
  for delete to authenticated using (voter_id = auth.uid());

create policy cxo_windows_select on public.cxo_windows
  for select to authenticated using (true);
create policy cxo_windows_update on public.cxo_windows
  for update to authenticated using (true) with check (true);

create policy cxo_book_select on public.cxo_bookings
  for select to authenticated using (booker_id = auth.uid() or public.is_admin());
create policy cxo_book_insert on public.cxo_bookings
  for insert to authenticated with check (booker_id = auth.uid());

create policy activity_select on public.activity_events
  for select to authenticated using (true);
create policy activity_insert on public.activity_events
  for insert to authenticated with check (true);
