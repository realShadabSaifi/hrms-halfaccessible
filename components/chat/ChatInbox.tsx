"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { initials } from "@/lib/names";
import type { InboxRow } from "@/lib/types";
import { ChatTeardrop } from "@phosphor-icons/react";
import { PushToggle } from "./PushToggle";
import styles from "./Chat.module.scss";

function shortTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export function ChatInbox({
  rows,
  selectedId,
  onNew,
}: {
  rows: InboxRow[];
  selectedId?: string;
  onNew: () => void;
}) {
  return (
    <section className={styles.inbox} aria-label="inbox">
      <div className={styles.inboxHead}>
        <h2>chat</h2>
        <Button onClick={onNew}>new</Button>
      </div>
      <div className={styles.promptWrap}>
        <PushToggle />
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={<ChatTeardrop size={28} />} title="no chats yet" body="start a dm or a group." />
      ) : (
        <div className={styles.list}>
          {rows.map((row) => (
            <Link
              key={row.id}
              href={`/chat/${row.id}`}
              className={`${styles.row} ${selectedId === row.id ? styles.rowActive : ""}`}
            >
              <Avatar initials={initials(row.avatarName)} color={row.avatarColor} size="sm" />
              <span className={styles.rowCopy}>
                <span className={styles.rowTitle}>
                  <span className={styles.name}>{row.title}</span>
                  <span className={styles.time}>{shortTime(row.lastAt)}</span>
                </span>
                <span className={styles.preview}>{row.lastPreview || "say something. that's the whole product."}</span>
              </span>
              {row.unread > 0 ? <span className={styles.unread}>{row.unread}</span> : null}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
