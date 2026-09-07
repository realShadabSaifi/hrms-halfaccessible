import { describe, expect, it } from "vitest";
import {
  announcementPushPayload,
  chatPushPayload,
  leavePushPayload,
  pushRecipients,
} from "./payload";

describe("push payloads", () => {
  it("drops the actor and de-dupes", () => {
    expect(pushRecipients("me", ["a", "me", "a", "b"])).toEqual(["a", "b"]);
  });

  it("builds a dm payload from the sender name", () => {
    expect(chatPushPayload({ conversationId: "c1", senderName: "Ada", groupTitle: null, body: "hey" })).toEqual({
      title: "Ada",
      body: "hey",
      url: "/chat/c1",
      tag: "chat:c1",
    });
  });

  it("uses the group title when present", () => {
    expect(chatPushPayload({ conversationId: "g1", senderName: "Ada", groupTitle: "eng squad", body: "stand up" }).title).toBe(
      "eng squad",
    );
  });

  it("truncates body to 120", () => {
    expect(chatPushPayload({ conversationId: "c1", senderName: "Ada", groupTitle: null, body: "x".repeat(200) }).body).toHaveLength(
      120,
    );
  });

  it("builds announcement and leave payloads", () => {
    expect(announcementPushPayload({ announcementId: "a1", title: "goa won" })).toEqual({
      title: "goa won",
      body: "new announcement",
      url: "/announcements",
      tag: "announcement:a1",
    });
    expect(leavePushPayload({ requestId: "l1", type: "sick", status: "approved" })).toEqual({
      title: "your sick leave was approved",
      body: "tap to see the note",
      url: "/leaves",
      tag: "leave:l1",
    });
  });
});
