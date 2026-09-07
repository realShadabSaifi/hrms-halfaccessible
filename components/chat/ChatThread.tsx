"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addGroupMembers,
  leaveGroup,
  markRead,
  removeGroupMember,
  sendMessage,
} from "@/app/(portal)/chat/actions";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import { createClient } from "@/lib/supabase/client";
import { initials } from "@/lib/names";
import { matchesMember } from "@/lib/team/search";
import type { ChatMessage, Conversation, ConversationMember, Profile } from "@/lib/types";
import { ArrowLeft, ChatTeardrop, DotsThree, X } from "@phosphor-icons/react";
import styles from "./Chat.module.scss";

type Person = { id: string; full_name: string; avatar_color: string };

function stamp(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export function ChatThread({
  me,
  conversation,
  members,
  people,
  initialMessages,
  directory,
  title,
  onError,
}: {
  me: string;
  conversation: Conversation;
  members: ConversationMember[];
  people: Person[];
  initialMessages: ChatMessage[];
  directory: Profile[];
  title: string;
  onError: (message: string) => void;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [addQ, setAddQ] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const peopleMap = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const memberIds = members.map((m) => m.user_id);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    void markRead(conversation.id);
    bottom.current?.scrollIntoView({ block: "end" });
  }, [conversation.id, messages.length]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat:${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const row = payload.new as ChatMessage;
          setMessages((cur) => {
            if (cur.some((m) => m.id === row.id)) return cur;
            const withoutTemp = cur.filter(
              (m) => !(m.id.startsWith("temp:") && m.sender_id === row.sender_id && m.body === row.body),
            );
            return [...withoutTemp, row];
          });
          void markRead(conversation.id);
        },
      )
      .subscribe();

    async function refetch() {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });
      if (data) setMessages(data as ChatMessage[]);
    }

    function onVis() {
      if (document.visibilityState === "visible") void refetch();
    }
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      void supabase.removeChannel(channel);
    };
  }, [conversation.id]);

  async function send() {
    const text = body;
    const invalid = text.trim();
    if (!invalid) {
      onError("type something");
      return;
    }
    const temp: ChatMessage = {
      id: `temp:${Date.now()}`,
      conversation_id: conversation.id,
      sender_id: me,
      body: invalid,
      created_at: new Date().toISOString(),
    };
    setMessages((cur) => [...cur, temp]);
    setBody("");
    setPending(true);
    const result = await sendMessage(conversation.id, text);
    setPending(false);
    if (!result.ok) {
      setMessages((cur) => cur.filter((m) => m.id !== temp.id));
      setBody(text);
      onError(result.error);
    }
  }

  const addable = directory.filter(
    (p) => p.id !== me && !memberIds.includes(p.id) && matchesMember(p, addQ),
  );

  return (
    <section className={styles.thread} aria-label="thread">
      <div className={styles.threadHead}>
        <Link href="/chat" className={styles.back} aria-label="back to inbox">
          <ArrowLeft size={16} />
        </Link>
        <h2>{title}</h2>
        {conversation.kind === "group" ? (
          <button type="button" className={styles.iconBtn} aria-label="group members" onClick={() => setSheet(true)}>
            <DotsThree size={18} />
          </button>
        ) : null}
      </div>
      <div className={styles.messages}>
        {messages.length === 0 ? (
          <EmptyState icon={<ChatTeardrop size={28} />} title="say something. that's the whole product." />
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === me;
            const person = peopleMap.get(m.sender_id);
            return (
              <div key={m.id} className={`${styles.bubble} ${mine ? styles.mine : ""}`}>
                {mine ? null : (
                  <Avatar initials={initials(person?.full_name ?? "?")} color={person?.avatar_color ?? "#7048B6"} size="sm" />
                )}
                <div className={styles.bubbleBody}>
                  {m.body}
                  <span className={styles.meta}>{stamp(m.created_at)}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottom} />
      </div>
      <form
        className={styles.composer}
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <TextArea
          label="message"
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <Button type="submit" pending={pending}>
          send
        </Button>
      </form>
      {sheet ? (
        <div className={styles.overlay} onClick={() => setSheet(false)}>
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-label="group members"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.dialogHead}>
              <h2>members</h2>
              <button type="button" className={styles.close} aria-label="close" onClick={() => setSheet(false)}>
                <X size={14} />
              </button>
            </div>
            {members.map((m) => {
              const person = peopleMap.get(m.user_id);
              return (
                <div key={m.user_id} className={styles.memberRow}>
                  <Avatar initials={initials(person?.full_name ?? "?")} color={person?.avatar_color ?? "#7048B6"} size="sm" />
                  <span>{person?.full_name ?? "human"}</span>
                  {conversation.created_by === me && m.user_id !== me ? (
                    <Button
                      variant="danger"
                      onClick={async () => {
                        const r = await removeGroupMember(conversation.id, m.user_id);
                        if (!r.ok) onError(r.error);
                        else router.refresh();
                      }}
                    >
                      remove
                    </Button>
                  ) : null}
                </div>
              );
            })}
            <TextField label="add people" value={addQ} onChange={(e) => setAddQ(e.target.value)} />
            <div className={styles.people}>
              {addable.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={styles.person}
                  onClick={async () => {
                    const r = await addGroupMembers(conversation.id, [p.id]);
                    if (!r.ok) onError(r.error);
                    else router.refresh();
                  }}
                >
                  <Avatar initials={initials(p.full_name)} color={p.avatar_color} size="sm" />
                  <span>{p.full_name}</span>
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              className="mt-3 w-full"
              onClick={async () => {
                const r = await leaveGroup(conversation.id);
                if (!r.ok) {
                  onError(r.error);
                  return;
                }
                router.push("/chat");
              }}
            >
              leave group
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
