import { ChatShell } from "@/components/chat/ChatShell";
import { requireProfile } from "@/lib/auth";
import { loadDirectory, loadInbox } from "@/lib/chat/queries";
import { canUseChat } from "@/lib/rls/policies";
import { redirect } from "next/navigation";

export default async function ChatThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireProfile();
  if (!canUseChat(me.role)) redirect("/");
  const { id } = await params;
  const [inbox, directory] = await Promise.all([loadInbox(me.id), loadDirectory()]);
  const conversation = inbox.conversations.find((c) => c.id === id);
  const row = inbox.rows.find((r) => r.id === id);
  if (!conversation || !row) {
    return <ChatShell me={me.id} rows={inbox.rows} directory={directory} selected={null} />;
  }
  return (
    <ChatShell
      me={me.id}
      rows={inbox.rows}
      directory={directory}
      selected={{
        conversation,
        members: inbox.members.filter((m) => m.conversation_id === id),
        people: inbox.people,
        messages: inbox.messages.filter((m) => m.conversation_id === id),
        title: row.title,
      }}
    />
  );
}
