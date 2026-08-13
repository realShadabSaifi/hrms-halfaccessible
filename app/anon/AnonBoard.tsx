"use client";

import { useMemo, useState } from "react";
import { postAnon, upvoteAnon } from "./actions";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { TextArea } from "@/components/ui/TextArea";
import { Toast } from "@/components/ui/Toast";
import styles from "./AnonBoard.module.scss";

const CATS = [
  "💬 General",
  "📣 Feedback",
  "💡 Idea",
  "🤔 Concern",
  "✨ Vibe Check",
  "🙌 Appreciation",
];

type Post = { id: string; category: string; body: string; created_at: string; up: number };

export function Composer({
  cat,
  onCat,
  onPosted,
}: {
  cat: string;
  onCat: (c: string) => void;
  onPosted: (msg: string) => void;
}) {
  return (
    <form
      className={styles.composer}
      action={async (fd) => {
        const r = await postAnon(cat, String(fd.get("body")));
        onPosted(r.ok ? "yeeted into the void" : r.error ?? "could not post");
      }}
    >
      <TextArea name="body" rows={3} placeholder="say the thing. nobody will ever know it was you." />
      <div className={styles.chips}>
        {CATS.map((c) => (
          <Chip key={c} active={cat === c} onClick={() => onCat(c)}>
            {c}
          </Chip>
        ))}
      </div>
      <Button type="submit" className="w-full">
        yeet it into the void
      </Button>
    </form>
  );
}

export function PostList({
  posts,
  filter,
  sort,
  onFilter,
  onSort,
}: {
  posts: Post[];
  filter: string;
  sort: "latest" | "top";
  onFilter: (c: string) => void;
  onSort: (s: "latest" | "top") => void;
}) {
  const visible = useMemo(() => {
    let list = posts;
    if (filter !== "All") list = list.filter((p) => p.category === filter);
    if (sort === "top") list = [...list].sort((a, b) => b.up - a.up);
    return list;
  }, [posts, filter, sort]);

  return (
    <>
      <div className={styles.toolbar}>
        <Chip active={sort === "latest"} onClick={() => onSort("latest")}>
          latest
        </Chip>
        <Chip active={sort === "top"} onClick={() => onSort("top")}>
          most upvoted
        </Chip>
        {["All", ...CATS].map((c) => (
          <Chip key={c} active={filter === c} onClick={() => onFilter(c)}>
            {c === "All" ? "All" : c.split(" ")[0]}
          </Chip>
        ))}
      </div>
      {visible.map((p) => (
        <article key={p.id} className={styles.post}>
          <div className={styles.meta}>
            <span className={styles.cat}>{p.category}</span>
            <span className="flex-1" />
            <span className={styles.date}>
              {new Date(p.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
            </span>
          </div>
          <p className={styles.body}>{p.body}</p>
          <Button variant="ghost" onClick={() => upvoteAnon(p.id)}>
            ▲ {p.up}
          </Button>
        </article>
      ))}
    </>
  );
}

export function AnonBoard({ posts }: { posts: Post[] }) {
  const [cat, setCat] = useState(CATS[0]);
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState<"latest" | "top">("latest");
  const [toast, setToast] = useState<string | null>(null);

  return (
    <div className={`pageEnter ${styles.page}`}>
      <div className={styles.hero}>
        <div className={styles.title}>no names. no tracking. just vibes.</div>
        <div className={styles.sub}>
          nothing is logged. admins can&apos;t delete. posts self-destruct in 90 days.
        </div>
      </div>
      <Composer cat={cat} onCat={setCat} onPosted={setToast} />
      <PostList posts={posts} filter={filter} sort={sort} onFilter={setFilter} onSort={setSort} />
      <Toast message={toast} />
    </div>
  );
}
