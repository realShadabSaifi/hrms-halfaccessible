import { describe, expect, it } from "vitest";
import { notifyAnnouncement, notifyChatMessage, notifyLeaveDecision } from "./notify";

describe("notify stubs", () => {
  it("resolves without sending", async () => {
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
      notifyLeaveDecision({ requestId: "l1", requesterId: "a", type: "sick", status: "approved" }),
    ).resolves.toBeUndefined();
  });
});
