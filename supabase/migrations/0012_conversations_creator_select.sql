drop policy conversations_select on public.conversations;

create policy conversations_select on public.conversations
  for select to authenticated
  using (public.is_conversation_member(id) or created_by = auth.uid());
