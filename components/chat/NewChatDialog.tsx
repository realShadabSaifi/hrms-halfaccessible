"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createGroup, openDm } from "@/app/(portal)/chat/actions";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { TextField } from "@/components/ui/TextField";
import { initials } from "@/lib/names";
import { matchesMember } from "@/lib/team/search";
import type { Profile } from "@/lib/types";
import { X } from "@phosphor-icons/react";
import styles from "./Chat.module.scss";

export function NewChatDialog({
  me,
  directory,
  onClose,
  onError,
}: {
  me: string;
  directory: Profile[];
  onClose: () => void;
  onError: (message: string) => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [pending, setPending] = useState(false);
  const people = useMemo(
    () => directory.filter((p) => p.id !== me && matchesMember(p, q)),
    [directory, me, q],
  );

  function toggle(id: string) {
    setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  async function submit() {
    setPending(true);
    const result =
      picked.length === 1 ? await openDm(picked[0]) : await createGroup(title, picked);
    setPending(false);
    if (!result.ok) {
      onError(result.error);
      return;
    }
    onClose();
    router.push(`/chat/${result.id}`);
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label="new chat"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.dialogHead}>
          <h2>new chat</h2>
          <button type="button" className={styles.close} aria-label="close" onClick={onClose}>
            <X size={14} />
          </button>
        </div>
        <TextField label="search people" value={q} onChange={(e) => setQ(e.target.value)} />
        {picked.length > 0 ? (
          <div className={styles.chips}>
            {picked.map((id) => {
              const person = directory.find((p) => p.id === id);
              return (
                <Chip key={id} active onClick={() => toggle(id)}>
                  {person?.full_name ?? id}
                </Chip>
              );
            })}
          </div>
        ) : null}
        <div className={styles.people}>
          {people.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`${styles.person} ${picked.includes(p.id) ? styles.personActive : ""}`}
              onClick={() => toggle(p.id)}
            >
              <Avatar initials={initials(p.full_name)} color={p.avatar_color} size="sm" />
              <span>{p.full_name}</span>
            </button>
          ))}
        </div>
        {picked.length > 1 ? (
          <TextField label="group name" value={title} onChange={(e) => setTitle(e.target.value)} />
        ) : null}
        <Button
          className="mt-3 w-full"
          pending={pending}
          disabled={picked.length === 0}
          onClick={() => void submit()}
        >
          {picked.length > 1 ? "create group" : "open dm"}
        </Button>
      </div>
    </div>
  );
}
