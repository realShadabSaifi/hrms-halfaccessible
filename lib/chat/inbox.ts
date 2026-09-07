import { chatPreview, isUnreadMessage } from "./unread";
import type { ChatMessage, Conversation, ConversationMember, InboxRow } from "@/lib/types";

export type InboxPerson = { id: string; full_name: string; avatar_color: string };

export type InboxInput = {
  me: string;
  conversations: Conversation[];
  members: ConversationMember[];
  people: InboxPerson[];
  messages: ChatMessage[];
};

export function buildInboxRows(input: InboxInput): InboxRow[] {
  const people = new Map(input.people.map((p) => [p.id, p]));
  const sorted = [...input.conversations].sort((a, b) => b.last_message_at.localeCompare(a.last_message_at));
  return sorted.map((c) => {
    const members = input.members.filter((m) => m.conversation_id === c.id);
    const mine = members.find((m) => m.user_id === input.me);
    const other = members.find((m) => m.user_id !== input.me);
    const otherPerson = other ? people.get(other.user_id) : undefined;
    const convMessages = input.messages.filter((m) => m.conversation_id === c.id);
    const last = [...convMessages].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    const unread = convMessages.filter((m) =>
      isUnreadMessage({
        senderId: m.sender_id,
        createdAt: m.created_at,
        me: input.me,
        lastReadAt: mine?.last_read_at ?? null,
      }),
    ).length;
    const title = c.kind === "group" ? c.title : (otherPerson?.full_name ?? "chat");
    const avatarName = c.kind === "group" ? c.title : (otherPerson?.full_name ?? "?");
    return {
      id: c.id,
      kind: c.kind,
      title,
      avatarName,
      avatarColor: otherPerson?.avatar_color ?? "#7048B6",
      lastPreview: last ? chatPreview(last.body) : "",
      lastAt: last?.created_at ?? c.last_message_at,
      unread,
      otherUserId: c.kind === "dm" ? (other?.user_id ?? null) : null,
    };
  });
}
