import { chatPreview } from "@/lib/chat/unread";

export type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
};

export function pushRecipients(actorId: string, userIds: string[]): string[] {
  return [...new Set(userIds.filter((id) => id && id !== actorId))];
}

export function chatPushPayload(input: {
  conversationId: string;
  senderName: string;
  groupTitle: string | null;
  body: string;
}): PushPayload {
  return {
    title: input.groupTitle || input.senderName,
    body: chatPreview(input.body),
    url: `/chat/${input.conversationId}`,
    tag: `chat:${input.conversationId}`,
  };
}

export function announcementPushPayload(input: { announcementId: string; title: string }): PushPayload {
  return {
    title: input.title,
    body: "new announcement",
    url: "/announcements",
    tag: `announcement:${input.announcementId}`,
  };
}

export function leavePushPayload(input: {
  requestId: string;
  type: string;
  status: "approved" | "rejected";
}): PushPayload {
  return {
    title: `your ${input.type} leave was ${input.status}`,
    body: "tap to see the note",
    url: "/leaves",
    tag: `leave:${input.requestId}`,
  };
}
