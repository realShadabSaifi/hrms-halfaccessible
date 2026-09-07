"use client";

import { useState } from "react";
import { ChatInbox } from "./ChatInbox";
import { ChatThread } from "./ChatThread";
import { NewChatDialog } from "./NewChatDialog";
import { Toast } from "@/components/ui/Toast";
import type { ChatMessage, Conversation, ConversationMember, InboxRow, Profile } from "@/lib/types";
import styles from "./Chat.module.scss";

type Person = { id: string; full_name: string; avatar_color: string };

export function ChatShell({
  me,
  rows,
  directory,
  selected,
}: {
  me: string;
  rows: InboxRow[];
  directory: Profile[];
  selected?: {
    conversation: Conversation;
    members: ConversationMember[];
    people: Person[];
    messages: ChatMessage[];
    title: string;
  } | null;
}) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const missing = selected === null;

  return (
    <div className="pageEnter">
      <div className={`${styles.shell} ${selected ? styles.hasThread : styles.inboxOnly}`}>
        <ChatInbox rows={rows} selectedId={selected?.conversation.id} onNew={() => setOpen(true)} />
        {selected ? (
          <ChatThread
            me={me}
            conversation={selected.conversation}
            members={selected.members}
            people={selected.people}
            initialMessages={selected.messages}
            directory={directory}
            title={selected.title}
            onError={setToast}
          />
        ) : (
          <section className={styles.thread} aria-label="thread">
            <div className={styles.emptyPane}>
              {missing ? "this chat is gone or you're not in it" : "pick a human or start a group."}
            </div>
          </section>
        )}
      </div>
      {open ? (
        <NewChatDialog me={me} directory={directory} onClose={() => setOpen(false)} onError={setToast} />
      ) : null}
      <Toast message={toast} />
    </div>
  );
}
