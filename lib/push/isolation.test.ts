import { describe, expect, it, vi } from "vitest";

vi.mock("./send", () => ({
  sendToUsers: vi.fn(async () => {
    throw new Error("boom");
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          neq: async () => ({ data: [{ id: "b" }] }),
        }),
      }),
    }),
  }),
}));

import { notifyAnnouncement, notifyChatMessage, notifyLeaveDecision } from "./notify";

describe("notify isolation", () => {
  it("still resolves when sendToUsers throws", async () => {
    await expect(
      notifyChatMessage({
        conversationId: "c1",
        senderId: "a",
        senderName: "Ada",
        groupTitle: null,
        body: "hey",
        memberIds: ["a", "b"],
      }),
    ).resolves.toBeUndefined();
    await expect(notifyAnnouncement({ announcementId: "a1", authorId: "a", title: "hi" })).resolves.toBeUndefined();
    await expect(
      notifyLeaveDecision({ requestId: "l1", requesterId: "b", type: "sick", status: "approved" }),
    ).resolves.toBeUndefined();
  });
});
