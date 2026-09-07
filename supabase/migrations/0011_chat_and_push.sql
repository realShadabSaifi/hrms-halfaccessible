create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('dm', 'group')),
  title text not null default '',
  dm_key text unique,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  check ((kind = 'dm' and dm_key is not null) or (kind = 'group' and dm_key is null))
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index messages_conversation_created_idx
  on public.messages (conversation_id, created_at);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create or replace function public.is_conversation_member(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = cid and user_id = auth.uid()
  )
$$;

create or replace function public.unread_chat_count()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(distinct m.conversation_id)::int
  from public.messages m
  join public.conversation_members me
    on me.conversation_id = m.conversation_id
   and me.user_id = auth.uid()
  where m.sender_id <> auth.uid()
    and (me.last_read_at is null or m.created_at > me.last_read_at)
$$;

create or replace function public.touch_conversation_last_message()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  update public.conversations
  set last_message_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation_last_message();

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.push_subscriptions enable row level security;

create policy conversations_select on public.conversations
  for select to authenticated
  using (public.is_conversation_member(id));

create policy conversations_insert on public.conversations
  for insert to authenticated
  with check (created_by = auth.uid());

create policy conversations_update on public.conversations
  for update to authenticated
  using (public.is_conversation_member(id))
  with check (public.is_conversation_member(id));

create policy members_select on public.conversation_members
  for select to authenticated
  using (public.is_conversation_member(conversation_id));

create policy members_insert on public.conversation_members
  for insert to authenticated
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.created_by = auth.uid()
    )
    or public.is_conversation_member(conversation_id)
  );

create policy members_update on public.conversation_members
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy members_delete on public.conversation_members
  for delete to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.created_by = auth.uid()
    )
  );

create policy messages_select on public.messages
  for select to authenticated
  using (public.is_conversation_member(conversation_id));

create policy messages_insert on public.messages
  for insert to authenticated
  with check (sender_id = auth.uid() and public.is_conversation_member(conversation_id));

create policy push_select on public.push_subscriptions
  for select to authenticated
  using (user_id = auth.uid());

create policy push_insert on public.push_subscriptions
  for insert to authenticated
  with check (user_id = auth.uid());

create policy push_delete on public.push_subscriptions
  for delete to authenticated
  using (user_id = auth.uid());

grant execute on function public.is_conversation_member(uuid) to authenticated;
grant execute on function public.unread_chat_count() to authenticated;

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversation_members;
