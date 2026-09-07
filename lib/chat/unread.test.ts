import { describe, expect, it } from "vitest";
import { CHAT_PREVIEW_MAX, chatPreview, isUnreadMessage, unreadConversationCount } from "./unread";

describe("chatPreview", () => {
  it("trims and caps at 120", () => {
    expect(chatPreview("  hi  ")).toBe("hi");
    expect(chatPreview("x".repeat(121)).length).toBe(CHAT_PREVIEW_MAX);
  });
});

describe("isUnreadMessage", () => {
  it("ignores my own messages", () => {
    expect(isUnreadMessage({ senderId: "me", createdAt: "2026-01-02T00:00:00Z", me: "me", lastReadAt: null })).toBe(false);
  });
  it("counts others after last_read_at or when never read", () => {
    expect(isUnreadMessage({ senderId: "b", createdAt: "2026-01-02T00:00:00Z", me: "me", lastReadAt: null })).toBe(true);
    expect(isUnreadMessage({ senderId: "b", createdAt: "2026-01-02T00:00:00Z", me: "me", lastReadAt: "2026-01-03T00:00:00Z" })).toBe(false);
    expect(isUnreadMessage({ senderId: "b", createdAt: "2026-01-04T00:00:00Z", me: "me", lastReadAt: "2026-01-03T00:00:00Z" })).toBe(true);
  });
});

describe("unreadConversationCount", () => {
  it("counts conversations that have unread, not messages", () => {
    expect(unreadConversationCount([{ unread: 4 }, { unread: 0 }, { unread: 1 }])).toBe(2);
  });
});
