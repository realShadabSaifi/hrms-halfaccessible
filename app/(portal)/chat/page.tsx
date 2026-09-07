import { ChatShell } from "@/components/chat/ChatShell";
import { requireProfile } from "@/lib/auth";
import { loadDirectory, loadInbox } from "@/lib/chat/queries";
import { canUseChat } from "@/lib/rls/policies";
import { redirect } from "next/navigation";

export default async function ChatPage() {
  const me = await requireProfile();
  if (!canUseChat(me.role)) redirect("/");
  const [inbox, directory] = await Promise.all([loadInbox(me.id), loadDirectory()]);
  return <ChatShell me={me.id} rows={inbox.rows} directory={directory} />;
}
