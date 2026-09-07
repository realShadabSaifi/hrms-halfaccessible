import { describe, expect, it } from "vitest";
import { buildInboxRows } from "./inbox";

const convo = {
  id: "c1",
  kind: "dm" as const,
  title: "",
  dm_key: "a:b",
  created_by: "a",
  created_at: "2026-01-01T00:00:00Z",
  last_message_at: "2026-01-02T00:00:00Z",
};

describe("buildInboxRows", () => {
  it("titles a dm with the other person and counts unread", () => {
    const rows = buildInboxRows({
      me: "a",
      conversations: [convo],
      members: [
        { conversation_id: "c1", user_id: "a", joined_at: "2026-01-01T00:00:00Z", last_read_at: "2026-01-01T12:00:00Z" },
        { conversation_id: "c1", user_id: "b", joined_at: "2026-01-01T00:00:00Z", last_read_at: null },
      ],
      people: [
        { id: "a", full_name: "Ada", avatar_color: "#7048B6" },
        { id: "b", full_name: "Bea", avatar_color: "#0E9488" },
      ],
      messages: [
        { id: "m1", conversation_id: "c1", sender_id: "b", body: "hello there", created_at: "2026-01-02T00:00:00Z" },
      ],
    });
    expect(rows[0]?.title).toBe("Bea");
    expect(rows[0]?.otherUserId).toBe("b");
    expect(rows[0]?.unread).toBe(1);
    expect(rows[0]?.lastPreview).toBe("hello there");
  });

  it("titles a group with the group title", () => {
    const rows = buildInboxRows({
      me: "a",
      conversations: [{ ...convo, id: "g1", kind: "group", title: "eng squad", dm_key: null }],
      members: [{ conversation_id: "g1", user_id: "a", joined_at: "2026-01-01T00:00:00Z", last_read_at: null }],
      people: [{ id: "a", full_name: "Ada", avatar_color: "#7048B6" }],
      messages: [],
    });
    expect(rows[0]?.title).toBe("eng squad");
    expect(rows[0]?.otherUserId).toBeNull();
  });
});
