import { buildInboxRows, type InboxPerson } from "./inbox";
import { createClient } from "@/lib/supabase/server";
import type { ChatMessage, Conversation, ConversationMember, InboxRow, Profile } from "@/lib/types";

export async function loadDirectory(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("active", true)
    .neq("role", "super_admin")
    .order("full_name");
  return (data ?? []) as Profile[];
}

export async function loadInbox(me: string): Promise<{
  rows: InboxRow[];
  conversations: Conversation[];
  members: ConversationMember[];
  messages: ChatMessage[];
  people: InboxPerson[];
}> {
  const supabase = await createClient();
  const { data: mine } = await supabase
    .from("conversation_members")
    .select("conversation_id, last_read_at, joined_at, user_id")
    .eq("user_id", me);
  const ids = (mine ?? []).map((m) => m.conversation_id);
  if (ids.length === 0) {
    return { rows: [], conversations: [], members: [], messages: [], people: [] };
  }
  const [{ data: convos }, { data: members }, { data: messages }] = await Promise.all([
    supabase.from("conversations").select("*").in("id", ids).order("last_message_at", { ascending: false }),
    supabase.from("conversation_members").select("conversation_id, user_id, joined_at, last_read_at").in("conversation_id", ids),
    supabase.from("messages").select("*").in("conversation_id", ids).order("created_at", { ascending: true }),
  ]);
  const userIds = [...new Set((members ?? []).map((m) => m.user_id))];
  const { data: people } = await supabase.from("profiles").select("id, full_name, avatar_color").in("id", userIds);
  const conversations = (convos ?? []) as Conversation[];
  const memberRows = (members ?? []) as ConversationMember[];
  const messageRows = (messages ?? []) as ChatMessage[];
  const personRows = (people ?? []) as InboxPerson[];
  return {
    rows: buildInboxRows({
      me,
      conversations,
      members: memberRows,
      people: personRows,
      messages: messageRows,
    }),
    conversations,
    members: memberRows,
    messages: messageRows,
    people: personRows,
  };
}
